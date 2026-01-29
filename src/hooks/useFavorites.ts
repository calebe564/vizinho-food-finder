import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const FAVORITES_KEY = "comercio_vizinho_favorites";
const PRODUCT_FAVORITES_KEY = "comercio_vizinho_product_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [productFavorites, setProductFavorites] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load favorites from localStorage and validate against active establishments
  useEffect(() => {
    const loadAndValidateFavorites = async () => {
      // Load stored favorites
      let storedEstablishments: string[] = [];
      let storedProducts: string[] = [];
      
      const storedEstablishmentsRaw = localStorage.getItem(FAVORITES_KEY);
      if (storedEstablishmentsRaw) {
        try {
          storedEstablishments = JSON.parse(storedEstablishmentsRaw);
        } catch {
          storedEstablishments = [];
        }
      }

      const storedProductsRaw = localStorage.getItem(PRODUCT_FAVORITES_KEY);
      if (storedProductsRaw) {
        try {
          storedProducts = JSON.parse(storedProductsRaw);
        } catch {
          storedProducts = [];
        }
      }

      // Validate establishments still exist and are active
      if (storedEstablishments.length > 0) {
        try {
          const { data: validEstablishments } = await supabase
            .from("establishments")
            .select("id")
            .in("id", storedEstablishments)
            .eq("active", true);

          const validIds = new Set(validEstablishments?.map(e => e.id) || []);
          const filteredFavorites = storedEstablishments.filter(id => validIds.has(id));
          
          if (filteredFavorites.length !== storedEstablishments.length) {
            // Some favorites were invalid, update localStorage
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(filteredFavorites));
          }
          
          setFavorites(filteredFavorites);
        } catch (err) {
          console.error("Error validating favorites:", err);
          setFavorites(storedEstablishments);
        }
      } else {
        setFavorites([]);
      }

      // Validate products still exist
      if (storedProducts.length > 0) {
        try {
          const { data: validProducts } = await supabase
            .from("products")
            .select("id")
            .in("id", storedProducts);

          const validIds = new Set(validProducts?.map(p => p.id) || []);
          const filteredProducts = storedProducts.filter(id => validIds.has(id));
          
          if (filteredProducts.length !== storedProducts.length) {
            localStorage.setItem(PRODUCT_FAVORITES_KEY, JSON.stringify(filteredProducts));
          }
          
          setProductFavorites(filteredProducts);
        } catch (err) {
          console.error("Error validating product favorites:", err);
          setProductFavorites(storedProducts);
        }
      } else {
        setProductFavorites([]);
      }

      setInitialized(true);
    };

    loadAndValidateFavorites();
  }, []);

  const saveFavorites = useCallback((newFavorites: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  }, []);

  const saveProductFavorites = useCallback((newFavorites: string[]) => {
    localStorage.setItem(PRODUCT_FAVORITES_KEY, JSON.stringify(newFavorites));
    setProductFavorites(newFavorites);
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.includes(id);
  }, [favorites]);

  const isProductFavorite = useCallback((id: string) => {
    return productFavorites.includes(id);
  }, [productFavorites]);

  const toggleFavorite = useCallback((id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];
    saveFavorites(newFavorites);
    return !favorites.includes(id);
  }, [favorites, saveFavorites]);

  const toggleProductFavorite = useCallback((id: string) => {
    const newFavorites = productFavorites.includes(id)
      ? productFavorites.filter(fav => fav !== id)
      : [...productFavorites, id];
    saveProductFavorites(newFavorites);
    return !productFavorites.includes(id);
  }, [productFavorites, saveProductFavorites]);

  const addFavorite = useCallback((id: string) => {
    if (!favorites.includes(id)) {
      saveFavorites([...favorites, id]);
    }
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((id: string) => {
    saveFavorites(favorites.filter(fav => fav !== id));
  }, [favorites, saveFavorites]);

  // Remove a deleted establishment from favorites (called from admin actions)
  const removeDeletedEstablishment = useCallback((id: string) => {
    saveFavorites(favorites.filter(fav => fav !== id));
  }, [favorites, saveFavorites]);

  const totalFavorites = favorites.length + productFavorites.length;

  return {
    favorites,
    productFavorites,
    isFavorite,
    isProductFavorite,
    toggleFavorite,
    toggleProductFavorite,
    addFavorite,
    removeFavorite,
    removeDeletedEstablishment,
    totalFavorites,
    isInitialized: initialized,
  };
}
