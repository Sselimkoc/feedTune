import { useState, useCallback } from "react";
import {
  searchYoutubeChannel,
  isYoutubeUrl,
  normalizeFeedData,
  normalizeChannelResults,
} from "@/services/feedService";
import { useLanguage } from "@/hooks/useLanguage";

export const useYoutubeSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { language } = useLanguage();

  const handlePreview = useCallback(async (url) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await searchYoutubeChannel(url, language);

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
  }, [language]);

  const handleSearch = useCallback(async (keyword) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await searchYoutubeChannel(keyword, language);

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
  }, [language]);

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
