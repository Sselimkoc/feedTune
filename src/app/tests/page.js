"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { enhancedFeedRepository } from "@/repositories/enhancedFeedRepository";
import { enhancedFeedService } from "@/services/enhancedFeedService";

export default function TestPage() {
  const [userId, setUserId] = useState("");
  const [testResults, setTestResults] = useState({
    direct: null,
    repository: null,
    service: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("direct");

  useEffect(() => {
    // Auth durumunu kontrol et
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase.auth.getUser();

        if (data?.user) {
          setUserId(data.user.id);
        } else if (localStorage.getItem("userId")) {
          setUserId(localStorage.getItem("userId"));
        }
      } catch (e) {
        console.error("Auth kontrolü sırasında hata:", e);
      }
    };

    checkAuth();
  }, []);

  // Kullanıcı ID'si değiştiğini izle
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  // ID'yi localStorage'a kaydet
  const saveUserId = () => {
    if (userId) {
      localStorage.setItem("userId", userId);
      alert(`Kullanıcı ID'si kaydedildi: ${userId}`);
    }
  };

  // Doğrudan Supabase ile test
  const testDirect = async () => {
    if (!userId) return;

    setLoading(true);
    setTestResults((prev) => ({ ...prev, direct: null, error: null }));

    try {
      const supabase = createClientComponentClient();

      // Beslemeleri getir
      const { data: feeds, error: feedError } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null);

      if (feedError) throw feedError;

      // Feed türlerini ayır
      const rssFeeds =
        feeds
          ?.filter((f) => f.type === "rss" || f.type === "atom")
          .map((f) => f.id) || [];
      const youtubeFeeds =
        feeds?.filter((f) => f.type === "youtube").map((f) => f.id) || [];

      let rssItems = [],
        youtubeItems = [];

      // RSS öğelerini getir
      if (rssFeeds.length > 0) {
        const { data: rss, error: rssError } = await supabase
          .from("rss_items")
          .select("*")
          .in("feed_id", rssFeeds)
          .order("published_at", { ascending: false })
          .limit(10);

        if (rssError) throw rssError;
        rssItems = rss || [];
      }

      // YouTube öğelerini getir
      if (youtubeFeeds.length > 0) {
        const { data: youtube, error: youtubeError } = await supabase
          .from("youtube_items")
          .select("*")
          .in("feed_id", youtubeFeeds)
          .order("published_at", { ascending: false })
          .limit(10);

        if (youtubeError) throw youtubeError;
        youtubeItems = youtube || [];
      }

      setTestResults((prev) => ({
        ...prev,
        direct: {
          feeds: {
            count: feeds?.length || 0,
            items: feeds || [],
          },
          rssItems: {
            count: rssItems.length,
            items: rssItems,
          },
          youtubeItems: {
            count: youtubeItems.length,
            items: youtubeItems,
          },
        },
      }));
    } catch (error) {
      console.error("Doğrudan test hatası:", error);
      setTestResults((prev) => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Repository ile test
  const testRepository = async () => {
    if (!userId) return;

    setLoading(true);
    setTestResults((prev) => ({ ...prev, repository: null, error: null }));

    try {
      // Beslemeleri getir
      const feeds = await enhancedFeedRepository.getFeeds(userId);

      // Feed ID'lerini topla
      const feedIds = feeds.map((feed) => feed.id);

      // İçerikleri getir
      const items = await enhancedFeedRepository.getFeedItems(
        feedIds,
        10,
        null,
        userId
      );

      // RSS ve YouTube içeriklerini ayır
      const rssItems = items.filter((item) => item.itemType === "rss");
      const youtubeItems = items.filter((item) => item.itemType === "youtube");

      setTestResults((prev) => ({
        ...prev,
        repository: {
          feeds: {
            count: feeds.length,
            items: feeds,
          },
          allItems: {
            count: items.length,
            items: items,
          },
          rssItems: {
            count: rssItems.length,
            items: rssItems,
          },
          youtubeItems: {
            count: youtubeItems.length,
            items: youtubeItems,
          },
        },
      }));
    } catch (error) {
      console.error("Repository test hatası:", error);
      setTestResults((prev) => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // Servis ile test
  const testService = async () => {
    if (!userId) return;

    setLoading(true);
    setTestResults((prev) => ({ ...prev, service: null, error: null }));

    try {
      // Beslemeleri getir
      const feeds = await enhancedFeedService.getFeeds(userId);

      // Feed ID'lerini topla
      const feedIds = feeds.map((feed) => feed.id);

      // İçerikleri getir
      const items = await enhancedFeedService.getFeedItems(feedIds, 10, userId);

      // Favorileri getir
      const favorites = await enhancedFeedService.getFavorites(userId);

      // Daha sonra oku listesini getir
      const readLater = await enhancedFeedService.getReadLaterItems(userId);

      setTestResults((prev) => ({
        ...prev,
        service: {
          feeds: {
            count: feeds.length,
            items: feeds,
          },
          allItems: {
            count: items.length,
            items: items,
          },
          favorites: {
            count: favorites.length,
            items: favorites,
          },
          readLater: {
            count: readLater.length,
            items: readLater,
          },
        },
      }));
    } catch (error) {
      console.error("Servis test hatası:", error);
      setTestResults((prev) => ({ ...prev, error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Sistem Test & Tanılama</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          Bu sayfa, farklı katmanları test ederek veri erişimindeki sorunları
          tespit etmenize yardımcı olur. Doğrudan Supabase, Repository katmanı
          ve Servis katmanı ile testler yapabilirsiniz.
        </p>
      </div>

      {/* Kullanıcı ID Girişi */}
      <div className="p-4 border rounded-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Kullanıcı Kimliği</h2>
        <div className="flex gap-3 items-end mb-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Kullanıcı ID:</label>
            <input
              type="text"
              value={userId}
              onChange={handleUserIdChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={saveUserId}
            className="px-4 py-2 bg-gray-200 rounded"
            disabled={!userId}
          >
            Kaydet
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Oturum açtıysanız, ID otomatik olarak doldurulur. Açık değilse, manuel
          olarak ID girebilirsiniz.
        </p>
      </div>

      {/* Test Butonları */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={testDirect}
          disabled={loading || !userId}
          className={`px-4 py-2 rounded ${
            tab === "direct" ? "bg-blue-600 text-white" : "bg-blue-100"
          }`}
          onMouseOver={() => !loading && setTab("direct")}
        >
          Doğrudan Supabase Testi
        </button>
        <button
          onClick={testRepository}
          disabled={loading || !userId}
          className={`px-4 py-2 rounded ${
            tab === "repository" ? "bg-blue-600 text-white" : "bg-blue-100"
          }`}
          onMouseOver={() => !loading && setTab("repository")}
        >
          Repository Testi
        </button>
        <button
          onClick={testService}
          disabled={loading || !userId}
          className={`px-4 py-2 rounded ${
            tab === "service" ? "bg-blue-600 text-white" : "bg-blue-100"
          }`}
          onMouseOver={() => !loading && setTab("service")}
        >
          Servis Testi
        </button>
      </div>

      {/* Hata Gösterimi */}
      {testResults.error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-semibold text-red-700 mb-2">Hata Oluştu:</h3>
          <p className="text-red-600">{testResults.error}</p>
        </div>
      )}

      {/* Test Sonuçları */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b">
          <h2 className="font-semibold">
            {tab === "direct"
              ? "Doğrudan Supabase"
              : tab === "repository"
              ? "Repository Katmanı"
              : "Servis Katmanı"}{" "}
            Test Sonuçları
          </h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <p>Test çalışıyor, lütfen bekleyin...</p>
          </div>
        ) : (
          <div>
            {/* Doğrudan Test Sonuçları */}
            {tab === "direct" && testResults.direct && (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    Beslemeler ({testResults.direct.feeds.count})
                  </h3>
                  {testResults.direct.feeds.count > 0 ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        testResults.direct.feeds.items[0],
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <p className="text-amber-600">Besleme bulunamadı</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      RSS Öğeleri ({testResults.direct.rssItems.count})
                    </h3>
                    {testResults.direct.rssItems.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.direct.rssItems.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">RSS öğesi bulunamadı</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">
                      YouTube Öğeleri ({testResults.direct.youtubeItems.count})
                    </h3>
                    {testResults.direct.youtubeItems.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.direct.youtubeItems.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">YouTube öğesi bulunamadı</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Repository Test Sonuçları */}
            {tab === "repository" && testResults.repository && (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    Beslemeler ({testResults.repository.feeds.count})
                  </h3>
                  {testResults.repository.feeds.count > 0 ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        testResults.repository.feeds.items[0],
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <p className="text-amber-600">Besleme bulunamadı</p>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    Tüm İçerikler ({testResults.repository.allItems.count})
                  </h3>
                  {testResults.repository.allItems.count > 0 ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        testResults.repository.allItems.items[0],
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <p className="text-amber-600">İçerik bulunamadı</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      RSS Öğeleri ({testResults.repository.rssItems.count})
                    </h3>
                    {testResults.repository.rssItems.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.repository.rssItems.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">RSS öğesi bulunamadı</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">
                      YouTube Öğeleri (
                      {testResults.repository.youtubeItems.count})
                    </h3>
                    {testResults.repository.youtubeItems.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.repository.youtubeItems.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">YouTube öğesi bulunamadı</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Servis Test Sonuçları */}
            {tab === "service" && testResults.service && (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    Beslemeler ({testResults.service.feeds.count})
                  </h3>
                  {testResults.service.feeds.count > 0 ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        testResults.service.feeds.items[0],
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <p className="text-amber-600">Besleme bulunamadı</p>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">
                    İçerikler ({testResults.service.allItems.count})
                  </h3>
                  {testResults.service.allItems.count > 0 ? (
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(
                        testResults.service.allItems.items[0],
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <p className="text-amber-600">İçerik bulunamadı</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">
                      Favoriler ({testResults.service.favorites.count})
                    </h3>
                    {testResults.service.favorites.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.service.favorites.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">Favori bulunamadı</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">
                      Daha Sonra Okunacaklar (
                      {testResults.service.readLater.count})
                    </h3>
                    {testResults.service.readLater.count > 0 ? (
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(
                          testResults.service.readLater.items[0],
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <p className="text-amber-600">
                        Daha sonra okunacak öğe bulunamadı
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Henüz test çalıştırılmadıysa */}
            {!testResults[tab] && !loading && (
              <div className="p-8 text-center text-gray-500">
                Bu katman için henüz test çalıştırılmadı
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
