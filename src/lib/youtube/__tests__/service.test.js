/**
 * YouTube Service entegrasyon testleri
 */
import { youtubeService } from "../service";
import * as apiClient from "../api-client";
import * as cache from "../cache";
import axios from "axios";

// Mock dependencies
jest.mock("../api-client");
jest.mock("../cache");
jest.mock("axios");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
          ilike: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: {} } })),
    },
  },
}));

jest.mock("@/services/feedService", () => ({
  feedService: {
    insertYoutubeItems: jest.fn(() =>
      Promise.resolve({ success: true, added: 5 })
    ),
  },
}));

jest.mock("rss-parser", () => {
  return jest.fn().mockImplementation(() => {
    return {
      parseURL: jest.fn(() =>
        Promise.resolve({
          items: [
            {
              title: "Video 1",
              link: "https://www.youtube.com/watch?v=video1",
              contentSnippet: "Description 1",
              pubDate: "2022-01-01T12:00:00Z",
              guid: "video1",
            },
            {
              title: "Video 2",
              link: "https://www.youtube.com/watch?v=video2",
              contentSnippet: "Description 2",
              pubDate: "2022-01-02T12:00:00Z",
              guid: "video2",
            },
          ],
        })
      ),
    };
  });
});

describe("YouTube Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getChannelInfo", () => {
    test("should return cached data when available", async () => {
      const cachedData = {
        youtube_id: "UC123",
        title: "Test Channel",
        description: "Test Description",
      };

      cache.getChannelFromCache.mockResolvedValueOnce(cachedData);

      const result = await youtubeService.getChannelInfo("UC123");

      expect(cache.getChannelFromCache).toHaveBeenCalledWith("UC123");
      expect(result).toEqual(cachedData);
      expect(apiClient.getChannelById).not.toHaveBeenCalled();
    });

    test("should fetch data from API when cache miss", async () => {
      const apiData = {
        youtube_id: "UC123",
        title: "Test Channel",
        description: "Test Description",
      };

      cache.getChannelFromCache.mockResolvedValueOnce(null);
      apiClient.getChannelById.mockResolvedValueOnce(apiData);

      const result = await youtubeService.getChannelInfo("UC123");

      expect(cache.getChannelFromCache).toHaveBeenCalledWith("UC123");
      expect(apiClient.getChannelById).toHaveBeenCalledWith("UC123");
      expect(cache.cacheChannelInfo).toHaveBeenCalledWith("UC123", apiData);
      expect(result).toEqual(apiData);
    });

    test("should handle API errors gracefully", async () => {
      cache.getChannelFromCache.mockResolvedValueOnce(null);
      apiClient.getChannelById.mockRejectedValueOnce(new Error("API Error"));

      // Mock youtubeService.fetchChannelInfo to provide fallback data
      const spyFetchChannelInfo = jest.spyOn(
        youtubeService,
        "fetchChannelInfo"
      );
      spyFetchChannelInfo.mockImplementationOnce(async () => ({
        youtube_id: "UC123",
        title: "Fallback Channel",
        description: "",
      }));

      const result = await youtubeService.getChannelInfo("UC123");

      expect(result.youtube_id).toBe("UC123");
      expect(spyFetchChannelInfo).toHaveBeenCalledWith("UC123");

      spyFetchChannelInfo.mockRestore();
    });
  });

  describe("getYoutubeRssUrl", () => {
    test("should return URL directly if already RSS format", async () => {
      const rssUrl =
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC123";
      const result = await youtubeService.getYoutubeRssUrl(rssUrl);
      expect(result).toBe(rssUrl);
    });

    test("should extract channel ID and create RSS URL", async () => {
      const channelUrl = "https://www.youtube.com/channel/UC123";
      const expectedRssUrl =
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC123";

      // Mock the extractChannelId utility to return a known ID
      const spyExtractChannelId = jest.spyOn(
        youtubeService,
        "extractYoutubeChannelId"
      );
      spyExtractChannelId.mockResolvedValueOnce("UC123");

      const result = await youtubeService.getYoutubeRssUrl(channelUrl);

      expect(result).toBe(expectedRssUrl);
      expect(spyExtractChannelId).toHaveBeenCalledWith(channelUrl);

      spyExtractChannelId.mockRestore();
    });

    test("should use API if channel ID extraction fails", async () => {
      const channelUrl = "https://www.youtube.com/@username";
      const apiResponseRssUrl =
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC456";

      // Mock channel ID extraction failure
      const spyExtractChannelId = jest.spyOn(
        youtubeService,
        "extractYoutubeChannelId"
      );
      spyExtractChannelId.mockResolvedValueOnce(null);

      // Mock API response
      axios.post.mockResolvedValueOnce({
        data: { rssUrl: apiResponseRssUrl },
      });

      const result = await youtubeService.getYoutubeRssUrl(channelUrl);

      expect(result).toBe(apiResponseRssUrl);
      expect(axios.post).toHaveBeenCalledWith("/api/youtube/to-rss", {
        url: channelUrl,
      });

      spyExtractChannelId.mockRestore();
    });

    test("should handle errors gracefully", async () => {
      const channelUrl = "https://www.youtube.com/@username";

      // Mock both extraction and API failure
      const spyExtractChannelId = jest.spyOn(
        youtubeService,
        "extractYoutubeChannelId"
      );
      spyExtractChannelId.mockResolvedValueOnce(null);

      axios.post.mockRejectedValueOnce(new Error("API Error"));

      await expect(youtubeService.getYoutubeRssUrl(channelUrl)).rejects.toThrow(
        "Failed to create YouTube RSS URL"
      );

      spyExtractChannelId.mockRestore();
    });
  });

  describe("syncVideos", () => {
    test("should synchronize videos successfully", async () => {
      const feedId = "feed123";
      const channelId = "UC123";
      const userId = "user123";

      const result = await youtubeService.syncVideos(feedId, channelId, userId);

      // Should have added 2 items
      expect(result.success).toBe(true);
      expect(result.count).toBe(5); // From the mock response of insertYoutubeItems
    });

    test("should handle invalid parameters", async () => {
      const result = await youtubeService.syncVideos(null, null, "user123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid feedId or channelId");
    });
  });

  describe("searchChannel", () => {
    test("should return search results from API", async () => {
      const searchResults = [{ id: "UC123", title: "Test Channel" }];

      apiClient.searchChannels.mockResolvedValueOnce(searchResults);

      const result = await youtubeService.searchChannel("test query");

      expect(result).toEqual(searchResults);
      expect(apiClient.searchChannels).toHaveBeenCalledWith("test query");
      expect(cache.cacheSearchResults).toHaveBeenCalledWith(
        "test query",
        searchResults
      );
    });

    test("should fall back to API endpoint if direct search fails", async () => {
      const searchResults = [{ id: "UC123", title: "Test Channel" }];

      apiClient.searchChannels.mockResolvedValueOnce([]);

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              channel: searchResults[0],
            }),
        })
      );

      const result = await youtubeService.searchChannel("test query");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(searchResults[0]);
      expect(global.fetch).toHaveBeenCalled();

      delete global.fetch;
    });

    test("should handle errors gracefully", async () => {
      apiClient.searchChannels.mockRejectedValueOnce(new Error("API Error"));

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        })
      );

      const result = await youtubeService.searchChannel("test query");

      expect(result).toEqual([]);

      delete global.fetch;
    });
  });

  describe("addYoutubeChannel", () => {
    test("should add channel with URL input", async () => {
      const url = "https://www.youtube.com/channel/UC123";
      const userId = "user123";

      // Mock the extractChannelId utility to return a known ID
      const spyGetChannelInfo = jest.spyOn(youtubeService, "getChannelInfo");
      spyGetChannelInfo.mockResolvedValueOnce({
        youtube_id: "UC123",
        title: "Test Channel",
        description: "Test Description",
        rss_url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC123",
        thumbnail: "https://example.com/image.jpg",
      });

      const spySyncVideos = jest.spyOn(youtubeService, "syncVideos");
      spySyncVideos.mockResolvedValueOnce({ success: true });

      await youtubeService.addYoutubeChannel(url, userId);

      // Channel info should have been fetched
      expect(spyGetChannelInfo).toHaveBeenCalledWith("UC123");

      // Videos should have been synced
      expect(spySyncVideos).toHaveBeenCalled();

      spyGetChannelInfo.mockRestore();
      spySyncVideos.mockRestore();
    });
  });
});
