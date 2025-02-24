"use client";

import { useFeedStore } from "@/store/useFeedStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ExternalLink,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Video,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function FeedList() {
  const {
    feeds,
    feedItems,
    loadFeeds,
    removeFeed,
    toggleItemRead,
    toggleItemFavorite,
  } = useFeedStore();
  const { user } = useAuthStore();
  const [expandedFeeds, setExpandedFeeds] = useState({});
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    if (user) {
      loadFeeds(user.id);
    }
  }, [user, loadFeeds]);

  const handleRemove = (feed) => {
    removeFeed(feed.id);
  };

  const toggleExpand = (feedId) => {
    setExpandedFeeds((prev) => ({
      ...prev,
      [feedId]: !prev[feedId],
    }));
  };

  const handleToggleRead = async (itemId, isRead) => {
    try {
      await toggleItemRead(itemId, isRead);
      // Yerel state'i güncelle
      const updatedFeedItems = feedItems.map((item) =>
        item.id === itemId ? { ...item, is_read: isRead } : item
      );
      useFeedStore.setState({ feedItems: updatedFeedItems });
    } catch (error) {
      console.error("Error toggling read status:", error);
      toast.error("Failed to update read status");
    }
  };

  const handleToggleFavorite = async (itemId, isFavorite) => {
    try {
      await toggleItemFavorite(itemId, isFavorite);
      // Yerel state'i güncelle
      const updatedFeedItems = feedItems.map((item) =>
        item.id === itemId ? { ...item, is_favorite: isFavorite } : item
      );
      useFeedStore.setState({ feedItems: updatedFeedItems });
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  if (feeds.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>
          No feeds added yet. Click the &quot;Add New Feed&quot; button to get
          started.
        </p>
      </div>
    );
  }

  // YouTube kanallarını grupla
  const groupedFeeds = feeds.reduce((acc, feed) => {
    if (feed.type === "youtube" || feed.type === "youtube_shorts") {
      const channelId = feed.link.split("/").pop();
      if (!acc[channelId]) {
        acc[channelId] = {
          channelId,
          channelTitle: feed.title.split(" - ")[0],
          feeds: [],
          items: [],
        };
      }
      acc[channelId].feeds.push(feed);
      // Her feed'in item'larını birleştir
      const feedItems = useFeedStore.getState().getFeedItems(feed.id);
      acc[channelId].items.push(...feedItems);
    } else {
      // RSS feedleri için tekil gösterim
      acc[feed.id] = {
        feeds: [feed],
        items: useFeedStore.getState().getFeedItems(feed.id),
      };
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.values(groupedFeeds).map((group) => {
        const currentFeed = group.feeds[0];
        const isExpanded = expandedFeeds[currentFeed.id];

        return (
          <Card key={currentFeed.id}>
            <CardHeader className="flex flex-col space-y-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {currentFeed.channel_avatar && (
                    <Image
                      src={currentFeed.channel_avatar}
                      alt={currentFeed.title}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <CardTitle className="text-lg font-semibold truncate">
                    {currentFeed.title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(currentFeed)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {currentFeed.description}
              </p>
              <div className="space-y-4">
                {group.items
                  .sort(
                    (a, b) =>
                      new Date(b.published_at) - new Date(a.published_at)
                  )
                  .slice(0, isExpanded ? undefined : 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-4 p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      {item.thumbnail && (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          width={160}
                          height={90}
                          className="object-cover rounded w-[120px] h-auto"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleToggleRead(item.id, true)}
                            className="flex-1"
                          >
                            <h3
                              className={`text-base font-medium ${
                                item.is_read ? "text-muted-foreground" : ""
                              }`}
                            >
                              {item.title}
                            </h3>
                          </a>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleFavorite(
                                  item.id,
                                  !item.is_favorite
                                );
                              }}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  item.is_favorite
                                    ? "fill-yellow-400 text-yellow-400"
                                    : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleRead(item.id, !item.is_read);
                              }}
                            >
                              <Check
                                className={`h-4 w-4 ${
                                  item.is_read ? "text-green-500" : ""
                                }`}
                              />
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.published_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(item.published_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {group.items.length > 3 && !isExpanded && (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => toggleExpand(currentFeed.id)}
                  >
                    Show {group.items.length - 3} more items
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
