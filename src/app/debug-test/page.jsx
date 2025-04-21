"use client";

import { useState, useEffect } from "react";
import { feedService } from "@/services/feedService";
import { FeedRepository } from "@/repositories/feedRepository";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Debug Test Sayfası
 * Bu sayfa, yeni yapılandırılmış repository ve service modüllerini test etmek için kullanılır.
 */
export default function DebugTestPage() {
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [testRunning, setTestRunning] = useState(false);
  const { user: authUser } = useAuthStore();
  const feedRepository = new FeedRepository();

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      log(`Kullanıcı oturumu bulundu: ${authUser.id.slice(0, 8)}...`);
    }
  }, [authUser]);

  const log = (message, type = "info") => {
    setLogs((prev) => [...prev, { message, type, time: new Date() }]);
  };

  const runBasicTests = async () => {
    if (!user) {
      log("Kullanıcı oturumu gerekli. Lütfen giriş yapın.", "error");
      return;
    }

    setTestRunning(true);
    log("🔍 Test başlatılıyor...");

    try {
      // 1. FeedRepository testi
      log("1. FeedRepository testi başlatılıyor...");
      const feeds = await feedRepository.getFeeds(user.id);
      log(`✅ ${feeds.length} adet feed bulundu`);

      if (feeds.length > 0) {
        // 2. Feed içeriklerini getir
        log("2. Feed içerikleri getiriliyor...");
        const feedIds = feeds.map((feed) => feed.id);
        const items = await feedRepository.getFeedItems(
          feedIds,
          5,
          null,
          user.id
        );
        log(
          `✅ Feed içerikleri başarıyla alındı: ${JSON.stringify(
            items,
            null,
            2
          ).slice(0, 100)}...`
        );

        // 3. FeedService testi
        log("3. FeedService testi başlatılıyor...");
        const serviceFeeds = await feedService.getFeeds(user.id);
        log(
          `✅ FeedService üzerinden ${serviceFeeds.length} adet feed bulundu`
        );

        const serviceItems = await feedService.getFeedItems(
          feedIds,
          5,
          user.id
        );
        log(`✅ FeedService üzerinden feed içerikleri başarıyla alındı`);
      }

      log("🎉 Tüm testler başarıyla tamamlandı!");
    } catch (error) {
      log(`❌ Test sırasında hata oluştu: ${error.message}`, "error");
      console.error("Test hatası:", error);
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Test Sayfası</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Kullanıcı Durumu</h2>
        {user ? (
          <p className="text-green-600">
            ✅ Oturum açık: {user.email} ({user.id.slice(0, 8)}...)
          </p>
        ) : (
          <p className="text-red-600">❌ Oturum açık değil</p>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={runBasicTests}
          disabled={!user || testRunning}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {testRunning ? "Test çalışıyor..." : "Temel Testleri Çalıştır"}
        </button>
      </div>

      <div className="bg-gray-800 text-green-400 p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
        <h2 className="text-white text-lg font-semibold mb-2">Log Çıktısı</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Henüz log yok</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`${
                  log.type === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                [{log.time.toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
