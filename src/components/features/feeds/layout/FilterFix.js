"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Filtreleme sorununu düzeltmek için kullanılan bir bileşen.
 * Feed listesi sayfasına gömülecek ve otomatik olarak çalışacak.
 */
export function FilterFix() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Oturumda yalnızca bir kez çalıştır
      const fixApplied = sessionStorage.getItem("filter_fix_applied");
      if (fixApplied) return;

      console.info("🔍 Filtreleme düzeltmesi uygulanıyor...");

      // LocalStorage'dan filtreleri temizle
      localStorage.removeItem("feedtune_filters");

      // Feed türü filtrelemesini düzeltmek için hook'lar arasındaki iletişimi iyileştir
      const patchCreateFilterObject = () => {
        if (window.createFilterObject) {
          const originalFunction = window.createFilterObject;
          window.createFilterObject = function (
            filters,
            selectedFeedId,
            activeFilter
          ) {
            // Orijinal fonksiyonu çağır ama sonucu doğrula
            const result = originalFunction(
              filters,
              selectedFeedId,
              activeFilter
            );

            // Feed tipi kontrolü - "all" dışında bir değer varsa type olarak ekle
            const feedType = activeFilter?.feedType || filters?.feedType;
            if (feedType && feedType !== "all" && !result.type) {
              result.type = feedType;
              console.log("🔧 Feed tipi düzeltildi:", feedType);
            }

            return result;
          };
        }
      };

      // Düzeltme uygula
      patchCreateFilterObject();

      // Düzeltmenin uygulandığını kaydet
      sessionStorage.setItem("filter_fix_applied", "true");

      // Kullanıcıya bilgi ver
      toast.success("Filtreleme iyileştirmesi uygulandı");

      console.info("✅ Filtreleme düzeltmesi tamamlandı");
    } catch (error) {
      console.error("❌ Filtreleme düzeltmesi uygulanırken hata:", error);
    }
  }, []);

  // Sadece client-side kod çalıştırıldı, görünür bir şey gösterme
  return null;
}
