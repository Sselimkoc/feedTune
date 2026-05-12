"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Rss, FileText, Star, Bookmark } from "lucide-react";

const CARDS = [
  {
    key: "totalFeeds",
    labelKey: "home.stats.totalFeeds",
    icon: Rss,
    accent: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glowColor: "hover:shadow-blue-500/10",
    subtitleKey: "home.dashboard.stats.rssYoutube",
  },
  {
    key: "totalItems",
    labelKey: "home.stats.totalItems",
    icon: FileText,
    accent: "border-l-indigo-500",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    glowColor: "hover:shadow-indigo-500/10",
    subtitleKey: "home.dashboard.stats.allContent",
  },
  {
    key: "totalFavorites",
    labelKey: "feeds.favorites",
    icon: Star,
    accent: "border-l-yellow-500",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    glowColor: "hover:shadow-yellow-500/10",
    subtitleKey: "home.dashboard.stats.savedItems",
  },
  {
    key: "totalReadLater",
    labelKey: "feeds.readLater",
    icon: Bookmark,
    accent: "border-l-violet-500",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    glowColor: "hover:shadow-violet-500/10",
    subtitleKey: "home.dashboard.stats.toRead",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function DashboardStats({ stats, feeds = [] }) {
  const { t } = useTranslation();

  const rss = feeds.filter((f) => f.type === "rss").length;
  const yt = feeds.filter((f) => f.type === "youtube").length;

  const getSubtitle = (card) => {
    if (card.subtitleKey === "home.dashboard.stats.rssYoutube") {
      return t(card.subtitleKey, { rss, yt });
    }
    return t(card.subtitleKey);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key] ?? 0;

        return (
          <motion.div
            key={card.key}
            variants={cardVariant}
            className={`
              relative bg-white dark:bg-[#181C2A] border border-gray-200 dark:border-blue-900/40 border-l-2 ${card.accent}
              rounded-xl p-4 transition-all duration-200
              hover:border-gray-300 dark:hover:border-blue-900/80 hover:shadow-lg ${card.glowColor}
              hover:-translate-y-0.5
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {getSubtitle(card)}
              </span>
            </div>

            <p className="text-3xl font-bold text-foreground tabular-nums leading-none mb-1">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {t(card.labelKey)}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
