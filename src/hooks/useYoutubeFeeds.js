import { useQuery } from "@tanstack/react-query";

export function useYoutubeFeed(channelId) {
  // Fetch channel and videos info in a single request
  const youtubeQuery = useQuery({
    queryKey: ["youtube", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/youtube?channelId=${channelId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch YouTube data");
      }
      return response.json();
    },
    enabled: !!channelId,
  });

  return {
    channelData: youtubeQuery.data?.channel,
    videos: youtubeQuery.data?.videos,
    isLoading: youtubeQuery.isLoading,
    error: youtubeQuery.error,
  };
}
