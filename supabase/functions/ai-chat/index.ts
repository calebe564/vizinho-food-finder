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

    const systemPrompt = `Você é a assistente virtual do Comércio Vizinho.

REGRAS OBRIGATÓRIAS:
- Respostas CURTAS e DIRETAS (máximo 3 frases)
- Português correto e natural
- Tom educado e profissional
- NÃO inventar funcionalidades que não existem
- NÃO dar respostas longas

FUNCIONALIDADES REAIS DO APP:

BUSCA: Barra de busca na tela inicial

CATEGORIAS: Menu "Categorias" para filtrar

FAVORITOS: Coração para favoritar, Menu > Favoritos

EMPRESA: Clique para ver detalhes e contato

CADASTRO: Menu > Cadastrar Empresa

FALAR COM ADM: Botão na tela inicial ou Menu > Conversas

EXEMPLOS:

"Como cadastro minha empresa?"
→ "Acesse o menu e clique em 'Cadastrar Empresa'. Preencha o formulário e aguarde aprovação."

"Onde vejo favoritos?"
→ "No menu, clique em 'Favoritos'."

"Como falo com vocês?"
→ "Clique em 'Falar com o ADM' na tela inicial."

Se fora do escopo:
→ "Posso ajudar com: buscar empresas, cadastrar negócios ou usar o app."`;

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
        return new Response(JSON.stringify({ error: 'Aguarde alguns segundos e tente novamente.' }), {
          status: 429,
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
    return new Response(JSON.stringify({ error: 'Erro no assistente' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
