"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Star, Check, ExternalLink, Rss } from "lucide-react";
import Image from "next/image";
import { memo } from "react";

export const FeedItem = memo(function FeedItem({
  item,
  feed,
  isActive,
  itemRef,
  toggleItemRead,
  toggleItemFavorite,
}) {
  if (!item) return null;

  return (
    <div
      ref={itemRef}
      className={cn(
        "group flex flex-col bg-card rounded-lg shadow-md hover:shadow-lg will-change-transform",
        isActive
          ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.01] z-10"
          : ""
      )}
      style={{
        transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
      }}
    >
      {/* Thumbnail Section */}
      <div className="relative w-full" style={{ minHeight: "200px" }}>
        {feed.type === "youtube" && item.thumbnail ? (
          <div className="relative aspect-video w-full">
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-accent/5 via-accent/10 to-background">
            <div className="flex flex-col items-center text-center space-y-4">
              {feed.type === "rss" && feed.site_favicon ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-background p-2 shadow-sm">
                  <Image
                    src={feed.site_favicon}
                    alt={feed.title}
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rss className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground/80">
                  {feed.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.published_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100"
          style={{ transition: "opacity 0.15s ease-out" }}
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "text-base font-medium line-clamp-2",
              item.is_read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {item.title}
          </h3>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                item.is_favorite
                  ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500"
                  : "hover:bg-yellow-500/10 hover:text-yellow-500"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItemFavorite(item.id, !item.is_favorite);
              }}
            >
              <Star
                className={cn(
                  "h-4 w-4 mr-1.5",
                  item.is_favorite ? "fill-yellow-500" : "fill-none"
                )}
              />
              <span className="text-sm">
                {item.is_favorite ? "Favorilerde" : "Favorilere Ekle"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3",
                item.is_read
                  ? "bg-green-500/10 hover:bg-green-500/20 text-green-500"
                  : "hover:bg-green-500/10 hover:text-green-500"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItemRead(item.id, !item.is_read);
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4 mr-1.5",
                  item.is_read ? "text-green-500" : ""
                )}
              />
              <span className="text-sm">
                {item.is_read ? "Okundu" : "Okunmadı"}
              </span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 hover:bg-primary/5"
            asChild
          >
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                toggleItemRead(item.id, !item.is_read);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span className="text-sm">Oku</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
});
