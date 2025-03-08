"use client";

import { useFeeds } from "@/hooks/useFeeds";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";
import { FeedList } from "@/components/feeds/FeedList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export function FeedContent() {
  const { addRssFeed, addYoutubeFeed } = useFeeds();
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();

  const addFeed = async (feed) => {
    try {
      const { data: newFeed, error: feedError } = await supabase
        .from("feeds")
        .insert([feed])
        .select()
        .single();

      if (feedError) throw feedError;

      toast.success("Feed added successfully");
    } catch (error) {
      console.error("Error adding feed:", error);
      toast.error("Failed to add feed");
    }
  };

  const removeFeed = async (feedId) => {
    try {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .match({ id: feedId });

      if (error) throw error;

      toast.success("Feed removed successfully");
    } catch (error) {
      console.error("Error removing feed:", error);
      toast.error("Failed to remove feed");
    }
  };

  const toggleItemRead = async (itemId, isRead) => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read: isRead })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: isRead,
            is_favorite: false,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }

      // Başarılı işlem sonrası kullanıcıya bildirim göster
      toast.success(
        isRead
          ? "Öğe okundu olarak işaretlendi"
          : "Öğe okunmadı olarak işaretlendi",
        {
          duration: 2000,
          position: "bottom-right",
        }
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Öğe durumu güncellenemedi");
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_favorite: isFavorite })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: isFavorite,
            is_read_later: false,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("Favori durumu güncellenemedi");
    }
  };

  const toggleItemReadLater = async (itemId, isReadLater) => {
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    try {
      // Önce etkileşim var mı kontrol et
      const { data: existingInteraction, error: checkError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      if (existingInteraction) {
        // Etkileşim varsa güncelle
        const { error } = await supabase
          .from("user_item_interactions")
          .update({ is_read_later: isReadLater })
          .eq("user_id", user.id)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        // Etkileşim yoksa oluştur
        const { error } = await supabase.from("user_item_interactions").insert([
          {
            user_id: user.id,
            item_id: itemId,
            is_read: false,
            is_favorite: false,
            is_read_later: isReadLater,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error("Okuma listesi durumu güncellenemedi");
    }
  };

  return (
    <div className="min-h-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Beslemeler</h2>
        <AddFeedDialog>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus-circle"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            Feed Ekle
          </button>
        </AddFeedDialog>
      </div>

      <FeedList
        onRemoveFeed={removeFeed}
        onToggleRead={toggleItemRead}
        onToggleFavorite={toggleItemFavorite}
        onToggleReadLater={toggleItemReadLater}
      />
    </div>
  );
}
