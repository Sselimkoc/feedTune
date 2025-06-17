"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { ContentCard } from "@/components/shared/ContentCard";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ModernContentCard } from "@/components/shared/ModernContentCard";

export function FeedPage() {
  const { feeds, items, isLoading, error } = useFeedService();
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);
  const { t } = useTranslation();

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
      channelTitle: item.channelTitle || item.channel || feed?.title || "",
      feedTitle: item.feedTitle || item.feed_title || feed?.title || "",
      logoUrl: feed?.icon || feed?.logo || item.channelLogo || item.logo || "",
    };
  });

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
      <div className="w-full px-8 relative z-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-blue-500 drop-shadow-sm">
            {t("feeds.title")}
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            {t("feeds.description")}
          </p>
        </header>
        {/* Feed Filter Bar */}
        <nav className="w-full flex flex-wrap gap-2 mb-8 bg-blue-500/10 dark:bg-blue-900/20 backdrop-blur-md border border-blue-300/20 dark:border-blue-900/30 rounded-xl shadow px-4 py-3">
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => handleFeedSelect(feed.id)}
              className={cn(
                "px-4 py-2 rounded-full border transition-all text-sm font-medium bg-white/20 dark:bg-white/10 backdrop-blur hover:bg-blue-500/20",
                selectedFeedIds.includes(feed.id)
                  ? "border-blue-500 text-blue-600 shadow"
                  : "border-white/20 text-zinc-300"
              )}
            >
              {feed.title}
            </button>
          ))}
        </nav>
        {/* Card Grid */}
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {itemsWithFeedTitle.map((item) => (
            <ModernContentCard
              key={item.id}
              item={item}
              onFavorite={() => {}}
              onReadLater={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
