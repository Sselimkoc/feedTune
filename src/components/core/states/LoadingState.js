"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Image from "next/image";

/**
 * Loading state component with different views
 */
export function LoadingState({
  viewMode = "grid",
  title,
  description,
  itemCount = 6,
  contentType = "default", // "default", "youtube", "rss"
  className = "",
  showSpinner = true,
  showSkeletons = true,
  minimal = false,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Theme-based color variables
  const colors = useMemo(() => {
    if (theme === "dark") {
      return {
        iconBg:
          contentType === "youtube"
            ? "bg-red-950/20"
            : contentType === "rss"
            ? "bg-blue-950/20"
            : "bg-zinc-800/30",
        iconColor:
          contentType === "youtube"
            ? "text-red-500"
            : contentType === "rss"
            ? "text-blue-500"
            : "text-zinc-300",
        borderColor:
          contentType === "youtube"
            ? "border-red-900/20"
            : contentType === "rss"
            ? "border-blue-900/20"
            : "border-zinc-800/20",
        titleGradient:
          contentType === "youtube"
            ? "from-red-400 to-red-600"
            : contentType === "rss"
            ? "from-blue-400 to-blue-600"
            : "from-zinc-300 to-zinc-500",
        skeletonBase: "bg-zinc-800/30",
        skeletonHighlight: "bg-zinc-700/30",
        textColor: "text-zinc-400",
        bgColor: "bg-zinc-900/20",
      };
    } else {
      return {
        iconBg:
          contentType === "youtube"
            ? "bg-red-100"
            : contentType === "rss"
            ? "bg-blue-100"
            : "bg-zinc-100",
        iconColor:
          contentType === "youtube"
            ? "text-red-600"
            : contentType === "rss"
            ? "text-blue-600"
            : "text-zinc-600",
        borderColor:
          contentType === "youtube"
            ? "border-red-200"
            : contentType === "rss"
            ? "border-blue-200"
            : "border-zinc-200",
        titleGradient:
          contentType === "youtube"
            ? "from-red-500 to-red-700"
            : contentType === "rss"
            ? "from-blue-500 to-blue-700"
            : "from-zinc-500 to-zinc-700",
        skeletonBase: "bg-zinc-200/60",
        skeletonHighlight: "bg-zinc-300/60",
        textColor: "text-zinc-500",
        bgColor: "bg-zinc-50/50",
      };
    }
  }, [theme, contentType]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    initial: { opacity: 0.6 },
    pulse: {
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.2,
      },
    },
  };

  // Generate skeleton items
  const generateSkeletonItems = () => {
    if (!showSkeletons) return null;

    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(
        <motion.div
          key={`skeleton-${i}`}
          variants={itemVariants}
          className={`rounded-xl border ${colors.borderColor} overflow-hidden ${
            viewMode === "grid" ? "w-full" : "w-full flex h-32"
          }`}
        >
          <div
            className={`relative ${
              viewMode === "grid" ? "pt-[60%]" : "w-32 h-full"
            }`}
          >
            <div
              className={`absolute inset-0 ${colors.skeletonBase} animate-pulse`}
            ></div>
          </div>

          <div
            className={`p-4 flex flex-col gap-2 ${
              viewMode === "grid" ? "" : "flex-1"
            }`}
          >
            <div
              className={`${colors.skeletonBase} h-5 rounded-md animate-pulse w-3/4`}
            ></div>
            <div
              className={`${colors.skeletonBase} h-4 rounded-md animate-pulse w-2/3`}
            ></div>

            {viewMode === "list" && (
              <div
                className={`${colors.skeletonBase} h-4 rounded-md animate-pulse w-1/2 mt-1`}
              ></div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2">
              <div
                className={`${colors.skeletonBase} h-4 w-20 rounded-md animate-pulse`}
              ></div>
              <div
                className={`${colors.skeletonBase} h-8 w-8 rounded-full animate-pulse`}
              ></div>
            </div>
          </div>
        </motion.div>
      );
    }
    return items;
  };

  // Minimal view - show only spinner
  if (minimal) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className={`h-8 w-8 animate-spin ${colors.iconColor}`} />
      </div>
    );
  }

  return (
    <motion.div
      className={`w-full ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Loading header */}
      {showSpinner && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="pulse"
            className={`p-4 rounded-full ${colors.iconBg} mb-4`}
          >
            <Loader2 className={`h-8 w-8 animate-spin ${colors.iconColor}`} />
          </motion.div>

          <motion.h2
            variants={pulseVariants}
            initial="initial"
            animate="pulse"
            className={`text-xl font-semibold bg-gradient-to-r ${colors.titleGradient} bg-clip-text text-transparent`}
          >
            {title || t("common.loading")}
          </motion.h2>

          {description && (
            <motion.p
              variants={pulseVariants}
              initial="initial"
              animate="pulse"
              className={`mt-2 ${colors.textColor}`}
            >
              {description}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Skeleton grid/list */}
      <div
        className={`grid gap-4 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {generateSkeletonItems()}
      </div>
    </motion.div>
  );
}

export function FullScreenLoader({ text }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <Image
        src="/images/feedtunelogo.png"
        alt="FeedTune Logo"
        width={64}
        height={64}
        style={{ width: "64px", height: "auto" }}
        className="mb-6 drop-shadow-lg blur-[1px]"
        priority
      />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        {text && (
          <span className="text-white text-lg font-medium mt-2">{text}</span>
        )}
      </div>
    </div>
  );
}
