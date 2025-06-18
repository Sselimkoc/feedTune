"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Rss } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardTitle } from "@/components/core/ui/card";
import VideoCard from "./layout/VideoCard";
import { useQueryClient } from "@tanstack/react-query";

export function FeedPage() {
  const {
    feeds,
    items,
    isLoading,
    error,
    addInteraction,
    removeInteraction,
    user,
  } = useFeedService();
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Feed selection logic
  const handleFeedSelect = (feedId) => {
    setSelectedFeedIds((prev) =>
      prev.includes(feedId)
        ? prev.filter((id) => id !== feedId)
        : [...prev, feedId]
    );
  };

  // Filter items by selected feeds
  const filteredItems =
    selectedFeedIds.length === 0
      ? items
      : items.filter((item) => selectedFeedIds.includes(item.feed_id));

  // Enrich items with feed/channel title if missing
  const itemsWithFeedTitle = filteredItems.map((item) => {
    const feed = feeds.find((f) => f.id === item.feed_id);
    return {
      ...item,
      thumbnailUrl: item.thumbnail,
      channelName: feed?.title || "",
      channelLogo: feed?.icon || "",
    };
  });

  // Favori toggle fonksiyonu
  const handleToggleFavorite = async (video) => {
    if (!video) return;
    const itemType =
      video.type || (video.feed_type || "").toLowerCase() || "rss";
    if (video.is_favorite) {
      await removeInteraction(video.id, "is_favorite", itemType);
    } else {
      await addInteraction(video.id, "is_favorite", itemType);
    }
  };

  // Sonra oku toggle fonksiyonu
  const handleToggleReadLater = async (video) => {
    if (!video) return;
    const itemType =
      video.type || (video.feed_type || "").toLowerCase() || "rss";
    if (video.is_read_later) {
      await removeInteraction(video.id, "is_read_later", itemType);
    } else {
      await addInteraction(video.id, "is_read_later", itemType);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries(["items", user?.id]);
      queryClient.invalidateQueries(["favorites", user?.id]);
      queryClient.invalidateQueries(["read_later", user?.id]);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [queryClient, user?.id]);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "14s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/4 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "16s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "18s" }}
        ></div>
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <header className="w-full max-w-screen-2xl mx-auto px-2 md:px-6 mt-8 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Rss className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-blue-500 drop-shadow-sm">
                {t("feeds.title")}
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl">
                {t("feeds.description")}
              </p>
            </div>
          </div>
        </header>
        {/* Feed Filter Bar */}
        <nav className="w-full overflow-x-auto flex gap-2 mb-8 py-2 px-1 bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-inner sticky top-0 z-20">
          <button
            onClick={() => setSelectedFeedIds([])}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
              selectedFeedIds.length === 0
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-blue-100"
            )}
          >
            <span className="font-bold">Tümü</span>
          </button>
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => handleFeedSelect(feed.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                selectedFeedIds.includes(feed.id)
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-blue-100"
              )}
            >
              {feed.icon && (
                <img src={feed.icon} alt="" className="w-5 h-5 rounded-full" />
              )}
              <span>{feed.title}</span>
            </button>
          ))}
        </nav>
        {/* Main Content */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
          <section className="flex-1">
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {itemsWithFeedTitle.map((item) => (
                <VideoCard
                  key={item.id}
                  video={item}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleReadLater={handleToggleReadLater}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
