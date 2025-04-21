import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { FeedService } from "@/services/feedService";

export function useEnhancedFeed() {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const feedService = new FeedService();

  const refreshFeed = async (feedId, skipCache = false) => {
    if (!feedId) {
      throw new Error("Feed ID is required");
    }

    try {
      setIsRefreshing(true);
      console.log(`Refreshing feed ID: ${feedId} with skipCache: ${skipCache}`);

      const result = await feedService.refreshFeed(feedId, skipCache);

      return {
        success: true,
        feed: result,
      };
    } catch (error) {
      console.error("Feed refresh error:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refreshFeed,
  };
}
