"use client";

import React from "react";
import { Button } from "@/components/core/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  ServerCrash,
  WifiOff,
  FileBadge,
  ShieldAlert,
  YoutubeIcon,
  Rss,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

// Hata türlerine göre simgeler
const ERROR_ICONS = {
  server: ServerCrash,
  network: WifiOff,
  permission: ShieldAlert,
  content: FileBadge,
  default: AlertTriangle,
};

// İçerik türlerine göre varsayılan simgeler
const CONTENT_TYPE_ICONS = {
  youtube: YoutubeIcon,
  rss: Rss,
};

/**
 * Hata durumlarını göstermek için kullanılan bileşen
 */
export function ErrorState({
  errorType = "default", // "default", "server", "network", "permission", "content"
  contentType = null, // "youtube", "rss" için özel simge ve renkler
  icon: CustomIcon,
  title,
  description,
  error, // Ham hata objesi (opsiyonel)
  actionText,
  onAction,
  onRetry,
  className = "",
  showDetails = false,
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Tema renklerini belirle
  const getThemeColors = () => {
    if (theme === "dark") {
      return {
        containerBg:
          contentType === "youtube"
            ? "bg-red-950/10"
            : contentType === "rss"
            ? "bg-blue-950/10"
            : "bg-blue-950/10",
        iconBg:
          contentType === "youtube"
            ? "bg-red-900/20"
            : contentType === "rss"
            ? "bg-blue-900/20"
            : "bg-blue-900/20",
        iconColor:
          contentType === "youtube"
            ? "text-red-500"
            : contentType === "rss"
            ? "text-blue-500"
            : "text-blue-500",
        borderColor:
          contentType === "youtube"
            ? "border-red-900/20"
            : contentType === "rss"
            ? "border-blue-900/20"
            : "border-blue-900/20",
        titleColor: "text-zinc-200",
        descriptionColor: "text-zinc-400",
        btnVariant: "secondary",
        errorDetailsBg: "bg-zinc-800/30",
        errorDetailsColor: "text-zinc-400",
      };
    } else {
      return {
        containerBg:
          contentType === "youtube"
            ? "bg-red-50/50"
            : contentType === "rss"
            ? "bg-blue-50/50"
            : "bg-blue-50/50",
        iconBg:
          contentType === "youtube"
            ? "bg-red-100"
            : contentType === "rss"
            ? "bg-blue-100"
            : "bg-blue-100",
        iconColor:
          contentType === "youtube"
            ? "text-red-600"
            : contentType === "rss"
            ? "text-blue-600"
            : "text-blue-600",
        borderColor:
          contentType === "youtube"
            ? "border-red-200"
            : contentType === "rss"
            ? "border-blue-200"
            : "border-blue-200",
        titleColor: "text-zinc-800",
        descriptionColor: "text-zinc-600",
        btnVariant: "outline",
        errorDetailsBg: "bg-zinc-100",
        errorDetailsColor: "text-zinc-500",
      };
    }
  };

  const colors = getThemeColors();

  // Hata tipine göre varsayılan metinleri belirle
  const getDefaultTexts = () => {
    switch (errorType) {
      case "server":
        return {
          title: t("errors.serverErrorTitle"),
          description: t("errors.serverErrorDescription"),
          actionText: t("errors.tryAgain"),
        };
      case "network":
        return {
          title: t("errors.networkErrorTitle"),
          description: t("errors.networkErrorDescription"),
          actionText: t("errors.retry"),
        };
      case "permission":
        return {
          title: t("errors.permissionErrorTitle"),
          description: t("errors.permissionErrorDescription"),
          actionText: t("errors.goBack"),
        };
      case "content":
        return {
          title: t("errors.contentErrorTitle"),
          description: t("errors.contentErrorDescription"),
          actionText: t("errors.refresh"),
        };
      default:
        return {
          title: t("errors.genericErrorTitle"),
          description: t("errors.genericErrorDescription"),
          actionText: t("errors.retry"),
        };
    }
  };

  const defaultTexts = getDefaultTexts();

  // Tipe göre simgeyi belirle
  const getIcon = () => {
    if (CustomIcon) return CustomIcon;

    // Önce içerik türüne göre kontrol et
    if (contentType && CONTENT_TYPE_ICONS[contentType]) {
      return CONTENT_TYPE_ICONS[contentType];
    }

    // Sonra hata tipine göre
    return ERROR_ICONS[errorType] || ERROR_ICONS.default;
  };

  const Icon = getIcon();

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
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

  // Hata detaylarını formatla
  const formatError = (error) => {
    if (!error) return null;

    // Hata bir string ise
    if (typeof error === "string") return error;

    // Hata bir hata objesi ise
    if (error instanceof Error) return `${error.name}: ${error.message}`;

    // Hata bir obje ise
    if (typeof error === "object") {
      try {
        return JSON.stringify(error, null, 2);
      } catch (e) {
        return `${error.toString()}`;
      }
    }

    return String(error);
  };

  const handleRetry = () => {
    if (onRetry) onRetry();
    else if (onAction) onAction();
  };

  return (
    <motion.div
      className={`flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg ${colors.containerBg} p-8 text-center ${className} border border-dashed ${colors.borderColor}`}
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

      {/* Hata detayları (geliştirici modu) */}
      {showDetails && error && (
        <motion.div
          variants={itemVariants}
          className={`mb-6 w-full max-w-md rounded-md ${colors.errorDetailsBg} p-3 text-left overflow-x-auto`}
        >
          <pre className={`text-xs ${colors.errorDetailsColor}`}>
            {formatError(error)}
          </pre>
        </motion.div>
      )}

      <motion.div className="flex gap-3" variants={itemVariants}>
        <Button
          variant={colors.btnVariant}
          onClick={handleRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {actionText || defaultTexts.actionText}
        </Button>

        {onAction && actionText && onRetry && (
          <Button variant="ghost" onClick={onAction}>
            {t("errors.cancel")}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
