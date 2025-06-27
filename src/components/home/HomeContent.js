"use client";

import { useState, useCallback, useEffect } from "react";
import { Toast } from "../core/ui/toast";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import { HomeStats } from "@/components/home/HomeStats";
import { HomeFeedManagement } from "@/components/home/HomeFeedManagement";
import { HomeRecentContent } from "@/components/home/HomeRecentContent";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { HomeModals } from "@/components/home/HomeModals";
import { EmptyState } from "@/components/core/states/EmptyState";
import { useLanguage } from "@/hooks/useLanguage";
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";

export function HomeContent({
  initialSession,
  feeds: initialFeeds = [],
  stats: initialStats = {},
  recentItems: initialRecentItems = [],
}) {
  const { user, isLoading: isSessionLoading } = useSession();

  const { t } = useLanguage();

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  // Data states
  const [feeds, setFeeds] = useState(initialFeeds);
  const [stats, setStats] = useState(initialStats);
  const [recentItems, setRecentItems] = useState(initialRecentItems);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const { isDialogOpen, openAddFeedDialog, closeAddFeedDialog } = useAddFeed();

  // Use deleteFeed from useFeedService
  const { deleteFeed } = useFeedService();

  // Fetch feeds and related data after session is available
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsDataLoading(true);
      try {
        // Fetch feeds
        const resFeeds = await fetch("/api/feeds");
        const feedsData = await resFeeds.json();
        setFeeds(feedsData.feeds || []);
        setStats(feedsData.stats || {});
        setRecentItems(feedsData.recentItems || []);
      } catch (error) {
        // Optionally handle error
        setFeeds([]);
        setStats({});
        setRecentItems([]);
      } finally {
        setIsDataLoading(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  // Feed management handlers
  const handleDeleteFeed = useCallback(
    async (feedId) => {
      try {
        await deleteFeed(feedId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting feed:", error);
        toast.error(t("feeds.deleteFeedError", { error: error.message }));
      }
    },
    [deleteFeed, t]
  );

  const handleAuthClick = () => setShowAuthModal(true);

  // Content render function
  const renderContent = () => {
    if (
      isSessionLoading ||
      isDataLoading ||
      feeds === undefined ||
      feeds === null
    ) {
      return (
        <div className="flex justify-center items-center h-96">
          <span className="animate-pulse text-lg text-muted-foreground">
            {t("common.loading")}
          </span>
        </div>
      );
    }
    if (!user) {
      return (
        <>
          <HomeHero onAuthClick={handleAuthClick} />
          <HomeAbout />
          <HomeShowcase />
          <HomeTechnology />
          <HomeCommunity />
        </>
      );
    }

    return (
      <div className="w-full max-w-6xl mx-auto px-2 md:px-6 py-10 flex flex-col gap-10 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-stretch">
          <div className="flex-1 flex items-center gap-6 p-8 bg-white dark:bg-[#181C2A] backdrop-blur-md shadow-lg rounded-2xl border-none">
            {/* Avatar and profile */}
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-lg">
              {/* Optionally use user.avatar_url if available */}
              <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                {user.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {t("dashboard.welcome", { email: user.email })}
              </div>
              <div className="text-base text-blue-400 dark:text-blue-100">
                {t("dashboard.subtitle")}
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200">
                  {t("dashboard.plan.free")}
                </span>
              </div>
            </div>
            {/* Theme/language controls can be added here if needed */}
          </div>
          {/* Stats bar */}
          <div className="flex flex-row items-center gap-6 px-8 py-6 bg-white dark:bg-[#181C2A] backdrop-blur-md shadow-lg rounded-2xl border-none min-w-[320px]">
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl mb-1 text-blue-400/70">📥</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {stats.feeds || 0}
              </div>
              <div className="text-xs text-blue-200 mt-1">Feeds</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl mb-1 text-yellow-400/70">⭐</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {stats.favorites || 0}
              </div>
              <div className="text-xs text-blue-200 mt-1">Favorites</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl mb-1 text-green-400/70">📖</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {stats.readLater || 0}
              </div>
              <div className="text-xs text-blue-200 mt-1">Read Later</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl mb-1 text-pink-400/70">📥</div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {stats.unread || 0}
              </div>
              <div className="text-xs text-blue-200 mt-1">Unread</div>
            </div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex flex-row gap-4 justify-center">
          <button
            className="flex gap-2 items-center px-6 py-3 rounded-full text-base font-semibold shadow-lg bg-blue-600 text-white hover:scale-105 transition-transform"
            onClick={openAddFeedDialog}
          >
            + Add Feed
          </button>
          <button
            className="flex gap-2 items-center px-6 py-3 rounded-full text-base font-semibold shadow-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            onClick={() => window.location.reload()}
          >
            ⟳ Sync All
          </button>
          <button
            className="flex gap-2 items-center px-6 py-3 rounded-full text-base font-semibold shadow-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
            onClick={() => {}}
          >
            ⭐ Show Favorites
          </button>
          <button
            className="flex gap-2 items-center px-6 py-3 rounded-full text-base font-semibold shadow-lg bg-red-500 text-white"
            onClick={() => {}}
          >
            🗑️ Clear Unread
          </button>
        </div>
        {/* Feed list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center gap-6 p-6 bg-white dark:bg-[#181C2A] backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-800/80 shadow-md">
                <img
                  src={feed.icon || "/images/feedtunelogo.png"}
                  alt={feed.title}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 dark:text-gray-100 text-lg truncate">
                  {feed.title}
                </div>
                <div className="text-xs text-blue-200 flex gap-2 items-center mt-1">
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-200 capitalize">
                    {feed.type}
                  </span>
                  <span>
                    Last updated:{" "}
                    {feed.last_updated
                      ? new Date(feed.last_updated).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => {}}
                  title="Edit"
                >
                  <span role="img" aria-label="edit">
                    ✏️
                  </span>
                </button>
                <button
                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleDeleteFeed(feed.id)}
                  title="Delete"
                >
                  <span role="img" aria-label="delete">
                    🗑️
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Recent activity */}
        <div className="p-8 bg-white dark:bg-[#181C2A] backdrop-blur-md rounded-2xl shadow-lg animate-fade-in mt-8">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Recent Activity
          </div>
          <div className="flex flex-col gap-4">
            {recentItems.length === 0 ? (
              <div className="text-blue-300">No recent activity</div>
            ) : (
              recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 group cursor-pointer relative"
                >
                  <div className="w-3 h-3 rounded-full bg-blue-400 group-hover:bg-blue-200 transition-colors" />
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-blue-200 flex gap-2 items-center">
                      <span>{item.feed_title || item.type}</span>
                      <span>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-6 lg:py-8 relative">
      {/* Background animated patterns (copied from FavoritesContent) */}
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
        {renderContent()}
        <HomeModals
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          isDialogOpen={isDialogOpen}
          openAddFeedDialog={openAddFeedDialog}
          closeAddFeedDialog={closeAddFeedDialog}
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          onDeleteFeed={handleDeleteFeed}
          isDeleting={false}
          onFeedAdded={() => window.location.reload()}
          feedToDelete={feedToDelete}
        />
      </div>
    </section>
  );
}
