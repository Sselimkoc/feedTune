import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
