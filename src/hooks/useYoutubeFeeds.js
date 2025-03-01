import { useQuery } from "@tanstack/react-query";

export function useYoutubeFeed(input) {
  // Handle veya channel ID kontrolü
  const isHandle = input?.startsWith("@");
  const queryParams = isHandle
    ? `handle=${encodeURIComponent(input.slice(1))}`
    : `channelId=${encodeURIComponent(input)}`;

  // Fetch channel and videos info in a single request
  const youtubeQuery = useQuery({
    queryKey: ["youtube", input],
    queryFn: async () => {
      const response = await fetch(`/api/youtube?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch YouTube data");
      }
      return response.json();
    },
    enabled: !!input,
  });

  return {
    channelData: youtubeQuery.data?.channel,
    videos: youtubeQuery.data?.videos,
    isLoading: youtubeQuery.isLoading,
    error: youtubeQuery.error,
  };
}
