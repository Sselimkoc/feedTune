"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  Rss,
  X,
  ExternalLink,
  Calendar,
  Clock,
  MousePointerClick,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRssFeeds } from "@/hooks/features/useRssFeeds";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useDebouncedCallback } from "use-debounce";

// Varsayılan favicon URL'si
const DEFAULT_FAVICON = "/images/rss-icon.svg";

/**
 * Özel CSS stilleri
 */
const styles = {
  articleScroller:
    "flex pb-2 overflow-x-hidden snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent scroll-smooth",
  articleContainer: "grid grid-cols-1 sm:grid-cols-3 gap-4 w-full",
  articleItem: "flex-shrink-0 snap-start w-full",
  articlesContainer: "overflow-hidden relative",
};

/**
 * RSS Besleme Ekleme Formu
 *
 * @param {Object} props
 * @param {Function} props.onCancel - İptal edildiğinde çağrılacak fonksiyon
 * @param {Function} props.onSuccess - Başarılı ekleme sonrası çağrılacak fonksiyon
 * @param {Function} props.onPreviewModeChange - Önizleme modu değiştiğinde çağrılacak fonksiyon
 * @param {string} props.initialQuery - Başlangıç için girilen sorgu
 * @param {boolean} props.isParentPreviewMode - Üst bileşenin previewMode durumu
 */
export default function RssFeedForm({
  onCancel,
  onSuccess,
  onPreviewModeChange,
  initialQuery = "",
  isParentPreviewMode = false,
}) {
  // Form state ve input durumu için state
  const [url, setUrl] = useState(initialQuery);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Önizleme durumu state'leri - YouTube formuyla uyumlu isimler
  const [isPreview, setIsPreview] = useState(false);
  const [visibleArticles, setVisibleArticles] = useState(100); // Yüksek bir değer belirterek tümünü göster
  const [previewData, setPreviewData] = useState(null);
  // Kaydırma pozisyonunu takip etmek için yeni state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScrollPosition, setMaxScrollPosition] = useState(0);

  // Referanslar
  const articlesRowRef = useRef(null);
  const prevStateRef = useRef(null); // usePreviewEffectSync için

  const { user } = useAuthStore();
  const { t } = useLanguage();
  const { addRssFeed, validateUrl, parseRssFeed, isAddingRssFeed } =
    useRssFeeds();
  const { i18n } = useTranslation();

  // initialQuery değiştiğinde otomatik olarak preview başlat
  useEffect(() => {
    if (initialQuery && isParentPreviewMode) {
      const timer = setTimeout(() => {
        handlePreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialQuery, isParentPreviewMode]);

  // RSS beslemesi önizleme fonksiyonu - YouTube ile uyumlu logic
  const handlePreview = useCallback(async () => {
    try {
      const currentUrl = url.trim();

      if (!currentUrl) {
        return;
      }

      // URL validasyonu
      const validationError = validateUrl(currentUrl);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Eğer parent bileşen preview modundaysa otomatik olarak preview başlat
      if (isParentPreviewMode && currentUrl) {
        setIsPreview(true);
      }

      // Yükleme durumunu güncelle
      setIsSubmitting(true);
      setError("");

      // Fallback verisini hazırla - hata durumunda en azından bu olacak
      const fallbackData = {
        feed: {
          title: "Yüklenemedi",
          description: "Besleme verileri yüklenemedi. Lütfen tekrar deneyin.",
          link: currentUrl,
          loadError: true,
        },
        items: [],
      };

      // API isteğini 20 saniye timeout ile çevreleyelim
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("İstek zaman aşımına uğradı (20 saniye)"));
        }, 20000);
      });

      try {
        // Race promise ile ya API yanıtı dönecek ya da timeout olacak
        const data = await Promise.race([
          parseRssFeed(currentUrl),
          timeoutPromise,
        ]);

        // Veri geldiyse kontrol et ve güvenli bir şekilde kullan
        if (data && data.feed) {
          // Başarılı yanıt geldiğinde önizleme verilerini ayarla
          setPreviewData(data);
        } else {
          // Veri API'den geldi ama geçersiz
          toast.error("Besleme bilgisi alınamadı. Lütfen tekrar deneyin.");
          setPreviewData(fallbackData);
        }

        // Önizleme modunu korumaya devam et
        if (!isPreview) {
          setIsPreview(true);

          // Parent'a tekrar bildirelim
          if (onPreviewModeChange) {
            onPreviewModeChange(true);
          }
        }
      } catch (error) {
        // Hata türünü belirle ve özel mesajlar oluştur
        let errorMessage = "";
        let errorType = "generic";

        if (error.message.includes("zaman aşımı")) {
          errorMessage =
            "Besleme yükleme zaman aşımına uğradı. Besleme çok büyük olabilir.";
          errorType = "timeout";
        } else if (error.message.includes("çok büyük")) {
          errorMessage =
            "Besleme boyutu çok büyük (5MB limit). Lütfen daha küçük bir besleme deneyin.";
          errorType = "sizeExceeded";
        } else if (
          error.message.includes("ayrıştırılamadı") ||
          error.message.includes("Invalid XML")
        ) {
          errorMessage =
            "Geçersiz RSS besleme formatı. Doğru bir RSS/Atom besleme adresi girdiğinizden emin olun.";
          errorType = "invalidFormat";
        } else if (
          error.message.includes("404") ||
          error.message.includes("bulunamadı")
        ) {
          errorMessage =
            "RSS besleme adresi bulunamadı. Lütfen URL'yi kontrol edin.";
          errorType = "notFound";
        } else {
          errorMessage =
            "Besleme yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.";
          errorType = "generic";
        }

        // Kullanıcıya toast ile bildirim göster
        toast.error(errorMessage, {
          duration: 5000,
          id: "rss-fetch-error",
        });

        // Özel hata verisini ayarla
        const errorData = {
          ...fallbackData,
          feed: {
            ...fallbackData.feed,
            title:
              errorType === "timeout"
                ? "Zaman Aşımı"
                : errorType === "sizeExceeded"
                ? "Besleme Çok Büyük"
                : errorType === "invalidFormat"
                ? "Geçersiz Format"
                : errorType === "notFound"
                ? "Bulunamadı"
                : "Yükleme Hatası",
            description: errorMessage,
            errorType: errorType,
          },
        };

        setPreviewData(errorData);

        // Hata durumunda da önizleme modunda kalmaya devam et
        setIsPreview(true);

        // Parent'a tekrar bildirelim
        if (onPreviewModeChange) {
          onPreviewModeChange(true);
        }
      }
    } catch (error) {
      toast.error("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");

      // Önizleme modunu koruyalım
      setIsPreview(true);

      if (onPreviewModeChange) {
        onPreviewModeChange(true);
      }
    } finally {
      // Her durumda yükleme durumunu güncelle
      setIsSubmitting(false);
    }
  }, [url, onPreviewModeChange, parseRssFeed, validateUrl, isPreview]);

  // Yerel önizleme state'i ile parent bileşen state'i arasındaki senkronizasyonu sağla
  const usePreviewEffectSync = (
    isLocalPreview,
    parentPreviewMode,
    syncCallback
  ) => {
    useEffect(() => {
      if (parentPreviewMode && !isLocalPreview) {
        setIsPreview(true);
        return;
      }

      if (!parentPreviewMode && isLocalPreview) {
        setIsPreview(false);
        return;
      }

      if (isLocalPreview !== parentPreviewMode && syncCallback) {
        syncCallback(isLocalPreview);
      }
    }, [isLocalPreview, parentPreviewMode, syncCallback]);
  };

  // Hook'u kullan
  usePreviewEffectSync(isPreview, isParentPreviewMode, onPreviewModeChange);

  // URL değişimini izle
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Boş giriş kontrolü
    if (!newUrl.trim()) {
      setError("URL zorunludur");
      return;
    }

    // Çok uzun URL kontrolü
    if (newUrl.length > 2000) {
      setError("URL çok uzun");
      return;
    }

    // Anlık doğrulama yapmamak için mevcut hatayı temizle
    // Debounce ile birlikte çalışacak
    setError("");
  };

  // Debounce ile URL doğrulama
  const debouncedValidateUrl = useDebouncedCallback((value) => {
    if (!value.trim()) return; // Boş URL kontrolü zaten yukarıda yapılıyor

    const validationError = validateUrl(value);
    setError(validationError || "");
  }, 300);

  // URL değiştiğinde debounce ile doğrulama yap
  useEffect(() => {
    if (url.trim()) {
      debouncedValidateUrl(url);
    }
  }, [url, debouncedValidateUrl]);

  // RSS beslemesini ekle
  const handleAddFeed = async () => {
    if (!previewData) {
      return toast.error("Önce besleme önizlemesini yapmalısınız");
    }

    setIsSubmitting(true);

    try {
      // Beslemelere ekle
      await addRssFeed(url);

      // Formu temizle
      setUrl("");
      setPreviewData(null);
      setIsPreview(false);

      // Başarı bildirimini gösterme işlemi useRssFeeds hook'unda yapılıyor
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || t("feeds.addRssFeed.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // previewData yüklendiğinde veya değiştiğinde, tüm makaleleri göster
  useEffect(() => {
    if (previewData?.items && previewData.items.length > 0) {
      // Tüm makaleleri görüntülemek için items.length değerini kullan
      setVisibleArticles(previewData.items.length);
    }
  }, [previewData]);

  // Kaydırma olayını dinle ve scroll pozisyonunu güncelle
  useEffect(() => {
    const handleScroll = () => {
      if (!articlesRowRef.current || !previewData?.items) return;

      const { scrollLeft, scrollWidth, clientWidth } = articlesRowRef.current;

      // Sadece kaydırma pozisyonunu güncelle
      setScrollPosition(scrollLeft);
      setMaxScrollPosition(scrollWidth - clientWidth);
    };

    const articlesRow = articlesRowRef.current;
    if (articlesRow) {
      // Event listener'ı ekle ve force update trigger et
      articlesRow.addEventListener("scroll", handleScroll, { passive: true });

      // Initial scroll position - ilk değerleri ayarla
      const { scrollWidth, clientWidth, scrollLeft } = articlesRow;
      setMaxScrollPosition(scrollWidth - clientWidth);
      setScrollPosition(scrollLeft);
    }

    return () => {
      if (articlesRow) {
        articlesRow.removeEventListener("scroll", handleScroll);
      }
    };
  }, [previewData?.items]);

  // visibleArticles değiştiğinde, maxScrollPosition'ı güncelle
  useEffect(() => {
    // Makale sayısı değiştiğinde veya yeni makaleler eklendiğinde
    // maxScrollPosition'ı yeniden hesapla
    if (articlesRowRef.current) {
      const { scrollWidth, clientWidth } = articlesRowRef.current;
      setMaxScrollPosition(scrollWidth - clientWidth);
    }
  }, [visibleArticles, previewData?.items]);

  // Ekran boyutu değiştiğinde maxScrollPosition'ı güncelle
  useEffect(() => {
    const handleResize = () => {
      if (articlesRowRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = articlesRowRef.current;
        setMaxScrollPosition(scrollWidth - clientWidth);
        setScrollPosition(scrollLeft);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fare tekerleği ile yatay kaydırma için olay dinleyicisi
  useEffect(() => {
    const handleWheel = (e) => {
      // Fare tekerleği olayı, yalnızca articlesRowRef.current üzerinde gerçekleşince
      // ve articlesRowRef.current'ın içinde olduğumuzda çalışmalı
      if (!articlesRowRef.current) return;

      // Fare imlecinin articlesRowRef.current içinde olup olmadığını kontrol et
      const rect = articlesRowRef.current.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      // Sadece bileşen içindeyken ve dikey kaydırma (deltaY) olduğunda işlem yap
      if (isInside && e.deltaY !== 0) {
        e.preventDefault(); // Çok önemli: Sayfanın dikey kaydırılmasını engeller
        e.stopPropagation(); // Olayın kabarcıklanmasını durdur

        // Ctrl tuşu ile yakınlaştırmayı engelleme
        if (e.ctrlKey) return;

        articlesRowRef.current.scrollBy({
          left: e.deltaY > 0 ? 100 : -100,
          behavior: "smooth",
        });
      }
    };

    // Fare tekerleği olayını tüm dokümana ekle
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Ana render metodu
  return (
    <div>
      {isPreview ? (
        <div>
          {isSubmitting ? (
            <div className="p-4 sm:p-6 py-8 flex flex-col items-center justify-center space-y-5 text-center border rounded-lg bg-background/50">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div>
                <h3 className="text-lg font-medium">Besleme Yükleniyor</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  RSS besleme verileri alınıyor, lütfen bekleyin...
                </p>
              </div>
            </div>
          ) : previewData?.feed?.loadError || previewData?.feed?.errorType ? (
            <div className="p-5 sm:p-8 flex flex-col items-center justify-center border rounded-lg bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 space-y-5">
              <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="text-center max-w-lg">
                <h3 className="text-lg sm:text-xl font-medium">
                  {previewData.feed.title || "Besleme Yüklenemedi"}
                </h3>

                <p className="text-sm sm:text-base mt-2 mb-4">
                  {previewData.feed.description ||
                    "RSS beslemesi yüklenirken bir sorun oluştu."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setIsPreview(false)}
                    className="border-red-300 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:hover:bg-red-800/30"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Aramaya Dön
                  </Button>

                      <Button
                    onClick={() => handlePreview()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tekrar Dene
                      </Button>
                </div>
              </div>
        </div>
      ) : (
            <>
          {/* RSS Besleme Önizleme - Ana Kart */}
          <Card className="bg-card border-muted shadow-sm mb-5 w-full overflow-hidden">
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                <div className="flex-shrink-0 flex justify-center sm:block">
                  {previewData?.feed?.favicon ? (
                    <img
                      src={previewData.feed.favicon}
                      alt={previewData.feed.title || "RSS Besleme"}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg object-cover border border-muted"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_FAVICON;
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Rss className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3 overflow-hidden">
                  <div>
                    <h3 className="text-lg sm:text-xl font-medium text-center sm:text-left truncate">
                      {previewData?.feed?.title || "İsimsiz Besleme"}
                    </h3>
                    {previewData?.feed?.link && (
                      <div className="flex items-center justify-center sm:justify-start mt-1 sm:mt-2">
                        <a
                          href={previewData.feed.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate max-w-full"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {previewData.feed.link}
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 text-center sm:text-left max-w-full">
                    {previewData?.feed?.description || "Açıklama yok"}
                  </p>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-2 pt-1 sm:pt-2 items-center sm:items-start">
                    {previewData?.feed?.language && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs py-1 sm:py-1.5 whitespace-nowrap"
                      >
                        {previewData.feed.language.toUpperCase()}
                      </Badge>
                    )}
                    {previewData?.feed?.lastBuildDate && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs py-1 sm:py-1.5 whitespace-nowrap"
                      >
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            {t("feeds.lastUpdated", {
                              date: formatDate(previewData.feed.lastBuildDate),
                            })}
                      </Badge>
                    )}

                    <Button
                      className="sm:ml-auto flex-shrink-0 w-full sm:w-auto"
                      variant="default"
                      size="sm"
                      disabled={isAddingRssFeed}
                      onClick={handleAddFeed}
                    >
                      {isAddingRssFeed ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Ekleniyor...
                        </>
                      ) : (
                        <>
                          <Check className="mr-1.5 h-3 w-3" />
                          Beslemeyi Ekle
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Son Makaleler - Kaydırmalı Görünüm */}
          {previewData?.items && previewData.items.length > 0 && (
                <Card
                  className={cn(
                    "bg-card border-muted shadow-sm",
                    styles.articlesContainer
                  )}
                >
              <CardContent className="py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <h4 className="text-sm sm:text-base font-medium">
                      Son Makaleler
                    </h4>
                        <Badge variant="secondary" className="ml-2">
                          {t("feeds.articleCount", {
                            count: previewData.items.length,
                          })}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <HoverCard openDelay={0} closeDelay={200}>
                          <HoverCardTrigger asChild>
                            <div className="hidden sm:flex items-center cursor-help text-xs text-muted-foreground border border-dashed border-muted-foreground/40 rounded-md px-1.5 py-0.5">
                              <MousePointerClick className="h-3 w-3 mr-1" />
                              <span>Fare tekerleği ile kaydır</span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-80 text-sm p-3"
                            side="bottom"
                          >
                            <div className="flex justify-between space-x-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">
                                  Kolay Kaydırma
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Makaleler arasında geçiş yapmak için fare
                                  imlecini makalelerin üzerine getirip fare
                                  tekerleğini kullanabilirsiniz.
                                </p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        {/* Mobil cihazlar için kaydırma ipucu */}
                        <div className="flex sm:hidden items-center text-[9px] text-muted-foreground">
                          <span className="animate-pulse">← kaydır →</span>
                        </div>
                      </div>
                    </div>

                    {/* Scroll Container */}
                    <div
                      className="relative w-full overflow-hidden"
                      style={{
                        height: previewData.items.length > 0 ? "auto" : "0",
                      }}
                    >
                      {/* Kaydırma göstergesi (kenarlarda soluklaşan gölgeler) */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none"></div>

                <div
                  ref={articlesRowRef}
                        className={cn(
                          styles.articleScroller,
                          "rounded-lg border border-dashed border-muted hover:border-muted-foreground/50 transition-colors duration-200 py-2"
                        )}
                        data-scrollable="true"
                      >
                        {/* Sayfalama mantığı - her sayfada 3 makale */}
                        {Array.from({
                          length: Math.ceil(visibleArticles / 3),
                        }).map((_, pageIndex) => (
                          <div
                            key={`page-${pageIndex}`}
                            className="flex-shrink-0 w-full snap-start"
                          >
                            <div className={styles.articleContainer}>
                  {previewData.items
                                .slice(
                                  pageIndex * 3,
                                  Math.min((pageIndex + 1) * 3, visibleArticles)
                                )
                    .map((item, index) => (
                      <div
                                    key={item.id || `${pageIndex}-${index}`}
                        className={styles.articleItem}
                      >
                        <ArticleCard item={item} />
                      </div>
                    ))}
                            </div>
                          </div>
                        ))}

                        {/* Daha fazla göster butonu gerekli değil, otomatik sayfalama yapıyoruz */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-full">
          <Card className="bg-card border-muted shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="url"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    RSS Besleme URL&apos;si
                  </Label>
                  <div className="relative">
                    <Input
                      id="url"
                      name="url"
                      type="text"
                      value={url}
                      onChange={handleUrlChange}
                      placeholder={t("feeds.addRssFeed.urlPlaceholder")}
                      disabled={isSubmitting}
                      aria-invalid={!!error}
                      className={cn(
                        "bg-background pr-10",
                        error ? "border-destructive" : ""
                      )}
                      maxLength={2000}
                    />
                    {url && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => {
                          setUrl("");
                          setError("URL zorunludur");
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Temizle</span>
                      </Button>
                    )}
                    </div>
                  {error ? (
                    <p className="text-xs text-destructive mt-1.5">{error}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {t("feeds.addRssFeed.urlHelp")}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!url || !!error || isSubmitting}
                  onClick={handlePreview}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("feeds.addRssFeed.checking")}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Önizle
                    </>
                  )}
                </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Makale Kartı Bileşeni
 * @param {Object} props
 * @param {Object} props.item - Makale bilgileri
 */
const ArticleCard = ({ item }) => {
  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Thumbnail URL'sini al
  const getThumbnail = () => {
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.media && item.media.length > 0) {
      const mediaItem = item.media.find((m) => m.$ && m.$.url);
      if (mediaItem) return mediaItem.$.url;
    }
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <Card className="h-full bg-card hover:bg-accent/5 transition-colors border-muted">
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        {thumbnail && (
          <div className="w-full h-32 mb-3 overflow-hidden rounded-md">
            <img
              src={thumbnail}
              alt={item.title || "Makale görseli"}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2">
          {item.title || "İsimsiz Makale"}
        </h3>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {item.description.replace(/<[^>]*>?/gm, "")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          {item.pubDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatDate(item.pubDate)}
            </span>
          )}

          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Oku
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
