"use client";

import { useFeedAnalysis } from "@/hooks/useFeedAnalysis";
import { useThemeStore } from "@/store/useThemeStore";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedCard({ feed, onDelete }) {
  const { isAnalyzing, colors } = useFeedAnalysis(feed);
  const { theme } = useThemeStore();

  // Feed'e özel renk veya varsayılan renk kullan
  const feedColor = theme.customColors[feed.id] || theme.primaryColor;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg",
        isAnalyzing && "animate-pulse"
      )}
      style={{
        "--feed-color": feedColor,
        borderColor: feedColor,
        background: colors?.background || "var(--background)",
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {feed.type === "youtube" && feed.channel_avatar && (
            <img
              src={feed.channel_avatar}
              alt={feed.title}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <h3
              className="font-semibold leading-none"
              style={{ color: colors?.text }}
            >
              {feed.title}
            </h3>
            <p
              className="text-sm text-muted-foreground"
              style={{ color: colors ? `${colors.text}80` : undefined }}
            >
              {feed.type === "youtube" ? "YouTube Kanalı" : "RSS Feed"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete?.(feed.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <a
            href={
              feed.feed_url || `https://youtube.com/channel/${feed.channel_id}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md w-8 h-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {feed.description && (
          <p className="text-sm line-clamp-2" style={{ color: colors?.text }}>
            {feed.description}
          </p>
        )}
        {feed.type === "youtube" && (
          <div className="mt-2 text-xs text-muted-foreground space-x-2">
            {feed.subscriber_count && (
              <span>
                {parseInt(feed.subscriber_count).toLocaleString()} abone
              </span>
            )}
            {feed.video_count && (
              <span>{parseInt(feed.video_count).toLocaleString()} video</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
