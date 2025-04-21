"use client";

import { useState, useEffect } from "react";
import feedDebugger from "@/debug/feedDebugger";

/**
 * Geliştirme ortamında feed sistemini test etmek için debug panel
 * Bu bileşen sadece geliştirme ortamında görüntülenir
 */
export default function FeedDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    dbConnection: null,
    feeds: null,
    rssItems: null,
    youtubeItems: null,
    userInteractions: null,
    repoFeeds: null,
    repoItems: null,
    serviceFeeds: null,
    serviceItems: null,
  });

  // Panel açıldığında kullanıcı ID'sini al
  useEffect(() => {
    if (isOpen) {
      fetchUserId();
    }
  }, [isOpen]);

  const fetchUserId = async () => {
    const id = await feedDebugger.getCurrentUserId();
    setUserId(id);
  };

  const runDiagnosis = async () => {
    setLoading(true);
    try {
      // Veritabanı bağlantısı kontrol et
      const dbConnection = await feedDebugger.testDbConnection();

      // Kullanıcı var mı kontrol et
      if (!userId) {
        await fetchUserId();
      }

      // Diğer testleri koşullu olarak çalıştır
      let feeds = null;
      let rssItems = null;
      let youtubeItems = null;
      let userInteractions = null;
      let repoFeeds = null;
      let repoItems = null;
      let serviceFeeds = null;
      let serviceItems = null;

      if (dbConnection && userId) {
        // Doğrudan DB sorgularını çalıştır
        feeds = await feedDebugger.getDirectFeeds(userId);

        if (feeds?.length) {
          const feedIds = feeds.map((f) => f.id);
          rssItems = await feedDebugger.getDirectRssItems(feedIds);
          youtubeItems = await feedDebugger.getDirectYoutubeItems(feedIds);
        }

        userInteractions = await feedDebugger.getDirectUserInteractions(userId);

        // Repository katmanını test et
        repoFeeds = await feedDebugger.getRepositoryFeeds(userId);

        if (repoFeeds?.length) {
          repoItems = await feedDebugger.getRepositoryFeedItems(
            repoFeeds.map((f) => f.id),
            userId
          );
        }

        // Service katmanını test et
        serviceFeeds = await feedDebugger.getServiceFeeds(userId);

        if (serviceFeeds?.length) {
          serviceItems = await feedDebugger.getServiceFeedItems(
            serviceFeeds.map((f) => f.id),
            userId
          );
        }
      }

      // Sonuçları kaydet
      setResults({
        dbConnection,
        feeds,
        rssItems,
        youtubeItems,
        userInteractions,
        repoFeeds,
        repoItems,
        serviceFeeds,
        serviceItems,
      });
    } catch (error) {
      console.error("Tanılama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnosis = async () => {
    setLoading(true);
    try {
      await feedDebugger.diagnoseFullSystem();
    } catch (error) {
      console.error("Tam tanılama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sadece geliştirme ortamında görüntüle
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Feed Debugger</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-700 rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-2 bg-slate-700 rounded">
              <p>Kullanıcı ID: {userId || "Bulunamadı"}</p>
              <p>
                DB Bağlantısı:{" "}
                {results.dbConnection === null
                  ? "?"
                  : results.dbConnection
                  ? "✅ Bağlı"
                  : "❌ Bağlantı Yok"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runDiagnosis}
                disabled={loading}
                className={`p-2 rounded ${
                  loading ? "bg-slate-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Çalışıyor..." : "Tanılama Çalıştır"}
              </button>

              <button
                onClick={runFullDiagnosis}
                disabled={loading}
                className={`p-2 rounded ${
                  loading ? "bg-slate-600" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Çalışıyor..." : "Konsolda Tanıla"}
              </button>
            </div>

            {results.feeds !== null && (
              <div>
                <h3 className="font-medium mb-1">Sonuçlar:</h3>
                <div className="space-y-2 text-sm">
                  <ResultItem
                    label="DB Beslemeler"
                    count={results.feeds?.length || 0}
                  />
                  <ResultItem
                    label="DB RSS Öğeleri"
                    count={results.rssItems?.length || 0}
                  />
                  <ResultItem
                    label="DB YouTube Öğeleri"
                    count={results.youtubeItems?.length || 0}
                  />
                  <ResultItem
                    label="DB Kullanıcı Etkileşimleri"
                    count={results.userInteractions?.length || 0}
                  />
                  <ResultItem
                    label="Repository Beslemeler"
                    count={results.repoFeeds?.length || 0}
                  />
                  <ResultItem
                    label="Repository Öğeler"
                    count={results.repoItems?.length || 0}
                  />
                  <ResultItem
                    label="Service Beslemeler"
                    count={results.serviceFeeds?.length || 0}
                  />
                  <ResultItem
                    label="Service Öğeler"
                    count={results.serviceItems?.length || 0}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 mt-4">
              <p>
                Not: Daha detaylı tanılama sonuçları için tarayıcı konsolunu
                kontrol edin.
              </p>
              <p>
                window.feedDebugger ile doğrudan debugger'a erişebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-800 text-white p-2 rounded-lg shadow-lg hover:bg-slate-700"
        >
          🐞 Debug
        </button>
      )}
    </div>
  );
}

function ResultItem({ label, count }) {
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span className={count > 0 ? "text-green-400" : "text-red-400"}>
        {count} {count > 0 ? "✅" : "❌"}
      </span>
    </div>
  );
}
