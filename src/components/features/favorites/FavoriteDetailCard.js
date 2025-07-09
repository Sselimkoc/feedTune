"use client";

import { useState } from "react";
import { Heart, Bookmark, ExternalLink } from "lucide-react";
import { NavigationButtons } from "../feed/layout/NavigationButtons";
import { Card, CardContent, CardFooter } from "@/components/core/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function FavoriteDetailCard({
  video,
  onToggleFavorite,
  onToggleReadLater,
  onShare,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!video) return null;

  // Handle item click
  const handleItemClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(video.url, video);
    } else if (video.url) {
      window.open(video.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/40 hover:border-primary/40 transition-all duration-300 h-full flex flex-col",
        video.is_read ? "bg-card/60" : "bg-card/90 shadow-sm",
        isHovered && "shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div
        className="relative w-full aspect-video bg-muted cursor-pointer"
        onClick={handleItemClick}
      >
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
            priority={false}
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              if (parent) {
                while (parent.firstChild) {
                  parent.removeChild(parent.firstChild);
                }
                const fallbackDiv = document.createElement("div");
                fallbackDiv.className =
                  "w-full h-full flex items-center justify-center";
                fallbackDiv.innerHTML = `<div class="text-muted-foreground/40 text-3xl font-medium">${
                  video.feed_title?.charAt(0) || "?"
                }</div>`;
                parent.appendChild(fallbackDiv);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-muted-foreground/40 text-3xl font-medium">
              {video.feed_title?.charAt(0) || "?"}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <CardContent className="p-4 pb-2 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          {video.feed_type && (
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {video.feed_type}
            </span>
          )}

          {video.feed_title && (
            <p className="text-xs text-muted-foreground truncate">
              {video.feed_title}
            </p>
          )}
        </div>

        <h3
          className={cn(
            "font-medium mb-2 line-clamp-2 leading-snug transition-colors duration-200 cursor-pointer",
            video.is_read ? "text-muted-foreground" : "text-foreground",
            isHovered && !video.is_read && "text-primary"
          )}
          onClick={handleItemClick}
        >
          {video.title}
        </h3>

        {video.description && (
          <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-auto">
            {video.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 border-t border-border/30 justify-between">
        <NavigationButtons
          item={video}
          onClick={onClick || handleItemClick}
          onFavorite={onToggleFavorite}
          onReadLater={onToggleReadLater}
          onShare={onShare}
        />
      </CardFooter>
    </Card>
  );
}
