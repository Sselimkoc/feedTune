"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/useFeeds";

export function AddRssFeed({ onBack, onSuccess }) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addRssFeed, isAddingRssFeed } = useFeeds();
  const { user } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a valid RSS feed URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/proxy?url=${encodeURIComponent(url)}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch feed");
      }

      if (data && data.items) {
        const feed = {
          user_id: user.id,
          type: "rss",
          title: data.feed.title,
          description: data.feed.description,
          feed_url: url,
          items: data.items.map((item) => ({
            title: item.title,
            link: item.link,
            description: item.description,
            published_at: item.published_at,
          })),
        };

        await addRssFeed(feed);
        setUrl("");
        toast.success(`Added feed: ${feed.title}`);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error(error.message || "Failed to fetch RSS feed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Add RSS Feed</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter RSS feed URL"
          disabled={isLoading || isAddingRssFeed}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isAddingRssFeed}
        >
          {isLoading || isAddingRssFeed ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Feed"
          )}
        </Button>
      </form>
    </div>
  );
}
