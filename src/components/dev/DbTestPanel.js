"use client";

import { useState, useEffect } from "react";
import { runAllTests } from "@/utils/dbTest";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Veritabanı bağlantı testleri için geliştirici paneli
 */
export default function DbTestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const supabase = createClientComponentClient();

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error("Kimlik doğrulama hatası:", error);
      }
    };

    checkAuth();
  }, []);

  const runTests = async () => {
    if (!userId) {
      console.error("Kullanıcı ID'si bulunamadı");
      return;
    }

    setLoading(true);
    try {
      const result = await runAllTests(userId);
      setResults(result);
      console.log("DB Test Sonuçları:", result);
    } catch (error) {
      console.error("Test hatası:", error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={toggle}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded shadow-lg"
      >
        {isOpen ? "DB Test Panelini Kapat" : "DB Test Panelini Aç"}
      </button>

      {isOpen && (
        <div className="absolute bottom-14 left-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
          <h3 className="text-lg font-bold mb-4">Veritabanı Test Paneli</h3>

          <div className="mb-4">
            <p className="mb-2">
              <strong>Kullanıcı ID:</strong> {userId || "Bulunamadı"}
            </p>
          </div>

          <button
            onClick={runTests}
            disabled={loading || !userId}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
          >
            {loading ? "Test Çalışıyor..." : "Veritabanı Testlerini Çalıştır"}
          </button>

          {results.error && (
            <div className="p-3 bg-red-100 text-red-800 rounded mb-4">
              <strong>Hata:</strong> {results.error}
            </div>
          )}

          {results.connection && (
            <div className="mb-4">
              <h4 className="font-bold">Bağlantı Testi:</h4>
              <p
                className={
                  results.connection.success ? "text-green-500" : "text-red-500"
                }
              >
                {results.connection.message}
              </p>
            </div>
          )}

          {results.feeds && (
            <div className="mb-4">
              <h4 className="font-bold">Feed Testi:</h4>
              <p>Bulunan Feed Sayısı: {results.feeds.count || 0}</p>
              {results.feeds.error && (
                <p className="text-red-500">Hata: {results.feeds.error}</p>
              )}
            </div>
          )}

          {results.items && (
            <div className="mb-4">
              <h4 className="font-bold">İçerik Testi:</h4>
              <p>RSS Öğeleri: {results.items.rssCount || 0}</p>
              <p>YouTube Öğeleri: {results.items.youtubeCount || 0}</p>
              {results.items.error && (
                <p className="text-red-500">Hata: {results.items.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
