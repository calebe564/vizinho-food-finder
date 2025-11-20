import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Você é o assistente virtual do aplicativo Comércio Vizinho. 

SEU PAPEL:
- Ajudar usuários com dúvidas sobre o aplicativo
- Explicar funcionalidades de forma clara e objetiva
- Ser educado, prestativo e profissional

VOCÊ PODE RESPONDER SOBRE:
- Como cadastrar uma empresa
- Como usar a busca por categorias
- Como funciona o sistema de localização manual (bairro/cidade)
- Como ver empresas próximas
- Como entrar em contato com estabelecimentos
- Como funciona o painel administrativo
- Funcionalidades disponíveis no app

VOCÊ NÃO DEVE:
- Responder perguntas pessoais
- Discutir sobre como o sistema foi criado
- Fornecer informações técnicas internas
- Responder perguntas fora do escopo do Comércio Vizinho

Se alguém perguntar algo fora do escopo, responda educadamente:
"Desculpe, só posso responder perguntas relacionadas ao aplicativo Comércio Vizinho."

Seja sempre breve, claro e útil.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de uso excedido. Tente novamente em instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Serviço temporariamente indisponível.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in ai-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});