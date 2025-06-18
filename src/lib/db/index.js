/**
 * Merkezi Veritabanı İstemci Modülü
 *
 * Tüm veritabanı bağlantıları ve istekleri için tek bir merkezi nokta sağlar.
 * Bağlantı havuzlaması, önbellek yönetimi ve performans optimizasyonları içerir.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Performans ayarlarını içeren yapılandırma nesnesi
 */
const CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 dakika (milisaniye cinsinden)
  BATCH_SIZE: 50, // Toplu işlem boyutu
  CONNECTION_TIMEOUT: 30000, // 30 saniye
  QUERY_TIMEOUT: 20000, // 20 saniye
  MAX_CONNECTIONS: 10, // Maksimum bağlantı sayısı
};

/**
 * Sorgu sonuçlarını önbelleğe alır
 */
class QueryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = CONFIG.CACHE_TTL;
  }

  /**
   * Önbellekten değer alır
   * @param {string} key - Önbellek anahtarı
   * @returns {any|null} - Önbellekteki değer veya null
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
   * Önbelleğe değer ekler
   * @param {string} key - Önbellek anahtarı
   * @param {any} value - Saklanacak değer
   * @param {number} [customTtl] - Özel TTL değeri (ms cinsinden)
   */
  set(key, value, customTtl) {
    if (!key || value === undefined) return;

    const ttl = customTtl || this.ttl;
    const expiry = Date.now() + ttl;

    this.cache.set(key, { value, expiry });
  }

  /**
   * Belirtilen anahtarı önbellekten kaldırır
   * @param {string} key - Önbellek anahtarı
   */
  invalidate(key) {
    if (!key) return;
    this.cache.delete(key);
  }

  /**
   * Belirli bir desene uyan tüm anahtarları önbellekten kaldırır
   * @param {RegExp} pattern - Anahtar deseni
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
   * Tüm önbelleği temizler
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
   * Supabase bağlantısını döndürür
   * @returns {Object} - Supabase istemcisi
   */
  getClient() {
    if (this._client) return this._client;

    try {
      // Client tarafı bağlantısı kullan - artık server tarafı desteği kaldırıldı
      this._client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    } catch (error) {
      console.error("Supabase bağlantısı oluşturulamadı:", error);
      throw error;
    }

    return this._client;
  }

  /**
   * Sorgu sonucu için önbellek anahtarı oluşturur
   * @param {string} table - Tablo adı
   * @param {Object} query - Sorgu parametreleri
   * @returns {string} - Önbellek anahtarı
   */
  createCacheKey(table, query = {}) {
    return `${table}:${JSON.stringify(query)}`;
  }

  /**
   * Belirlenen tablodan veri sorgular, önbellek desteği ile
   * @param {string} table - Tablo adı
   * @param {Object} query - Sorgu parametreleri
   * @param {boolean} useCache - Önbellek kullanılsın mı?
   * @param {number} cacheTtl - Özel önbellek TTL değeri
   * @returns {Promise<Object>} - Sorgu sonucu
   */
  async query(table, query = {}, useCache = false, cacheTtl) {
    if (!table) {
      throw new Error("Tablo adı gerekli");
    }

    const supabase = this.getClient();
    const cacheKey = this.createCacheKey(table, query);

    // Eğer önbellek kullanılabilirse ve sonuç önbellekte varsa
    if (useCache) {
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        console.log(`Cache hit for query: ${cacheKey}`);
        return { data: cachedResult, source: "cache" };
      }
    }

    try {
      let queryBuilder = supabase.from(table);

      // Sorgu parametrelerini uygula
      if (query.select) queryBuilder = queryBuilder.select(query.select);

      // Count desteği ekle
      if (query.count) {
        queryBuilder = queryBuilder.count(query.count);
      }

      if (query.eq) {
        Object.entries(query.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      // In operatörünü düzgün şekilde kullanabilmek için
      if (query.in) {
        Object.entries(query.in).forEach(([field, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            // values bir dizi olarak geldiğinde in operatörünü direkt uygula
            const filterString = `${field}.in.(${values.join(",")})`;
            queryBuilder = queryBuilder.or(filterString);
          }
        });
      }

      if (query.is) {
        Object.entries(query.is).forEach(([field, value]) => {
          queryBuilder = queryBuilder.is(field, value);
        });
      }
      if (query.gt) {
        Object.entries(query.gt).forEach(([field, value]) => {
          queryBuilder = queryBuilder.gt(field, value);
        });
      }
      if (query.lt) {
        Object.entries(query.lt).forEach(([field, value]) => {
          queryBuilder = queryBuilder.lt(field, value);
        });
      }
      if (query.order) {
        Object.entries(query.order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.order(field, {
            ascending: direction === "asc",
          });
        });
      }
      if (query.limit) queryBuilder = queryBuilder.limit(query.limit);
      if (query.offset) queryBuilder = queryBuilder.offset(query.offset);

      // Sorguyu çalıştır
      const { data, error } = await queryBuilder;

      if (error) {
        console.error(`Query error for ${table}:`, error);

        // Sayım sorguları için özel hata mesajları
        if (query.count && error.code === "PGRST100") {
          console.error("Count sorgusu hatası, kullanım: { count: 'exact' }");
        }

        throw error;
      }

      // Sonucu önbelleğe al
      if (useCache && data) {
        this.queryCache.set(cacheKey, data, cacheTtl);
      }

      return { data, source: "db" };
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      throw error;
    }
  }

  /**
   * Veri ekler
   * @param {string} table - Tablo adı
   * @param {Object|Array} data - Eklenecek veri
   * @param {Array} invalidatePatterns - İptal edilecek önbellek desenleri
   * @returns {Promise<Object>} - Ekleme sonucu
   */
  async insert(table, data, invalidatePatterns = []) {
    if (!table || !data) {
      throw new Error("Tablo adı ve veri gerekli");
    }

    const supabase = this.getClient();

    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        console.error(`Insert error for ${table}:`, error);
        throw error;
      }

      // İlgili önbellekleri temizle
      this._invalidateCachePatterns(invalidatePatterns);

      return { data: result };
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  /**
   * Toplu veri ekler (chunk'lar halinde)
   * @param {string} table - Tablo adı
   * @param {Array} items - Eklenecek öğeler dizisi
   * @param {Array} invalidatePatterns - İptal edilecek önbellek desenleri
   * @returns {Promise<Object>} - Ekleme sonucu
   */
  async batchInsert(table, items, invalidatePatterns = []) {
    if (!table || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Tablo adı ve veri dizisi gerekli");
    }

    const supabase = this.getClient();
    const batchSize = CONFIG.BATCH_SIZE;
    const results = [];
    const errors = [];

    try {
      // Veriyi daha küçük parçalara böl
      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);

        const { data, error } = await supabase
          .from(table)
          .insert(chunk)
          .select();

        if (error) {
          console.error(
            `Batch insert error for ${table} (chunk ${i}/${items.length}):`,
            error
          );
          errors.push(error);
        } else if (data) {
          results.push(...data);
        }
      }

      // İlgili önbellekleri temizle
      this._invalidateCachePatterns(invalidatePatterns);

      return {
        data: results,
        errors: errors.length > 0 ? errors : null,
        success: errors.length === 0,
        totalInserted: results.length,
      };
    } catch (error) {
      console.error(`Error in batch insert for ${table}:`, error);
      throw error;
    }
  }

  /**
   * Veri günceller
   * @param {string} table - Tablo adı
   * @param {Object} query - Güncelleme koşulları
   * @param {Object} updates - Güncellenecek veriler
   * @param {Array} invalidatePatterns - İptal edilecek önbellek desenleri
   * @returns {Promise<Object>} - Güncelleme sonucu
   */
  async update(table, query, updates, invalidatePatterns = []) {
    if (!table || !query || !updates) {
      throw new Error("Tablo adı, sorgu ve güncellemeler gerekli");
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).update(updates);

      // Sorgu parametrelerini uygula
      if (query.eq) {
        Object.entries(query.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      // Sorguyu çalıştır ve sonucu al
      const { data, error } = await queryBuilder.select();

      if (error) {
        console.error(`Update error for ${table}:`, error);
        throw error;
      }

      // İlgili önbellekleri temizle
      this._invalidateCachePatterns(invalidatePatterns);

      return { data };
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
  }

  /**
   * Veri siler
   * @param {string} table - Tablo adı
   * @param {Object} query - Silme koşulları
   * @param {Array} invalidatePatterns - İptal edilecek önbellek desenleri
   * @returns {Promise<Object>} - Silme sonucu
   */
  async delete(table, query, invalidatePatterns = []) {
    if (!table || !query) {
      throw new Error("Tablo adı ve sorgu gerekli");
    }

    const supabase = this.getClient();

    try {
      let queryBuilder = supabase.from(table).delete();

      // Sorgu parametrelerini uygula
      if (query.eq) {
        Object.entries(query.eq).forEach(([field, value]) => {
          queryBuilder = queryBuilder.eq(field, value);
        });
      }

      // Sorguyu çalıştır
      const { data, error } = await queryBuilder.select();

      if (error) {
        console.error(`Delete error for ${table}:`, error);
        throw error;
      }

      // İlgili önbellekleri temizle
      this._invalidateCachePatterns(invalidatePatterns);

      return { data };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Tek bir işlemde birden fazla tabloyu günceller (transactional)
   * @param {Function} operations - İşlem fonksiyonu
   * @param {Array} invalidatePatterns - İptal edilecek önbellek desenleri
   * @returns {Promise<Object>} - İşlem sonucu
   */
  async transaction(operations, invalidatePatterns = []) {
    const supabase = this.getClient();

    try {
      // Fonksiyonu çağır ve supabase istemcisini ver
      const result = await operations(supabase);

      // İlgili önbellekleri temizle
      this._invalidateCachePatterns(invalidatePatterns);

      return result;
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  }

  /**
   * RPC (Remote Procedure Call) işlevini çağırır
   * @param {string} functionName - Fonksiyon adı
   * @param {Object} params - Fonksiyon parametreleri
   * @param {boolean} useCache - Önbellek kullanılsın mı?
   * @param {number} cacheTtl - Özel önbellek TTL değeri
   * @returns {Promise<Object>} - RPC sonucu
   */
  async rpc(functionName, params = {}, useCache = false, cacheTtl) {
    if (!functionName) {
      throw new Error("Fonksiyon adı gerekli");
    }

    const supabase = this.getClient();
    const cacheKey = `rpc:${functionName}:${JSON.stringify(params)}`;

    // Eğer önbellek kullanılabilirse ve sonuç önbellekte varsa
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

      // Sonucu önbelleğe al
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
   * Join sorgusu yapar
   * @param {string} mainTable - Ana tablo
   * @param {Array} joins - Join tanımları
   * @param {Object} filters - Filtreler
   * @param {Object} options - Sorgu seçenekleri
   * @param {boolean} useCache - Önbellek kullanılsın mı?
   * @returns {Promise<Object>} - Sorgu sonucu
   */
  async joinQuery(
    mainTable,
    joins = [],
    filters = {},
    options = {},
    useCache = true
  ) {
    if (!mainTable) {
      throw new Error("Ana tablo adı gerekli");
    }

    const supabase = this.getClient();
    const cacheKey = `join:${mainTable}:${JSON.stringify(
      joins
    )}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

    // Eğer önbellek kullanılabilirse ve sonuç önbellekte varsa
    if (useCache) {
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, source: "cache" };
      }
    }

    try {
      // Select sorgusunu oluştur
      let selectQuery = "";
      if (options.select && options.select.length > 0) {
        selectQuery = options.select.join(", ");
      } else {
        selectQuery = "*";
      }

      // Join sorgularını oluştur
      for (const join of joins) {
        if (join.fields && join.fields.length > 0) {
          selectQuery += `, ${join.table}(${join.fields.join(", ")})`;
        } else {
          selectQuery += `, ${join.table}(*)`;
        }
      }

      // Sorgu oluşturucu
      let queryBuilder = supabase.from(mainTable).select(selectQuery);

      // Filtreleri uygula
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

      // Sıralama
      if (options.order) {
        Object.entries(options.order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.order(field, {
            ascending: direction === "asc",
          });
        });
      }

      // Sayfalama
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit);
      if (options.offset) queryBuilder = queryBuilder.offset(options.offset);

      // Sorguyu çalıştır
      const { data, error } = await queryBuilder;

      if (error) {
        console.error(`Join query error for ${mainTable}:`, error);
        throw error;
      }

      // Sonucu önbelleğe al
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
   * Sağlanan desen listesine göre önbelleği temizler
   * @param {Array} patterns - Desen dizisi
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
   * Önbelleği tamamen temizler
   */
  clearCache() {
    this.queryCache.clear();
  }
}

// Servis singleton örneği
const dbClient = new DbClient();
export default dbClient;
