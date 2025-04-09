"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Varsayılan filtre değerleri
const DEFAULT_FILTERS = {
  feedType: null,
  feedName: null,
  sortBy: "date",
  sortOrder: "desc",
};

export function useFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Filtreleri uygula
  const applyFilters = useCallback((newFilters) => {
    try {
      const updatedFilters = {
        ...DEFAULT_FILTERS,
        ...newFilters
      };
      
      // Null değerleri temizle
      const cleanFilters = Object.fromEntries(
        Object.entries(updatedFilters).filter(([_, value]) => value !== null)
      );
      
      setFilters(cleanFilters);
      
      // URL'i güncelle
      const params = new URLSearchParams();
      Object.entries(cleanFilters).forEach(([key, value]) => {
        if (value !== DEFAULT_FILTERS[key]) {
          params.set(key, value);
        }
      });
      
      const query = params.toString();
      router.push(query ? `?${query}` : "/feeds", { scroll: false });
    } catch (error) {
      console.error("Filtre uygulama hatası:", error);
    }
  }, [router]);

  // Filtreleri sıfırla
  const resetFilters = useCallback(() => {
    try {
      setFilters(DEFAULT_FILTERS);
      router.push("/feeds", { scroll: false });
    } catch (error) {
      console.error("Filtre sıfırlama hatası:", error);
    }
  }, [router]);

  return {
    filters,
    applyFilters,
    resetFilters,
    DEFAULT_FILTERS,
  };
} 