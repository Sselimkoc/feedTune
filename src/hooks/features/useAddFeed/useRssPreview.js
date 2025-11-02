import { useState, useCallback } from "react";
import { previewRssFeed, normalizeFeedData } from "@/services/feedService";

export const useRssPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreview = useCallback(async (url) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await previewRssFeed(url);

      if (response.success && response.feed) {
        const normalizedData = normalizeFeedData(response, "rss");
        normalizedData.url = url;
        return { type: "preview", data: normalizedData };
      }

      throw new Error(response.error || "Failed to preview RSS feed");
    } catch (err) {
      const errorMessage = err.message || "Invalid RSS URL";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    setError,
    handlePreview,
  };
};
