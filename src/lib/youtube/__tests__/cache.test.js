/**
 * YouTube cache fonksiyonları için test suite
 */
import {
  isCacheValid,
  getCachedSearchResults,
  cacheSearchResults,
} from "../cache";

// Mock localStorage for browser environment tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// Mock supabase before import
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        lt: jest.fn(() => Promise.resolve({ error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe("YouTube Cache Functions", () => {
  describe("isCacheValid", () => {
    test("should return true for a recent timestamp", () => {
      const now = new Date();
      const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString();
      expect(isCacheValid(yesterday, 7)).toBe(true);
    });

    test("should return false for an old timestamp", () => {
      const now = new Date();
      const tenDaysAgo = new Date(
        now.setDate(now.getDate() - 10)
      ).toISOString();
      expect(isCacheValid(tenDaysAgo, 7)).toBe(false);
    });

    test("should use default cache duration if not specified", () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.setDate(now.getDate() - 2)).toISOString();
      // Default is 7 days, so 2 days ago should be valid
      expect(isCacheValid(twoDaysAgo)).toBe(true);
    });
  });

  describe("getCachedSearchResults & cacheSearchResults", () => {
    beforeAll(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      global.localStorage = localStorageMock;
    });

    beforeEach(() => {
      localStorageMock.clear();
      jest.clearAllMocks();
    });

    test("should return null when localStorage is not available", () => {
      // Simulate server environment
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;
      delete window.localStorage;

      expect(getCachedSearchResults("test")).toBeNull();

      // Restore localStorage for other tests
      global.localStorage = originalLocalStorage;
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
      });
    });

    test("should cache and retrieve search results", () => {
      const query = "test query";
      const results = [
        { id: "1", title: "Test Result 1" },
        { id: "2", title: "Test Result 2" },
      ];

      // Cache the results
      cacheSearchResults(query, results);

      // Verify localStorage was called with the right params
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `youtube_search_${query.toLowerCase()}`,
        expect.any(String)
      );

      // Get cached results
      const cachedResults = getCachedSearchResults(query);
      expect(cachedResults).toEqual(results);
    });

    test("should return null for non-existing cache", () => {
      expect(getCachedSearchResults("non-existing")).toBeNull();
    });

    test("should return null for expired cache", () => {
      const query = "expired query";
      const results = [{ id: "1", title: "Expired Result" }];

      // Create an expired cache entry (2 hours old)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const cacheData = {
        results,
        timestamp: twoHoursAgo.toISOString(),
      };

      localStorageMock.setItem(
        `youtube_search_${query.toLowerCase()}`,
        JSON.stringify(cacheData)
      );

      // Should return null as cache is over 1 hour old
      expect(getCachedSearchResults(query)).toBeNull();

      // Verify localStorage.removeItem was called to clear expired cache
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `youtube_search_${query.toLowerCase()}`
      );
    });
  });
});
