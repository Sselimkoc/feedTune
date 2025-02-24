"use client";

import { useEffect } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const { loadFeeds, getFavoriteItems, toggleItemRead, toggleItemFavorite } =
    useFeedStore();

  useEffect(() => {
    if (user) {
      loadFeeds(user.id);
    }
  }, [user, loadFeeds]);

  const favoriteItems = getFavoriteItems();

  if (favoriteItems.length === 0) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-8">Favorites</h1>
        <div className="text-center text-muted-foreground py-10">
          <p>
            No favorite items yet. Star items in your feeds to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Favorites</h1>
      <div className="grid gap-4">
        {favoriteItems.map((item) => (
          <Card key={item.id} className="group">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {item.thumbnail && (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={160}
                    height={90}
                    className="object-cover rounded w-[120px] h-auto"
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
                    placeholder="blur"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3
                      className={`text-lg font-medium ${
                        item.is_read ? "text-muted-foreground" : ""
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleItemFavorite(item.id, !item.is_favorite)
                        }
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleItemRead(item.id, !item.is_read)}
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
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
