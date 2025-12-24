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
    active: boolean;
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
  description: string | null;
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

    // Fetch all products with their establishments
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
          active
        )
      `)
      .order('name');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Fetch all active establishments
    const { data: establishments, error: establishmentsError } = await supabase
      .from('establishments')
      .select('id, name, neighborhood, region, city, profile_image, category, description')
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

    // Search establishments
    const typedEstablishments = (establishments || []) as Establishment[];
    const matchedEstablishments = typedEstablishments.filter(est => {
      const nameMatch = searchLower.some((term: string) => 
        est.name.toLowerCase().includes(term)
      );
      const categoryMatch = searchLower.some((term: string) => 
        est.category.toLowerCase().includes(term)
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
      
      // Sort by proximity (same neighborhood first, then region, then city)
      filteredProducts = matchedProducts.sort((a, b) => {
        const aScore = getProximityScore(a.establishments, locLower);
        const bScore = getProximityScore(b.establishments, locLower);
        return bScore - aScore;
      });
      
      filteredEstablishments = matchedEstablishments.sort((a, b) => {
        const aScore = getProximityScore(a, locLower);
        const bScore = getProximityScore(b, locLower);
        return bScore - aScore;
      });
    }

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
