"use client";

import { useFeedStore } from "@/store/useFeedStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export function FeedList() {
  const { feeds, removeFeed } = useFeedStore();

  const handleRemove = (feed) => {
    removeFeed(feed.link);
    toast.success(`Removed: ${feed.title}`);
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
      {feeds.map((feed) => (
        <Card key={feed.link}>
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
              {feed.items.slice(0, 3).map((item) => (
                <a
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-md hover:bg-accent transition-colors"
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
                      <h3 className="text-sm font-medium truncate">
                        {item.title}
                      </h3>
                      {item.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
