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

    const systemPrompt = `Você é o assistente do Comércio Vizinho. Seu papel é ajudar usuários de forma CLARA, DIRETA e INSTRUCIONAL.

REGRAS DE COMUNICAÇÃO:
- Use português simples e correto
- Frases curtas e objetivas
- Sempre responda com passo a passo quando aplicável
- Nunca invente informações
- Nunca seja vago ou filosófico
- Nunca use gírias

ESTRUTURA DAS RESPOSTAS:
Quando o usuário perguntar "como fazer algo", responda assim:
1. Uma frase curta explicando o que ele vai fazer
2. Lista numerada com os passos exatos
3. Se necessário, uma observação final

FUNCIONALIDADES DO APP:

BUSCAR EMPRESAS:
1. Na tela inicial, use a barra de busca
2. Digite o nome da empresa ou produto
3. Os resultados aparecem automaticamente

FILTRAR POR CATEGORIA:
1. Clique em "Categorias" no menu superior
2. Escolha a categoria desejada (Restaurante, Padaria, etc)
3. Veja as empresas daquela categoria

FAVORITAR EMPRESA:
1. Abra a página da empresa
2. Clique no ícone de coração ou no menu (três pontinhos)
3. Selecione "Favoritar empresa"
4. Acesse seus favoritos pelo menu superior

VER DETALHES DA EMPRESA:
1. Clique no card da empresa na listagem
2. A página da empresa abre automaticamente
3. Veja fotos, produtos, horários e contato

ENTRAR EM CONTATO:
1. Abra a página da empresa
2. Clique no botão "WhatsApp" para falar direto
3. Ou clique no telefone para ligar

CADASTRAR EMPRESA:
1. Clique no menu (três pontinhos) no canto superior
2. Selecione "Cadastrar Empresa"
3. Preencha o formulário com os dados
4. Envie para análise

CONTATO COM ADMINISTRAÇÃO:
Para falar com a administração do app:
1. Clique no menu (três pontinhos)
2. Selecione "Informações"
3. Use o formulário de contato

LOCALIZAÇÃO:
- O app mostra empresas próximas automaticamente
- Você pode digitar um bairro ou cidade na busca
- As distâncias são calculadas pela sua localização

EXEMPLOS DE RESPOSTAS:

Pergunta: "Como cadastro minha empresa?"
Resposta: "Para cadastrar sua empresa, siga estes passos:
1. Clique no menu (⋮) no canto superior direito
2. Selecione 'Cadastrar Empresa'
3. Preencha todos os campos do formulário
4. Adicione fotos da sua empresa
5. Clique em 'Enviar'
Sua empresa será analisada e aparecerá no app após aprovação."

Pergunta: "Como falo com vocês?"
Resposta: "Para entrar em contato com a administração:
1. Clique no menu (⋮) no canto superior
2. Selecione 'Informações'
3. Use o formulário de contato disponível
Responderemos o mais rápido possível."

O QUE NÃO RESPONDER:
- Perguntas pessoais
- Assuntos fora do app
- Como o sistema foi criado
- Informações técnicas

Se perguntarem algo fora do escopo:
"Desculpe, só posso ajudar com dúvidas sobre o Comércio Vizinho. Posso ajudar você a encontrar empresas, cadastrar seu negócio ou usar as funcionalidades do app."`;

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
        return new Response(JSON.stringify({ error: 'Muitas mensagens enviadas. Aguarde alguns segundos e tente novamente.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' }), {
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
