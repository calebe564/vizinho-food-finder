import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

type EstablishmentCategory = Database["public"]["Enums"]["establishment_category"];

export default function AllEstablishments() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialNeighborhood = searchParams.get("neighborhood") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood);

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["establishments", searchQuery, selectedCategory, selectedNeighborhood],
    queryFn: async () => {
      let query = supabase
        .from("establishments")
        .select("*")
        .eq("active", true)
        .order("name");

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      if (selectedCategory && selectedCategory !== "todos") {
        query = query.eq("category", selectedCategory as EstablishmentCategory);
      }

      if (selectedNeighborhood) {
        query = query.eq("neighborhood", selectedNeighborhood);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Todos os Estabelecimentos</h1>
          <p className="text-muted-foreground mb-8">
            Explore todos os estabelecimentos cadastrados
          </p>

          <div className="space-y-6 mb-8">
            <SearchBar onSearch={setSearchQuery} />
            <FilterBar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedNeighborhood={selectedNeighborhood}
              onNeighborhoodChange={setSelectedNeighborhood}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : establishments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum estabelecimento encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishments.map((establishment) => (
                <EstablishmentCard
                  key={establishment.id}
                  establishment={establishment}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
