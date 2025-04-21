"use client";

import { useEffect } from "react";
import debugHelper from "@/debug-helper";

/**
 * Debug yardımcılarını yükleyen bileşen
 * Bu bileşen layout'a eklenerek debug-helper'ın otomatik olarak başlamasını sağlar
 */
export default function DebugLoader() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 Debug araçları yükleniyor...");

      // Debug helper'ı yükle
      debugHelper.initialize().then(() => {
        console.log("✅ Debug araçları yüklendi");

        // Global nesneye eklendi
        window.diagnose = async () => {
          console.log("🔍 Sistem tanılama başlatılıyor...");
          const results = await debugHelper.diagnoseAll();
          console.log("📊 Tanılama sonuçları:", results);
          return results;
        };

        window.cleanCache = () => {
          return debugHelper.clearAllCache();
        };

        console.log("📢 Kullanılabilir komutlar:");
        console.log("  • window.diagnose() - Tam sistem tanılama yapar");
        console.log("  • window.cleanCache() - Tüm önbellekleri temizler");
        console.log("  • window.debugHelper.* - Tüm debug yardımcıları");
      });
    }

    // Component unmount olduğunda bir şey yapma
    return () => {};
  }, []);

  // Görünür bir şey render etme (yalnızca yan etki)
  return null;
}
