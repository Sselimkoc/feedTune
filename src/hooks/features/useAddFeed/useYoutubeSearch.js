import { useState, useCallback } from "react";
import {
  searchYoutubeChannel,
  isYoutubeUrl,
  normalizeFeedData,
  normalizeChannelResults,
} from "@/services/feedService";

export const useYoutubeSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreview = useCallback(async (url) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await searchYoutubeChannel(url);

      if (response.success && response.channel) {
        const normalizedData = normalizeFeedData(response.channel, "youtube");
        return { type: "preview", data: normalizedData };
      }

      throw new Error(response.error || "Failed to get channel info");
    } catch (err) {
      const errorMessage = err.message || "Invalid YouTube URL";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (keyword) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await searchYoutubeChannel(keyword);

      if (!response.success || !response.channels?.length) {
        throw new Error(response.error || "No channels found");
      }

      const normalizedResults = normalizeChannelResults(response.channels);
      return { type: "search", data: normalizedResults };
    } catch (err) {
      const errorMessage = err.message || "No channels found";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processYoutubeInput = useCallback(
    async (input) => {
      if (!input) return null;

      if (isYoutubeUrl(input)) {
        return await handlePreview(input);
      } else {
        return await handleSearch(input);
      }
    },
    [handlePreview, handleSearch]
  );

  return {
    isLoading,
    error,
    setError,
    handlePreview,
    handleSearch,
    processYoutubeInput,
  };
};
