"use client";

import { useFeedStore } from "@/store/useFeedStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Star, Check } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useEffect } from "react";
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

  useEffect(() => {
    if (user) {
      loadFeeds(user.id);
    }
  }, [user, loadFeeds]);

  const handleRemove = (feed) => {
    removeFeed(feed.id);
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {feeds.map((feed) => {
        // Her feed için ilgili item'ları bul
        const feedItems = useFeedStore.getState().getFeedItems(feed.id);

        return (
          <Card key={feed.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold truncate">
                {feed.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(feed)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {feed.description}
              </p>
              <div className="space-y-2">
                {feedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="group relative">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => toggleItemRead(item.id, true)}
                    >
                      <div className="flex items-start gap-2">
                        {item.thumbnail && (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            width={64}
                            height={48}
                            className="object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-medium truncate ${
                              item.is_read ? "text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </h3>
                          {item.published_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.published_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleItemFavorite(item.id, !item.is_favorite);
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleItemRead(item.id, !item.is_read);
                            }}
                          >
                            <Check
                              className={`h-4 w-4 ${
                                item.is_read ? "text-green-500" : ""
                              }`}
                            />
                          </Button>
                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
