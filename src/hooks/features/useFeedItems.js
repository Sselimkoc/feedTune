"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Supabase client'ı oluştur
const createSupabaseClient = () => createClientComponentClient();

export function useFeedItems() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // Okundu/Okunmadı Durumu
  const { mutate: toggleItemRead, isLoading: isTogglingRead } = useMutation({
    mutationFn: async ({ itemId, isRead, userId }) => {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("user_item_interactions").upsert(
        {
          user_id: userId,
          item_id: itemId,
          is_read: isRead,
        },
        {
          onConflict: "user_id,item_id",
        }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["feedItems"]);
    },
    onError: (error) => {
      console.error("Error toggling read status:", error);
      toast.error(t("item.updateError"));
    },
  });

  // Favori Durumu
  const { mutate: toggleItemFavorite, isLoading: isTogglingFavorite } =
    useMutation({
      mutationFn: async ({ itemId, isFavorite, userId }) => {
        const supabase = createSupabaseClient();
        const { error } = await supabase.from("user_item_interactions").upsert(
          {
            user_id: userId,
            item_id: itemId,
            is_favorite: isFavorite,
          },
          {
            onConflict: "user_id,item_id",
          }
        );

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["feedItems"]);
        queryClient.invalidateQueries(["favorites"]);
      },
      onError: (error) => {
        console.error("Error toggling favorite status:", error);
        toast.error(t("item.updateError"));
      },
    });

  // Daha Sonra Oku Durumu
  const { mutate: toggleItemReadLater, isLoading: isTogglingReadLater } =
    useMutation({
      mutationFn: async ({ itemId, isReadLater, userId }) => {
        const supabase = createSupabaseClient();
        const { error } = await supabase.from("user_item_interactions").upsert(
          {
            user_id: userId,
            item_id: itemId,
            is_read_later: isReadLater,
          },
          {
            onConflict: "user_id,item_id",
          }
        );

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["feedItems"]);
        queryClient.invalidateQueries(["readLater"]);
      },
      onError: (error) => {
        console.error("Error toggling read later status:", error);
        toast.error(t("item.updateError"));
      },
    });

  return {
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
    isTogglingRead,
    isTogglingFavorite,
    isTogglingReadLater,
  };
}
