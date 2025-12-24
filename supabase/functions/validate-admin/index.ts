import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    
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

    const isValid = password === adminPassword;
    
    // Generate a simple session token if valid
    let sessionToken = null;
    if (isValid) {
      // Create a simple token (timestamp + random) - not cryptographically secure but sufficient for this use case
      sessionToken = btoa(`admin_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: isValid,
        sessionToken: isValid ? sessionToken : null,
        message: isValid ? 'Acesso autorizado' : 'Senha incorreta'
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
