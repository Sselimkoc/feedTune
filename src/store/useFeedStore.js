import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Önbellek ayarları
const CACHE_KEY = "feed-cache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 dakika
const MAX_ITEMS_PER_FEED = 50; // Her feed için maksimum item sayısı

// Önbellek yönetimi için yardımcı fonksiyonlar
const getCache = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const { data, timestamp } = JSON.parse(cache);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Cache error:", error);
    return null;
  }
};

const setCache = (data) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Cache error:", error);
  }
};

// Feed ile ilgili toast mesajları için sabit anahtarlar tanımlayalım
const FEED_MESSAGES = {
  LOADING_ERROR: "errors.general",
  FEED_EXISTS: "feeds.feedExists",
  FEED_ADDED: "feeds.feedAdded",
  FEED_ADD_ERROR: "feeds.addFeed.error",
  FEED_REMOVED: "feeds.feedRemovedSuccessfully",
  FEED_REMOVE_ERROR: "errors.failedToDeleteFeed",
  ITEM_STATUS_ERROR: "errors.errorUpdatingItemStatus",
  FAVORITE_STATUS_ERROR: "errors.errorUpdatingFavoriteStatus",
  CACHE_CLEARED: "feeds.cacheCleared",
};

// Feed Store - Global durum yönetimi
export const useFeedStore = create(
  persist(
    (set, get) => ({
      // Veriler
      feeds: [],
      items: [],
      localItems: [],

      // UI durumu
      selectedFeedId: null,
      viewMode: "grid", // "grid" veya "list"
      isLoading: false,
      isError: false,
      error: null,

      // Filtreler
      filters: {
        sortBy: "newest",
        showRead: true,
        showUnread: true,
        feedTypes: {
          rss: true,
          youtube: true,
        },
      },

      // Veri yükleme eylemleri
      setFeeds: (feeds) => set({ feeds }),
      setItems: (items) =>
        set((state) => {
          // Önceki items ile yeni items arasında ID seviyesinde karşılaştırma yap
          if (
            !state.items.length ||
            JSON.stringify(items.map((i) => i.id)) !==
              JSON.stringify(state.items.map((i) => i.id))
          ) {
            console.log(
              "Feed store: Yeni içerikler alındı, state güncelleniyor"
            );
            return { items, localItems: items };
          }
          console.log("Feed store: İçerikler değişmedi, güncelleme yapılmıyor");
          return { items }; // Sadece API veri kısmını güncelle, localItems değişmesin
        }),

      // UI eylemler
      setSelectedFeed: (feedId) => set({ selectedFeedId: feedId }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ isError: !!error, error }),

      // Filtre eylemleri
      setFilters: (filters) => set({ filters }),

      // İyimser Güncellemeler
      updateLocalItem: (itemId, changes) =>
        set((state) => {
          const item = state.localItems.find((item) => item.id === itemId);

          // Eğer öğe bulunamadıysa veya değişiklik gerekli değilse güncelleme yapma
          if (
            !item ||
            Object.entries(changes).every(([key, value]) => item[key] === value)
          ) {
            return state;
          }

          return {
            localItems: state.localItems.map((item) =>
              item.id === itemId ? { ...item, ...changes } : item
            ),
          };
        }),

      // Tüm verileri yenile
      refreshData: () =>
        set((state) => {
          // Burada sadece durumu sıfırlıyoruz, gerçek veri yenileme API tarafında yapılacak
          return { isLoading: true, isError: false, error: null };
        }),

      // Veri yüklendikten sonra çağrılır
      dataLoaded: () => set({ isLoading: false }),

      // Tüm state'i temizle (logout durumlarında kullanılabilir)
      clearStore: () =>
        set({
          feeds: [],
          items: [],
          localItems: [],
          selectedFeedId: null,
          isLoading: false,
          isError: false,
          error: null,
        }),
    }),
    {
      name: "feedtune-store", // localStorage key
      partialize: (state) => ({
        viewMode: state.viewMode,
        filters: state.filters,
      }), // Sadece bu değerleri localStorage'da sakla
    }
  )
);

// Yardımcı fonksiyonlar
export const getFilteredItems = () => {
  const { localItems, feeds, selectedFeedId, filters } =
    useFeedStore.getState();

  // Filtreleme
  return localItems
    .filter((item) => {
      // Feed ID'ye göre filtrele
      if (selectedFeedId && item.feed_id !== selectedFeedId) return false;

      // Okuma durumuna göre filtrele
      if (!filters.showRead && item.is_read) return false;
      if (!filters.showUnread && !item.is_read) return false;

      // Feed tipine göre filtrele
      const feedType = feeds.find((f) => f.id === item.feed_id)?.type || "rss";
      if (!filters.feedTypes[feedType]) return false;

      return true;
    })
    .sort((a, b) => {
      // Sıralama
      if (filters.sortBy === "newest") {
        return new Date(b.published_at) - new Date(a.published_at);
      } else if (filters.sortBy === "oldest") {
        return new Date(a.published_at) - new Date(b.published_at);
      } else if (filters.sortBy === "unread") {
        return b.is_read === a.is_read ? 0 : b.is_read ? -1 : 1;
      } else if (filters.sortBy === "favorites") {
        return b.is_favorite === a.is_favorite ? 0 : b.is_favorite ? 1 : -1;
      }
      return 0;
    });
};
