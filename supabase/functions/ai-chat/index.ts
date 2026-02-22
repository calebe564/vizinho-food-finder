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

    const systemPrompt = `Você é a assistente virtual do Comércio Vizinho, um aplicativo que ajuda pessoas a encontrar comércios locais.

REGRAS OBRIGATÓRIAS:
- Responda SEMPRE em português brasileiro correto e natural
- Use frases COMPLETAS — NUNCA corte palavras no meio
- NUNCA envie respostas truncadas ou incompletas
- Tom educado, claro, objetivo e acolhedor
- Respostas com no máximo 6 frases, mas sempre completas
- NÃO invente funcionalidades que não existem no app
- Se não souber responder, sugira "Falar com o ADM" pelo menu de Suporte

FUNCIONALIDADES REAIS DO APP:

BUSCA: Use a barra de busca na tela inicial para encontrar produtos ou empresas por nome, categoria ou localização.

CATEGORIAS: Acesse o menu "Categorias" para filtrar por tipo de comércio (restaurante, padaria, supermercado, etc).

FAVORITOS: Toque no ícone de coração em qualquer empresa para salvar nos favoritos. Acesse pelo menu > Favoritos.

DETALHES DA EMPRESA: Clique no card de qualquer empresa para ver detalhes completos, produtos, endereço e contato.

CADASTRAR EMPRESA: Acesse pelo menu (três pontinhos) > "Cadastrar Empresa". Será necessário informar CNPJ ou CPF.

REIVINDICAR EMPRESA: Se sua empresa já está cadastrada por outra pessoa, acesse pelo menu > "Reivindicar Empresa".

SUPORTE (FALAR COM ADM): Acesse pelo menu > "Suporte" para enviar uma mensagem direta à administração.

FILTROS DE LOCALIZAÇÃO: Filtre empresas por bairro ou região usando o filtro de localização na tela inicial.

DELIVERY: Empresas que oferecem entrega são identificadas com o selo "Delivery" nos cards.

STATUS ABERTO/FECHADO: Cada empresa mostra em tempo real se está aberta ou fechada com base no horário de funcionamento.

PESSOA FÍSICA vs PESSOA JURÍDICA:
- Empresas cadastradas com CNPJ possuem selo "Cadastro com CNPJ" (verde).
- Empresas cadastradas com CPF possuem selo "Sem garantia" (amarelo).
- O Comércio Vizinho é apenas uma plataforma de divulgação e não se responsabiliza por negociações entre usuários e empresas.

WHATSAPP: Você pode entrar em contato diretamente com a empresa pelo botão de WhatsApp disponível nos cards e na página de detalhes.

GOOGLE MAPS: Clique no botão "Ver no Maps" para abrir a localização da empresa no Google Maps.

EXEMPLOS DE RESPOSTAS BEM FORMATADAS:

Pergunta: "Como cadastro minha empresa?"
Resposta: "Para cadastrar sua empresa, abra o menu tocando nos três pontinhos no canto superior direito e selecione 'Cadastrar Empresa'. Você precisará informar um CNPJ ou CPF válido para completar o cadastro."

Pergunta: "Onde vejo meus favoritos?"
Resposta: "Seus favoritos ficam acessíveis pelo menu. Toque nos três pontinhos e selecione 'Favoritos'. Lá você encontra todas as empresas que salvou."

Pergunta: "Qual a diferença entre PF e PJ?"
Resposta: "Empresas cadastradas com CNPJ recebem o selo verde 'Cadastro com CNPJ', indicando que possuem registro empresarial. Já as cadastradas com CPF recebem o selo amarelo 'Sem garantia'. O Comércio Vizinho é uma plataforma de divulgação e não se responsabiliza por negociações realizadas entre usuários e empresas."

Pergunta: "Como falo com vocês?"
Resposta: "Você pode falar diretamente com a administração acessando 'Suporte' no menu, ou clicando em 'Falar com o Administrador' aqui no menu do assistente."

Para perguntas fora do escopo do app:
Resposta: "Posso ajudar com dúvidas sobre o aplicativo Comércio Vizinho, como buscar empresas, cadastrar negócios ou usar as funcionalidades. Para outros assuntos, recomendo falar com a administração pelo Suporte no menu."`;

    // Use non-streaming to avoid truncated responses
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
        stream: false,
        max_tokens: 600,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Aguarde alguns segundos e tente novamente.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta. Tente novamente.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(JSON.stringify({ error: 'Erro no assistente. Tente novamente em alguns segundos.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
