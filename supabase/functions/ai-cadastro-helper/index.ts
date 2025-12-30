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
    const { type, input, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = `Você é um assistente inteligente do aplicativo Comércio Vizinho, criado para AJUDAR COMERCIANTES a preencher corretamente o cadastro da empresa.

Seu papel NÃO é cadastrar a empresa sozinho, nem alterar dados automaticamente.
Seu papel é GERAR SUGESTÕES DE TEXTO para facilitar o cadastro.

REGRAS IMPORTANTES:
- Nunca altere endereço, telefone ou dados sensíveis
- Nunca diga que a empresa está cadastrada
- Nunca invente informações
- Linguagem sempre em português do Brasil
- Seja objetivo, educado e claro
- Seu objetivo é facilitar, não substituir o comerciante`;

    let userPrompt = "";

    if (type === "horario") {
      systemPrompt += `

TAREFA: FORMATAR HORÁRIO DE FUNCIONAMENTO

Quando o usuário informar o horário em texto livre, você deve:
- Entender o texto
- Organizar
- Devolver em formato padronizado e compacto

Formato esperado:
SEG–SEX: 08:00–18:00
SÁB: 08:00–12:00
DOM: Fechado

Regras:
- Nunca invente horários
- Se algo não estiver claro, organize apenas o que foi informado
- Use o formato 24h (ex: 08:00, 18:00)
- Use abreviações: SEG, TER, QUA, QUI, SEX, SÁB, DOM
- Para intervalos de dias use hífen: SEG–SEX
- Para horários use hífen: 08:00–18:00`;

      userPrompt = `Formate este horário de funcionamento: "${input}"`;

    } else if (type === "descricao") {
      systemPrompt += `

TAREFA: GERAR DESCRIÇÃO DA EMPRESA

Gere uma descrição:
- Clara e profissional
- Humana, sem exageros
- Sem promessas falsas
- Sem linguagem genérica de propaganda
- Curta (3 a 5 linhas)

A descrição deve:
- Explicar o que a empresa faz
- Para quem atende
- Destacar diferenciais simples

Exemplo de tom esperado:
"Somos uma lanchonete de bairro focada em atendimento rápido e comida bem feita, oferecendo hambúrgueres, porções e bebidas para consumo no local ou retirada."`;

      const categoryInfo = context?.category ? `Categoria: ${context.category}` : "";
      const nameInfo = context?.name ? `Nome: ${context.name}` : "";
      
      userPrompt = `Gere uma descrição para esta empresa:
${nameInfo}
${categoryInfo}
Informações do comerciante: "${input}"`;

    } else if (type === "produtos") {
      systemPrompt += `

TAREFA: ORGANIZAR LISTA DE PRODUTOS

Transforme a lista em formato estruturado.
Retorne APENAS um JSON válido no seguinte formato:
{
  "produtos": [
    { "nome": "Nome do produto", "preco": "0.00" ou null se não informado }
  ]
}

Regras:
- Sem criar preços irreais
- Sem inventar variações que o usuário não citou
- Se o preço não foi informado, use null
- Nunca gere imagens
- Apenas organize os produtos mencionados`;

      userPrompt = `Organize esta lista de produtos em JSON: "${input}"`;

    } else {
      // Conversa geral de ajuda
      systemPrompt += `

TAREFA: AJUDAR COM DÚVIDAS SOBRE O CADASTRO

Você pode ajudar o comerciante com:
1. Horário de funcionamento - formate de forma padronizada
2. Descrição da empresa - gere textos profissionais
3. Lista de produtos - organize de forma clara

Seja prestativo e ofereça ajuda específica.`;

      userPrompt = input;
    }

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Muitas solicitações. Aguarde alguns segundos e tente novamente.' }), {
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-cadastro-helper:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
