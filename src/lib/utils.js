import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Verilen tarihi "şu kadar zaman önce" formatında döndürür
 * @param {string|Date} date - Tarih
 * @returns {string} - Formatlanmış zaman
 */
export function formatTimeAgo(date) {
  if (!date) return "";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return "Az önce";
  } else if (diffMin < 60) {
    return `${diffMin} dk önce`;
  } else if (diffHour < 24) {
    return `${diffHour} saat önce`;
  } else if (diffDay < 7) {
    return `${diffDay} gün önce`;
  } else if (diffWeek < 4) {
    return `${diffWeek} hafta önce`;
  } else if (diffMonth < 12) {
    return `${diffMonth} ay önce`;
  } else {
    return `${diffYear} yıl önce`;
  }
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
