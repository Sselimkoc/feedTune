/**
 * Shared cache utility functions for the application
 * This centralizes all cache-related functionality to avoid duplication
 */

/**
 * Safely access localStorage with fallback
 * @returns {Storage|null} localStorage object or null if not available
 */
export const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    try {
      return window.localStorage;
    } catch (e) {
      console.warn("localStorage may not be accessible:", e);
    }
  }
  return null;
};

/**
 * Get data from local cache
 * @param {string} key - Cache key
 * @param {number} [ttl] - Optional TTL override in milliseconds
 * @returns {any|null} Cached value or null if not found/expired
 */
export const getFromCache = (key, ttl) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return null;

    const item = storage.getItem(key);
    if (!item) return null;

    const { value, timestamp, cacheTtl } = JSON.parse(item);
    const effectiveTtl = ttl || cacheTtl;

    if (Date.now() - timestamp > effectiveTtl) {
      storage.removeItem(key);
      return null;
    }

    return value;
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
};

/**
 * Save data to local cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} [ttl=3600000] - Cache TTL in milliseconds (default: 1 hour)
 */
export const saveToCache = (key, value, ttl = 1000 * 60 * 60) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return;

    const item = {
      value,
      timestamp: Date.now(),
      cacheTtl: ttl,
    };

    storage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn("Cache write error:", error);
  }
};

/**
 * Remove item from cache
 * @param {string} key - Cache key
 */
export const removeFromCache = (key) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return;

    storage.removeItem(key);
  } catch (error) {
    console.warn("Cache remove error:", error);
  }
};

/**
 * Clear all items with a specific prefix from cache
 * @param {string} prefix - Key prefix to match
 */
export const clearCacheByPrefix = (prefix) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return;

    const keysToRemove = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));

    console.log(
      `Cleared ${keysToRemove.length} items from cache with prefix: ${prefix}`
    );
  } catch (error) {
    console.warn("Cache clear error:", error);
  }
};

/**
 * Check if a cache key exists
 * @param {string} key - Cache key
 * @returns {boolean} True if key exists and is not expired
 */
export const cacheExists = (key) => {
  return getFromCache(key) !== null;
};
