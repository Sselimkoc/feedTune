import { useCallback } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { FeedRepository } from "@/lib/db/feedRepository";
import { feedService } from "@/services/feedService";
import { FeedParser } from "@/utils/feedParser";

export function useFeedService() {
  const { session } = useSupabase();
  const feedRepository = new FeedRepository();
  const feedParser = new FeedParser();

  const addFeed = useCallback(
    async (url, categoryId) => {
      const feed = await feedParser.parseURL(url);
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      return await feedRepository.addFeed({
        userId,
        url,
        type: feed.type,
        title: feed.title,
        description: feed.description,
        icon: feed.icon,
        categoryId,
      });
    },
    [session]
  );

  const updateFeed = useCallback(
    async (feedId, { title, description, icon, categoryId }) => {
      return await feedRepository.updateFeed(feedId, {
        title,
        description,
        icon,
        categoryId,
      });
    },
    []
  );

  const refreshFeed = useCallback(async (feedId, skipCache = false) => {
    try {
      return await feedService.refreshFeed(feedId, skipCache);
    } catch (error) {
      console.error("Error refreshing feed:", error);
      throw error;
    }
  }, []);

  return {
    addFeed,
    updateFeed,
    refreshFeed,
  };
}
