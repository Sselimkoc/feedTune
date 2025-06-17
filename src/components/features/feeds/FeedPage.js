"use client";

import { useFeedService } from "@/hooks/features/useFeedService";
import { ContentHeader } from "@/components/shared/ContentHeader";
import { Rss } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { FeedList } from "./FeedList";
import { FeedSidebar } from "./layout/FeedSidebar";
import { MobileFeedNav } from "./layout/MobileFeedNav";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FeedPage() {
  const { t } = useLanguage();
  const { feeds, isLoading, error, invalidateFeedsQuery } = useFeedService();
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const handleFeedSelect = (feedId) => {
    setSelectedFeedIds((prev) =>
      prev.includes(feedId)
        ? prev.filter((id) => id !== feedId)
        : [...prev, feedId]
    );
  };

  const handleFilterToggle = (filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setSearchQuery("");
  };

  const handleFeedDelete = async (feedId) => {
    await invalidateFeedsQuery();
  };

  const filteredFeeds = feeds?.filter((feed) => {
    const matchesSearch = feed.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => {
        switch (filter) {
          case "unread":
            return feed.unread_count > 0;
          case "favorites":
            return feed.favorite_count > 0;
          case "readLater":
            return feed.read_later_count > 0;
          default:
            return true;
        }
      });
    return matchesSearch && matchesFilters;
  });

  const statistics = {
    totalFeeds: feeds?.length || 0,
    unreadItems:
      feeds?.reduce((sum, feed) => sum + (feed.unread_count || 0), 0) || 0,
    favorites:
      feeds?.reduce((sum, feed) => sum + (feed.favorite_count || 0), 0) || 0,
    readLater:
      feeds?.reduce((sum, feed) => sum + (feed.read_later_count || 0), 0) || 0,
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-80 border-r">
        <FeedSidebar
          feeds={feeds}
          selectedFeedIds={selectedFeedIds}
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          statistics={statistics}
          onFeedSelect={handleFeedSelect}
          onFilterToggle={handleFilterToggle}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileFeedNav
            feeds={feeds}
            selectedFeedIds={selectedFeedIds}
            activeFilters={activeFilters}
            searchQuery={searchQuery}
            statistics={statistics}
            onFeedSelect={handleFeedSelect}
            onFilterToggle={handleFilterToggle}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Content Header */}
        <ContentHeader
          title={t("feeds.title")}
          description={t("feeds.description")}
          icon={<Rss className="h-6 w-6" />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                {t("common.grid")}
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                {t("common.list")}
              </Button>
            </div>
          }
        />

        {/* Feed List */}
        <div className="flex-1 p-6 overflow-auto">
          <FeedList
            feeds={filteredFeeds}
            isLoading={isLoading}
            error={error}
            viewMode={viewMode}
            onFeedDelete={handleFeedDelete}
          />
        </div>
      </div>
    </div>
  );
}
