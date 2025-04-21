"use client";

import { useState, useEffect } from "react";
import { authDebug } from "@/debug/authState";
import { feedDebug } from "@/debug/feedState";
import { db } from "@/lib/db";
import { RepositoryFixer } from "@/debug/RepositoryFixer";
import { RepositoryValidator } from "@/debug/RepositoryValidator";
import { FeedRepository } from "@/repositories/feedRepository";

// Repository sınıfını dinamik olarak başlat
let feedRepositoryInstance = null;

/**
 * Feed veri sorunlarını debug ve onarma arayüzü
 */
export default function FeedSelfFixPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [fixInProgress, setFixInProgress] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [repositoryLoaded, setRepositoryLoaded] = useState(false);

  // FeedRepository sınıfını başlat
  useEffect(() => {
    if (isOpen && !repositoryLoaded) {
      try {
        feedRepositoryInstance = new FeedRepository();
        setRepositoryLoaded(true);
      } catch (error) {
        console.error("FeedRepository başlatılırken hata:", error);
      }
    }
  }, [isOpen, repositoryLoaded]);

  // Kullanıcı kimliğini al
  useEffect(() => {
    const getUserId = async () => {
      const id = await authDebug.getUserId();
      setUserId(id);
    };

    if (isOpen) {
      getUserId();
    }
  }, [isOpen]);

  // Tanılama çalıştır
  const runDiagnosis = async () => {
    if (!userId) {
      alert("Kullanıcı ID'si bulunamadı. Lütfen oturum açın.");
      return;
    }

    setIsLoading(true);
    setResults({});

    try {
      const diagnosticResult = await feedDebug.diagnoseSystem(userId);
      setResults(diagnosticResult);
      console.log("Tanılama sonuçları:", diagnosticResult);
    } catch (error) {
      console.error("Tanılama hatası:", error);
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Repository metotlarını doğrula
  const runRepositoryValidation = async () => {
    if (!userId || !repositoryLoaded) {
      alert(
        repositoryLoaded
          ? "Kullanıcı ID'si bulunamadı. Lütfen oturum açın."
          : "Repository sınıfı henüz yüklenmedi. Lütfen bekleyin."
      );
      return;
    }

    setIsLoading(true);
    setResults({});

    try {
      // 1. Kullanıcının feed'lerini al
      const feedsResult = await feedDebug.checkFeeds(userId);

      if (
        !feedsResult.success ||
        !feedsResult.feeds ||
        feedsResult.feeds.length === 0
      ) {
        setResults({
          success: false,
          message:
            "Kullanıcı feed'leri alınamadı. Önce feed'leri kontrol edin.",
          feedsResult,
        });
        return;
      }

      const feedIds = feedsResult.feeds.map((feed) => feed.id);

      // 2. getFeedItems metodunu doğrula
      const getFeedItemsValidation =
        await RepositoryValidator.validateGetFeedItems(
          feedRepositoryInstance,
          feedIds,
          userId
        );

      // 3. Sonuçları raporla
      const hasProblem =
        getFeedItemsValidation.analysis?.hasParameterOrderIssue;

      const validationResults = {
        success: !hasProblem,
        message: hasProblem
          ? "Repository metodlarında parametre sırası sorunu tespit edildi"
          : "Repository metodları doğru çalışıyor",
        timestamp: new Date().toISOString(),
        feedsResult,
        methodValidation: getFeedItemsValidation,
        hasProblem,
        problemType: hasProblem ? "parameterOrder" : null,
      };

      setResults(validationResults);
      console.log("Repository doğrulama sonuçları:", validationResults);
    } catch (error) {
      console.error("Repository doğrulama hatası:", error);
      setResults({
        success: false,
        message: "Repository doğrulama sırasında hata oluştu",
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gelişmiş tanılama ve onarım
  const runAdvancedDiagnosis = async () => {
    if (!userId) {
      alert("Kullanıcı ID'si bulunamadı. Lütfen oturum açın.");
      return;
    }

    setIsLoading(true);
    setResults({});

    try {
      // 1. Repository metotlarını doğrula
      if (repositoryLoaded) {
        await runRepositoryValidation();
      }

      // 2. Eksik etkileşimleri onar
      const diagnosticResult = await RepositoryFixer.diagnoseAndFix(userId);
      setResults(diagnosticResult);
      console.log("Gelişmiş tanılama ve onarım sonuçları:", diagnosticResult);
    } catch (error) {
      console.error("Gelişmiş tanılama hatası:", error);
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Sorunu otomatik düzelt
  const fixIssue = async () => {
    if (!userId) {
      alert("Kullanıcı ID'si bulunamadı. Lütfen oturum açın.");
      return;
    }

    setFixInProgress(true);
    setFixResult(null);

    try {
      // 1. Eksik etkileşimleri onar
      const interactionFixResult =
        await RepositoryValidator.applyInteractionFix(userId);

      // 2. Önbelleği temizle
      await clearCaches();

      // 3. Yeniden tanılama çalıştır
      const diagnosticResult = await feedDebug.diagnoseSystem(userId);

      // 4. Sonucu rapor et
      setFixResult({
        success: interactionFixResult.success,
        interactions: interactionFixResult,
        diagnostic: diagnosticResult,
      });

      console.log("Onarım tamamlandı:", {
        interactionFixResult,
        diagnostic: diagnosticResult,
      });
    } catch (error) {
      console.error("Onarım hatası:", error);
      setFixResult({
        success: false,
        error: error.message,
      });
    } finally {
      setFixInProgress(false);
    }
  };

  // Önbellekleri temizle
  const clearCaches = async () => {
    try {
      // 1. DbClient önbelleğini temizle
      db.clearCache();

      // 2. Tarayıcı önbelleğini temizle
      localStorage.removeItem("feedtune_cache");
      sessionStorage.removeItem("feedtune_cache");

      return true;
    } catch (error) {
      console.error("Önbellek temizleme hatası:", error);
      return false;
    }
  };

  const togglePanel = () => setIsOpen(!isOpen);
  const toggleAdvancedMode = () => setAdvancedMode(!advancedMode);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePanel}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2"
      >
        <span>🔧</span>
        <span>Onarım Paneli</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-[500px] max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Feed Sistemi Onarım Paneli</h3>
            <button
              onClick={togglePanel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Kullanıcı bilgisi */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Kullanıcı Bilgisi</h4>
            <p>
              <strong>Kullanıcı ID:</strong> {userId || "Bulunamadı"}
            </p>
            {!userId && (
              <p className="text-red-500 mt-2">
                Lütfen önce oturum açın veya refresh yapın
              </p>
            )}
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <strong>Repository Durumu:</strong>{" "}
              {repositoryLoaded ? "Yüklendi ✓" : "Yükleniyor..."}
            </p>
          </div>

          {/* Mod seçimi */}
          <div className="mb-4 flex items-center">
            <label
              htmlFor="advancedMode"
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  id="advancedMode"
                  type="checkbox"
                  className="sr-only"
                  checked={advancedMode}
                  onChange={toggleAdvancedMode}
                />
                <div
                  className={`block ${
                    advancedMode
                      ? "bg-blue-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  } w-12 h-6 rounded-full transition-colors`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                    advancedMode ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </div>
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                Gelişmiş Mod
              </span>
            </label>
          </div>

          {/* Tanılama */}
          <div className="mb-6 flex flex-wrap gap-2">
            {!advancedMode ? (
              <>
                <button
                  onClick={runDiagnosis}
                  disabled={isLoading || !userId}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? "Tanılama..." : "Sistemi Tanıla"}
                </button>

                <button
                  onClick={fixIssue}
                  disabled={fixInProgress || !userId}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {fixInProgress ? "Onarılıyor..." : "Otomatik Onar"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={runAdvancedDiagnosis}
                  disabled={isLoading || !userId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 flex-grow"
                >
                  {isLoading ? "İşlem Yapılıyor..." : "Gelişmiş Tanı ve Onarım"}
                </button>

                {repositoryLoaded && (
                  <button
                    onClick={runRepositoryValidation}
                    disabled={isLoading || !userId}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    Repository Kontrol
                  </button>
                )}
              </>
            )}
          </div>

          {/* Metot Validasyon Sonuçları */}
          {results.methodValidation && (
            <div
              className={`p-4 rounded-lg mb-4 ${
                results.success
                  ? "bg-green-100 dark:bg-green-800/20"
                  : "bg-yellow-100 dark:bg-yellow-800/20"
              }`}
            >
              <h4 className="font-bold mb-2">Repository Analizi:</h4>
              <p className="mb-2">{results.message}</p>

              {results.hasProblem && (
                <div className="bg-white dark:bg-gray-900 p-3 rounded border border-yellow-300 dark:border-yellow-700 mb-3">
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    Tespit Edilen Sorun:
                  </p>
                  <p className="text-sm">
                    {results.methodValidation.analysis.recommendedFix}
                  </p>
                </div>
              )}

              <div className="mt-3 text-sm">
                <p>
                  <strong>Standart Çağrı:</strong>{" "}
                  {results.methodValidation.standardResult.success
                    ? `Başarılı, ${
                        results.methodValidation.standardResult
                          .interactionCount || 0
                      } etkileşim`
                    : "Başarısız"}
                </p>
                <p>
                  <strong>Ters Parametre Çağrısı:</strong>{" "}
                  {results.methodValidation.reversedResult.success
                    ? `Başarılı, ${
                        results.methodValidation.reversedResult
                          .interactionCount || 0
                      } etkileşim`
                    : "Başarısız"}
                </p>
              </div>
            </div>
          )}

          {/* Sonuçlar */}
          {results.success !== undefined && !results.methodValidation && (
            <div
              className={`p-4 rounded-lg mb-4 ${
                results.success
                  ? "bg-green-100 dark:bg-green-800/20"
                  : "bg-red-100 dark:bg-red-800/20"
              }`}
            >
              <h4 className="font-bold mb-2">Tanılama Sonucu:</h4>
              <p>{results.message}</p>

              {/* Gelişmiş mod - adım adım sonuçlar */}
              {advancedMode && results.steps && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h5 className="font-semibold mb-2">Adım Adım Sonuçlar:</h5>

                  {/* Veritabanı Bağlantısı */}
                  {results.steps.dbConnection && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Veritabanı Bağlantısı:</p>
                      <p
                        className={
                          results.steps.dbConnection.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.steps.dbConnection.message}
                      </p>
                    </div>
                  )}

                  {/* Feed Bilgileri */}
                  {results.steps.feeds && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Feed Kayıtları:</p>
                      <p
                        className={
                          results.steps.feeds.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.steps.feeds.message}
                      </p>
                    </div>
                  )}

                  {/* İçerik Bilgileri */}
                  {results.steps.feedContent && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Feed İçeriği:</p>
                      <p
                        className={
                          results.steps.feedContent.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.steps.feedContent.message}
                      </p>
                    </div>
                  )}

                  {/* Etkileşim Bilgileri */}
                  {results.steps.interactions && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Etkileşimler:</p>
                      <p>{results.steps.interactions.message}</p>
                    </div>
                  )}

                  {/* Onarım Bilgileri */}
                  {results.steps.repair && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Onarım:</p>
                      <p
                        className={
                          results.steps.repair.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.steps.repair.message}
                      </p>
                    </div>
                  )}

                  {/* Önbellek Temizleme */}
                  {results.steps.cacheCleared && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium">Önbellek Temizleme:</p>
                      <p
                        className={
                          results.steps.cacheCleared.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.steps.cacheCleared.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Basit mod gösterimi */}
              {!advancedMode && (
                <>
                  {/* Veritabanı durumu */}
                  {results.dbConnection && (
                    <div className="mt-4">
                      <h5 className="font-semibold">Veritabanı Bağlantısı:</h5>
                      <p
                        className={
                          results.dbConnection.success
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {results.dbConnection.message}
                      </p>
                      {results.dbConnection.pingTime && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Yanıt süresi: {results.dbConnection.pingTime}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Feed bilgileri */}
                  {results.userFeeds && (
                    <div className="mt-4">
                      <h5 className="font-semibold">Feed Abonelikleri:</h5>
                      <p>
                        {results.userFeeds.success
                          ? `${results.userFeeds.feedCount} feed bulundu`
                          : results.userFeeds.message}
                      </p>
                    </div>
                  )}

                  {/* İçerik bilgileri */}
                  {results.rssItems && (
                    <div className="mt-4">
                      <h5 className="font-semibold">RSS İçeriği:</h5>
                      <p>
                        {results.rssItems.success
                          ? results.rssItems.message
                          : results.rssItems.message}
                      </p>
                    </div>
                  )}

                  {results.youtubeItems && (
                    <div className="mt-4">
                      <h5 className="font-semibold">YouTube İçeriği:</h5>
                      <p>
                        {results.youtubeItems.success
                          ? results.youtubeItems.message
                          : results.youtubeItems.message}
                      </p>
                    </div>
                  )}

                  {/* Etkileşim bilgileri */}
                  {results.userInteractions && (
                    <div className="mt-4">
                      <h5 className="font-semibold">
                        Kullanıcı Etkileşimleri:
                      </h5>
                      <p>
                        {results.userInteractions.success
                          ? results.userInteractions.message
                          : results.userInteractions.message}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Onarım sonuçları */}
          {!advancedMode && fixResult && (
            <div
              className={`p-4 rounded-lg ${
                fixResult.success
                  ? "bg-green-100 dark:bg-green-800/20"
                  : "bg-red-100 dark:bg-red-800/20"
              }`}
            >
              <h4 className="font-bold mb-2">Onarım Sonucu:</h4>

              {fixResult.success ? (
                <>
                  <p className="text-green-600 dark:text-green-400 mb-2">
                    Onarım işlemi başarıyla tamamlandı!
                  </p>

                  {fixResult.interactions && (
                    <div className="mt-2">
                      <h5 className="font-semibold">Etkileşim Onarımı:</h5>
                      <p>{fixResult.interactions.message}</p>

                      {fixResult.interactions.created > 0 && (
                        <div className="mt-2 text-sm">
                          <p>
                            Onarılan etkileşimler:{" "}
                            {fixResult.interactions.created}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-gray-700 dark:text-gray-300">
                      Sayfayı yenileyin veya tekrar tanı çalıştırın.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-red-600 dark:text-red-400 mb-2">
                    Onarım sırasında bir hata oluştu.
                  </p>
                  {fixResult.error && (
                    <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {fixResult.error}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Yardım Bilgisi */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold mb-2">Yardım</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bu panel feed verilerini görüntüleme sorunlarını tanılamak ve
              onarmak için kullanılır.
              {!advancedMode ? (
                <>
                  "Sistemi Tanıla" butonu ile feed sisteminin durumunu kontrol
                  edebilirsiniz. "Otomatik Onar" butonu ile veri ilişkilendirme
                  ve önbellek sorunlarını düzeltebilirsiniz.
                </>
              ) : (
                <>
                  "Gelişmiş Tanı ve Onarım" butonu ile tüm sistem bileşenlerini
                  kontrol edip otomatik onarım yapabilirsiniz. "Repository
                  Kontrol" butonu ile metot çağrılarındaki parametre sırası
                  sorunlarını tespit edebilirsiniz.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
