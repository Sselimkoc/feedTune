"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Supabase client'ı oluştur
const createSupabaseClient = () => createClientComponentClient();

export function useFeedItems() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Okundu/Okunmadı Durumu
  const { mutate: toggleItemRead, isLoading: isTogglingRead } = useMutation({
    mutationFn: async ({
      itemId,
      isRead,
      userId,
      skipInvalidation = false,
    }) => {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("user_interactions").upsert(
        {
          user_id: userId,
          item_id: itemId,
          item_type: "rss",
          is_read: isRead,
          is_favorite: false,
          is_read_later: false,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id, item_id" }
      );

      if (error) throw error;

      // Veriyi doğrudan güncelleyerek cache'i yönet
      if (!skipInvalidation) {
        return { itemId, isRead, skipInvalidation };
      }

      return { itemId, isRead, skipInvalidation };
    },
    onSuccess: (data) => {
      // Eğer skipInvalidation true ise, cache'i yenileme
      if (!data.skipInvalidation) {
        queryClient.invalidateQueries(["feedItems"]);
      } else {
        // Cache'i manuel olarak güncelle
        updateQueryCache(queryClient, data.itemId, { is_read: data.isRead });
      }
    },
    onError: (error) => {
      console.error("Error toggling read status:", error);
      toast.error(t("item.updateError"));
    },
  });

  // Favori Durumu
  const { mutate: toggleItemFavorite, isLoading: isTogglingFavorite } =
    useMutation({
      mutationFn: async ({
        itemId,
        isFavorite,
        userId,
        skipInvalidation = false,
      }) => {
        const supabase = createSupabaseClient();
        const { error } = await supabase.from("user_interactions").upsert(
          {
            user_id: userId,
            item_id: itemId,
            item_type: "rss",
            is_favorite: !isFavorite,
          },
          { onConflict: "user_id, item_id" }
        );

        if (error) throw error;
        return { itemId, isFavorite, skipInvalidation };
      },
      onSuccess: (data) => {
        // Eğer skipInvalidation true ise, cache'i yenileme
        if (!data.skipInvalidation) {
          queryClient.invalidateQueries(["feedItems"]);
          queryClient.invalidateQueries(["favorites"]);
        } else {
          // Cache'i manuel olarak güncelle
          updateQueryCache(queryClient, data.itemId, {
            is_favorite: data.isFavorite,
          });
        }
      },
      onError: (error) => {
        console.error("Error toggling favorite status:", error);
        toast.error(t("item.updateError"));
      },
    });

  // Daha Sonra Oku Durumu
  const { mutate: toggleItemReadLater, isLoading: isTogglingReadLater } =
    useMutation({
      mutationFn: async ({
        itemId,
        isReadLater,
        userId,
        skipInvalidation = false,
      }) => {
        const supabase = createSupabaseClient();
        const { error } = await supabase.from("user_interactions").upsert(
          {
            user_id: userId,
            item_id: itemId,
            item_type: "rss",
            is_read_later: !isReadLater,
          },
          { onConflict: "user_id, item_id" }
        );

        if (error) throw error;
        return { itemId, isReadLater, skipInvalidation };
      },
      onSuccess: (data) => {
        // Eğer skipInvalidation true ise, cache'i yenileme
        if (!data.skipInvalidation) {
          queryClient.invalidateQueries(["feedItems"]);
          queryClient.invalidateQueries(["readLater"]);
        } else {
          // Cache'i manuel olarak güncelle
          updateQueryCache(queryClient, data.itemId, {
            is_read_later: data.isReadLater,
          });
        }
      },
      onError: (error) => {
        console.error("Error toggling read later status:", error);
        toast.error(t("item.updateError"));
      },
    });

  // Cache'i manuel olarak güncelleyen yardımcı fonksiyon
  const updateQueryCache = (queryClient, itemId, updates) => {
    // Tüm ilgili sorguları al
    const feedItemsData = queryClient.getQueryData(["feedItems"]);
    const favoritesData = queryClient.getQueryData(["favorites"]);
    const readLaterData = queryClient.getQueryData(["readLater"]);

    // Güncellenen öğeyi bul
    const updatedItem = feedItemsData?.find((item) => item.id === itemId);

    // feedItems cache'ini güncelle
    if (feedItemsData) {
      queryClient.setQueryData(["feedItems"], (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });
    }

    // favorites cache'ini güncelle (eğer is_favorite değişti ise)
    if ("is_favorite" in updates && favoritesData) {
      queryClient.setQueryData(["favorites"], (old) => {
        if (!old) return old;

        if (updates.is_favorite) {
          // Favorilere eklenmiş ve zaten listede değilse ekle
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // Zaten varsa sadece durum bilgisini güncelle
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Favorilerden kaldırılmışsa listeden çıkar
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // readLater cache'ini güncelle (eğer is_read_later değişti ise)
    if ("is_read_later" in updates && readLaterData) {
      queryClient.setQueryData(["readLater"], (old) => {
        if (!old) return old;

        if (updates.is_read_later) {
          // Okuma listesine eklenmiş ve zaten listede değilse ekle
          const itemExists = old.some((item) => item.id === itemId);
          if (!itemExists && updatedItem) {
            return [...old, { ...updatedItem, ...updates }];
          } else {
            // Zaten varsa sadece durum bilgisini güncelle
            return old.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            );
          }
        } else {
          // Okuma listesinden kaldırılmışsa listeden çıkar
          return old.filter((item) => item.id !== itemId);
        }
      });
    }

    // Güncelleme sonrası cache durumunu kontrol et ve logla
    console.log("Cache güncellemesi tamamlandı:", {
      itemId,
      updates,
      feedItemsCacheSize: queryClient.getQueryData(["feedItems"])?.length || 0,
      favoritesCacheSize: queryClient.getQueryData(["favorites"])?.length || 0,
      readLaterCacheSize: queryClient.getQueryData(["readLater"])?.length || 0,
    });
  };

  return {
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
    isTogglingRead,
    isTogglingFavorite,
    isTogglingReadLater,
  };
}
