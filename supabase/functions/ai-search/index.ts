import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  unit: string | null;
  establishment_id: string;
  establishments: {
    id: string;
    name: string;
    neighborhood: string | null;
    region: string | null;
    city: string;
    profile_image: string | null;
    category: string;
    category_2: string | null;
    category_3: string | null;
    active: boolean;
    schedule: string;
    has_delivery: boolean | null;
    phone: string;
  } | null;
}

interface Establishment {
  id: string;
  name: string;
  neighborhood: string | null;
  region: string | null;
  city: string;
  profile_image: string | null;
  category: string;
  category_2: string | null;
  category_3: string | null;
  description: string | null;
  schedule: string;
  has_delivery: boolean | null;
  phone: string;
}

// Função para verificar se estabelecimento corresponde a categoria (incluindo secundárias)
function matchesCategory(establishment: { category: string; category_2?: string | null; category_3?: string | null }, categoryFilter: string): boolean {
  if (!categoryFilter) return true;
  
  const categories = [
    establishment.category,
    establishment.category_2,
    establishment.category_3
  ].filter(Boolean).map(c => c!.toLowerCase());
  
  return categories.includes(categoryFilter.toLowerCase());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ products: [], establishments: [], correctedQuery: null }),
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

    // Fetch all products with their establishments (include schedule, has_delivery, phone for sorting/display)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image,
        unit,
        establishment_id,
        establishments (
          id,
          name,
          neighborhood,
          region,
          city,
          profile_image,
          category,
          active,
          schedule,
          has_delivery,
          phone
        )
      `)
      .order('name');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch all active establishments (include schedule, has_delivery, phone and categories for sorting)
    const { data: establishments, error: establishmentsError } = await supabase
      .from('establishments')
      .select('id, name, neighborhood, region, city, profile_image, category, category_2, category_3, description, schedule, has_delivery, phone')
      .eq('active', true)
      .order('name');

    if (establishmentsError) {
      console.error('Error fetching establishments:', establishmentsError);
      throw establishmentsError;
    }

    // Filter active establishments from products - handle the nested select properly
    const activeProducts: Product[] = [];
    for (const p of (products || [])) {
      // Supabase returns single object for belongs_to relationship, not array
      const est = p.establishments as unknown as Product['establishments'];
      if (est?.active) {
        activeProducts.push({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          unit: p.unit,
          establishment_id: p.establishment_id,
          establishments: est
        });
      }
    }

    // Create a summary of available data for the AI
    const productNames = [...new Set(activeProducts.map(p => p.name))];
    const establishmentNames = [...new Set((establishments || []).map(e => e.name))];
    const categories = [...new Set((establishments || []).map(e => e.category))];
    const neighborhoods = [...new Set([
      ...((establishments || []).map(e => e.neighborhood).filter(Boolean) as string[]),
      ...((establishments || []).map(e => e.region).filter(Boolean) as string[])
    ])];

    // Use AI to interpret the search query
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
            content: `Você é um assistente de busca inteligente para um marketplace de comércios locais.

Sua tarefa é interpretar a busca do usuário e retornar:
1. A forma CORRETA do termo buscado (corrigindo erros de digitação)
2. Termos relacionados e sinônimos que devem ser buscados
3. Se é uma busca por PRODUTO, EMPRESA, CATEGORIA ou LOCAL

Produtos disponíveis: ${productNames.slice(0, 50).join(', ')}
Empresas disponíveis: ${establishmentNames.join(', ')}
Categorias: ${categories.join(', ')}
Bairros/Regiões: ${neighborhoods.join(', ')}

IMPORTANTE:
- Corrija erros de digitação comuns (hanburguer → hambúrguer, x-burg → X-Burger, etc)
- Identifique sinônimos (lanche → hambúrguer, sanduíche, etc)
- Se o usuário buscar um produto, retorne variações do nome
- Se buscar local, sugira bairros próximos ou com nomes similares

Responda APENAS em JSON válido com este formato:
{
  "correctedQuery": "termo corrigido",
  "searchTerms": ["termo1", "termo2"],
  "searchType": "product" | "establishment" | "category" | "location",
  "locationFilter": "bairro sugerido se aplicável" ou null
}`
          },
          {
            role: 'user',
            content: `Busca do usuário: "${query}"${location ? `\nLocalização informada: "${location}"` : ''}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      // Fallback to basic search if AI fails
      return performBasicSearch(query, activeProducts, (establishments || []) as Establishment[], corsHeaders);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', aiContent);

    let searchParams;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        searchParams = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return performBasicSearch(query, activeProducts, (establishments || []) as Establishment[], corsHeaders);
    }

    const { correctedQuery, searchTerms, searchType, locationFilter } = searchParams;

    // Perform intelligent search based on AI interpretation
    const searchLower = (searchTerms || [correctedQuery || query]).map((t: string) => t.toLowerCase());
    
    // Search products
    const matchedProducts = activeProducts.filter(product => {
      const nameMatch = searchLower.some((term: string) => 
        product.name.toLowerCase().includes(term) ||
        term.includes(product.name.toLowerCase().split(' ')[0])
      );
      const descMatch = product.description && searchLower.some((term: string) => 
        product.description!.toLowerCase().includes(term)
      );
      const establishmentMatch = product.establishments?.name && searchLower.some((term: string) =>
        product.establishments!.name.toLowerCase().includes(term)
      );
      
      return nameMatch || descMatch || establishmentMatch;
    });

    // Search establishments (including secondary categories)
    const typedEstablishments = (establishments || []) as Establishment[];
    const matchedEstablishments = typedEstablishments.filter(est => {
      const nameMatch = searchLower.some((term: string) => 
        est.name.toLowerCase().includes(term)
      );
      // Buscar em todas as categorias (principal + secundárias)
      const categoryMatch = searchLower.some((term: string) => 
        est.category.toLowerCase().includes(term) ||
        (est.category_2 && est.category_2.toLowerCase().includes(term)) ||
        (est.category_3 && est.category_3.toLowerCase().includes(term))
      );
      const descMatch = est.description && searchLower.some((term: string) => 
        est.description!.toLowerCase().includes(term)
      );
      const locationMatch = searchLower.some((term: string) => 
        (est.neighborhood?.toLowerCase().includes(term)) ||
        (est.region?.toLowerCase().includes(term))
      );
      
      return nameMatch || categoryMatch || descMatch || locationMatch;
    });

    // Apply location filter if provided
    let filteredProducts = matchedProducts;
    let filteredEstablishments = matchedEstablishments;
    
    const locationToFilter = locationFilter || location;
    if (locationToFilter) {
      const locLower = locationToFilter.toLowerCase();
      
      // PRIORIDADE 1: Filtrar por localização (só mostrar resultados da localização filtrada)
      filteredProducts = matchedProducts.filter(p => {
        const score = getProximityScore(p.establishments, locLower);
        return score > 0; // Só incluir se tiver alguma correspondência de localização
      });
      
      filteredEstablishments = matchedEstablishments.filter(e => {
        const score = getProximityScore(e, locLower);
        return score > 0;
      });
      
      // Ordenar por proximidade dentro dos filtrados
      filteredProducts = filteredProducts.sort((a, b) => {
        const aScore = getProximityScore(a.establishments, locLower);
        const bScore = getProximityScore(b.establishments, locLower);
        return bScore - aScore;
      });
      
      filteredEstablishments = filteredEstablishments.sort((a, b) => {
        const aScore = getProximityScore(a, locLower);
        const bScore = getProximityScore(b, locLower);
        return bScore - aScore;
      });
    }

    // PRIORIDADE 2: ORDENAÇÃO FINAL - Abertos primeiro, depois fechados
    filteredProducts = filteredProducts.sort((a, b) => {
      const aOpen = isEstablishmentOpen(a.establishments?.schedule || '');
      const bOpen = isEstablishmentOpen(b.establishments?.schedule || '');
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      return 0;
    });
    
    filteredEstablishments = filteredEstablishments.sort((a, b) => {
      const aOpen = isEstablishmentOpen(a.schedule || '');
      const bOpen = isEstablishmentOpen(b.schedule || '');
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      return 0;
    });

    // Format response
    const formattedProducts = filteredProducts.slice(0, 20).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      unit: p.unit,
      establishment: p.establishments ? {
        id: p.establishments.id,
        name: p.establishments.name,
        neighborhood: p.establishments.neighborhood,
        region: p.establishments.region,
        city: p.establishments.city,
        profileImage: p.establishments.profile_image,
        category: p.establishments.category,
        schedule: p.establishments.schedule,
        hasDelivery: p.establishments.has_delivery ?? false,
        phone: p.establishments.phone,
      } : null
    }));

    const formattedEstablishments = filteredEstablishments.slice(0, 10).map(e => ({
      id: e.id,
      name: e.name,
      neighborhood: e.neighborhood,
      region: e.region,
      city: e.city,
      profileImage: e.profile_image,
      category: e.category,
      description: e.description,
    }));

    return new Response(
      JSON.stringify({
        products: formattedProducts,
        establishments: formattedEstablishments,
        correctedQuery: correctedQuery !== query ? correctedQuery : null,
        searchType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getProximityScore(establishment: { neighborhood?: string | null; region?: string | null; city?: string } | null, location: string): number {
  if (!establishment) return 0;
  
  const neighborhood = establishment.neighborhood?.toLowerCase() || '';
  const region = establishment.region?.toLowerCase() || '';
  const city = establishment.city?.toLowerCase() || '';
  
  if (neighborhood.includes(location) || location.includes(neighborhood)) return 3;
  if (region.includes(location) || location.includes(region)) return 2;
  if (city.includes(location) || location.includes(city)) return 1;
  
  return 0;
}

// Função para verificar se estabelecimento está aberto
function isEstablishmentOpen(schedule: string): boolean {
  if (!schedule || typeof schedule !== 'string') return false;
  
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    const daysMap: Record<string, number> = {
      'dom': 0, 'domingo': 0,
      'seg': 1, 'segunda': 1,
      'ter': 2, 'terça': 2, 'terca': 2,
      'qua': 3, 'quarta': 3,
      'qui': 4, 'quinta': 4,
      'sex': 5, 'sexta': 5,
      'sáb': 6, 'sab': 6, 'sábado': 6, 'sabado': 6,
    };

    const scheduleLines = schedule.split(',').map(s => s.trim());

    for (const line of scheduleLines) {
      if (!line) continue;
      
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('fechado')) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const days = line.substring(0, colonIndex).trim().toLowerCase();
      const hours = line.substring(colonIndex + 1).trim();

      // Check if current day is included
      let dayIncluded = false;
      const rangeMatch = days.match(/(\w+)\s*[-–]\s*(\w+)/);
      if (rangeMatch) {
        const startDay = daysMap[rangeMatch[1]];
        const endDay = daysMap[rangeMatch[2]];
        if (startDay !== undefined && endDay !== undefined) {
          dayIncluded = startDay <= endDay 
            ? (currentDay >= startDay && currentDay <= endDay)
            : (currentDay >= startDay || currentDay <= endDay);
        }
      }
      if (!dayIncluded) {
        for (const [key, value] of Object.entries(daysMap)) {
          if (days.includes(key) && value === currentDay) {
            dayIncluded = true;
            break;
          }
        }
      }
      
      if (!dayIncluded) continue;

      const hoursMatch = hours.match(/(\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?/);
      if (!hoursMatch) continue;

      const openMinutes = parseInt(hoursMatch[1], 10) * 60 + parseInt(hoursMatch[2] || '0', 10);
      const closeMinutes = parseInt(hoursMatch[3], 10) * 60 + parseInt(hoursMatch[4] || '0', 10);
      
      if (closeMinutes < openMinutes) {
        // Crosses midnight
        if (currentTime >= openMinutes || currentTime < closeMinutes) return true;
      } else {
        if (currentTime >= openMinutes && currentTime < closeMinutes) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function performBasicSearch(query: string, products: Product[], establishments: Establishment[], corsHeaders: Record<string, string>) {
  const queryLower = query.toLowerCase();
  
  const matchedProducts = products.filter(p => 
    p.name.toLowerCase().includes(queryLower) ||
    p.description?.toLowerCase().includes(queryLower)
  ).slice(0, 20).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    unit: p.unit,
    establishment: p.establishments ? {
      id: p.establishments.id,
      name: p.establishments.name,
      neighborhood: p.establishments.neighborhood,
      region: p.establishments.region,
      city: p.establishments.city,
      profileImage: p.establishments.profile_image,
      category: p.establishments.category,
      schedule: p.establishments.schedule,
      hasDelivery: p.establishments.has_delivery ?? false,
      phone: p.establishments.phone,
    } : null
  }));
  
  const matchedEstablishments = establishments.filter(e => 
    e.name.toLowerCase().includes(queryLower) ||
    e.category.toLowerCase().includes(queryLower) ||
    e.description?.toLowerCase().includes(queryLower)
  ).slice(0, 10).map(e => ({
    id: e.id,
    name: e.name,
    neighborhood: e.neighborhood,
    region: e.region,
    city: e.city,
    profileImage: e.profile_image,
    category: e.category,
    description: e.description,
  }));
  
  return new Response(
    JSON.stringify({
      products: matchedProducts,
      establishments: matchedEstablishments,
      correctedQuery: null,
      searchType: 'mixed',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
