/**
 * Tarih işlemleri için yardımcı fonksiyonlar
 */

import {
  formatDistanceToNowStrict,
  fromUnixTime,
  format,
  formatDistance,
} from "date-fns";
import { tr, enUS } from "date-fns/locale";

/**
 * Bir Date nesnesinin geçerli olup olmadığını kontrol eder
 * @param {Date} date - Kontrol edilecek tarih
 * @returns {boolean} - Tarih geçerli mi?
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Tarihi UTC zaman damgasına dönüştürür
 * @param {Date|string} date - Dönüştürülecek tarih
 * @returns {Date} UTC zaman damgası
 */
export function toUTCTimestamp(date) {
  if (!date) return null;

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate(),
    parsedDate.getUTCHours(),
    parsedDate.getUTCMinutes(),
    parsedDate.getUTCSeconds()
  );
}

/**
 * Timestamp formatındaki tarihi yerel tarihe çevirir
 * @param {string} timestamp - Timestamp formatında tarih
 * @returns {Date} - Yerel tarih objesi
 */
export function fromUTCTimestamp(timestamp) {
  if (!timestamp) return null;

  try {
    // Timestamp'i Date objesine çevir
    const date = new Date(timestamp.replace(" ", "T") + "Z");

    // Geçerli bir tarih değilse null döndür
    if (isNaN(date.getTime())) {
      console.warn("Geçersiz timestamp formatı:", timestamp);
      return null;
    }

    return date;
  } catch (error) {
    console.error("Timestamp dönüştürme hatası:", error);
    return null;
  }
}

/**
 * Tarihi kullanıcı dostu formata çevirir
 * @param {string|Date} date - Formatlanacak tarih
 * @param {string} locale - Dil kodu (örn: 'tr-TR')
 * @returns {string} - Formatlanmış tarih
 */
export function formatDate(date, locale = "tr-TR") {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? fromUTCTimestamp(date) : date;
    if (!dateObj) return "";

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  } catch (error) {
    console.error("Tarih formatlama hatası:", error);
    return "";
  }
}

/**
 * Tarihi göreceli formata çevirir (örn: "2 saat önce")
 * @param {string|Date} date - Formatlanacak tarih
 * @param {string} locale - Dil kodu (örn: 'tr-TR')
 * @returns {string} - Göreceli tarih
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date = fromUnixTime(timestamp);
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: tr,
  });
}

/**
 * Tarihten bugüne kadar geçen süreyi kullanıcı dostu formatta döndürür
 * @param {string|Date} date - Tarih
 * @param {string} language - Dil kodu (örn: 'tr', 'en')
 * @returns {string} - Geçen süre (örn: "2 hours ago")
 */
export function timeAgo(date, language = "tr") {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!isValidDate(dateObj)) {
      return "";
    }

    return formatDistance(dateObj, new Date(), {
      addSuffix: true,
      locale: language === "tr" ? tr : enUS,
    });
  } catch (error) {
    console.error("timeAgo formatting error:", error);
    return "";
  }
}

/**
 * Tarihi PostgreSQL timestamp formatına çevirir
 * @param {Date|string} date - Dönüştürülecek tarih
 * @returns {string} - PostgreSQL timestamp formatında tarih
 */
export function formatToPostgresTimestamp(date) {
  if (!date) return null;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!isValidDate(dateObj)) return null;

    return format(dateObj, "yyyy-MM-dd HH:mm:ss.SSSxxx");
  } catch (error) {
    console.error("PostgreSQL timestamp dönüştürme hatası:", error);
    return null;
  }
}
