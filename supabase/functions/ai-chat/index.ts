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
- Respostas CURTAS e DIRETAS (máximo 4 frases)
- Português correto e natural, frases COMPLETAS
- NUNCA corte palavras no meio
- Tom educado e profissional
- NÃO inventar funcionalidades que não existem
- Se não souber, sugira "Falar com o ADM"

FUNCIONALIDADES REAIS DO APP:

BUSCA: Barra de busca na tela inicial para produtos ou empresas

CATEGORIAS: Menu "Categorias" para filtrar por tipo de comércio

FAVORITOS: Toque no coração para favoritar, acesse pelo Menu > Favoritos

EMPRESA: Clique no card para ver detalhes, produtos e contato

CADASTRO: Menu (3 pontinhos) > Cadastrar Empresa

REIVINDICAR: Menu (3 pontinhos) > Reivindicar Empresa (para empresas já cadastradas)

FALAR COM ADM: Menu > Suporte ou botão no chat

FILTROS: Ordenar por proximidade, aberto/fechado, categorias

EXEMPLOS DE RESPOSTAS:

"Como cadastro minha empresa?"
→ "Acesse o menu (3 pontinhos) e clique em 'Cadastrar Empresa'. Você precisará de CNPJ ou CPF válido."

"Onde vejo meus favoritos?"
→ "Abra o menu e toque em 'Favoritos'. Lá ficam todas as empresas que você salvou."

"Como falo com vocês?"
→ "Você pode acessar 'Suporte' pelo menu ou clicar em 'Falar com o ADM' aqui no chat."

"Não encontro uma empresa"
→ "Use a barra de busca na tela inicial. Você pode buscar por nome, produto ou categoria."

Para perguntas fora do escopo do app:
→ "Posso ajudar com: buscar empresas, cadastrar negócios ou usar o app. Para outros assuntos, fale com o ADM pelo Suporte."`;

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
        max_tokens: 300,
        temperature: 0.7,
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
