"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function useHomeData() {
  const [feeds, setFeeds] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalItems: 0,
    unreadItems: 0,
    favoriteItems: 0,
    readLaterItems: 0,
  });

  const { user } = useAuthStore();
  const supabase = createClientComponentClient();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          setIsLoading(true);

          // Kullanıcının feed'lerini çek
          const { data: userFeeds, error: feedsError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (feedsError) throw feedsError;

          setFeeds(userFeeds || []);

          // Son içerikleri çek
          const { data: items, error: itemsError } = await supabase
            .from("feed_items")
            .select(
              `
              *,
              feed:feed_id(id, title, type, site_favicon)
            `
            )
            .in("feed_id", userFeeds?.map((f) => f.id) || [])
            .order("published_at", { ascending: false })
            .limit(6);

          if (itemsError) throw itemsError;

          // Zaman bilgilerini ekle
          const itemsWithTimeAgo = items.map((item) => {
            const publishedDate = new Date(item.published_at);
            const now = new Date();
            const diffMs = now - publishedDate;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            const diffWeek = Math.floor(diffDay / 7);
            const diffMonth = Math.floor(diffDay / 30);
            const diffYear = Math.floor(diffDay / 365);

            const timeAgoData = {
              value: 0,
              unit: "",
              isJustNow: false,
            };

            if (diffSec < 60) {
              timeAgoData.isJustNow = true;
            } else if (diffMin < 60) {
              timeAgoData.value = diffMin;
              timeAgoData.unit = "minute";
            } else if (diffHour < 24) {
              timeAgoData.value = diffHour;
              timeAgoData.unit = "hour";
            } else if (diffDay < 7) {
              timeAgoData.value = diffDay;
              timeAgoData.unit = "day";
            } else if (diffWeek < 4) {
              timeAgoData.value = diffWeek;
              timeAgoData.unit = "week";
            } else if (diffMonth < 12) {
              timeAgoData.value = diffMonth;
              timeAgoData.unit = "month";
            } else {
              timeAgoData.value = diffYear;
              timeAgoData.unit = "year";
            }

            return {
              ...item,
              timeAgoData,
            };
          });

          setRecentItems(itemsWithTimeAgo || []);

          // İstatistikleri hesapla
          try {
            const { count: totalItems, error: totalItemsError } = await supabase
              .from("feed_items")
              .select("id", { count: "exact" })
              .in("feed_id", userFeeds?.map((f) => f.id) || []);

            if (totalItemsError) throw totalItemsError;

            const { data: interactions, error: interactionsError } =
              await supabase
                .from("user_item_interactions")
                .select("*")
                .eq("user_id", user.id);

            if (interactionsError) throw interactionsError;

            const unreadItems =
              totalItems - interactions.filter((i) => i.is_read).length;
            const favoriteItems = interactions.filter(
              (i) => i.is_favorite
            ).length;
            const readLaterItems = interactions.filter(
              (i) => i.is_read_later
            ).length;

            setStats({
              totalFeeds: userFeeds?.length || 0,
              totalItems: totalItems || 0,
              unreadItems,
              favoriteItems,
              readLaterItems,
            });
          } catch (statsError) {
            console.error("Error calculating stats:", statsError);
            setStats({
              totalFeeds: 0,
              totalItems: 0,
              unreadItems: 0,
              favoriteItems: 0,
              readLaterItems: 0,
            });
          }
        } catch (error) {
          console.error("Error loading data:", error);
          toast.error(t("errors.general"));
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [user, t, supabase]);

  return {
    feeds,
    setFeeds,
    recentItems,
    isLoading,
    stats,
  };
}
