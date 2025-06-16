"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Inbox,
  Search,
  RefreshCw,
  Rss,
  YoutubeIcon,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const CONTENT_TYPE_ICONS = {
  youtube: YoutubeIcon,
  rss: Rss,
  default: Inbox,
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
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

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
