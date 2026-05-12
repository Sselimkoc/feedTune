"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Rss } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { useTranslation } from "react-i18next";
import VideoCard from "./layout/VideoCard";
import { EmptyState } from "@/components/core/states/EmptyState";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";

export function FeedPage() {
  const { feeds, items, isLoading, error, addInteraction, removeInteraction } =
    useFeedService();

  const [selectedFeedIds, setSelectedFeedIds] = useState([]);
  const { t } = useTranslation();

  // scroll to top on feed select so user sees updated content
  const handleFeedSelect = (feedId) => {
    setSelectedFeedIds((prev) =>
      prev.includes(feedId)
        ? prev.filter((id) => id !== feedId)
        : [...prev, feedId],
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };

const filteredItems =
    selectedFeedIds.length === 0
      ? items
      : items.filter((item) => selectedFeedIds.includes(item.feed_id));

const itemsWithFeedTitle = filteredItems.map((item) => {
    const feed = feeds.find((f) => f.id === item.feed_id);
    return {
      ...item,
      thumbnailUrl: item.thumbnail,
      channelName: feed?.title || "",
      channelLogo: feed?.icon || "",
    };
  });

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

if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <AnimatedPageBackground />
        <div className="container relative z-10">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <Rss className="h-12 w-12 animate-ping text-blue-600 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                {t("common.loading")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

if (error) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <AnimatedPageBackground />
        <div className="container relative z-10">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="text-destructive text-4xl font-bold mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">{t("common.error")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {error?.message || t("common.errorDescription")}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
            >
              {t("common.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

if (!feeds || feeds.length === 0) {
    return (
      <EmptyState
        title={t("emptyState.defaultTitle")}
        description={t("emptyState.defaultDescription")}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedPageBackground />

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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {itemsWithFeedTitle.length} {t("feeds.items")}
            </span>
          </div>
        </header>

        {/* Feed Filter Bar */}
        <nav className="w-full overflow-x-auto flex gap-2 mb-8 py-2 px-1 bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-inner sticky top-16 z-20">
          <button
            onClick={() => setSelectedFeedIds([])}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium whitespace-nowrap",
              selectedFeedIds.length === 0
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-blue-100",
            )}
          >
            <span className="font-bold">{t("feeds.allFeeds")}</span>
          </button>
          {feeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => handleFeedSelect(feed.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium whitespace-nowrap",
                selectedFeedIds.includes(feed.id)
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-blue-100",
              )}
            >
              {feed.icon ? (
                <img
                  src={feed.icon}
                  alt=""
                  className="w-5 h-5 rounded-full"
                  onError={(e) => {
                    // Fallback to letter when image fails to load
                    e.currentTarget.style.display = "none";
                    const div = document.createElement("div");
                    div.className =
                      "w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold";
                    div.textContent =
                      feed.title?.charAt(0)?.toUpperCase() || "F";
                    e.currentTarget.parentElement.insertBefore(
                      div,
                      e.currentTarget,
                    );
                  }}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {feed.title?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span>{feed.title}</span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
          <section className="flex-1">
            {itemsWithFeedTitle.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="text-muted-foreground text-4xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("feeds.noItemsInSelection")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("feeds.noItemsInSelectionDescription")}
                </p>
                <Button
                  onClick={() => {
                    setSelectedFeedIds([]);
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }}
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90"
                >
                  {t("feeds.showAllFeeds")}
                </Button>
              </div>
            ) : (
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
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
