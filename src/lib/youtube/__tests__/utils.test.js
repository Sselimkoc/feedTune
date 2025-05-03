/**
 * YouTube utility fonksiyonları için test suite
 */
import {
  extractChannelId,
  createRssUrl,
  extractVideoId,
  createThumbnailUrl,
} from "../utils";

describe("YouTube Utility Functions", () => {
  describe("extractChannelId", () => {
    test("should extract channel ID from a channel URL", () => {
      const url = "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw";
      expect(extractChannelId(url)).toBe("UC_x5XG1OV2P6uZZ5FSM9Ttw");
    });

    test("should return null for non-YouTube URLs", () => {
      const url = "https://example.com";
      expect(extractChannelId(url)).toBeNull();
    });

    test("should return null for YouTube URLs without channel ID format", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractChannelId(url)).toBeNull();
    });

    test("should handle null or empty input", () => {
      expect(extractChannelId(null)).toBeNull();
      expect(extractChannelId("")).toBeNull();
    });
  });

  describe("createRssUrl", () => {
    test("should create valid RSS URL from channel ID", () => {
      const channelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw";
      const expected =
        "https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw";
      expect(createRssUrl(channelId)).toBe(expected);
    });

    test("should return null for empty channel ID", () => {
      expect(createRssUrl("")).toBeNull();
      expect(createRssUrl(null)).toBeNull();
    });
  });

  describe("extractVideoId", () => {
    test("should extract video ID from standard YouTube URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    test("should extract video ID from shortened YouTube URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    test("should return null for non-YouTube URLs", () => {
      const url = "https://example.com";
      expect(extractVideoId(url)).toBeNull();
    });

    test("should handle null or empty input", () => {
      expect(extractVideoId(null)).toBeNull();
      expect(extractVideoId("")).toBeNull();
    });
  });

  describe("createThumbnailUrl", () => {
    test("should create high quality thumbnail URL by default", () => {
      const videoId = "dQw4w9WgXcQ";
      const expected = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg";
      expect(createThumbnailUrl(videoId)).toBe(expected);
    });

    test("should create thumbnail URLs with specified quality", () => {
      const videoId = "dQw4w9WgXcQ";
      expect(createThumbnailUrl(videoId, "default")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg"
      );
      expect(createThumbnailUrl(videoId, "medium")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
      );
      expect(createThumbnailUrl(videoId, "standard")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/sddefault.jpg"
      );
      expect(createThumbnailUrl(videoId, "maxres")).toBe(
        "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
      );
    });

    test("should default to high quality when invalid quality is specified", () => {
      const videoId = "dQw4w9WgXcQ";
      const expected = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg";
      expect(createThumbnailUrl(videoId, "invalid_quality")).toBe(expected);
    });

    test("should return null for null or empty video ID", () => {
      expect(createThumbnailUrl(null)).toBeNull();
      expect(createThumbnailUrl("")).toBeNull();
    });
  });
});
