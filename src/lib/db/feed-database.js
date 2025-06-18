import { createBrowserClient } from "@supabase/ssr";

/**
 * Feed veritabanı erişimi için yardımcı sınıf
 * Bu sınıf, Supabase veri erişimlerini basitleştirir ve veritabanı işlemlerini soyutlar
 */
export default class FeedDatabase {
  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Bir tabloya sorgu yapar
   * @param {string} table - Tablo adı
   * @param {Object} params - Sorgu parametreleri
   * @param {boolean} single - Tek sonuç mu dönecek?
   * @returns {Promise<Object>} - Sorgu sonucu
   */
  async query(table, params = {}, single = false) {
    try {
      const {
        select,
        eq,
        neq,
        gt,
        lt,
        gte,
        lte,
        is,
        like,
        order,
        limit,
        offset,
      } = params;

      let query = this.supabase.from(table).select(select || "*");

      // Eşitlik şartları
      if (eq && typeof eq === "object") {
        Object.entries(eq).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Eşit değil şartları
      if (neq && typeof neq === "object") {
        Object.entries(neq).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.neq(key, value);
          }
        });
      }

      // Büyüktür şartları
      if (gt && typeof gt === "object") {
        Object.entries(gt).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.gt(key, value);
          }
        });
      }

      // Küçüktür şartları
      if (lt && typeof lt === "object") {
        Object.entries(lt).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.lt(key, value);
          }
        });
      }

      // Büyük eşit şartları
      if (gte && typeof gte === "object") {
        Object.entries(gte).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.gte(key, value);
          }
        });
      }

      // Küçük eşit şartları
      if (lte && typeof lte === "object") {
        Object.entries(lte).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.lte(key, value);
          }
        });
      }

      // IS operatörü (null kontrolleri için)
      if (is && typeof is === "object") {
        Object.entries(is).forEach(([key, value]) => {
          query = query.is(key, value);
        });
      }

      // LIKE operatörü
      if (like && typeof like === "object") {
        Object.entries(like).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.like(key, value);
          }
        });
      }

      // Sıralama
      if (order && typeof order === "object") {
        Object.entries(order).forEach(([key, value]) => {
          query = query.order(key, {
            ascending: value.toLowerCase() === "asc",
          });
        });
      }

      // Limit
      if (limit && typeof limit === "number") {
        query = query.limit(limit);
      }

      // Offset
      if (offset && typeof offset === "number") {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      // Tek sonuç mu dönecek?
      if (single) {
        query = query.maybeSingle();
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      console.error(`[FeedDatabase] ${table} tablosuna sorgu hatası:`, error);
      return { data: null, error };
    }
  }

  /**
   * Tabloya yeni kayıt ekler
   * @param {string} table - Tablo adı
   * @param {Object|Array} data - Eklenecek veri
   * @returns {Promise<Object>} - Ekleme sonucu
   */
  async insert(table, data) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select();

      return { data: result, error };
    } catch (error) {
      console.error(`[FeedDatabase] ${table} tablosuna ekleme hatası:`, error);
      return { data: null, error };
    }
  }

  /**
   * Tablodaki kaydı günceller
   * @param {string} table - Tablo adı
   * @param {Object} filter - Filtreleme parametreleri
   * @param {Object} data - Güncellenecek veri
   * @returns {Promise<Object>} - Güncelleme sonucu
   */
  async update(table, filter, data) {
    try {
      let query = this.supabase.from(table).update(data);

      // Eşitlik şartları
      if (filter.eq && typeof filter.eq === "object") {
        Object.entries(filter.eq).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data: result, error } = await query.select();

      return { data: result, error };
    } catch (error) {
      console.error(
        `[FeedDatabase] ${table} tablosunda güncelleme hatası:`,
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Tablodaki kaydı siler
   * @param {string} table - Tablo adı
   * @param {Object} filter - Filtreleme parametreleri
   * @returns {Promise<Object>} - Silme sonucu
   */
  async delete(table, filter) {
    try {
      let query = this.supabase.from(table).delete();

      // Eşitlik şartları
      if (filter.eq && typeof filter.eq === "object") {
        Object.entries(filter.eq).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      const { data: result, error } = await query.select();

      return { data: result, error };
    } catch (error) {
      console.error(`[FeedDatabase] ${table} tablosundan silme hatası:`, error);
      return { data: null, error };
    }
  }
}
