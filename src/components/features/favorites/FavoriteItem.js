"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Share, BookmarkCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn, formatRelativeDate } from "@/lib/utils";

export const FavoriteItem = memo(function FavoriteItem({
  item,
  viewMode,
  onToggleFavorite,
  onToggleReadLater,
  onShare,
}) {
  const { t, language } = useLanguage();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
          viewMode === "grid" ? "h-[280px]" : "h-auto"
        )}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="line-clamp-2 text-lg font-semibold">
                {item.title}
              </h3>
              {item.isRead === false && (
                <Badge variant="secondary" className="mt-1">
                  {t("feeds.new")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorite}
                className="h-8 w-8"
              >
                <Star className="h-4 w-4 fill-primary text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleReadLater}
                className="h-8 w-8"
              >
                <BookmarkCheck
                  className={cn(
                    "h-4 w-4",
                    item.isReadLater && "fill-primary text-primary"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onShare}
                className="h-8 w-8"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
            {item.description || t("feeds.noDescription")}
          </p>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.feedTitle}</span>
            <time dateTime={item.publishedAt}>
              {formatRelativeDate(item.publishedAt, language, t)}
            </time>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
