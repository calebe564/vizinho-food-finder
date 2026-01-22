import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cryptographically secure token hash
async function hashToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(token)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Check rate limit using database function
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .rpc('check_admin_rate_limit', { 
        _ip_address: clientIP,
        _max_attempts: 5,
        _window_minutes: 15
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (rateLimitData && rateLimitData.length > 0) {
      const limitResult = rateLimitData[0];
      if (!limitResult.allowed) {
        const blockedUntil = limitResult.blocked_until ? 
          new Date(limitResult.blocked_until).toLocaleString('pt-BR') : 
          '15 minutos';
        
        console.warn(`Rate limited: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Muitas tentativas. Tente novamente após ${blockedUntil}.`,
            blockedUntil: limitResult.blocked_until
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Sistema não configurado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { password, action } = await req.json();
    
    // Handle different actions
    if (action === 'validate_session') {
      // Validate existing session
      const tokenHash = password; // In this case, password is the token hash
      const { data: sessionData } = await supabaseAdmin
        .rpc('validate_admin_session', { _token_hash: tokenHash });
      
      if (sessionData && sessionData.length > 0 && sessionData[0].valid) {
        return new Response(
          JSON.stringify({ 
            success: true,
            valid: true,
            role: sessionData[0].role
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, valid: false }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (action === 'logout') {
      // Revoke session
      const tokenHash = password;
      await supabaseAdmin.rpc('revoke_admin_session', { _token_hash: tokenHash });
      
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Default action: validate password and create session
    const authHeader = req.headers.get('Authorization');
    
    // Validate the password
    const isValid = password === adminPassword;
    
    if (!isValid) {
      console.warn(`Failed admin validation attempt from IP: ${clientIP}`);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          sessionToken: null,
          message: 'Senha incorreta'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Verify user is authenticated and has admin role
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub;
        
        // Verify user is actually an admin in the database
        const { data: roleData } = await supabaseAdmin.rpc('get_user_role', {
          _user_id: userId
        });
        
        const userRole = roleData as string;
        
        if (userRole !== 'adm_master' && userRole !== 'admin') {
          console.warn(`User ${userId} attempted admin access without proper role`);
          return new Response(
            JSON.stringify({ 
              success: false,
              sessionToken: null,
              message: 'Acesso não autorizado para este usuário'
            }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          sessionToken: null,
          message: 'Usuário não autenticado'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Generate secure random token
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const sessionToken = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Hash the token for storage
    const tokenHash = await hashToken(sessionToken, supabaseServiceKey);
    
    // Create session in database
    const { data: sessionId } = await supabaseAdmin.rpc('create_admin_session', {
      _user_id: userId,
      _token_hash: tokenHash,
      _ip_address: clientIP,
      _user_agent: userAgent,
      _expires_hours: 24
    });
    
    console.log(`Admin session created for user: ${userId}, session: ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionToken: tokenHash, // Return hash for client to store
        message: 'Acesso autorizado'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error validating admin:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
