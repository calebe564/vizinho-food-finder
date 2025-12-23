import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "comercio_vizinho_favorites";
const PRODUCT_FAVORITES_KEY = "comercio_vizinho_product_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [productFavorites, setProductFavorites] = useState<string[]>([]);

  useEffect(() => {
    const storedEstablishments = localStorage.getItem(FAVORITES_KEY);
    if (storedEstablishments) {
      try {
        setFavorites(JSON.parse(storedEstablishments));
      } catch {
        setFavorites([]);
      }
    }

    const storedProducts = localStorage.getItem(PRODUCT_FAVORITES_KEY);
    if (storedProducts) {
      try {
        setProductFavorites(JSON.parse(storedProducts));
      } catch {
        setProductFavorites([]);
      }
    }
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
    totalFavorites,
  };
}
