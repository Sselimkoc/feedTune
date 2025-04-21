import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import tr from "date-fns/locale/tr";
import enUS from "date-fns/locale/en-US";
import de from "date-fns/locale/de";

/**
 * Tailwind CSS sınıflarını birleştirmek için yardımcı fonksiyon
 * @param  {...any} inputs - Sınıf adları
 * @returns {string} - Birleştirilmiş sınıf adları
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * HTML etiketlerini temizler
 * @param {string} html - HTML içeriği
 * @returns {string} - Temizlenmiş metin
 */
export function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

/**
 * URL'nin geçerli olup olmadığını kontrol eder
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean} - URL geçerli mi?
 */
export function isValidUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // http veya https protokolü kullanmalı
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Tarihi formatlar ve göreceli zaman bilgisi döndürür
 * @param {string|Date} date - Formatlanacak tarih
 * @param {string} language - Dil kodu (tr, en, de, vb.)
 * @param {Object} t - Çeviri fonksiyonu
 * @returns {string} - Formatlanmış tarih
 */
export function formatRelativeDate(date, language = "tr", t) {
  if (!date) return "";

  try {
    const targetDate = new Date(date);
    const now = new Date();
    const diffMs = now - targetDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Dil koduna göre locale'i al
    const locales = {
      tr,
      en: enUS,
      de,
    };
    const locale = locales[language] || tr;

    // Gelecek tarihler için kontrol
    if (diffMs < 0) {
      const futureDiffMs = Math.abs(diffMs);
      const futureMinutes = Math.floor(futureDiffMs / (1000 * 60));
      const futureHours = Math.floor(futureDiffMs / (1000 * 60 * 60));
      const futureDays = Math.floor(futureDiffMs / (1000 * 60 * 60 * 24));
      const futureWeeks = Math.floor(futureDays / 7);
      const futureMonths = Math.floor(futureDays / 30);
      const futureYears = Math.floor(futureDays / 365);

      if (futureMinutes < 60) {
        return t("time.relative.future.minutes", { count: futureMinutes });
      } else if (futureHours < 24) {
        return t("time.relative.future.hours", { count: futureHours });
      } else if (futureDays < 7) {
        return t("time.relative.future.days", { count: futureDays });
      } else if (futureWeeks < 4) {
        return t("time.relative.future.weeks", { count: futureWeeks });
      } else if (futureMonths < 12) {
        return t("time.relative.future.months", { count: futureMonths });
      } else {
        return t("time.relative.future.years", { count: futureYears });
      }
    }

    // Geçmiş tarihler için
    if (diffMinutes < 1) {
      return t("time.relative.past.justNow");
    } else if (diffMinutes < 60) {
      return t("time.relative.past.minutes", { count: diffMinutes });
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMinutes / 60);
      return t("time.relative.past.hours", { count: hours });
    } else if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return t("time.relative.past.days", { count: days });
    } else if (diffMs < 30 * 24 * 60 * 60 * 1000) {
      const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      return t("time.relative.past.weeks", { count: weeks });
    } else if (diffMs < 365 * 24 * 60 * 60 * 1000) {
      const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      return t("time.relative.past.months", { count: months });
    }

    // 1 yıldan eski tarihler için tam tarih formatını kullan
    return format(targetDate, t("time.formats.medium"), { locale });
  } catch (error) {
    console.error("Tarih formatlanırken hata oluştu:", error);
    return "";
  }
}
