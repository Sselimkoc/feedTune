"use client";

import { useState } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export function AddRssFeed({ onBack, onSuccess }) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const feedStore = useFeedStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a valid RSS feed URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch feed");

      if (data && data.items) {
        const formattedData = {
          type: "rss",
          title: data.feed.title,
          link: data.feed.link,
          description: data.feed.description,
          items: data.items.map((item) => ({
            title: item.title,
            link: item.link,
            description: item.description,
          })),
        };

        feedStore.addFeed(formattedData);
        setUrl("");
        toast.success(`Added feed: ${formattedData.title}`);
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
          disabled={isLoading}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
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
