"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function FeedDebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [feedSummary, setFeedSummary] = useState(null);
  const [contentSummary, setContentSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error("Kimlik doğrulama hatası:", error);
      }
    }

    checkAuth();
  }, []);

  // Feed verilerini getir
  const fetchFeedInfo = async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      // Feed'leri getir
      const { data: feeds, error: feedError } = await supabase
        .from("feeds")
        .select("id, title, url, type, created_at")
        .eq("user_id", userData.id)
        .is("deleted_at", null);

      if (feedError) throw feedError;

      // Feed tiplerini say
      const rssFeeds = feeds.filter(
        (f) => f.type === "rss" || f.type === "atom"
      );
      const youtubeFeeds = feeds.filter((f) => f.type === "youtube");

      setFeedSummary({
        total: feeds.length,
        rss: rssFeeds.length,
        youtube: youtubeFeeds.length,
        feeds: feeds.slice(0, 3), // Sadece ilk 3 feed'i göster
      });

      // RSS içerikleri
      if (rssFeeds.length > 0) {
        const rssIds = rssFeeds.map((f) => f.id);
        const { data: rssItems, error: rssError } = await supabase
          .from("rss_items")
          .select("id, title, feed_id, published_at")
          .in("feed_id", rssIds)
          .order("published_at", { ascending: false })
          .limit(10);

        if (rssError) throw rssError;

        // YouTube içerikleri
        const youtubeIds = youtubeFeeds.map((f) => f.id);
        let youtubeItems = [];

        if (youtubeIds.length > 0) {
          const { data: ytItems, error: ytError } = await supabase
            .from("youtube_items")
            .select("id, title, feed_id, published_at")
            .in("feed_id", youtubeIds)
            .order("published_at", { ascending: false })
            .limit(10);

          if (ytError) throw ytError;
          youtubeItems = ytItems || [];
        }

        // Kullanıcı etkileşimleri
        const { data: interactions, error: intError } = await supabase
          .from("user_item_interactions")
          .select("id, item_id, item_type, is_read, is_favorite, is_read_later")
          .eq("user_id", userData.id)
          .limit(50);

        if (intError) throw intError;

        setContentSummary({
          rssCount: rssItems?.length || 0,
          youtubeCount: youtubeItems?.length || 0,
          rssItems: rssItems?.slice(0, 3) || [],
          youtubeItems: youtubeItems?.slice(0, 3) || [],
          interactionCount: interactions?.length || 0,
          favorites: interactions?.filter((i) => i.is_favorite)?.length || 0,
          readLater: interactions?.filter((i) => i.is_read_later)?.length || 0,
          read: interactions?.filter((i) => i.is_read)?.length || 0,
        });
      }
    } catch (error) {
      console.error("Veri getirme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-4 top-20 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded shadow-lg"
      >
        {isVisible ? "Bilgi Panelini Kapat" : "Feed Bilgisi"}
      </button>

      {isVisible && (
        <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
          <h3 className="text-lg font-bold mb-4">Feed Veri Durumu</h3>

          <div className="mb-4">
            <h4 className="font-bold text-sm mb-2">Kullanıcı Durumu:</h4>
            {userData ? (
              <div className="text-xs">
                <p>
                  <span className="font-semibold">ID:</span>{" "}
                  {userData.id.substring(0, 8)}...
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {userData.email}
                </p>
              </div>
            ) : (
              <p className="text-red-500 text-sm">Oturum açılmamış</p>
            )}
          </div>

          <div className="mb-4">
            <button
              onClick={fetchFeedInfo}
              disabled={loading || !userData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Veri getiriliyor..." : "Feed Verilerini Getir"}
            </button>
          </div>

          {feedSummary && (
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">Feed Özeti:</h4>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">{feedSummary.total}</div>
                  <div className="text-xs">Toplam</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">{feedSummary.rss}</div>
                  <div className="text-xs">RSS</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">{feedSummary.youtube}</div>
                  <div className="text-xs">YouTube</div>
                </div>
              </div>

              {feedSummary.feeds.length > 0 && (
                <div className="text-xs">
                  <p className="font-semibold mb-1">İlk Beslemeler:</p>
                  <ul className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {feedSummary.feeds.map((feed, i) => (
                      <li key={i} className="mb-1">
                        <span className="font-semibold">{feed.title}</span> (
                        {feed.type})
                      </li>
                    ))}
                    {feedSummary.total > 3 && (
                      <li className="text-gray-500">
                        ...ve {feedSummary.total - 3} besleme daha
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {contentSummary && (
            <div>
              <h4 className="font-bold text-sm mb-2">İçerik Özeti:</h4>
              <div className="grid grid-cols-2 gap-2 text-center mb-2">
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">
                    {contentSummary.rssCount}
                  </div>
                  <div className="text-xs">RSS Öğesi</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">
                    {contentSummary.youtubeCount}
                  </div>
                  <div className="text-xs">YouTube Öğesi</div>
                </div>
              </div>

              <h4 className="font-bold text-sm mt-3 mb-1">Etkileşim Özeti:</h4>
              <div className="grid grid-cols-4 gap-2 text-center mb-2">
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">
                    {contentSummary.interactionCount}
                  </div>
                  <div className="text-xs">Toplam</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">
                    {contentSummary.favorites}
                  </div>
                  <div className="text-xs">Favori</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">
                    {contentSummary.readLater}
                  </div>
                  <div className="text-xs">Sonra Oku</div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                  <div className="text-lg font-bold">{contentSummary.read}</div>
                  <div className="text-xs">Okundu</div>
                </div>
              </div>

              {contentSummary.rssItems.length > 0 && (
                <div className="text-xs mt-3">
                  <p className="font-semibold mb-1">İlk RSS Öğeleri:</p>
                  <ul className="bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                    {contentSummary.rssItems.map((item, i) => (
                      <li key={i} className="mb-1 truncate">
                        {item.title}
                      </li>
                    ))}
                    {contentSummary.rssCount > 3 && (
                      <li className="text-gray-500">
                        ...ve {contentSummary.rssCount - 3} öğe daha
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {contentSummary.youtubeItems.length > 0 && (
                <div className="text-xs">
                  <p className="font-semibold mb-1">İlk YouTube Öğeleri:</p>
                  <ul className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {contentSummary.youtubeItems.map((item, i) => (
                      <li key={i} className="mb-1 truncate">
                        {item.title}
                      </li>
                    ))}
                    {contentSummary.youtubeCount > 3 && (
                      <li className="text-gray-500">
                        ...ve {contentSummary.youtubeCount - 3} öğe daha
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
