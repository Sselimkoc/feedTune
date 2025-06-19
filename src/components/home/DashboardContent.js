"use client";

import { useSession } from "@/hooks/auth/useSession";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useFeedService } from "@/hooks/features/useFeedService";
import { Button } from "../core/ui/button";
import { Badge } from "../core/ui/badge";
import { Card } from "../core/ui/card";
import { Avatar } from "../core/ui/avatar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomeHero from "@/components/public-home/HomeHero";
import {
  FiPlus,
  FiRefreshCw,
  FiStar,
  FiBookOpen,
  FiInbox,
  FiSun,
  FiMoon,
  FiGlobe,
  FiTrash2,
  FiEdit2,
  FiRss,
  FiYoutube,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function DashboardBackground() {
  // Very soft, static, blurred gradient for both themes
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Light mode: subtle blue/purple gradient */}
      <div className="block dark:hidden absolute w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-white opacity-80" />
      {/* Dark mode: subtle dark blue gradient */}
      <div className="hidden dark:block absolute w-full h-full bg-gradient-to-br from-gray-900 via-blue-950 to-gray-950 opacity-95" />
      {/* One very soft, blurred blob in the corner for both themes */}
      <div className="absolute w-[600px] h-[600px] left-[-200px] top-[-150px] rounded-full bg-blue-200 dark:bg-blue-900 opacity-20 blur-3xl" />
    </div>
  );
}

export default function DashboardContent() {
  const { user, isLoading } = useSession();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const feedService = useFeedService();

  const [feeds, setFeeds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [readLater, setReadLater] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      feedService.feeds,
      feedService.favorites,
      feedService.readLaterItems,
      feedService.items,
    ]).then(([feeds, favorites, readLater, items]) => {
      setFeeds(feeds);
      setFavorites(favorites);
      setReadLater(readLater);
      setRecentItems(items.slice(0, 5));
      setLoading(false);
    });
  }, [
    user,
    feedService.feeds,
    feedService.favorites,
    feedService.readLaterItems,
    feedService.items,
  ]);

  if (!user) return <HomeHero />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-lg animate-pulse">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="w-full max-w-6xl mx-auto px-2 md:px-6 py-10 flex flex-col gap-10 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-stretch">
          <Card className="flex-1 flex items-center gap-6 p-8 bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-md rounded-2xl border-none">
            <Avatar
              src={user.avatar_url}
              alt={user.email}
              className="w-24 h-24 shadow-lg"
            />
            <div className="flex-1 flex flex-col gap-2">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {t("dashboard.welcome", { email: user.email })}
              </div>
              <div className="text-base text-blue-400 dark:text-blue-100">
                {t("dashboard.subtitle")}
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <Badge variant="secondary">Free Plan</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end self-start">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <FiSun /> : <FiMoon />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setLanguage(language === "en" ? "tr" : "en")}
              >
                {<FiGlobe />}
              </Button>
            </div>
          </Card>
          <StatsBar
            feeds={feeds}
            favorites={favorites}
            readLater={readLater}
            unreadCount={feeds.reduce(
              (acc, f) => acc + (f.unread_count || 0),
              0
            )}
          />
        </div>
        <QuickActionsBar router={router} />
        <FeedListModern feeds={feeds} router={router} />
        <RecentActivityTimeline recentItems={recentItems} router={router} />
      </div>
    </>
  );
}

function StatsBar({ feeds, favorites, readLater, unreadCount }) {
  const stats = [
    {
      label: "Feeds",
      value: feeds.length,
      icon: <FiInbox className="text-blue-400/70" />,
    },
    {
      label: "Favorites",
      value: favorites.length,
      icon: <FiStar className="text-yellow-400/70" />,
    },
    {
      label: "Read Later",
      value: readLater.length,
      icon: <FiBookOpen className="text-green-400/70" />,
    },
    {
      label: "Unread",
      value: unreadCount,
      icon: <FiInbox className="text-pink-400/70" />,
    },
  ];
  return (
    <Card className="flex flex-row items-center gap-6 px-8 py-6 bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-md rounded-2xl border-none min-w-[320px]">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center flex-1 group cursor-pointer"
        >
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
            {stat.icon}
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-200 transition-colors">
            {stat.value}
          </div>
          <div className="text-xs text-blue-200 mt-1">{stat.label}</div>
        </div>
      ))}
    </Card>
  );
}

function QuickActionsBar({ router }) {
  const actions = [
    {
      label: "Add Feed",
      icon: <FiPlus />,
      onClick: () => router.push("/feeds/add"),
      variant: "default",
    },
    {
      label: "Sync All",
      icon: <FiRefreshCw />,
      onClick: () => router.refresh(),
      variant: "secondary",
    },
    {
      label: "Show Favorites",
      icon: <FiStar />,
      onClick: () => router.push("/favorites"),
      variant: "outline",
    },
    {
      label: "Clear Unread",
      icon: <FiInbox />,
      onClick: () => router.push("/feeds?filter=unread"),
      variant: "destructive",
    },
  ];
  return (
    <div className="flex flex-row gap-4 justify-center">
      {actions.map((action) => (
        <Button
          key={action.label}
          className="flex gap-2 items-center px-6 py-3 rounded-full text-base font-semibold shadow-lg hover:scale-105 transition-transform"
          variant={action.variant}
          onClick={action.onClick}
        >
          {action.icon} {action.label}
        </Button>
      ))}
    </div>
  );
}

function FeedListModern({ feeds, router }) {
  if (!feeds.length) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-blue-200 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-md">
        <img
          src="/images/feedtunelogo.png"
          alt="No feeds"
          className="w-16 h-16 mb-4 opacity-60"
        />
        <div className="text-lg font-semibold mb-2">No feeds yet</div>
        <div className="text-sm text-blue-300 mb-4">
          Add your first feed to get started!
        </div>
        <Button onClick={() => router.push("/feeds/add")}>Add Feed</Button>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {feeds.map((feed) => (
        <Card
          key={feed.id}
          className="flex items-center gap-6 p-6 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg transition-shadow group"
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
              <Badge
                variant="secondary"
                className="capitalize flex items-center gap-1"
              >
                {feed.type === "youtube" ? (
                  <FiYoutube className="inline" />
                ) : (
                  <FiRss className="inline" />
                )}
                {feed.type}
              </Badge>
              <span>
                Last updated:{" "}
                {feed.last_updated
                  ? new Date(feed.last_updated).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => router.push(`/feeds/${feed.id}/edit`)}
            >
              <FiEdit2 />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => router.push(`/feeds/${feed.id}/delete`)}
            >
              <FiTrash2 />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RecentActivityTimeline({ recentItems, router }) {
  if (!recentItems.length) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center text-blue-200 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-md">
        <svg
          width="80"
          height="80"
          fill="none"
          className="mb-4 opacity-60"
          viewBox="0 0 80 80"
        >
          <circle
            cx="40"
            cy="40"
            r="38"
            stroke="#60A5FA"
            strokeWidth="4"
            fill="#1E293B"
          />
          <path
            d="M25 40h30M40 25v30"
            stroke="#60A5FA"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div className="text-lg font-semibold mb-2">No recent activity</div>
        <div className="text-sm text-blue-300">
          Start reading or adding feeds to see your activity here.
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-8 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-2xl shadow-md animate-fade-in">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
        Recent Activity
      </div>
      <div className="flex flex-col gap-4">
        {recentItems.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-4 group cursor-pointer relative"
            onClick={() => router.push(`/feeds/${item.feed_id || item.id}`)}
          >
            <div
              className="w-3 h-3 rounded-full bg-blue-400 group-hover:bg-blue-200 transition-colors absolute left-0 top-1/2 -translate-y-1/2"
              style={{ left: -18 }}
            />
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
        ))}
      </div>
    </Card>
  );
}
