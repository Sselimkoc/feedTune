"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { useState } from "react";
import { Rss } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { useTranslation } from "react-i18next";
import VideoCard from "./layout/VideoCard";
import { AnimatedPageBackground } from "@/components/shared/AnimatedPageBackground";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "@/components/core/states/PageStates";
import { FeedFilterBar } from "./FeedFilterBar";
import FeedHeader from "./FeedHeader";
import FeedMain from "./FeedMain";

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

  if (isLoading) return <PageLoadingState />;
  if (error) return <PageErrorState message={error?.message} />;

  if (!feeds || feeds.length === 0) {
    return (
      <PageEmptyState
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
        <FeedHeader totalFeeds={itemsWithFeedTitle.length} />

        {/* Feed Filter Bar */}
        <FeedFilterBar
          feeds={feeds}
          selectedFeedIds={selectedFeedIds}
          onSelectAll={() => setSelectedFeedIds([])}
          onSelectFeed={handleFeedSelect}
        />

        {/* Main Content */}
        <FeedMain feeds={itemsWithFeedTitle} />
      </div>
    </div>
  );
}
