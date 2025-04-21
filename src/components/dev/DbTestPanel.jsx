"use client";

import { useState, useEffect } from "react";
import {
  runAllTests,
  testDbConnection,
  testGetFeeds,
  testGetFeedItems,
} from "@/utils/dbTest";
import { useAuth } from "@/app/auth-context";

/**
 * Veritabanı ve repository test paneli
 * Sadece geliştirme ortamında görünür olacak
 */
export default function DbTestPanel() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [results, setResults] = useState({
    dbConnection: null,
    feeds: null,
    feedItems: null,
  });
  const [feedIds, setFeedIds] = useState([]);
  const auth = useAuth();

  useEffect(() => {
    // Auth context'ten userId'yi al
    if (auth && auth.user && auth.user.id) {
      setUserId(auth.user.id);
    }
  }, [auth]);

  const runTests = async () => {
    setLoading(true);
    setResults({
      dbConnection: null,
      feeds: null,
      feedItems: null,
    });

    try {
      if (!userId) {
        alert("Kullanıcı ID'si gerekli");
        setLoading(false);
        return;
      }

      const testResults = await runAllTests(userId);
      setResults(testResults);

      // Eğer feed testi başarılıysa ve feed'ler varsa, feed ID'lerini kaydet
      if (
        testResults.feeds &&
        testResults.feeds.success &&
        testResults.feeds.data
      ) {
        setFeedIds(testResults.feeds.data.map((feed) => feed.id));
      }
    } catch (error) {
      console.error("Test çalıştırma hatası:", error);
      setResults({
        dbConnection: { success: false, message: `Hata: ${error.message}` },
        feeds: null,
        feedItems: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const testDbOnly = async () => {
    setLoading(true);
    try {
      const result = await testDbConnection();
      setResults({
        ...results,
        dbConnection: result,
      });
    } catch (error) {
      console.error("DB bağlantı testi hatası:", error);
      setResults({
        ...results,
        dbConnection: { success: false, message: `Hata: ${error.message}` },
      });
    } finally {
      setLoading(false);
    }
  };

  const testFeedsOnly = async () => {
    setLoading(true);
    try {
      if (!userId) {
        alert("Kullanıcı ID'si gerekli");
        setLoading(false);
        return;
      }

      const result = await testGetFeeds(userId);
      setResults({
        ...results,
        feeds: result,
      });

      // Eğer feed testi başarılıysa ve feed'ler varsa, feed ID'lerini kaydet
      if (result && result.success && result.data) {
        setFeedIds(result.data.map((feed) => feed.id));
      }
    } catch (error) {
      console.error("Feed testi hatası:", error);
      setResults({
        ...results,
        feeds: { success: false, message: `Hata: ${error.message}` },
      });
    } finally {
      setLoading(false);
    }
  };

  const testFeedItemsOnly = async () => {
    setLoading(true);
    try {
      if (feedIds.length === 0) {
        alert("Önce feed'leri test edin veya feed ID'lerini girin");
        setLoading(false);
        return;
      }

      const result = await testGetFeedItems(feedIds, userId);
      setResults({
        ...results,
        feedItems: result,
      });
    } catch (error) {
      console.error("Feed içerikleri testi hatası:", error);
      setResults({
        ...results,
        feedItems: { success: false, message: `Hata: ${error.message}` },
      });
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Panel kapalıysa sadece toggle butonunu göster
  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-md z-50"
      >
        DB Test Paneli
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-white border border-gray-300 rounded-tl-md shadow-lg z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Veritabanı Test Paneli</h3>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Kapat
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kullanıcı ID
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Kullanıcı ID'si girin"
        />
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-500 text-white py-1 px-3 rounded-md disabled:opacity-50"
        >
          {loading ? "Çalışıyor..." : "Tüm Testleri Çalıştır"}
        </button>
        <button
          onClick={testDbOnly}
          disabled={loading}
          className="bg-gray-500 text-white py-1 px-3 rounded-md disabled:opacity-50"
        >
          DB Testi
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={testFeedsOnly}
          disabled={loading || !userId}
          className="bg-green-500 text-white py-1 px-3 rounded-md disabled:opacity-50"
        >
          Feed Testi
        </button>
        <button
          onClick={testFeedItemsOnly}
          disabled={loading || feedIds.length === 0}
          className="bg-purple-500 text-white py-1 px-3 rounded-md disabled:opacity-50"
        >
          İçerik Testi
        </button>
      </div>

      {/* Test Sonuçları */}
      <div className="mt-4 text-sm overflow-auto max-h-72">
        <h4 className="font-bold">Test Sonuçları:</h4>

        {/* DB Bağlantı Sonucu */}
        {results.dbConnection && (
          <div
            className={`mt-2 p-2 rounded-md ${
              results.dbConnection.success ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div className="font-bold">Veritabanı Bağlantısı:</div>
            <div>{results.dbConnection.message}</div>
            {results.dbConnection.details && (
              <pre className="text-xs mt-1 bg-gray-50 p-1 rounded">
                {JSON.stringify(results.dbConnection.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Feed Sonucu */}
        {results.feeds && (
          <div
            className={`mt-2 p-2 rounded-md ${
              results.feeds.success ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div className="font-bold">Feed Testi:</div>
            <div>{results.feeds.message}</div>
            {results.feeds.success && results.feeds.data && (
              <div className="mt-1">
                <div>Feed Sayısı: {results.feeds.count}</div>
                <details>
                  <summary className="cursor-pointer text-blue-500">
                    Feed Listesi
                  </summary>
                  <pre className="text-xs mt-1 bg-gray-50 p-1 rounded max-h-24 overflow-auto">
                    {JSON.stringify(results.feeds.data.slice(0, 3), null, 2)}
                    {results.feeds.data.length > 3 && "...ve daha fazlası"}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Feed İçerikleri Sonucu */}
        {results.feedItems && (
          <div
            className={`mt-2 p-2 rounded-md ${
              results.feedItems.success ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div className="font-bold">Feed İçerikleri Testi:</div>
            <div>{results.feedItems.message}</div>
            {results.feedItems.success && results.feedItems.data && (
              <div className="mt-1">
                <div>İçerik Sayısı: {results.feedItems.count}</div>
                <details>
                  <summary className="cursor-pointer text-blue-500">
                    İçerik Listesi
                  </summary>
                  <pre className="text-xs mt-1 bg-gray-50 p-1 rounded max-h-24 overflow-auto">
                    {JSON.stringify(
                      results.feedItems.data.slice(0, 2),
                      null,
                      2
                    )}
                    {results.feedItems.data.length > 2 && "...ve daha fazlası"}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
