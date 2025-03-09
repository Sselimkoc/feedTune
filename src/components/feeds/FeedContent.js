"use client";

import { useFeeds } from "@/hooks/useFeeds";
import { AddFeedButton } from "@/components/feeds/AddFeedButton";
import { FeedList } from "@/components/feeds/FeedList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyboardShortcutsHelp } from "@/components/feeds/KeyboardShortcutsHelp";

export function FeedContent() {
  const { addRssFeed, addYoutubeFeed } = useFeeds();
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

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
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feed'ler</h1>
          <p className="text-muted-foreground">
            Takip ettiğiniz kaynakların içeriklerini görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddFeedButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
            className="h-9 px-3"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            <span className="text-sm">Klavye Kısayolları</span>
          </Button>
        </div>
      </div>

      <FeedList
        onRemoveFeed={removeFeed}
        onToggleRead={toggleItemRead}
        onToggleFavorite={toggleItemFavorite}
        onToggleReadLater={toggleItemReadLater}
      />

      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}
