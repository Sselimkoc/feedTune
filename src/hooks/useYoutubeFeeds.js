import { useQuery } from "@tanstack/react-query";

export function useYoutubeFeed(channelId) {
  // Fetch channel info
  const channelQuery = useQuery({
    queryKey: ["youtube", "channel", channelId],
    queryFn: async () => {
      const response = await fetch(
        `/api/proxy/youtube/channel?channelId=${channelId}`
      );
      if (!response.ok) throw new Error("Failed to fetch channel");
      return response.json();
    },
    enabled: !!channelId,
  });

  // Fetch videos
  const videosQuery = useQuery({
    queryKey: ["youtube", "videos", channelId],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/youtube?channelId=${channelId}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
    enabled: !!channelId,
  });

  return {
    channelData: channelQuery.data,
    videos: videosQuery.data,
    isLoading: channelQuery.isLoading || videosQuery.isLoading,
    error: channelQuery.error || videosQuery.error,
  };
}
