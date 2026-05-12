"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/core/ui/button";
import { Rss, Zap, ArrowRight, ExternalLink } from "lucide-react";
import { YouTubeIcon } from "@/components/core/icons/YouTubeIcon";

function timeAgo(date, t) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return t("home.recentContent.timeAgo.justNow");
  if (s < 3600) return t("home.recentContent.timeAgo.minutesAgo", { count: Math.floor(s / 60) });
  if (s < 86400) return t("home.recentContent.timeAgo.hoursAgo", { count: Math.floor(s / 3600) });
  return t("home.recentContent.timeAgo.daysAgo", { count: Math.floor(s / 86400) });
}

export function DashboardActivity({ recentItems, onViewAll }) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("home.dashboard.recentActivity")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("home.dashboard.latestFromFeeds")}
            </p>
          </div>
        </div>
        {recentItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/60"
          >
            {t("home.dashboard.viewAll")}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="p-2">
        {recentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-indigo-400/60" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {t("home.dashboard.noActivity.title")}
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {t("home.dashboard.noActivity.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-px">
            {recentItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onClick={() => window.open(item.url || item.link, "_blank", "noopener,noreferrer")}
                className="group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors duration-150 cursor-pointer"
              >
                <div
                  className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center ${
                    item.type === "youtube" ? "bg-red-500/10" : "bg-blue-500/10"
                  }`}
                >
                  {item.type === "youtube" ? (
                    <YouTubeIcon className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Rss className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-300 line-clamp-2 leading-snug transition-colors duration-150">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {item.feed?.title && (
                      <span className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 truncate max-w-[130px]">
                        {item.feed.title}
                      </span>
                    )}
                    {item.published_at && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        · {timeAgo(item.published_at, t)}
                      </span>
                    )}
                  </div>
                </div>

                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
