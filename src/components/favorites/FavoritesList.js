"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

export function FavoritesList({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const supabase = createClientComponentClient();

  const toggleItemRead = async (itemId, isRead) => {
    try {
      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read: isRead } : item
        )
      );

      const { error } = await supabase
        .from("feed_items")
        .update({ is_read: isRead })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      // Rollback on error
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_read: !isRead } : item
        )
      );
      toast.error("Failed to update item status");
    }
  };

  const toggleItemFavorite = async (itemId, isFavorite) => {
    try {
      // Optimistic update
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_favorite: isFavorite } : item
        )
      );

      const { error } = await supabase
        .from("feed_items")
        .update({ is_favorite: isFavorite })
        .eq("id", itemId);

      if (error) throw error;

      // Remove from list if unfavorited
      if (!isFavorite) {
        setItems((currentItems) =>
          currentItems.filter((item) => item.id !== itemId)
        );
      }
    } catch (error) {
      // Rollback on error
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, is_favorite: !isFavorite } : item
        )
      );
      toast.error("Failed to update favorite status");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No favorite items yet. Star items in your feeds to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <Card key={item.id} className="group">
          <CardContent className="p-4">
            <div className="flex items-start gap-4 h-[120px]">
              {item.thumbnail && (
                <div className="relative w-[120px] h-[90px] flex-shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover rounded"
                    sizes="120px"
                    priority={false}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4">
                  <h2
                    className={`text-lg font-medium line-clamp-2 ${
                      item.is_read ? "text-muted-foreground" : ""
                    }`}
                  >
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleItemFavorite(item.id, !item.is_favorite)
                      }
                      aria-label={
                        item.is_favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleItemRead(item.id, !item.is_read)}
                      aria-label={
                        item.is_read ? "Mark as unread" : "Mark as read"
                      }
                    >
                      <Check
                        className={`h-4 w-4 ${
                          item.is_read ? "text-green-500" : ""
                        }`}
                      />
                    </Button>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md w-8 h-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                )}
                {item.published_at && (
                  <time
                    dateTime={item.published_at}
                    className="text-xs text-muted-foreground mt-auto"
                  >
                    {new Date(item.published_at).toLocaleDateString()}
                  </time>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
