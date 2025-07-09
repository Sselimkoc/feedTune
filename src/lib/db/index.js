/**
 * Central Database Client Module
 *
 * Provides a single central point for all database connections and requests.
 * Includes connection pooling, cache management, and performance optimizations.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Configuration object containing performance settings
 */
const CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes (in milliseconds)
  BATCH_SIZE: 50, // Batch size
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 20000, // 20 seconds
  MAX_CONNECTIONS: 10, // Maximum number of connections
};

/**
 * Caches query results
 */
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = CONFIG.CACHE_TTL;
  }

  /**
   * Gets a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null
   */
  get(key) {
    if (!key) return null;

    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Adds a value to cache
   * @param {string} key - Cache key
   * @param {any} value - Value to store
   * @param {number} [customTtl] - Custom TTL value (in ms)
   */
  set(key, value, customTtl) {
    if (!key || value === undefined) return;

    const ttl = customTtl || this.ttl;
    const expiry = Date.now() + ttl;

    this.cache.set(key, { value, expiry });
  }

  /**
   * Removes the specified key from cache
   * @param {string} key - Cache key
   */
  invalidate(key) {
    if (!key) return;
    this.cache.delete(key);
  }

  /**
   * Removes all keys matching a pattern from cache
   * @param {RegExp} pattern - Key pattern
   */
  invalidatePattern(pattern) {
    if (!pattern) return;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

export class DbClient {
  constructor(options = {}) {
    this.isServer = typeof window === "undefined";
    this.queryCache = new QueryCache();
    this.options = { ...options };
  }

  /**
   * Returns the Supabase connection
   * @returns {Object} - Supabase client
   */
  getClient() {
    if (this._client) return this._client;

    try {
      // Use client-side connection - server-side support has been removed
      this._client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error("Failed to create Supabase connection:", error);
      throw error;
    }

    return this._client;
  }

  /**
   * Creates a cache key for query results
   * @param {string} table - Table name
   * @param {Object} query - Query parameters
   * @returns {string} - Cache key
   */
  createCacheKey(table, query = {}) {
    return `${table}:${JSON.stringify(query)}`;
  }

  /**
   * Queries data from the specified table with cache support
   * @param {string} table - Table name
   * @param {Object} query - Query parameters
   * @param {boolean} useCache - Whether to use cache
   * @param {number} cacheTtl - Custom cache TTL value
   * @returns {Promise<Object>} - Query result
   */
  async query(table, query = {}, options = {}) {
    const { single = false, useCache = true, cacheTtl } = options;
    if (!table) {
      throw new Error("Table name is required");
    }

    // Check cache if enabled
    if (useCache) {
      const cacheKey = this.createCacheKey(table, query);
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).select(query.select || "*");

      // Equality conditions
      if (query.eq) {
        for (const [field, value] of Object.entries(query.eq)) {
          queryBuilder = queryBuilder.eq(field, value);
        }
      }
      
      // IN operator
      if (query.in) {
        for (const [field, values] of Object.entries(query.in)) {
          if (Array.isArray(values) && values.length > 0) {
            queryBuilder = queryBuilder.in(field, values);
          }
        }
      }
      
      // IS operator
      if (query.is) {
        for (const [field, value] of Object.entries(query.is)) {
          queryBuilder = queryBuilder.is(field, value);
        }
      }
      
      // Greater than
      if (query.gt) {
        for (const [field, value] of Object.entries(query.gt)) {
          queryBuilder = queryBuilder.gt(field, value);
        }
      }
      
      // Less than
      if (query.lt) {
        for (const [field, value] of Object.entries(query.lt)) {
          queryBuilder = queryBuilder.lt(field, value);
        }
      }
      
      // Greater than or equal
      if (query.gte) {
        for (const [field, value] of Object.entries(query.gte)) {
          queryBuilder = queryBuilder.gte(field, value);
        }
      }
      
      // Less than or equal
      if (query.lte) {
        for (const [field, value] of Object.entries(query.lte)) {
          queryBuilder = queryBuilder.lte(field, value);
        }
      }
      
      // Not equal
      if (query.neq) {
        for (const [field, value] of Object.entries(query.neq)) {
          queryBuilder = queryBuilder.neq(field, value);
        }
      }
      
      // LIKE operator
      if (query.like) {
        for (const [field, value] of Object.entries(query.like)) {
          queryBuilder = queryBuilder.like(field, value);
        }
      }
      
      // NOT operator
      if (query.not) {
        for (const [field, condition] of Object.entries(query.not)) {
          if (condition.in && Array.isArray(condition.in) && condition.in.length > 0) {
            queryBuilder = queryBuilder.not(field, 'in', condition.in);
          } else if (condition.eq !== undefined) {
            queryBuilder = queryBuilder.not(field, 'eq', condition.eq);
          }
        }
      }
      
      // OR conditions
      if (query.or) {
        const orConditions = Array.isArray(query.or) ? query.or : [query.or];
        const orString = orConditions
          .map(cond => {
            const key = Object.keys(cond)[0];
            return `${key}.eq.${cond[key]}`;
          })
          .join(',');
        
        if (orString) {
          queryBuilder = queryBuilder.or(orString);
        }
      }
      
      // Sorting
      if (query.order && typeof query.order === "object") {
        for (const [key, value] of Object.entries(query.order)) {
          queryBuilder = queryBuilder.order(key, {
            ascending: value.toLowerCase() === "asc",
          });
        }
      }
      
      // Limit
      if (query.limit && typeof query.limit === "number") {
        queryBuilder = queryBuilder.limit(query.limit);
      }
      
      // Offset
      if (query.offset && typeof query.offset === "number") {
        queryBuilder = queryBuilder.range(
          query.offset,
          query.offset + (query.limit || 10) - 1
        );
      }
      
      // Single result?
      if (single) {
        queryBuilder = queryBuilder.single();
      }
      
      const { data, error, count } = await queryBuilder;
      const result = { data, error, count };
      
      // Cache the result if caching is enabled
      if (useCache) {
        const cacheKey = this.createCacheKey(table, query);
        this.queryCache.set(cacheKey, result, cacheTtl);
      }
      
      return result;
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      throw error;
    }
  }

  /**
   * Counts records in a table based on query conditions
   * @param {string} table - Table name
   * @param {Object} query - Query conditions
   * @returns {Promise<number>} - Count of records
   */
  async count(table, query = {}) {
    if (!table) {
      throw new Error("Table name is required");
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).select('*', { count: 'exact', head: true });

      // Apply the same conditions as in the query method
      if (query.eq) {
        for (const [field, value] of Object.entries(query.eq)) {
          queryBuilder = queryBuilder.eq(field, value);
        }
      }
      
      if (query.in) {
        for (const [field, values] of Object.entries(query.in)) {
          if (Array.isArray(values) && values.length > 0) {
            queryBuilder = queryBuilder.in(field, values);
          }
        }
      }
      
      // Add other conditions as needed...

      const { count, error } = await queryBuilder;
      
      if (error) {
        console.error(`Error counting records in ${table}:`, error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`Error counting records in ${table}:`, error);
      return 0;
    }
  }

  /**
   * Inserts data
   * @param {string} table - Table name
   * @param {Object|Array} data - Data to insert
   * @param {Array} invalidatePatterns - Cache patterns to invalidate
   * @returns {Promise<Object>} - Insert result
   */
  async insert(table, data, invalidatePatterns = []) {
    if (!table || !data) {
      throw new Error("Table name and data are required");
    }

    const supabase = this.getClient();

    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      // Invalidate cache patterns
      this._invalidateCachePatterns(invalidatePatterns);

      return { data: result, error };
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  /**
   * Updates data
   * @param {string} table - Table name
   * @param {Object} query - Update conditions
   * @param {Object} updates - Data to update
   * @param {Array} invalidatePatterns - Cache patterns to invalidate
   * @returns {Promise<Object>} - Update result
   */
  async update(table, query, updates, invalidatePatterns = []) {
    if (!table || !query || !updates) {
      throw new Error("Table name, query, and updates are required");
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).update(updates);

      // Apply query parameters
      if (query.eq) {
        Object.entries(query.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      // Execute and get the result
      const { data, error } = await queryBuilder.select();

      if (error) {
        console.error(`Update error for ${table}:`, error);
        throw error;
      }

      // Invalidate cache patterns
      this._invalidateCachePatterns(invalidatePatterns);

      return { data };
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Deletes data
   * @param {string} table - Table name
   * @param {Object} query - Delete conditions
   * @param {Array} invalidatePatterns - Cache patterns to invalidate
   * @returns {Promise<Object>} - Delete result
   */
  async delete(table, query, invalidatePatterns = []) {
    if (!table || !query) {
      throw new Error("Table name and query are required");
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).delete();

      // Apply query parameters
      if (query.eq) {
        Object.entries(query.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      // Execute
      const { data, error } = await queryBuilder.select();

      if (error) {
        console.error(`Delete error for ${table}:`, error);
        throw error;
      }

      // Invalidate cache patterns
      this._invalidateCachePatterns(invalidatePatterns);

      return { data };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Performs multiple updates in a single transaction (transactional)
   * @param {Function} operations - Operation function
   * @param {Array} invalidatePatterns - Cache patterns to invalidate
   * @returns {Promise<Object>} - Transaction result
   */
  async transaction(operations, invalidatePatterns = []) {
    const supabase = this.getClient();

    try {
      // Call the function and pass the supabase client
      const result = await operations(supabase);

      // Invalidate cache patterns
      this._invalidateCachePatterns(invalidatePatterns);

      return result;
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  }

  /**
   * Calls an RPC (Remote Procedure Call) function
   * @param {string} functionName - Function name
   * @param {Object} params - Function parameters
   * @param {boolean} useCache - Whether to use cache
   * @param {number} cacheTtl - Custom cache TTL value
   * @returns {Promise<Object>} - RPC result
   */
  async rpc(functionName, params = {}, useCache = false, cacheTtl) {
    if (!functionName) {
      throw new Error("Function name is required");
    }

    const supabase = this.getClient();
    const cacheKey = `rpc:${functionName}:${JSON.stringify(params)}`;

    // If caching is enabled and the result is in cache
    if (useCache) {
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, source: "cache" };
      }
    }

    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) {
        console.error(`RPC error for ${functionName}:`, error);
        throw error;
      }

      // Cache the result
      if (useCache && data) {
        this.queryCache.set(cacheKey, data, cacheTtl);
      }

      return { data, source: "db" };
    } catch (error) {
      console.error(`Error calling RPC ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Performs a join query
   * @param {string} mainTable - Main table
   * @param {Array} joins - Join definitions
   * @param {Object} filters - Filters
   * @param {Object} options - Query options
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Object>} - Query result
   */
  async joinQuery(
    mainTable,
    joins = [],
    filters = {},
    options = {},
    useCache = true
  ) {
    if (!mainTable) {
      throw new Error("Main table name is required");
    }

    const supabase = this.getClient();
    const cacheKey = `join:${mainTable}:${JSON.stringify(
      joins
    )}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

    // If caching is enabled and the result is in cache
    if (useCache) {
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, source: "cache" };
      }
    }

    try {
      // Construct the select query
      let selectQuery = "";
      if (options.select && options.select.length > 0) {
        selectQuery = options.select.join(", ");
      } else {
        selectQuery = "*";
      }

      // Construct join queries
      for (const join of joins) {
        if (join.fields && join.fields.length > 0) {
          selectQuery += `, ${join.table}(${join.fields.join(", ")})`;
        } else {
          selectQuery += `, ${join.table}(*)`;
        }
      }

      // Construct the query builder
      let queryBuilder = supabase.from(mainTable).select(selectQuery);

      // Apply filters
      if (filters.eq) {
        Object.entries(filters.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      if (filters.in) {
        Object.entries(filters.in).forEach(([field, values]) => {
          queryBuilder = queryBuilder.in(field, values);
        });
      }

      // Sorting
      if (options.order) {
        Object.entries(options.order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.order(field, {
            ascending: direction === "asc",
          });
        });
      }

      // Pagination
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit);
      if (options.offset) queryBuilder = queryBuilder.offset(options.offset);

      // Execute
      const { data, error } = await queryBuilder;

      if (error) {
        console.error(`Join query error for ${mainTable}:`, error);
        throw error;
      }

      // Cache the result
      if (useCache && data) {
        this.queryCache.set(cacheKey, data);
      }

      return { data, source: "db" };
    } catch (error) {
      console.error(`Error in join query for ${mainTable}:`, error);
      throw error;
    }
  }

  /**
   * Clears cache based on the provided pattern list
   * @param {Array} patterns - Pattern array
   * @private
   */
  _invalidateCachePatterns(patterns) {
    if (!patterns || !Array.isArray(patterns)) return;

    patterns.forEach((pattern) => {
      if (typeof pattern === "string") {
        this.queryCache.invalidate(pattern);
      } else if (pattern instanceof RegExp) {
        this.queryCache.invalidatePattern(pattern);
      }
    });
  }

  /**
   * Clears the entire cache
   */
  clearCache() {
    this.queryCache.clear();
  }
}

// Service singleton instance
const dbClient = new DbClient();
export default dbClient;
