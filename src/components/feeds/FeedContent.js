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
  const { addRssFeed, addYoutubeFeed, refetch } = useFeeds();
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
      // Kullanıcıya onay sor
      if (
        !window.confirm(
          "Bu feed'i silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        )
      ) {
        return;
      }

      // İlerleme bildirimi göster
      const toastId = toast.loading("Feed siliniyor...");

      // 1. Önce feed'e ait tüm öğeleri bul
      const { data: feedItems, error: itemsError } = await supabase
        .from("feed_items")
        .select("id")
        .eq("feed_id", feedId);

      if (itemsError) {
        console.error("Feed öğeleri alınırken hata:", itemsError);
        toast.error("Feed öğeleri alınırken hata oluştu", { id: toastId });
        return;
      }

      // 2. Kullanıcı etkileşimlerini sil (eğer öğeler varsa)
      if (feedItems && feedItems.length > 0) {
        const itemIds = feedItems.map((item) => item.id);

        const { error: interactionsError } = await supabase
          .from("user_item_interactions")
          .delete()
          .in("item_id", itemIds);

        if (interactionsError) {
          console.error(
            "Kullanıcı etkileşimleri silinirken hata:",
            interactionsError
          );
          toast.error("Kullanıcı etkileşimleri silinirken hata oluştu", {
            id: toastId,
          });
          return;
        }
      }

      // 3. Feed öğelerini sil
      const { error: deleteItemsError } = await supabase
        .from("feed_items")
        .delete()
        .eq("feed_id", feedId);

      if (deleteItemsError) {
        console.error("Feed öğeleri silinirken hata:", deleteItemsError);
        toast.error("Feed öğeleri silinirken hata oluştu", { id: toastId });
        return;
      }

      // 4. Feed türüne özel tablodan sil (rss_feeds veya youtube_feeds)
      const { data: feedData, error: feedTypeError } = await supabase
        .from("feeds")
        .select("type")
        .eq("id", feedId)
        .single();

      if (!feedTypeError && feedData) {
        if (feedData.type === "rss") {
          const { error: rssError } = await supabase
            .from("rss_feeds")
            .delete()
            .eq("id", feedId);

          if (rssError) {
            console.error("RSS feed detayları silinirken hata:", rssError);
            // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
          }
        } else if (feedData.type === "youtube") {
          const { error: youtubeError } = await supabase
            .from("youtube_feeds")
            .delete()
            .eq("id", feedId);

          if (youtubeError) {
            console.error(
              "YouTube feed detayları silinirken hata:",
              youtubeError
            );
            // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
          }
        }
      }

      // 5. Feed kategori ilişkilerini sil
      const { error: categoryMappingError } = await supabase
        .from("feed_category_mappings")
        .delete()
        .eq("feed_id", feedId);

      if (categoryMappingError) {
        console.error(
          "Feed kategori ilişkileri silinirken hata:",
          categoryMappingError
        );
        // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
      }

      // 6. Son olarak ana feed'i sil
      const { error: deleteFeedError } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId);

      if (deleteFeedError) {
        console.error("Feed silinirken hata:", deleteFeedError);
        toast.error("Feed silinirken hata oluştu", { id: toastId });
        return;
      }

      // Başarılı bildirim göster
      toast.success("Feed ve ilişkili tüm veriler başarıyla silindi", {
        id: toastId,
      });

      // Feed listesini yenile
      refetch();
    } catch (error) {
      console.error("Feed silme işlemi sırasında hata:", error);
      toast.error("Feed silme işlemi başarısız oldu");
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
          <h1 className="text-2xl font-bold">Feed&apos;ler</h1>
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
