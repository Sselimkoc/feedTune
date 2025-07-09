"use client";

import { FeedRepository } from "@/lib/db/feedRepository";
import { toast } from "@/components/core/ui/use-toast";
import { createBrowserClient } from "@supabase/ssr";
import { FeedParser } from "@/utils/feedParser";
import { parseURL } from "@/utils/feedParser";
import { toUTCTimestamp } from "@/utils/dateUtils";

/**
 * Feed service layer that manages feed operations.
 * This layer mediates between repository and UI and contains business logic.
 */
export class FeedService {
  constructor() {
    this.feedRepository = new FeedRepository();
    this.feedParser = new FeedParser();
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Gets the user session
   * @returns {Promise<Object|null>} User session
   * @private
   */
  async _getSession() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Cleans and normalizes the URL
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      if (!url) return "";

      // Clean URL
      let normalizedUrl = url.trim();

      // Add protocol if missing
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      // Convert to URL object to standardize
      const urlObj = new URL(normalizedUrl);

      // Remove trailing slash (optional)
      let finalUrl = urlObj.toString();
      if (finalUrl.endsWith("/") && !urlObj.pathname.endsWith("//")) {
        finalUrl = finalUrl.slice(0, -1);
      }

      return finalUrl;
    } catch (error) {
      console.warn("URL normalization error:", error);
      // Return original URL if error
      return url;
    }
  }

  /**
   * Gets user feeds
   * @param {string} userId User ID
   * @returns {Promise<Array>} User feeds
   */
  async getFeeds(userId) {
    try {
      console.log("[FeedService] Fetching feeds for user:", userId);
      if (!userId) {
        console.warn("[FeedService] No userId provided");
        return [];
      }

      const feeds = await this.feedRepository.getFeeds(userId);
      console.log("[FeedService] Repository response:", feeds);

      if (!feeds || feeds.length === 0) {
        console.log("[FeedService] No feeds found for user");
        return [];
      }

      console.log(`[FeedService] Found ${feeds.length} feeds for user`);
      return feeds;
    } catch (error) {
      console.error("[FeedService] Error in getFeeds:", error);
      throw error;
    }
  }

  /**
   * Gets feed items
   * @param {Array} feedIds Feed IDs
   * @param {number} limit Record limit
   * @param {string} userId User ID
   * @returns {Promise<Array>} Feed items
   */
  async getFeedItems(feedIds, limit = 10, userId = null) {
    try {
      if (!feedIds || feedIds.length === 0) return [];

      return await this.feedRepository.getFeedItems(feedIds, limit, userId);
    } catch (error) {
      console.error("Error fetching feed items:", error);
      toast.error("An error occurred while loading feed content.");
      return [];
    }
  }

  /**
   * Gets user's favorite items
   * @param {string} userId User ID
   * @param {string} [feedType='rss'] Feed type
   * @returns {Promise<Array>} Favorite items
   */
  async getFavorites(userId, feedType = "rss") {
    try {
      if (!userId) {
        console.warn("getFavorites called without userId");
        return [];
      }
      return await this.feedRepository.getFavoriteItems(userId, feedType);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("An error occurred while loading favorites.");
      return [];
    }
  }

  /**
   * Gets user's read later items
   * @param {string} userId User ID
   * @param {string} [feedType='rss'] Feed type
   * @returns {Promise<Array>} Read later items
   */
  async getReadLaterItems(userId, feedType = "rss") {
    try {
      if (!userId) {
        console.warn("getReadLaterItems called without userId");
        return [];
      }
      return await this.feedRepository.getReadLaterItems(userId, feedType);
    } catch (error) {
      console.error("Error fetching read later list:", error);
      toast.error("An error occurred while loading read later list.");
      return [];
    }
  }

  /**
   * Toggles item read status
   * @param {string} userId User ID
   * @param {string} itemId Item ID
   * @param {boolean} isRead Read status
   * @param {string} [feedType='rss'] Feed type
   * @returns {Promise<object>} Updated data
   */
  async toggleItemReadStatus(userId, itemId, isRead, feedType = "rss") {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");
      const updates = {
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      };
      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        feedType,
        updates
      );
    } catch (error) {
      console.error("Error updating read status:", error);
      toast.error("An error occurred while updating read status.");
      throw error;
    }
  }

  /**
   * Toggles item favorite status
   * @param {string} userId User ID
   * @param {string} itemId Item ID
   * @param {boolean} isFavorite Favorite status
   * @param {string} [feedType='rss'] Feed type
   * @returns {Promise<object>} Updated data
   */
  async toggleItemFavoriteStatus(userId, itemId, isFavorite, feedType = "rss") {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");
      const updates = {
        is_favorite: isFavorite,
      };
      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        feedType,
        updates
      );
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("An error occurred while updating favorite status.");
      throw error;
    }
  }

  /**
   * Toggles item read later status
   * @param {string} userId User ID
   * @param {string} itemId Item ID
   * @param {boolean} isReadLater Read later status
   * @param {string} [feedType='rss'] Feed type
   * @returns {Promise<object>} Updated data
   */
  async toggleItemReadLaterStatus(
    userId,
    itemId,
    isReadLater,
    feedType = "rss"
  ) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!itemId) throw new Error("Item ID is required");
      const updates = {
        is_read_later: isReadLater,
      };
      return await this.feedRepository.updateItemInteraction(
        userId,
        itemId,
        feedType,
        updates
      );
    } catch (error) {
      console.error("Error updating read later status:", error);
      toast.error("An error occurred while updating read later status.");
      throw error;
    }
  }

  /**
   * Adds a new feed
   * @param {string} url Feed URL
   * @param {string} type Feed type ('rss', 'atom' or 'youtube')
   * @param {string} userId User ID
   * @param {Object} extraData Extra data
   * @returns {Promise<Object>} Added feed information
   */
  async addFeed(url, type = "rss", userId, extraData = {}) {
    try {
      // URL and user ID checks
      if (!url) {
        throw new Error("Feed URL is required");
      }

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Feed type check
      if (!type || !["rss", "atom", "youtube"].includes(type)) {
        throw new Error("Valid feed type is required (rss, atom, youtube)");
      }

      // URL normalization
      const normalizedUrl = this.normalizeUrl(url);

      // YouTube RSS feed check
      let feedType = type;
      if (normalizedUrl.includes("youtube.com/feeds/videos.xml")) {
        // Special case for YouTube RSS - URL might contain YouTube RSS but type is passed as "rss"
        feedType = "youtube";
      }

      // Get feed metadata
      let feedInfo = {};

      if (feedType === "rss" || feedType === "atom") {
        // Parse RSS feed
        try {
          feedInfo = await this.feedParser.parseRssFeed(normalizedUrl);
        } catch (error) {
          console.error("RSS parsing error:", error);
          throw new Error(`Failed to parse RSS feed: ${error.message}`);
        }
      } else if (feedType === "youtube") {
        // Parse YouTube feed
        try {
          feedInfo = await this.feedParser.parseYoutubeFeed(normalizedUrl);
          // Improve YouTube feed title
          if (!extraData.title && feedInfo.title) {
            feedInfo.title = feedInfo.title.replace("YouTube", "").trim();
          }
        } catch (error) {
          console.error("YouTube parsing error:", error);
          throw new Error(`Failed to parse YouTube feed: ${error.message}`);
        }
      } else {
        throw new Error(`Unsupported feed type: ${feedType}`);
      }

      // Prepare feed data
      const feedData = {
        url: normalizedUrl,
        user_id: userId,
        type: feedType,
        title: extraData.title || feedInfo.title || normalizedUrl,
        description: extraData.description || feedInfo.description || "",
        icon: extraData.icon || feedInfo.icon || null,
        category_id: extraData.category_id || null,
      };

      // Add feed
      const result = await this.feedRepository.addFeed(feedData);

      // If feed is new, fetch content
      if (result && result.feed && result.feed.id) {
        try {
          await this.syncFeedItems(result.feed.id, userId, feedType);
        } catch (syncError) {
          console.error(
            `Error synchronizing feed contents: ${syncError.message}`
          );
          // This error should not affect feed addition
        }
      }

      return result;
    } catch (error) {
      console.error("Error adding feed:", error);
      throw new Error(`Error adding feed: ${error.message}`);
    }
  }

  /**
   * Deletes a feed (soft delete)
   * @param {string} feedId Feed ID to delete
   * @param {string} userId User ID
   * @returns {Promise<boolean>} Operation result
   */
  async deleteFeed(feedId, userId) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!feedId) throw new Error("Feed ID is required");

      // Soft delete the feed
      const result = await this.feedRepository.deleteFeed(feedId, userId);

      // If successful, perform any additional cleanup if needed
      if (result) {
        // Additional operations can be performed here

        // Log successful deletion
        console.log(`Feed ${feedId} soft deleted successfully`);
      }

      return result;
    } catch (error) {
      console.error("Error deleting feed:", error);
      throw error;
    }
  }

  /**
   * Cleans up old items
   * @param {string} userId User ID
   * @param {number} olderThanDays Delete items older than this many days (default: 30 days)
   * @param {boolean} keepFavorites Keep favorites (default: true)
   * @param {boolean} keepReadLater Keep items marked for later reading (default: true)
   * @returns {Promise<{deleted: number, error: any}>} Number of deleted items and error if any
   */
  async cleanUpOldItems(
    userId,
    olderThanDays = 30,
    keepFavorites = true,
    keepReadLater = true
  ) {
    try {
      if (!userId) throw new Error("User ID is required");

      const result = await this.feedRepository.cleanUpOldItems(
        userId,
        olderThanDays,
        keepFavorites,
        keepReadLater
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Error cleaning up old items:", error);
      throw error;
    }
  }

  /**
   * Limits items per feed
   * @param {Array} feeds Feeds
   * @param {Array} items Items
   * @param {number} limit Maximum items per feed
   * @returns {Array} Limited items
   */
  limitItemsPerFeed(feeds, items, limit = 12) {
    if (!feeds || !items) return { feeds: [], items: [] };

    const itemsByFeed = items.reduce((acc, item) => {
      if (!acc[item.feed_id]) {
        acc[item.feed_id] = [];
      }
      acc[item.feed_id].push(item);
      return acc;
    }, {});

    const limitedItems = [];
    Object.entries(itemsByFeed).forEach(([feedId, feedItems]) => {
      limitedItems.push(...feedItems.slice(0, limit));
    });

    return { feeds, items: limitedItems };
  }

  /**
   * Gets paginated feed items
   * @param {string} userId User ID
   * @param {number} page Page number
   * @param {number} pageSize Items per page
   * @param {Object} filters Filter parameters
   * @returns {Promise<Object>} Paginated feed items
   */
  async getPaginatedFeedItems(userId, page = 1, pageSize = 12, filters = {}) {
    try {
      if (!userId) {
        console.warn("getPaginatedFeedItems called without userId");
        return { data: [], total: 0, hasMore: false };
      }

      // Get user's feeds first
      const feeds = await this.getFeeds(userId);
      console.log("User feeds:", feeds?.length || 0);

      if (!feeds || feeds.length === 0) {
        console.log("No feeds found for user");
        return { data: [], total: 0, hasMore: false };
      }

      // Extract feed IDs
      let feedIds = feeds.map((feed) => feed.id);

      // Log filtering operations
      console.log("Starting filtering:", {
        selectedFeedId: filters.selectedFeedId,
        feedType: filters.feedType,
      });

      // Filter by selected feed (highest priority)
      if (filters.selectedFeedId) {
        console.log("Selected feed:", filters.selectedFeedId);
        feedIds = [filters.selectedFeedId];
        // If the selected feed is not found, return empty result
        if (!feeds.some((feed) => feed.id === filters.selectedFeedId)) {
          console.log("Selected feed not found");
          return { data: [], total: 0, hasMore: false };
        }
      }
      // If no feed is selected and feed type is specified, filter by type
      else if (filters.feedType && filters.feedType !== "all") {
        console.log("Feed type filter:", filters.feedType);
        const filteredFeeds = feeds.filter(
          (feed) => feed.type === filters.feedType
        );
        if (filteredFeeds.length === 0) {
          console.log("No feeds found for specified type");
          return { data: [], total: 0, hasMore: false };
        }
        feedIds = filteredFeeds.map((feed) => feed.id);
      }

      // Call repository
      console.log("Parameters sent to repository:", {
        feedIds,
        page,
        pageSize,
        filters,
      });

      const result = await this.feedRepository.getPaginatedFeedItems(
        feedIds,
        page,
        pageSize,
        filters
      );

      // Add user interactions
      if (result.data && result.data.length > 0) {
        const itemIds = result.data.map((item) => item.id);
        const interactions = await this.feedRepository.getUserInteractions(
          userId,
          itemIds
        );

        result.data = result.data.map((item) => {
          const interaction =
            interactions.find((i) => i.item_id === item.id) || {};
          return {
            ...item,
            is_read: interaction.is_read || false,
            is_favorite: interaction.is_favorite || false,
            is_read_later: interaction.is_read_later || false,
          };
        });
      }

      console.log("Result from repository:", {
        itemCount: result.data?.length || 0,
        total: result.total,
        hasMore: result.hasMore,
      });

      return result;
    } catch (error) {
      console.error("Error fetching feed items:", error);
      throw error;
    }
  }

  /**
   * Toggles item read status
   * @param {string} itemId Item ID
   * @param {boolean} isRead Read status
   * @returns {Promise<Object>} Update result
   */
  async toggleRead(itemId, isRead) {
    try {
      const session = await this._getSession();
      if (!session || !session.user) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      if (!itemId) throw new Error("Item ID is required");

      // Determine if it's a YouTube or RSS item
      const itemType = this._determineItemType(itemId);

      return await this.toggleItemReadStatus(userId, itemId, isRead, itemType);
    } catch (error) {
      console.error("Error toggling read status:", error);
      toast.error("An error occurred while updating read status.");
      throw error;
    }
  }

  /**
   * Toggles item favorite status
   * @param {string} itemId Item ID
   * @param {boolean} isFavorite Favorite status
   * @returns {Promise<Object>} Update result
   */
  async toggleFavorite(itemId, isFavorite) {
    try {
      const session = await this._getSession();
      if (!session || !session.user) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      if (!itemId) throw new Error("Item ID is required");

      // Determine if it's a YouTube or RSS item
      const itemType = this._determineItemType(itemId);

      return await this.toggleItemFavoriteStatus(
        userId,
        itemId,
        isFavorite,
        itemType
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      toast.error("An error occurred while updating favorite status.");
      throw error;
    }
  }

  /**
   * Toggles item read later status
   * @param {string} itemId Item ID
   * @param {boolean} isReadLater Read later status
   * @returns {Promise<Object>} Update result
   */
  async toggleReadLater(itemId, isReadLater) {
    try {
      const session = await this._getSession();
      if (!session || !session.user) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      if (!itemId) throw new Error("Item ID is required");

      // Determine if it's a YouTube or RSS item
      const itemType = this._determineItemType(itemId);

      return await this.toggleItemReadLaterStatus(
        userId,
        itemId,
        isReadLater,
        itemType
      );
    } catch (error) {
      console.error("Error toggling read later status:", error);
      toast.error("An error occurred while updating read later status.");
      throw error;
    }
  }

  /**
   * Determines item type based on ID or other properties
   * @param {string} itemId Item ID
   * @returns {string} 'rss' or 'youtube'
   * @private
   */
  _determineItemType(itemId) {
    // This is a simplified implementation
    // In a real application, you might query the database or use a more sophisticated method

    // For now, let's assume we can determine by ID format or prefix
    // This should be replaced with proper logic based on your ID structure
    if (typeof itemId === "string" && itemId.startsWith("yt_")) {
      return "youtube";
    }

    return "rss";
  }

  /**
   * Adds a category
   * @param {string} name Category name
   * @param {string} userId User ID
   * @param {string} color Color code (optional)
   * @param {string} icon Icon (optional)
   * @returns {Promise<object>} Added category
   */
  async addCategory(name, userId, color = null, icon = null) {
    try {
      if (!userId) throw new Error("User ID is required");
      if (!name) throw new Error("Category name is required");

      // Check if category with same name exists
      const { data: existingCategory, error: checkError } = await this.supabase
        .from("categories")
        .select("id")
        .eq("name", name)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingCategory)
        throw new Error("A category with this name already exists");

      // Add new category
      const { data, error } = await this.supabase
        .from("categories")
        .insert({
          name,
          user_id: userId,
          color,
          icon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  /**
   * Gets user categories
   * @param {string} userId User ID
   * @returns {Promise<Array>} Categories
   */
  async getCategories(userId) {
    try {
      if (!userId) {
        console.warn("getCategories called without userId");
        return [];
      }

      const { data, error } = await this.supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  /**
   * Synchronizes feed items
   * @param {string} feedId - Feed ID
   * @param {string} userId - User ID
   * @param {string} feedType - Feed type
   * @param {Object} options - Extra options
   * @param {boolean} options.skipCache - Skip cache (default: false)
   * @returns {Promise<Object>} - Synchronization result
   */
  async syncFeedItems(feedId, userId, feedType, options = {}) {
    const { skipCache = false } = options;

    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Get feed information from repository
      const repositoryResult = await this.feedRepository.syncFeedItems(
        feedId,
        userId,
        { skipCache }
      );

      if (!repositoryResult.success) {
        throw new Error(`Failed to get feed data: ${repositoryResult.error}`);
      }

      // If feed was updated in the last 1 minute, skip the process
      if (
        repositoryResult.message &&
        repositoryResult.message.includes("updated") &&
        !skipCache
      ) {
        return repositoryResult;
      }

      const feedInfo = repositoryResult.feedData;
      const feedUrl = repositoryResult.feedUrl;
      const actualFeedType = repositoryResult.feedType || feedType;

      // Fetch content based on feed type
      let items = [];
      let feedData = null;
      const MAX_ITEMS = 20; // Maximum 20 items in all cases

      if (actualFeedType === "rss" || actualFeedType === "atom") {
        try {
          // Simplified RSS fetching
          feedData = await this.feedParser.parseRssFeed(feedUrl, { skipCache });
          items = feedData.items || [];

          // Always limit to maximum 20 items
          if (items.length > MAX_ITEMS) {
            items = items.slice(0, MAX_ITEMS);
          }
        } catch (error) {
          console.error("RSS parsing error:", error);
          throw new Error(`RSS parsing error: ${error.message}`);
        }
      } else if (actualFeedType === "youtube") {
        try {
          // Simplified YouTube content fetching
          feedData = await this.feedParser.parseYoutubeFeed(feedUrl, {
            skipCache,
            maxItems: MAX_ITEMS, // Limit to maximum 20 items
          });
          items = feedData.items || [];

          // Extra check - if more than 20 items still come, limit
          if (items.length > MAX_ITEMS) {
            items = items.slice(0, MAX_ITEMS);
          }
        } catch (error) {
          console.error("YouTube parsing error:", error);
          throw new Error(`YouTube parsing error: ${error.message}`);
        }
      } else {
        console.error("Unsupported feed type:", actualFeedType);
        throw new Error(`Unsupported feed type: ${actualFeedType}`);
      }

      if (items.length === 0) {
        // Update feed (last updated time)
        await this.feedRepository.updateFeedLastUpdated(feedId);

        return {
          success: true,
          message: "No new content to update",
          feedId,
          updatedItems: 0,
        };
      }

      // Add items to database - based on feed type
      let insertedItems = 0;
      if (actualFeedType === "rss" || actualFeedType === "atom") {
        try {
          insertedItems = await this.insertRssItems(feedId, items);
        } catch (error) {
          console.error("Error adding RSS items:", error);
          throw new Error(`Error adding RSS items: ${error.message}`);
        }
      } else if (actualFeedType === "youtube") {
        try {
          insertedItems = await this.insertYoutubeItems(feedId, items);
        } catch (error) {
          console.error("Error adding YouTube items:", error);
          throw new Error(`Error adding YouTube items: ${error.message}`);
        }
      }

      // Update feed last updated time
      await this.feedRepository.updateFeedLastUpdated(feedId);

      return {
        success: true,
        message: "Feed content successfully synchronized",
        feedId,
        updatedItems: insertedItems,
      };
    } catch (error) {
      console.error("Error syncing feed items:", error);
      throw error;
    }
  }

  /**
   * Refreshes feed items
   * @param {string} feedId Feed ID
   * @param {boolean} skipCache Skip cache
   * @returns {Promise<Object>} Refresh result
   */
  async refreshFeed(feedId, skipCache = false) {
    try {
      if (!feedId) {
        throw new Error("Feed ID is required");
      }

      // Get feed type
      const feedType = await this.feedRepository.getFeedType(feedId);
      if (!feedType || !feedType.type) {
        throw new Error(`Feed type not found: ${feedId}`);
      }

      // Session check
      const { session } = await this._getSession();
      if (!session || !session.user) {
        throw new Error("Session not found");
      }

      const userId = session.user.id;

      console.log(
        `Feed refreshing: feedId=${feedId}, type=${feedType.type}, userId=${userId}, skipCache=${skipCache}`
      );

      // Refresh feed items
      return await this.syncFeedItems(feedId, userId, feedType.type, {
        skipCache,
      });
    } catch (error) {
      console.error(`refreshFeed error for feedId=${feedId}:`, error);
      throw new Error(`Error refreshing feed: ${error.message}`);
    }
  }

  /**
   * Adds RSS items
   * @param {string} feedId - Feed ID
   * @param {Array} items - RSS Items
   * @returns {Promise<number>} - Number of added items
   */
  async insertRssItems(feedId, items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }

    try {
      // Limit maximum items to 100
      let itemsToInsert = items;
      if (items.length > 100) {
        itemsToInsert = items.slice(0, 100);
      }

      let insertedCount = 0;
      // Add each item individually
      for (const item of itemsToInsert) {
        try {
          const rssItemData = {
            feed_id: feedId,
            title: item.title || "Untitled",
            description: item.description || null,
            content: item.content || null,
            link: item.link || null,
            pub_date: item.pubDate || new Date().toISOString(),
            guid:
              item.guid ||
              item.link ||
              `${feedId}-${Date.now()}-${Math.random()}`,
            thumbnail: item.thumbnail || null,
            author: item.author || null,
          };

          // Use repository's addRssItem function
          const result = await this.feedRepository.addRssItem(rssItemData);

          // Increment count if successful
          if (result && !result.error) {
            insertedCount++;
          }
        } catch (itemError) {
          console.error(`Error adding RSS item:`, itemError);
          // Do not let one item error affect others, continue
        }
      }

      return insertedCount;
    } catch (error) {
      console.error("Error adding RSS items:", error);
      throw error;
    }
  }

  /**
   * Adds YouTube items
   * @param {string} feedId - Feed ID
   * @param {Array} items - YouTube Items
   * @returns {Promise<number>} - Number of added items
   */
  async insertYoutubeItems(feedId, items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return 0;
    }

    try {
      // Always process up to 20 items
      const MAX_ITEMS = 20;
      let itemsToInsert = items.slice(0, MAX_ITEMS);

      let insertedCount = 0;

      // Add each item individually
      for (const item of itemsToInsert) {
        try {
          if (!item.videoId) {
            console.warn("Skipping YouTube item without video ID:", item.title);
            continue;
          }

          // Simplified YouTube item data
          const youtubeItemData = {
            feed_id: feedId,
            video_id: item.videoId,
            title: item.title || "Untitled Video",
            description: item.description
              ? item.description.substring(0, 500)
              : null, // Limit description
            thumbnail: item.thumbnail || null,
            published_at: item.pubDate || new Date().toISOString(),
            channel_title: item.channelTitle || null,
            url: `https://youtube.com/watch?v=${item.videoId}`,
            is_short: item.isShort || false, // Is it a short video?
            content_type: item.type || "video", // Content type (shorts/video)
            duration: item.duration || null, // Video duration (if available)
          };

          // Add to database
          const result = await this.feedRepository.addYoutubeItem(
            youtubeItemData
          );

          // Increment count if successful
          if (result) {
            insertedCount++;
          }
        } catch (itemError) {
          // Even if an error occurs, continue adding other items
          console.error(`Error adding YouTube item:`, itemError);
        }
      }

      return insertedCount;
    } catch (error) {
      console.error("Error adding YouTube items:", error);
      throw error;
    }
  }
}

// Create an instance of the class and export it
export const feedService = new FeedService();
