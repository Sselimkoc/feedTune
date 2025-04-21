"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function DirectTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [manualUserId, setManualUserId] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auth durumunu kontrol et
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase.auth.getUser();

        if (data?.user) {
          setUserId(data.user.id);
        } else if (localStorage.getItem("userId")) {
          setManualUserId(localStorage.getItem("userId"));
        }
      } catch (e) {
        console.error("Auth kontrolü sırasında hata:", e);
      }
    };

    checkAuth();
  }, []);

  const runDirectTest = async (id) => {
    setLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const testId = id || userId || manualUserId;

      if (!testId) {
        throw new Error("Test için bir kullanıcı ID'si gerekli");
      }

      // Test sonuçlarını toplayacak nesne
      const results = {
        timestamp: new Date().toISOString(),
        userId: testId,
        feeds: null,
        rssItems: null,
        youtubeItems: null,
        interactions: null,
      };

      const supabase = createClientComponentClient();

      // 1. Besleme tablosunu kontrol et
      const { data: feeds, error: feedError } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", testId)
        .is("deleted_at", null);

      if (feedError) {
        throw new Error(`Feed tablosu erişim hatası: ${feedError.message}`);
      }

      results.feeds = {
        count: feeds?.length || 0,
        items: feeds || [],
      };

      // Feed ID'lerini topla
      if (feeds && feeds.length > 0) {
        const rssFeedIds = feeds
          .filter((f) => f.type === "rss" || f.type === "atom")
          .map((f) => f.id);

        const youtubeFeedIds = feeds
          .filter((f) => f.type === "youtube")
          .map((f) => f.id);

        // 2. RSS öğelerini kontrol et
        if (rssFeedIds.length > 0) {
          const { data: rssItems, error: rssError } = await supabase
            .from("rss_items")
            .select("*")
            .in("feed_id", rssFeedIds)
            .order("published_at", { ascending: false })
            .limit(10);

          if (rssError) {
            throw new Error(`RSS öğeleri erişim hatası: ${rssError.message}`);
          }

          results.rssItems = {
            count: rssItems?.length || 0,
            items: rssItems || [],
            feedCount: rssFeedIds.length,
          };
        } else {
          results.rssItems = { count: 0, items: [], feedCount: 0 };
        }

        // 3. YouTube öğelerini kontrol et
        if (youtubeFeedIds.length > 0) {
          const { data: youtubeItems, error: youtubeError } = await supabase
            .from("youtube_items")
            .select("*")
            .in("feed_id", youtubeFeedIds)
            .order("published_at", { ascending: false })
            .limit(10);

          if (youtubeError) {
            throw new Error(
              `YouTube öğeleri erişim hatası: ${youtubeError.message}`
            );
          }

          results.youtubeItems = {
            count: youtubeItems?.length || 0,
            items: youtubeItems || [],
            feedCount: youtubeFeedIds.length,
          };
        } else {
          results.youtubeItems = { count: 0, items: [], feedCount: 0 };
        }
      }

      // 4. Kullanıcı etkileşimlerini kontrol et
      const { data: interactions, error: interactionError } = await supabase
        .from("user_item_interactions")
        .select("*")
        .eq("user_id", testId)
        .limit(10);

      if (interactionError) {
        throw new Error(
          `Etkileşim tablosu erişim hatası: ${interactionError.message}`
        );
      }

      results.interactions = {
        count: interactions?.length || 0,
        items: interactions || [],
      };

      // Sonuçları ayarla
      setTestResults(results);
      console.log("Test sonuçları:", results);
    } catch (err) {
      console.error("Doğrudan test sırasında hata:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveUserId = () => {
    if (manualUserId) {
      localStorage.setItem("userId", manualUserId);
      alert(`Kullanıcı ID'si kaydedildi: ${manualUserId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Supabase Doğrudan Erişim Testi
      </h1>

      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Hakkında</h2>
        <p className="text-sm text-gray-700">
          Bu test aracı, Supabase veritabanına doğrudan erişim sağlayarak feed
          ve içerik verilerine ulaşılabildiğini kontrol eder. Servis veya
          repository katmanlarını kullanmadan doğrudan sorgu yapar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="p-4 border rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-3">Kullanıcı Kimliği</h2>

            {userId ? (
              <div className="mb-4">
                <p className="text-sm font-medium">Oturum Açık:</p>
                <div className="flex items-center mt-1">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-mono">
                    {userId}
                  </span>
                  <button
                    onClick={() => runDirectTest(userId)}
                    className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    disabled={loading}
                  >
                    Bu ID ile Test Et
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm text-amber-600">
                Oturum açık değil. Manuel ID girişi yapabilirsiniz.
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Manuel Kullanıcı ID'si:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  className="px-3 py-2 border rounded flex-1 text-sm"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
                <button
                  onClick={saveUserId}
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                  disabled={!manualUserId}
                >
                  Kaydet
                </button>
              </div>
            </div>

            <button
              onClick={() => runDirectTest(manualUserId)}
              disabled={loading || (!userId && !manualUserId)}
              className="w-full py-2 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50"
            >
              {loading
                ? "Test Çalışıyor..."
                : "Doğrudan Veritabanı Testi Çalıştır"}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <h3 className="font-medium text-red-700 mb-1">Hata Oluştu</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div>
          {loading ? (
            <div className="p-8 border rounded-lg flex justify-center items-center">
              <p>Test çalışıyor, lütfen bekleyin...</p>
            </div>
          ) : testResults ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-semibold">Test Sonuçları</h3>
                <p className="text-xs text-gray-500">
                  {new Date(testResults.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="divide-y">
                <div className="p-4">
                  <h4 className="font-medium mb-2">Beslemeler</h4>
                  <p className="text-sm">
                    Toplam:{" "}
                    <span className="font-mono">{testResults.feeds.count}</span>
                  </p>
                  {testResults.feeds.count > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Detayları Göster
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded-sm text-xs overflow-auto max-h-40">
                        {JSON.stringify(testResults.feeds.items[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-medium mb-2">RSS Öğeleri</h4>
                  <p className="text-sm">
                    Toplam:{" "}
                    <span className="font-mono">
                      {testResults.rssItems?.count || 0}
                    </span>
                    {testResults.rssItems?.feedCount > 0 && (
                      <span className="text-xs ml-2 text-gray-500">
                        ({testResults.rssItems.feedCount} besleme için)
                      </span>
                    )}
                  </p>
                  {testResults.rssItems?.count > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Detayları Göster
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded-sm text-xs overflow-auto max-h-40">
                        {JSON.stringify(testResults.rssItems.items[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-medium mb-2">YouTube Öğeleri</h4>
                  <p className="text-sm">
                    Toplam:{" "}
                    <span className="font-mono">
                      {testResults.youtubeItems?.count || 0}
                    </span>
                    {testResults.youtubeItems?.feedCount > 0 && (
                      <span className="text-xs ml-2 text-gray-500">
                        ({testResults.youtubeItems.feedCount} besleme için)
                      </span>
                    )}
                  </p>
                  {testResults.youtubeItems?.count > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Detayları Göster
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded-sm text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.youtubeItems.items[0],
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="font-medium mb-2">Kullanıcı Etkileşimleri</h4>
                  <p className="text-sm">
                    Toplam:{" "}
                    <span className="font-mono">
                      {testResults.interactions.count}
                    </span>
                  </p>
                  {testResults.interactions.count > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Detayları Göster
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded-sm text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.interactions.items[0],
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 border rounded-lg flex justify-center items-center text-gray-500">
              Henüz test çalıştırılmadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
