/**
 * YouTube API client tests
 */
import {
  searchChannels,
  getChannelById,
  getChannelVideos,
} from "../api-client";
import axios from "axios";

// Mock axios
jest.mock("axios");

describe("YouTube API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.YOUTUBE_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
  });

  describe("searchChannels", () => {
    test("should return formatted channel results", async () => {
      // Mock successful API response
      const mockResponse = {
        data: {
          items: [
            {
              id: { channelId: "UC_123" },
              snippet: {
                title: "Test Channel",
                description: "Test Description",
                thumbnails: {
                  high: { url: "https://example.com/high.jpg" },
                },
                publishedAt: "2020-01-01T00:00:00Z",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchChannels("test query");

      // Verify API was called correctly
      expect(axios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            type: "channel",
            q: "test query",
            maxResults: 10,
            key: "test-api-key",
          },
        }
      );

      // Verify results are formatted correctly
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "UC_123",
        title: "Test Channel",
        description: "Test Description",
        thumbnail: "https://example.com/high.jpg",
        publishedAt: "2020-01-01T00:00:00Z",
      });
    });

    test("should fall back to default thumbnail when high is not available", async () => {
      // Mock response with only default thumbnail
      const mockResponse = {
        data: {
          items: [
            {
              id: { channelId: "UC_123" },
              snippet: {
                title: "Test Channel",
                description: "Test Description",
                thumbnails: {
                  default: { url: "https://example.com/default.jpg" },
                },
                publishedAt: "2020-01-01T00:00:00Z",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchChannels("test query");
      expect(result[0].thumbnail).toBe("https://example.com/default.jpg");
    });

    test("should return empty array on API error", async () => {
      axios.get.mockRejectedValueOnce(new Error("API Error"));

      const result = await searchChannels("test query");
      expect(result).toEqual([]);
    });
  });

  describe("getChannelById", () => {
    test("should return channel details with RSS URL", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: "UC_123",
              snippet: {
                title: "Test Channel",
                description: "Test Description",
                thumbnails: {
                  high: { url: "https://example.com/high.jpg" },
                },
              },
              statistics: {
                subscriberCount: "1000",
                videoCount: "50",
              },
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const channelId = "UC_123";
      const result = await getChannelById(channelId);

      // Verify API was called correctly
      expect(axios.get).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "snippet,contentDetails,statistics",
            id: channelId,
            key: "test-api-key",
          },
        }
      );

      // Verify results include RSS URL
      expect(result).toEqual({
        youtube_id: "UC_123",
        title: "Test Channel",
        description: "Test Description",
        thumbnail: "https://example.com/high.jpg",
        channel_title: "Test Channel",
        statistics: {
          subscriberCount: "1000",
          videoCount: "50",
        },
        rss_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC_123",
      });
    });

    test("should throw error when channel not found", async () => {
      const mockResponse = {
        data: {
          items: [],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await expect(getChannelById("invalid-id")).rejects.toThrow(
        "Channel not found"
      );
    });

    test("should throw error on API error", async () => {
      const error = new Error("API Error");
      axios.get.mockRejectedValueOnce(error);

      await expect(getChannelById("UC_123")).rejects.toThrow("API Error");
    });
  });

  describe("getChannelVideos", () => {
    test("should return formatted channel videos", async () => {
      // First mock response for getting uploads playlist ID
      const mockChannelResponse = {
        data: {
          items: [
            {
              contentDetails: {
                relatedPlaylists: {
                  uploads: "UU_123_uploads",
                },
              },
            },
          ],
        },
      };

      // Second mock response for getting videos
      const mockPlaylistResponse = {
        data: {
          items: [
            {
              snippet: {
                title: "Test Video",
                description: "Video Description",
                thumbnails: {
                  high: { url: "https://example.com/video.jpg" },
                },
                publishedAt: "2020-01-01T00:00:00Z",
                channelId: "UC_123",
                channelTitle: "Test Channel",
              },
              contentDetails: {
                videoId: "vid123",
              },
            },
          ],
        },
      };

      // Setup sequential mocks
      axios.get
        .mockResolvedValueOnce(mockChannelResponse)
        .mockResolvedValueOnce(mockPlaylistResponse);

      const result = await getChannelVideos("UC_123");

      // Verify first API call to get uploads playlist
      expect(axios.get).toHaveBeenNthCalledWith(
        1,
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            part: "contentDetails",
            id: "UC_123",
            key: "test-api-key",
          },
        }
      );

      // Verify second API call to get playlist items
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId: "UU_123_uploads",
            maxResults: 50,
            key: "test-api-key",
          },
        }
      );

      // Verify results are formatted correctly
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "vid123",
        title: "Test Video",
        description: "Video Description",
        thumbnail: "https://example.com/video.jpg",
        publishedAt: "2020-01-01T00:00:00Z",
        channelId: "UC_123",
        channelTitle: "Test Channel",
      });
    });

    test("should return empty array when channel not found", async () => {
      const mockResponse = {
        data: {
          items: [],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await getChannelVideos("invalid-id");
      expect(result).toEqual([]);
    });

    test("should return empty array on API error", async () => {
      axios.get.mockRejectedValueOnce(new Error("API Error"));

      const result = await getChannelVideos("UC_123");
      expect(result).toEqual([]);
    });
  });
});
