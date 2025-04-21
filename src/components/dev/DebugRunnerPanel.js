"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { runDebugTest } from "@/debug/debugTest";

export default function DebugRunnerPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [userId, setUserId] = useState(null);
  const [manualUserId, setManualUserId] = useState("");
  const { user } = useAuthStore();

  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  const togglePanel = () => setIsOpen(!isOpen);

  const runTest = async () => {
    if (!userId && !manualUserId) {
      alert("Kullanıcı ID'si gerekli");
      return;
    }

    setLoading(true);
    try {
      const testResult = await runDebugTest(userId || manualUserId);
      setResults(testResult);
    } catch (error) {
      console.error("Test hatası:", error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const saveManualUserId = () => {
    if (manualUserId) {
      setUserId(manualUserId);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePanel}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-lg"
      >
        {isOpen ? "Debug Panelini Kapat" : "Debug Panelini Aç"}
      </button>

      {isOpen && (
        <div className="fixed right-4 bottom-16 w-[500px] max-h-[80vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4">FeedTune Debug Testi</h3>

          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="mb-2">
              <strong>Aktif Kullanıcı ID:</strong> {userId || "Yok"}
            </p>

            {!userId && (
              <div className="flex items-center mt-2 space-x-2">
                <input
                  type="text"
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  placeholder="Kullanıcı ID'si girin"
                  className="flex-1 px-3 py-1 border rounded"
                />
                <button
                  onClick={saveManualUserId}
                  className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1"
                >
                  Kaydet
                </button>
              </div>
            )}
          </div>

          <button
            onClick={runTest}
            disabled={loading || (!userId && !manualUserId)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 mb-4 disabled:opacity-50"
          >
            {loading ? "Test Çalışıyor..." : "Debug Testini Çalıştır"}
          </button>

          {results && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">Test Sonuçları:</h4>

              {results.error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg mb-4">
                  <strong>Hata:</strong> {results.error}
                </div>
              )}

              {/* DB Sonuçları */}
              <ResultSection
                title="Veritabanı Testi"
                data={results.db}
                success={results.db?.success}
              />

              {/* Repository Sonuçları */}
              <ResultSection
                title="Repository Testi"
                data={results.repository}
                success={results.repository?.success}
              />

              {/* Service Sonuçları */}
              <ResultSection
                title="Service Testi"
                data={results.service}
                success={results.service?.success}
              />

              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs opacity-70">
                  Test zamanı: {results.timestamp}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sonuç bölümü komponenti
function ResultSection({ title, data, success }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);

  if (!data) return null;

  return (
    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
      >
        <h5 className="font-semibold flex items-center">
          <span className={success ? "text-green-500" : "text-red-500"}>
            {success ? "✅" : "❌"}
          </span>
          <span className="ml-2">{title}</span>
        </h5>
        <span>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          {/* Feed Sayısı */}
          {data.data?.feedCount !== undefined && (
            <DataItem label="Feed Sayısı" value={data.data.feedCount} />
          )}

          {/* Hata Mesajı */}
          {data.error && (
            <div className="text-red-500 mt-1">
              <strong>Hata:</strong> {data.error}
            </div>
          )}

          {/* İçerik bilgileri */}
          {data.content && (
            <div className="mt-2">
              <h6 className="font-medium">İçerik Bilgileri:</h6>
              {data.content.rssCount !== undefined && (
                <DataItem label="RSS Öğeleri" value={data.content.rssCount} />
              )}
              {data.content.youtubeCount !== undefined && (
                <DataItem
                  label="YouTube Öğeleri"
                  value={data.content.youtubeCount}
                />
              )}
              {data.content.itemCount !== undefined && (
                <DataItem
                  label="Toplam Öğeler"
                  value={data.content.itemCount}
                />
              )}
              {data.content.hasInteractions !== undefined && (
                <DataItem
                  label="Etkileşimler"
                  value={data.content.hasInteractions ? "Var" : "Yok"}
                />
              )}
            </div>
          )}

          {/* Örnek Veriler */}
          {data.feeds?.data && data.feeds.data.length > 0 && (
            <div className="mt-2">
              <h6 className="font-medium">Örnek Feed:</h6>
              <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded text-xs overflow-auto mt-1">
                {JSON.stringify(data.feeds.data[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Veri öğesi komponenti
function DataItem({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm my-1">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
