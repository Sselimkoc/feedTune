"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Varsayılan filtre değerleri
const DEFAULT_FILTERS = {
  feedType: "all",   // 'all', 'rss' veya 'youtube'
  readStatus: null,  // null (tümü), 'read' veya 'unread'
  sortBy: "newest",  // 'newest', 'oldest', 'unread-first' veya 'favorites'
  feedName: null,    // Besleme adına göre filtreleme
};

export function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // URL parametrelerinden filtreleri yükle
  useEffect(() => {
    const urlFilters = {};
    
    // URL'den tüm filtreleri oku
    if (searchParams.has('feedType')) {
      urlFilters.feedType = searchParams.get('feedType');
    }
    
    if (searchParams.has('readStatus')) {
      urlFilters.readStatus = searchParams.get('readStatus');
    }
    
    if (searchParams.has('sortBy')) {
      urlFilters.sortBy = searchParams.get('sortBy');
    }
    
    if (searchParams.has('feedName')) {
      urlFilters.feedName = searchParams.get('feedName');
    }
    
    // Eğer URL'de filtreler varsa, state'i güncelle
    if (Object.keys(urlFilters).length > 0) {
      setFilters({...DEFAULT_FILTERS, ...urlFilters});
      console.log("URL'den filtreleri yüklendi:", urlFilters);
    }
  }, [searchParams]);

  // Filtreleri uygula
  const applyFilters = useCallback((newFilters) => {
    try {
      console.log("Uygulanan filtreler:", newFilters);
      
      const updatedFilters = {
        ...DEFAULT_FILTERS,
        ...newFilters
      };
      
      // Filtreleri state'e kaydet
      setFilters(updatedFilters);
      
      // URL parametrelerini güncelle (ama sayfayı yenileme)
      const params = new URLSearchParams();
      
      // Boş olmayan ve varsayılan olmayan değerleri URL'e ekle
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== null && 
            value !== DEFAULT_FILTERS[key] && 
            !(key === 'feedType' && value === 'all')) {
          params.set(key, value);
        }
      });
      
      const query = params.toString();
      // shallow: true ile sayfa yenilemeden URL güncellenir
      router.push(query ? `?${query}` : "/feeds", { scroll: false, shallow: true });
    } catch (error) {
      console.error("Filtre uygulama hatası:", error);
    }
  }, [router]);

  // Filtreleri sıfırla
  const resetFilters = useCallback(() => {
    try {
      setFilters(DEFAULT_FILTERS);
      router.push("/feeds", { scroll: false, shallow: true });
    } catch (error) {
      console.error("Filtre sıfırlama hatası:", error);
    }
  }, [router]);

  return {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    DEFAULT_FILTERS,
  };
} 