"use client";

import { Button } from "@/components/core/ui/button";
import { ExternalLink, Bookmark, Clock, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/components/core/ui/use-toast";

/**
 * Navigation buttons for feed items
 */
export function NavigationButtons({
  item,
  onFavorite,
  onReadLater,
  onShare,
  onClick,
  size = "default",
  className,
}) {
  const { t } = useLanguage();

  // Handle item click with proper URL
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick && item) {
      onClick(item.url, item);
    }
  };

  // Handle favorite toggle
  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onFavorite && item) {
      onFavorite(item.id, !item.is_favorite);
    }
  };

  // Handle read later toggle
  const handleReadLater = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onReadLater && item) {
      onReadLater(item.id, !item.is_read_later);
    }
  };

  // Handle share
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onShare && item) {
      onShare(item);
    } else if (item && item.url) {
      if (navigator.share) {
        navigator
          .share({
            title: item.title,
            text: item.description,
            url: item.url,
          })
          .catch((error) => console.error("Error sharing:", error));
      } else {
        navigator.clipboard
          .writeText(item.url)
          .then(() =>
            toast({
              title: t("common.copied"),
              description: t("common.urlCopied"),
            })
          )
          .catch((error) => console.error("Error copying:", error));
      }
    }
  };

  const buttonSize = size === "small" ? "icon-sm" : "icon";
  const iconSize = size === "small" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size={buttonSize}
        className={cn(
          "rounded-full",
          item.is_favorite
            ? "text-yellow-500 bg-yellow-500/10"
            : "text-muted-foreground hover:text-yellow-500"
        )}
        onClick={handleFavorite}
        aria-label={
          item.is_favorite ? t("feeds.removeFavorite") : t("feeds.addFavorite")
        }
      >
        <Bookmark
          className={cn(iconSize, item.is_favorite && "fill-current")}
        />
      </Button>

      <Button
        variant="ghost"
        size={buttonSize}
        className={cn(
          "rounded-full",
          item.is_read_later
            ? "text-blue-500 bg-blue-500/10"
            : "text-muted-foreground hover:text-blue-500"
        )}
        onClick={handleReadLater}
        aria-label={
          item.is_read_later
            ? t("feeds.removeReadLater")
            : t("feeds.addReadLater")
        }
      >
        <Clock className={cn(iconSize, item.is_read_later && "fill-current")} />
      </Button>

      <Button
        variant="ghost"
        size={buttonSize}
        className="rounded-full text-muted-foreground hover:text-primary"
        onClick={handleShare}
        aria-label={t("feeds.shareItem")}
      >
        <Share2 className={iconSize} />
      </Button>

      <Button
        variant="ghost"
        size={buttonSize}
        className="rounded-full text-muted-foreground hover:text-primary"
        onClick={handleClick}
        aria-label={t("feeds.openItem")}
      >
        <ExternalLink className={iconSize} />
      </Button>
    </div>
  );
}
