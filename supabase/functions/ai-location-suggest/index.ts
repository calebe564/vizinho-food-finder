import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Location {
  neighborhood: string | null;
  region: string | null;
  city: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch unique locations from establishments
    const { data: establishments, error } = await supabase
      .from('establishments')
      .select('neighborhood, region, city')
      .eq('active', true);

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    // Build unique locations list
    const locationsSet = new Set<string>();
    (establishments || []).forEach((e: Location) => {
      if (e.neighborhood) {
        locationsSet.add(`${e.neighborhood}|${e.region || ''}|${e.city}`);
      }
      if (e.region) {
        locationsSet.add(`|${e.region}|${e.city}`);
      }
    });

    const locations = Array.from(locationsSet).map(loc => {
      const [neighborhood, region, city] = loc.split('|');
      return { neighborhood: neighborhood || null, region: region || null, city };
    });

    // Use AI to find best matches with typo tolerance
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente de autocomplete para localização em Belo Horizonte e região.

Localizações disponíveis:
${locations.map(l => `- ${l.neighborhood || '(região)'} - ${l.region || ''} - ${l.city}`).join('\n')}

Sua tarefa:
1. Interpretar o que o usuário está digitando (mesmo com erros)
2. Retornar as 5 melhores sugestões de localização

IMPORTANTE:
- Corrija erros de digitação (Olari → Olaria, Bareiro → Barreiro)
- Considere abreviações (BH → Belo Horizonte)
- Retorne localizações que existem na lista

Responda APENAS em JSON válido:
{
  "suggestions": [
    {"neighborhood": "Bairro", "region": "Região", "city": "Cidade", "displayName": "Bairro - Região - Cidade"}
  ]
}`
          },
          {
            role: 'user',
            content: `Usuário digitou: "${query}"`
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      // Fallback to basic search
      return performBasicLocationSearch(query, locations, corsHeaders);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI Location Response:', aiContent);

    let suggestions;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return performBasicLocationSearch(query, locations, corsHeaders);
    }

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 5) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-location-suggest function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function performBasicLocationSearch(query: string, locations: { neighborhood: string | null; region: string | null; city: string }[], corsHeaders: Record<string, string>) {
  const queryLower = query.toLowerCase();
  
  const matched = locations.filter(l => 
    l.neighborhood?.toLowerCase().includes(queryLower) ||
    l.region?.toLowerCase().includes(queryLower) ||
    l.city?.toLowerCase().includes(queryLower)
  ).slice(0, 5).map(l => ({
    neighborhood: l.neighborhood,
    region: l.region,
    city: l.city,
    displayName: [l.neighborhood, l.region, l.city].filter(Boolean).join(' - ')
  }));
  
  return new Response(
    JSON.stringify({ suggestions: matched }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
