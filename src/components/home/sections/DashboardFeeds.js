"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/core/ui/button";
import { Rss, Plus, Trash2, Clock, ArrowRight } from "lucide-react";
import { YouTubeIcon } from "@/components/core/icons/YouTubeIcon";

export function DashboardFeeds({ feeds, onAddFeed, onViewAll, onDeleteFeed }) {
  const { t } = useTranslation();
  const displayFeeds = feeds.slice(0, 7);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Rss className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("home.dashboard.yourFeeds")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("home.dashboard.subscribed", { count: feeds.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddFeed}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/60"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("home.dashboard.add")}
          </Button>
          {feeds.length > 0 && (
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
      </div>

      {/* Body */}
      <div className="p-2">
        {feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-900/40 flex items-center justify-center mb-4">
              <Rss className="h-6 w-6 text-blue-400/60" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {t("home.feedManagement.noFeedsTitle")}
            </p>
            <p className="text-xs text-muted-foreground mb-5 max-w-[200px]">
              {t("home.dashboard.noFeeds.description")}
            </p>
            <Button
              onClick={onAddFeed}
              size="sm"
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/30 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {t("home.feedManagement.addFirstFeed")}
            </Button>
          </div>
        ) : (
          <div className="space-y-px">
            {displayFeeds.map((feed, i) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors duration-150 cursor-default"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    feed.type === "youtube" ? "bg-red-500/10" : "bg-blue-500/10"
                  }`}
                >
                  {feed.type === "youtube" ? (
                    <YouTubeIcon className="h-4 w-4 text-red-400" />
                  ) : (
                    <Rss className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {feed.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        feed.type === "youtube"
                          ? "text-red-500/70 dark:text-red-400/70"
                          : "text-blue-600/70 dark:text-blue-400/70"
                      }`}
                    >
                      {feed.type === "youtube" ? "YouTube" : "RSS"}
                    </span>
                    {feed.last_synced_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(feed.last_synced_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {onDeleteFeed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteFeed(feed.id)}
                    aria-label={`Delete ${feed.title}`}
                    className="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-50 h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
