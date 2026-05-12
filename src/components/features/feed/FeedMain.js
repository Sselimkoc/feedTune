"use client";

import { Button } from "@/components/core/ui/button";
import React from "react";
import { useTranslation } from "react-i18next";
import VideoCard from "./layout/VideoCard";
import { useFeedService } from "@/hooks/features/useFeedService";

const FeedMain = ({ feeds }) => {
  const { addInteraction, removeInteraction } = useFeedService();
  const t = useTranslation();
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

  return (
    <main className="flex-1 w-full max-w-screen-2xl mx-auto px-2 md:px-6">
      <section className="flex-1">
        {feeds.length === 0 ? (
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
            {feeds.map((item) => (
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
  );
};

export default FeedMain;
