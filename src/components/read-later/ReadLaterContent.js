"use client";

import { useState, useEffect } from "react";
import { ReadLaterList } from "@/components/read-later/ReadLaterList";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export function ReadLaterContent() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchReadLater = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        console.log("Fetching read later items for user:", user.id);

        // Kullanıcının okuma listesi etkileşimlerini al
        const { data: interactions, error: interactionsError } = await supabase
          .from("user_item_interactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_read_later", true);

        if (interactionsError) {
          console.error(
            "Error fetching read later interactions:",
            interactionsError
          );
          throw interactionsError;
        }

        console.log("Read later interactions:", interactions?.length || 0);

        if (!interactions || interactions.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        // Etkileşimlere ait içerik ID'lerini al
        const itemIds = interactions.map((interaction) => interaction.item_id);

        // İçerikleri ve ilişkili feed bilgilerini çek
        const { data: feedItems, error: itemsError } = await supabase
          .from("feed_items")
          .select(
            `
            id,
            title,
            description,
            link,
            published_at,
            thumbnail,
            feed_id,
            feeds (
              id,
              title,
              site_favicon,
              type
            )
          `
          )
          .in("id", itemIds);

        if (itemsError) {
          console.error("Error fetching feed items:", itemsError);
          throw itemsError;
        }

        console.log("Feed items fetched:", feedItems?.length || 0);

        if (!feedItems || feedItems.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        // Etkileşim bilgilerini içeriklere ekle
        const formattedItems = feedItems.map((item) => {
          // Bu içerik için etkileşim bilgisini bul
          const interaction = interactions.find(
            (int) => int.item_id === item.id
          );

          // Feed bilgilerini doğru şekilde al
          const feed = item.feeds || {};

          return {
            ...item,
            is_read_later: true,
            is_read: interaction?.is_read || false,
            is_favorite: interaction?.is_favorite || false,
            feed_title: feed.title || "Bilinmeyen Kaynak",
            feed_type: feed.type || "rss",
            site_favicon: feed.site_favicon || null,
          };
        });

        // Tarihe göre sırala (en yeni en üstte)
        const sortedItems = formattedItems.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at)
        );

        console.log("Formatted items:", sortedItems.length);
        setItems(sortedItems);
      } catch (error) {
        console.error("Error in fetchReadLater:", error);
        toast.error("Okuma listesi yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadLater();
  }, [user, supabase]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Okuma Listem</h1>
          <p className="text-muted-foreground">
            Daha sonra okumak için kaydettiğiniz içerikleri görüntüleyin
          </p>
        </div>
      </div>

      <ReadLaterList initialItems={items} isLoading={isLoading} />
    </div>
  );
}
