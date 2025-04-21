"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Feed sorunlarını bildiren ve kullanıcıya yardım eden banner bileşeni
 * @param {Object} props - Bileşen props'ları
 * @param {boolean} props.visible - Banner'ın görünür olup olmadığı
 * @param {Function} props.onDismiss - Banner kapatıldığında çağrılacak fonksiyon
 * @param {string} props.issueType - Sorun türü: 'noContent', 'loading', 'error'
 * @returns {JSX.Element} - Banner bileşeni
 */
export default function FeedTroubleshootBanner({
  visible = false,
  onDismiss,
  issueType = "noContent",
}) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();
  const [isDocAvailable, setIsDocAvailable] = useState(false);

  // Yardım dokümanının varlığını kontrol et
  useEffect(() => {
    // Sadece istemci tarafında çalışmalı
    if (typeof window !== "undefined") {
      // Dokümanın var olup olmadığını kontrol etmek için fetch işlemi
      fetch("/api/check-docs?doc=USER_GUIDE_FEED_ISSUES.md")
        .then((response) => {
          if (response.ok) {
            setIsDocAvailable(true);
          }
        })
        .catch(() => {
          // Hata durumunda dokümanı kullanılamaz olarak işaretle
          setIsDocAvailable(false);
        });
    }
  }, []);

  if (!visible || dismissed) {
    return null;
  }

  // Sorun türüne göre mesaj seç
  const getMessage = () => {
    switch (issueType) {
      case "noContent":
        return (
          t("feedErrors.noContent") ||
          "Feed içeriğinizi görüntülemede sorun yaşıyoruz. Onarım aracını kullanmak ister misiniz?"
        );
      case "loading":
        return (
          t("feedErrors.loading") ||
          "Feed içeriğiniz çok yavaş yükleniyor. Onarım aracını kullanarak hızlandırabilirsiniz."
        );
      case "error":
        return (
          t("feedErrors.error") ||
          "Feed verilerinizi yüklerken bir hata oluştu. Onarım aracı sorunu çözebilir."
        );
      default:
        return (
          t("feedErrors.general") ||
          "Feed görüntüleme sorunlarını çözmek için onarım aracını kullanabilirsiniz."
        );
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }

    // 24 saat boyunca gösterme (localStorage'da kaydet)
    localStorage.setItem("feedErrorBannerDismissed", Date.now().toString());
  };

  const openRepairPanel = () => {
    // Global onarım paneli nesnesini kontrol et ve aç
    if (
      window.openRepairPanel &&
      typeof window.openRepairPanel === "function"
    ) {
      window.openRepairPanel();
      handleDismiss();
    } else {
      // Onarım paneli bulunamadıysa yönlendirme yap
      alert(
        t("feedErrors.repairNotAvailable") ||
          "Onarım aracı yüklenemedi. Sayfayı yenileyin ve tekrar deneyin."
      );
    }
  };

  return (
    <div className="relative mt-2 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-500 dark:text-amber-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {getMessage()}
          </p>
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={openRepairPanel}
              className="mr-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {t("actions.repair") || "Onar"}
            </button>

            {isDocAvailable && (
              <Link
                href="/docs/USER_GUIDE_FEED_ISSUES"
                className="rounded-md border border-amber-600 bg-transparent px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500 mr-2"
              >
                {t("actions.help") || "Yardım"}
              </Link>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-md border border-transparent bg-transparent px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {t("actions.dismiss") || "Kapat"}
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex rounded-md p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <span className="sr-only">{t("actions.dismiss") || "Kapat"}</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
