"use client";

import React from "react";
import { Button } from "@/components/core/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Inbox,
  Search,
  RefreshCw,
  Rss,
  YoutubeIcon,
  Star,
  Clock,
  Filter,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/core/ui/card";

const CONTENT_TYPE_ICONS = {
  youtube: YoutubeIcon,
  rss: Rss,
  default: Inbox,
};

const FEED_EMPTY_STATES = {
  feed: {
    icon: <Rss className="h-8 w-8" />,
    titleKey: "feeds.emptyFeedTitle",
    descriptionKey: "feeds.emptyFeedDescription",
  },
  favorites: {
    icon: <Star className="h-8 w-8" />,
    titleKey: "feeds.emptyFavoritesTitle",
    descriptionKey: "feeds.emptyFavoritesDescription",
  },
  readLater: {
    icon: <Clock className="h-8 w-8" />,
    titleKey: "feeds.emptyReadLaterTitle",
    descriptionKey: "feeds.emptyReadLaterDescription",
  },
  search: {
    icon: <Search className="h-8 w-8" />,
    titleKey: "feeds.emptySearchTitle",
    descriptionKey: "feeds.emptySearchDescription",
  },
  filter: {
    icon: <Filter className="h-8 w-8" />,
    titleKey: "feeds.emptyFilterTitle",
    descriptionKey: "feeds.emptyFilterDescription",
  },
  default: {
    icon: <AlertTriangle className="h-8 w-8" />,
    titleKey: "feeds.emptyDefaultTitle",
    descriptionKey: "feeds.emptyDefaultDescription",
  },
};

/**
 * Boş durum mesajı gösterir (veri yok, sonuç bulunamadı, vb.)
 */
export function EmptyState({
  type = "default", // 'default', 'search', 'error', 'feed', 'youtube', 'rss'
  icon: CustomIcon,
  title,
  description,
  actionText,
  onAction,
  className = "",
  feedType = null, // 'youtube' veya 'rss' gibi feed tipini desteklemek için
  isRefreshable = false, // Yenileme butonu gösterip göstermeme
  onRefresh,
  onResetFilters,
  onAddFeed,
  variant = "default", // 'default' veya 'feed'
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Feed variant için özel render
  if (variant === "feed") {
    const state = FEED_EMPTY_STATES[type] || FEED_EMPTY_STATES.default;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex items-center justify-center py-12"
      >
        <Card className="max-w-md w-full border shadow-md">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="mb-4 p-4 bg-primary/10 rounded-full">
              {state.icon}
            </div>

            <h3 className="text-xl font-bold mb-2">{t(state.titleKey)}</h3>

            <p className="text-muted-foreground mb-8 max-w-sm">
              {t(state.descriptionKey)}
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              {onResetFilters && (
                <Button
                  variant="outline"
                  onClick={onResetFilters}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {t("feeds.resetFilters")}
                </Button>
              )}

              {onRefresh && (
                <Button variant="outline" onClick={onRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t("feeds.refreshContent")}
                </Button>
              )}

              {onAddFeed && (
                <Button variant="default" onClick={onAddFeed} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("feeds.addNewFeed")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Tema renklerini belirle
  const getThemeColors = () => {
    if (theme === "dark") {
      return {
        containerBg: "bg-zinc-900/20",
        iconBg: "bg-zinc-800",
        iconColor:
          feedType === "youtube"
            ? "text-red-500"
            : feedType === "rss"
            ? "text-blue-500"
            : "text-zinc-400",
        titleColor: "text-zinc-200",
        descriptionColor: "text-zinc-400",
        btnVariant: "secondary",
      };
    } else {
      return {
        containerBg: "bg-zinc-100/50",
        iconBg: "bg-white",
        iconColor:
          feedType === "youtube"
            ? "text-red-600"
            : feedType === "rss"
            ? "text-blue-600"
            : "text-zinc-500",
        titleColor: "text-zinc-800",
        descriptionColor: "text-zinc-500",
        btnVariant: "outline",
      };
    }
  };

  const colors = getThemeColors();

  // Tipe göre simgeyi belirle
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;

    if (feedType && CONTENT_TYPE_ICONS[feedType]) {
      return CONTENT_TYPE_ICONS[feedType];
    }

    switch (type) {
      case "search":
        return Search;
      case "error":
        return AlertTriangle;
      case "feed":
        return Inbox;
      default:
        return Inbox;
    }
  };

  // Tipe göre varsayılan metinleri belirle
  const getDefaultTexts = () => {
    switch (type) {
      case "search":
        return {
          title: t("emptyState.searchTitle"),
          description: t("emptyState.searchDescription"),
        };
      case "error":
        return {
          title: t("emptyState.errorTitle"),
          description: t("emptyState.errorDescription"),
          actionText: t("emptyState.tryAgain"),
        };
      case "feed":
        return {
          title:
            feedType === "youtube"
              ? t("emptyState.youtubeTitle")
              : feedType === "rss"
              ? t("emptyState.rssTitle")
              : t("emptyState.feedTitle"),
          description:
            feedType === "youtube"
              ? t("emptyState.youtubeDescription")
              : feedType === "rss"
              ? t("emptyState.rssDescription")
              : t("emptyState.feedDescription"),
        };
      default:
        return {
          title: t("emptyState.defaultTitle"),
          description: t("emptyState.defaultDescription"),
        };
    }
  };

  const defaultTexts = getDefaultTexts();
  const Icon = getIcon();

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={`flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg ${colors.containerBg} p-8 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${colors.iconBg} ${colors.iconColor}`}
        variants={itemVariants}
      >
        <Icon className="h-8 w-8" aria-hidden="true" />
      </motion.div>

      <motion.h3
        className={`mb-2 text-lg font-semibold ${colors.titleColor}`}
        variants={itemVariants}
      >
        {title || defaultTexts.title}
      </motion.h3>

      <motion.p
        className={`mb-6 max-w-md ${colors.descriptionColor}`}
        variants={itemVariants}
      >
        {description || defaultTexts.description}
      </motion.p>

      {(actionText || isRefreshable) && (
        <motion.div variants={itemVariants}>
          <Button
            variant={colors.btnVariant}
            onClick={onAction}
            className="gap-2"
          >
            {isRefreshable && <RefreshCw className="h-4 w-4" />}
            {actionText ||
              defaultTexts.actionText ||
              (isRefreshable ? t("emptyState.refresh") : null)}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
