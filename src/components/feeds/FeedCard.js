"use client";

import { memo, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckIcon, ExternalLinkIcon, StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const FeedCardComponent = ({
  item,
  feed,
  isCompact,
  onToggleRead,
  onToggleFavorite,
  onOpenLink,
  isFocused,
}) => {
  // Erken dönüş öncesinde useMemo kullanımı
  const truncatedDescription = useMemo(() => {
    if (!item || !feed) return "";

    const itemDescription = item.description || "";
    const isYoutube = feed.type === "youtube";

    if (!itemDescription) return "";

    // YouTube descriptions are often longer and contain links/timestamps
    if (isYoutube) {
      // Remove common YouTube description patterns
      const cleanDescription = itemDescription
        .split("\n")[0] // Take only first paragraph
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "") // Remove URLs
        .replace(/\[.*?\]/g, "") // Remove timestamps
        .trim();

      return cleanDescription.length > 100
        ? cleanDescription.substring(0, 100) + "..."
        : cleanDescription;
    }

    // Regular RSS feed description truncation
    return isCompact
      ? itemDescription.length > 150
        ? itemDescription.substring(0, 150) + "..."
        : itemDescription
      : itemDescription;
  }, [item, feed, isCompact]);

  // Erken dönüş kontrolü
  if (!item || !feed) return null;

  const isYoutube = feed.type === "youtube";
  const feedTitle = feed.title || "Unknown Feed";
  const itemTitle = item.title || "Untitled";
  const publishedAt = item.published_at
    ? new Date(item.published_at)
    : new Date();
  const timeAgo = formatDistanceToNow(publishedAt, { addSuffix: true });

  return (
    <Card
      className={cn(
        "transition-all duration-150 ease-in-out will-change-transform",
        item.is_read ? "bg-muted/50" : "bg-card",
        isFocused ? "ring-2 ring-primary ring-offset-2" : "",
        "hover:shadow-md"
      )}
    >
      <CardHeader className="pb-2 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {feed.site_favicon ? (
              <Image
                src={feed.site_favicon}
                alt={feedTitle}
                width={24}
                height={24}
                className={cn(
                  "rounded",
                  isYoutube ? "rounded-full" : "rounded"
                )}
                unoptimized
              />
            ) : (
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {feedTitle.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {feedTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isYoutube && (
              <Badge variant="outline" className="text-xs">
                YouTube
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {timeAgo}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "font-semibold leading-tight flex-1",
              item.is_read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {itemTitle}
          </h3>
          <div className="flex gap-2 ml-3">
            <Button
              variant={item.is_read ? "secondary" : "outline"}
              size="sm"
              onClick={() => onToggleRead(item.id, !item.is_read)}
              className={cn(
                "h-8 w-8 p-0 relative group hover:scale-105 transition-transform",
                item.is_read
                  ? "bg-primary/10 hover:bg-primary/20"
                  : "hover:bg-primary/10"
              )}
              title={item.is_read ? "Mark as unread" : "Mark as read"}
            >
              <CheckIcon
                className={cn(
                  "h-4 w-4 transition-colors",
                  item.is_read
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <span className="sr-only">
                {item.is_read ? "Read" : "Unread"}
              </span>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.is_read ? "Mark as unread" : "Mark as read"}
              </span>
            </Button>

            <Button
              variant={item.is_favorite ? "secondary" : "outline"}
              size="sm"
              onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
              className={cn(
                "h-8 w-8 p-0 relative group hover:scale-105 transition-transform",
                item.is_favorite
                  ? "bg-yellow-500/10 hover:bg-yellow-500/20"
                  : "hover:bg-yellow-500/10"
              )}
              title={
                item.is_favorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <StarIcon
                className={cn(
                  "h-4 w-4 transition-colors",
                  item.is_favorite
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground group-hover:text-yellow-500 group-hover:fill-yellow-500"
                )}
              />
              <span className="sr-only">
                {item.is_favorite ? "Favorited" : "Favorite"}
              </span>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.is_favorite
                  ? "Remove from favorites"
                  : "Add to favorites"}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        {item.thumbnail && (
          <div className="mb-2 rounded-md overflow-hidden">
            <Image
              src={item.thumbnail}
              alt={itemTitle}
              className="w-full h-auto object-cover"
              loading="lazy"
              width={320}
              height={180}
              unoptimized
            />
          </div>
        )}
        <p
          className={cn(
            "text-sm",
            item.is_read ? "text-muted-foreground/80" : "text-muted-foreground"
          )}
        >
          {truncatedDescription}
        </p>
      </CardContent>

      <CardFooter className="pt-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onOpenLink(item.link);
            if (!item.is_read) {
              onToggleRead(item.id, true);
            }
          }}
          className="h-8 hover:scale-105 transition-transform"
        >
          <ExternalLinkIcon className="h-4 w-4 mr-1" />
          <span className="text-xs">Open</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const FeedCard = memo(FeedCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.is_read === nextProps.item?.is_read &&
    prevProps.item?.is_favorite === nextProps.item?.is_favorite &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.isFocused === nextProps.isFocused
  );
});
