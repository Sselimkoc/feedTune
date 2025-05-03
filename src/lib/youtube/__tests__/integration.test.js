/**
 * YouTube entegrasyon testleri
 * Bu testler, YouTube servisinin alt sistemleriyle (API, cache, vb.) birlikte çalışmasını test eder
 */
import { youtubeService } from "../service";
import { extractChannelId, createRssUrl } from "../utils";

// Bu testler gerçek API çağrılarını önlemek için mock'lanmalıdır
jest.mock("../api-client");
jest.mock("axios");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          ilike: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: null, error: null })
              ),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: "feed123",
                title: "Test Channel",
                url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC123",
                feed_type: "youtube",
                channel_id: "UC123",
              },
              error: null,
            })
          ),
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

// Test senaryoları
describe("YouTube Service Integration", () => {
  describe("End-to-end workflow", () => {
    const mockUserId = "user123";
    const mockChannelId = "UC_test123";
    const mockChannelUrl = `https://www.youtube.com/channel/${mockChannelId}`;

    // İş akışının her adımını taklit et
    test("Full workflow of adding and synchronizing a channel", async () => {
      // 1. İlk önce URL ayrıştırma işlemini test et
      const extractedId = extractChannelId(mockChannelUrl);
      expect(extractedId).toBe(mockChannelId);

      // 2. RSS URL oluşturmayı test et
      const rssUrl = createRssUrl(mockChannelId);
      expect(rssUrl).toBe(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${mockChannelId}`
      );

      // 3. Servis fonksiyonlarını mock'la
      const mockGetChannelInfo = jest.spyOn(youtubeService, "getChannelInfo");
      mockGetChannelInfo.mockResolvedValueOnce({
        youtube_id: mockChannelId,
        title: "Test Channel",
        description: "Test Description",
        thumbnail: "http://example.com/thumbnail.jpg",
        rss_url: rssUrl,
      });

      const mockSyncVideos = jest.spyOn(youtubeService, "syncVideos");
      mockSyncVideos.mockResolvedValueOnce({
        success: true,
        count: 10,
        message: "10 video synchronized",
      });

      // 4. Kanal ekleme işlemini test et
      try {
        const feed = await youtubeService.addYoutubeChannel(
          mockChannelUrl,
          mockUserId
        );

        // Beklenen davranışları doğrula
        expect(mockGetChannelInfo).toHaveBeenCalledWith(mockChannelId);
        expect(mockSyncVideos).toHaveBeenCalled();
        expect(feed).toBeDefined();
      } catch (error) {
        fail(`Workflow failed with error: ${error.message}`);
      } finally {
        // Mockları temizle
        mockGetChannelInfo.mockRestore();
        mockSyncVideos.mockRestore();
      }
    });
  });

  describe("Error handling and recovery", () => {
    test("Should handle and recover from search errors", async () => {
      // Mock search to simulate error and recovery
      const searchSpy = jest.spyOn(youtubeService, "searchChannel");
      searchSpy
        .mockImplementationOnce(async () => {
          // İlk çağrıda hata döndür
          throw new Error("Network error");
        })
        .mockImplementationOnce(async () => {
          // İkinci çağrıda başarılı sonuç döndür
          return [{ id: "UC_123", title: "Test Channel" }];
        });

      // İlk çağrıda, hata silsile halinde ele alınmalı
      try {
        await youtubeService.searchChannel("test query");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }

      // İkinci çağrıda, işlem başarılı olmalı
      const results = await youtubeService.searchChannel("test query");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Test Channel");

      searchSpy.mockRestore();
    });

    test("Should handle parse errors when extracting channel IDs", async () => {
      const invalidUrls = [
        "not a url",
        "http://example.com", // YouTube değil
        "https://youtube.com/invalidpath",
      ];

      for (const url of invalidUrls) {
        const id = extractChannelId(url);
        expect(id).toBeNull();
      }
    });
  });

  describe("Utilities integration", () => {
    test("Should successfully combine utility functions", () => {
      // URL > Channel ID > RSS URL dönüşüm zincirini test et
      const testUrls = [
        "https://www.youtube.com/channel/UC123456789",
        "https://youtube.com/channel/UC987654321",
      ];

      for (const url of testUrls) {
        const channelId = extractChannelId(url);
        expect(channelId).not.toBeNull();

        const rssUrl = createRssUrl(channelId);
        expect(rssUrl).toContain("feeds/videos.xml");
        expect(rssUrl).toContain(channelId);
      }
    });
  });
});
