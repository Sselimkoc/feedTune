"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Yerel depolama için sabitler
const FILTERS_STORAGE_KEY = "feedtune-feed-filters";

// Varsayılan filtreler
const DEFAULT_FILTERS = {
  feedType: "all",
  readStatus: "all",
  sortBy: "newest",
  feedName: "",
};

/**
 * Feed öğelerini filtrelemek için hook
 * @returns {Object} Filtre işlemleri ve durumu
 */
export function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitializedRef = useRef(false);

  // Önbellekten başlangıç değerlerini alma
  const [filters, setFilters] = useState(() => {
    try {
      // Tarayıcı ortamında çalışıyorsa
      if (typeof window !== "undefined") {
        const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (savedFilters) {
          return JSON.parse(savedFilters);
        }
      }
      return DEFAULT_FILTERS;
    } catch (error) {
      console.error("Filtre ayarları yüklenirken hata:", error);
      return DEFAULT_FILTERS;
    }
  });

  const previousFiltersRef = useRef(filters);

  // URL parametrelerinden filtreleri yükle
  useEffect(() => {
    const urlFilters = {};
    let hasUrlFilters = false;

    // URL'den tüm filtreleri oku
    if (searchParams.has("feedType")) {
      urlFilters.feedType = searchParams.get("feedType");
      hasUrlFilters = true;
    }

    if (searchParams.has("readStatus")) {
      urlFilters.readStatus = searchParams.get("readStatus");
      hasUrlFilters = true;
    }

    if (searchParams.has("sortBy")) {
      urlFilters.sortBy = searchParams.get("sortBy");
      hasUrlFilters = true;
    }

    if (searchParams.has("feedName")) {
      urlFilters.feedName = searchParams.get("feedName");
      hasUrlFilters = true;
    }

    // Eğer URL'de filtreler varsa ve ilk yükleniyorsa, state'i güncelle
    if (hasUrlFilters && !isInitializedRef.current) {
      console.log("URL'den filtreleri yüklendi:", urlFilters);
      setFilters((prev) => ({ ...prev, ...urlFilters }));

      // Bu filtreleri localStorage'a da kaydet
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({ ...filters, ...urlFilters })
      );
    }

    isInitializedRef.current = true;
  }, [searchParams]);

  // Filtrelerin değişiminde yerel depolamaya kaydet ve URL'i güncelle
  useEffect(() => {
    // İlk yükleme sırasında değişiklik yapmaktan kaçın
    if (!isInitializedRef.current) return;

    try {
      // Aynı değerlere sahip filtreler için kaydetme
      const prevFilters = previousFiltersRef.current;
      const hasChanged =
        prevFilters.feedType !== filters.feedType ||
        prevFilters.readStatus !== filters.readStatus ||
        prevFilters.sortBy !== filters.sortBy ||
        prevFilters.feedName !== filters.feedName;

      if (hasChanged) {
        // LocalStorage'a kaydet
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
        previousFiltersRef.current = { ...filters };

        // URL parametrelerini güncelle
        updateUrlWithFilters(filters);
      }
    } catch (error) {
      console.error("Filtre ayarları kaydedilirken hata:", error);
    }
  }, [filters]);

  // URL'yi filtrelerle güncelleme işlevi
  const updateUrlWithFilters = useCallback(
    (filterValues) => {
      try {
        const params = new URLSearchParams();

        // Boş olmayan ve varsayılan olmayan değerleri URL'e ekle
        Object.entries(filterValues).forEach(([key, value]) => {
          if (
            value !== null &&
            value !== DEFAULT_FILTERS[key] &&
            !(key === "feedType" && value === "all") &&
            !(key === "readStatus" && value === "all")
          ) {
            params.set(key, value);
          }
        });

        const query = params.toString();
        // shallow: true ile sayfa yenilemeden URL güncellenir
        router.push(query ? `?${query}` : "/feeds", { scroll: false });
      } catch (error) {
        console.error("URL güncelleme hatası:", error);
      }
    },
    [router]
  );

  // Filtreleri güncelle
  const applyFilters = useCallback((newFilters) => {
    setFilters((prev) => {
      // Önceki filtrelerin tam bir kopyasını oluştur
      const updated = { ...prev };

      // Sadece değişen filtreleri güncelle
      Object.entries(newFilters).forEach(([key, value]) => {
        if (prev[key] !== value) {
          updated[key] = value;
        }
      });

      // Veriler aynıysa state güncellemesini engelle
      if (JSON.stringify(updated) === JSON.stringify(prev)) {
        return prev;
      }

      return updated;
    });
  }, []);

  // Belirli bir filtre değerini güncelle
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      // Değer zaten aynıysa güncelleme yapma
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  // Tüm filtreleri varsayılan değerlere sıfırla
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);

    // URL'yi de temizle
    router.push("/feeds", { scroll: false });

    // LocalStorage'ı temizle
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  }, [router]);

  // Feed ismi arama filtresi
  const setFeedNameFilter = useCallback(
    (name) => {
      updateFilter("feedName", name);
    },
    [updateFilter]
  );

  // Feed türü filtresi (tümü, rss, youtube)
  const setFeedTypeFilter = useCallback(
    (type) => {
      updateFilter("feedType", type);
    },
    [updateFilter]
  );

  // Okunma durumu filtresi (tümü, okundu, okunmadı)
  const setReadStatusFilter = useCallback(
    (status) => {
      updateFilter("readStatus", status);
    },
    [updateFilter]
  );

  // Sıralama filtresi
  const setSortByFilter = useCallback(
    (sortBy) => {
      updateFilter("sortBy", sortBy);
    },
    [updateFilter]
  );

  return {
    filters,
    applyFilters,
    updateFilter,
    resetFilters,
    setFeedNameFilter,
    setFeedTypeFilter,
    setReadStatusFilter,
    setSortByFilter,
  };
}
