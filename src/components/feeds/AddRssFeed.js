"use client";

import { useState } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function AddRssFeed({ onBack, onSuccess }) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const feedStore = useFeedStore();
  const { session, checkSession } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      toast.error("Please enter a valid RSS feed URL");
      return;
    }

    // Ensure session is current
    await checkSession();

    if (!session?.access_token) {
      toast.error("Please sign in to add an RSS feed");
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

        await feedStore.addFeed(formattedData, session?.user?.id);
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
