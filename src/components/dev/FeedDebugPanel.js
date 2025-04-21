"use client";

import { useState, useEffect } from "react";
import { dbClient } from "../../lib/db";

export default function FeedDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Tarayıcıdan mevcut kullanıcı ID'sini al
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const checkDbConnection = async () => {
    try {
      await dbClient.executeQuery("SELECT 1");
      return true;
    } catch (error) {
      console.error("DB bağlantı hatası:", error);
      return false;
    }
  };

  const checkUserFeeds = async (userId) => {
    try {
      const feeds = await dbClient.executeQuery(
        "SELECT * FROM feeds WHERE user_id = ? AND deleted = 0",
        [userId]
      );
      return feeds;
    } catch (error) {
      console.error("Feed kontrolü hatası:", error);
      return [];
    }
  };

  const checkRssItems = async (feedIds) => {
    if (!feedIds.length) return [];
    try {
      const placeholders = feedIds.map(() => "?").join(",");
      const rssItems = await dbClient.executeQuery(
        `SELECT * FROM rss_items WHERE feed_id IN (${placeholders}) ORDER BY pub_date DESC LIMIT 10`,
        feedIds
      );
      return rssItems;
    } catch (error) {
      console.error("RSS kontrolü hatası:", error);
      return [];
    }
  };

  const checkYoutubeItems = async (feedIds) => {
    if (!feedIds.length) return [];
    try {
      const placeholders = feedIds.map(() => "?").join(",");
      const youtubeItems = await dbClient.executeQuery(
        `SELECT * FROM youtube_items WHERE feed_id IN (${placeholders}) ORDER BY published_at DESC LIMIT 10`,
        feedIds
      );
      return youtubeItems;
    } catch (error) {
      console.error("YouTube kontrolü hatası:", error);
      return [];
    }
  };

  const runDiagnostics = async () => {
    if (!userId) {
      alert("Lütfen kullanıcı ID girin");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // DB bağlantısını kontrol et
      const dbConnected = await checkDbConnection();

      // Kullanıcı feed'lerini kontrol et
      const feeds = await checkUserFeeds(userId);
      const feedIds = feeds.map((feed) => feed.id);

      // RSS ve YouTube öğelerini kontrol et
      const rssItems = await checkRssItems(feedIds);
      const youtubeItems = await checkYoutubeItems(feedIds);

      // Sonuçları ayarla
      setResults({
        dbConnected,
        feedCount: feeds.length,
        feedIds,
        rssItemCount: rssItems.length,
        youtubeItemCount: youtubeItems.length,
        sampleRssItem: rssItems[0] || null,
        sampleYoutubeItem: youtubeItems[0] || null,
      });

      // Konsolda ayrıntılı bilgileri göster
      console.log("Debug sonuçları:", {
        dbConnected,
        feeds,
        rssItems,
        youtubeItems,
      });
    } catch (error) {
      console.error("Tanılama hatası:", error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed right-4 bottom-4 bg-blue-500 text-white p-2 rounded-md z-50"
      >
        Debug Paneli
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 w-96 bg-white shadow-lg rounded-md p-4 z-50 border border-gray-300">
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Feed Debug Paneli</h3>
        <button onClick={() => setVisible(false)} className="text-gray-500">
          &times;
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Kullanıcı ID:</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border rounded-md p-2"
        />
      </div>

      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded-md mb-4"
      >
        {loading ? "Kontrol Ediliyor..." : "Kontrol Et"}
      </button>

      {results && (
        <div className="bg-gray-100 p-3 rounded-md">
          <h4 className="font-semibold mb-2">Sonuçlar:</h4>
          {results.error ? (
            <p className="text-red-500">{results.error}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              <li>
                DB Bağlantısı:{" "}
                <span
                  className={
                    results.dbConnected ? "text-green-500" : "text-red-500"
                  }
                >
                  {results.dbConnected ? "Başarılı" : "Başarısız"}
                </span>
              </li>
              <li>Feed Sayısı: {results.feedCount}</li>
              <li>RSS Öğe Sayısı: {results.rssItemCount}</li>
              <li>YouTube Öğe Sayısı: {results.youtubeItemCount}</li>
              {(results.sampleRssItem || results.sampleYoutubeItem) && (
                <li className="mt-2">
                  <details>
                    <summary>Örnek Öğe Bilgileri</summary>
                    <pre className="mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(
                        results.sampleRssItem || results.sampleYoutubeItem,
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
