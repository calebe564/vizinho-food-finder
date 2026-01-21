import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - simple in-memory store (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Generate cryptographically secure token
async function generateSecureToken(userId: string): Promise<string> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  const timestamp = Date.now();
  const expiry = timestamp + (24 * 60 * 60 * 1000); // 24 hours
  
  const payload = JSON.stringify({
    userId,
    exp: expiry,
    iat: timestamp,
    jti: Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  });
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'fallback-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return btoa(payload) + '.' + signatureHex;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check rate limit
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limited: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Muitas tentativas. Aguarde 15 minutos.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { password } = await req.json();
    
    // Get authorization header to validate user is authenticated
    const authHeader = req.headers.get('Authorization');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    
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

    // Validate the password
    const isValid = password === adminPassword;
    
    if (!isValid) {
      // Log failed attempt
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
    
    // If user is authenticated, verify they are actually an admin in the database
    let userId = 'anonymous';
    
    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub;
        
        // Verify user is actually an admin in the database
        const { data: roleData } = await supabase.rpc('get_user_role', {
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
    
    // Generate secure session token
    const sessionToken = await generateSecureToken(userId);
    
    console.log(`Admin validated successfully for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionToken,
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
