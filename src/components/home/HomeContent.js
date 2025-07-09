"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/auth/useSession";
import { useFeedService } from "@/hooks/features/useFeedService";
import HomeHero from "@/components/public-home/HomeHero";
import { HomeAbout } from "@/components/public-home/HomeAbout";
import { HomeTechnology } from "@/components/public-home/HomeTechnology";
import { HomeShowcase } from "@/components/public-home/HomeShowcase";
import { HomeCommunity } from "@/components/public-home/HomeCommunity";
import { HomeModals } from "@/components/home/HomeModals";
import { useLanguage } from "@/hooks/useLanguage";
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/core/ui/skeleton";
import Link from "next/link";

export function HomeContent({
  initialSession,
  feeds: initialFeeds = [],
  stats: initialStats = {},
  recentItems: initialRecentItems = [],
}) {
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
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

  // Redirect to home if not logged in after session loading
  useEffect(() => {
    if (!isSessionLoading && !user) {
      router.replace("/");
    }
  }, [isSessionLoading, user, router]);

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
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-8">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </div>
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
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* User Profile Section */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {t("dashboard.welcome", { email: user.email })}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-300 mt-1">
                    {t("dashboard.subtitle")}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                      {t("dashboard.plan.free")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 md:p-8 flex flex-row md:w-auto w-full justify-between gap-8 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700">
              <StatCard
                icon="📊"
                value={stats.feeds || 0}
                label="Feeds"
                color="blue"
              />
              <StatCard
                icon="⭐"
                value={stats.favorites || 0}
                label="Favorites"
                color="amber"
              />
              <StatCard
                icon="📖"
                value={stats.readLater || 0}
                label="Read Later"
                color="emerald"
              />
              <StatCard
                icon="📬"
                value={stats.unread || 0}
                label="Unread"
                color="rose"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 justify-start">
          <QuickActionButton
            icon="+"
            label="Add Feed"
            onClick={openAddFeedDialog}
            variant="primary"
          />
          <QuickActionButton
            icon="⟳"
            label="Sync All"
            onClick={() => window.location.reload()}
            variant="secondary"
          />
          <QuickActionButton
            icon="⭐"
            label="Favorites"
            onClick={() => {}}
            variant="amber"
          />
          <QuickActionButton
            icon="🗑️"
            label="Clear Unread"
            onClick={() => {}}
            variant="rose"
          />
        </div>

        {/* Feed List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Feeds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeds.length === 0 ? (
              <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No feeds yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Add your first feed to get started
                </p>
                <button
                  className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={openAddFeedDialog}
                >
                  + Add Feed
                </button>
              </div>
            ) : (
              feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center p-2.5 border border-gray-100 dark:border-gray-700">
                      <img
                        src={feed.icon || "/images/feedtunelogo.png"}
                        alt={feed.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white text-base truncate">
                        {feed.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                          {feed.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          {feed.last_updated
                            ? new Date(feed.last_updated).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {}}
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-md text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteFeed(feed.id)}
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          {recentItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No recent activity
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your recent feed activity will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href="#"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 group-hover:scale-125 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          ></path>
                        </svg>
                        {item.feed_title || item.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 lg:py-8 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-indigo-500/5 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-2/3 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        </div>
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

// Stat Card Component
function StatCard({ icon, value, label, color }) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-2xl mb-1 ${colorClasses[color] || colorClasses.blue}`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, onClick, variant = "primary" }) {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary:
      "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200",
    amber:
      "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 text-amber-800 dark:text-amber-300",
    rose: "bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-800/40 text-rose-800 dark:text-rose-300",
  };

  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${variantClasses[variant]}`}
      onClick={onClick}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
