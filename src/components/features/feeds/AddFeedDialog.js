"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Rss,
  Youtube,
  ArrowLeft,
  Search,
  X,
  Zap,
  Globe,
  Sparkles,
  Newspaper,
} from "lucide-react";
import RssFeedForm from "@/components/features/feeds/RssFeedForm";
import YoutubeFeedForm from "@/components/features/feeds/YoutubeFeedForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

function handleError(error, info, t) {
  console.error("Feed Dialog Error:", error, info);

  if (error.name === "NetworkError") {
    toast.error(t("errors.networkError"));
  } else if (error.name === "LoadingError") {
    toast.error(t("errors.general"));
  } else {
    toast.error(error.message || t("errors.tryAgain"));
  }
}

function AddFeedErrorBoundary({ children }) {
  const { t } = useLanguage();
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h3 className="text-lg font-medium mb-2">
            {t("errors.feedLoadingError")}
          </h3>
          <p className="text-sm mb-4">{error.message}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="destructive"
            size="sm"
          >
            {t("actions.refresh")}
          </Button>
        </div>
      )}
      onError={(error, info) => handleError(error, info, t)}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AddFeedDialog({
  children,
  onSuccess,
  defaultPlatform = null,
  open,
  onOpenChange,
}) {
  const [selectedPlatform, setSelectedPlatform] = useState(defaultPlatform);
  const [keepAdding, setKeepAdding] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const searchInputRef = useRef(null);
  const { t } = useLanguage();

  // Platform seçenekleri
  const FEED_PLATFORMS = useMemo(
    () => [
      {
        id: "rss",
        name: t("feeds.addFeed.rss"),
        icon: Rss,
        component: RssFeedForm,
        description: "RSS, Atom veya JSON beslemeleri ekleyin",
        color: "bg-orange-500/10 text-orange-600 border-orange-200",
        iconColor: "text-orange-500",
        badge: "Klasik",
        badgeColor: "bg-orange-100 text-orange-700",
        features: ["Haber Siteleri", "Bloglar", "Podcast'ler"],
      },
      {
        id: "youtube",
        name: t("feeds.addFeed.youtube"),
        icon: Youtube,
        component: YoutubeFeedForm,
        description: "YouTube kanallarını takip edin",
        color: "bg-red-500/10 text-red-600 border-red-200",
        iconColor: "text-red-500",
        badge: "Popüler",
        badgeColor: "bg-red-100 text-red-700",
        features: [
          "Video İçerikler",
          "Canlı Yayınlar",
          "Benzer Kanal Önerileri",
        ],
      },
    ],
    [t]
  );

  const handleSuccess = useCallback(() => {
    console.log(
      "[AddFeedDialog] handleSuccess çağrıldı, keepAdding:",
      keepAdding
    );
    if (!keepAdding) {
      onOpenChange?.(false);
    }
    setIsPreviewMode(false);
    setIsCardFlipped(false);
    onSuccess?.();
    console.log("[AddFeedDialog] handleSuccess tamamlandı");
  }, [keepAdding, onSuccess, onOpenChange]);

  const handlePlatformSelect = useCallback((platform) => {
    console.log("[AddFeedDialog] Platform seçildi:", platform);
    setSelectedPlatform(platform);
    // Kart flip animasyonunu başlat
    setIsCardFlipped(true);
    console.log(
      "[AddFeedDialog] Kart çevirme animasyonu başlatıldı, isCardFlipped:",
      true
    );

    // Kart döndükten sonra odağı arama kutusuna al
    setTimeout(() => {
      console.log("[AddFeedDialog] Arama kutusuna odak ayarlanıyor");
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        console.log("[AddFeedDialog] Arama kutusuna odaklanıldı");
      } else {
        console.log(
          "[AddFeedDialog] Arama kutusu henüz hazır değil, odaklanamadı"
        );
      }
    }, 600);
  }, []);

  const ActiveComponent = useMemo(() => {
    const platform = FEED_PLATFORMS.find((p) => p.id === selectedPlatform);
    return platform?.component || null;
  }, [selectedPlatform, FEED_PLATFORMS]);

  const handleOpenChange = useCallback(
    (open) => {
      console.log("[AddFeedDialog] handleOpenChange çağrıldı, open:", open);
      onOpenChange?.(open);
      if (!open) {
        setSelectedPlatform(defaultPlatform);
        setIsPreviewMode(false);
        setIsCardFlipped(false);
        setSearchQuery("");
        console.log("[AddFeedDialog] Dialog kapatıldı, state'ler sıfırlandı");
      }
    },
    [defaultPlatform, onOpenChange]
  );

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      console.log("[AddFeedDialog] Arama formu gönderildi:", {
        searchQuery,
        selectedPlatform,
      });

      // Aktif elemanın odağını kaldır (mobil klavyenin kapanmasına yardımcı olur)
      if (document.activeElement) {
        document.activeElement.blur();
      }

      if (!searchQuery.trim()) {
        console.log("[AddFeedDialog] Arama sorgusu boş, önizleme yapılmıyor");
        return;
      }

      console.log(
        "[AddFeedDialog] Önizleme moduna geçiliyor ve sorgu:",
        searchQuery
      );

      // Önce isPreviewMode'u true yapıyoruz
      setIsPreviewMode(true);

      // Güvenlik için - React state güncellemelerinin batch yapısı nedeniyle
      // alt bileşenler için isParentPreviewMode değerinin ayarlandığından emin olmalıyız
      console.log("[AddFeedDialog] isPreviewMode ayarlandı: true");

      // En fazla 1 saniyelik kontrol - üst bileşen geçiş yaptıktan sonra alt bileşenler önizleme yapmalı
      setTimeout(() => {
        if (!isPreviewMode) {
          console.log(
            "[AddFeedDialog] isPreviewMode güncellenmesi kontrol ediliyor - yeniden ayarlanıyor"
          );
          setIsPreviewMode(true);
        } else {
          console.log(
            "[AddFeedDialog] isPreviewMode doğru şekilde güncellenmiş:",
            isPreviewMode
          );
        }
      }, 100);
    },
    [searchQuery, selectedPlatform, isPreviewMode]
  );

  const handleBackToSelection = useCallback(() => {
    console.log("[AddFeedDialog] Platform seçimine geri dönülüyor");
    setIsCardFlipped(false);
    setSelectedPlatform(null);
    setSearchQuery("");
    setIsPreviewMode(false);
    console.log("[AddFeedDialog] States resetlendi");
  }, []);

  // Aktif platform bilgisini al
  const activePlatformInfo = useMemo(() => {
    return FEED_PLATFORMS.find((p) => p.id === selectedPlatform);
  }, [selectedPlatform, FEED_PLATFORMS]);

  // Önizleme moduna geçiş
  const handlePreviewModeChange = useCallback(
    (isPreview) => {
      console.log(
        "[AddFeedDialog] handlePreviewModeChange çağrıldı, isPreview:",
        isPreview
      );

      // React 18'de state güncellemeleri batch'lenir, bu yüzden direkt state'i güncelliyoruz
      setIsPreviewMode(isPreview);
      console.log(
        `[AddFeedDialog] isPreviewMode -> ${isPreview} olarak ayarlandı`
      );

      // Mutlaka state'in güncellendiğinden emin olmak için
      requestAnimationFrame(() => {
        console.log(
          "[AddFeedDialog] Animation frame içinde isPreviewMode:",
          isPreviewMode
        );
      });
    },
    [isPreviewMode] // boş dependency array, gereksiz re-render'ları önler
  );

  // Dialog genişliği için sınıf adı - daha esnek responsive yaklaşım
  const dialogSizeClass = useMemo(() => {
    if (!selectedPlatform) {
      return "sm:max-w-md";
    }
    // Preview modunda daha esnek genişlik sağla
    return isPreviewMode
      ? "w-[95vw] sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[1024px]"
      : "sm:max-w-md";
  }, [selectedPlatform, isPreviewMode]);

  // State değişikliklerini takip et
  useEffect(() => {
    console.log(
      "[AddFeedDialog] isPreviewMode değişti:",
      isPreviewMode,
      "- Diyalog genişliği:",
      dialogSizeClass
    );
  }, [isPreviewMode, dialogSizeClass]);

  useEffect(() => {
    console.log("[AddFeedDialog] selectedPlatform değişti:", selectedPlatform);
  }, [selectedPlatform]);

  useEffect(() => {
    console.log("[AddFeedDialog] isCardFlipped değişti:", isCardFlipped);
  }, [isCardFlipped]);

  // Arama kutusu odak kontrolü
  useEffect(() => {
    if (isCardFlipped && !isPreviewMode && searchInputRef.current) {
      console.log(
        "[AddFeedDialog] Arama kutusuna otomatik odaklanma (useEffect)"
      );
      setTimeout(() => {
        // Timeout çalıştığında referansın hala geçerli olduğundan emin oluyoruz
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          console.log("[AddFeedDialog] Arama kutusuna odaklanıldı");
        } else {
          console.log("[AddFeedDialog] Arama kutusu referansı bulunamadı");
        }
      }, 500);
    }
  }, [isCardFlipped, isPreviewMode]);

  // isPreviewMode değiştiğinde log çıktısı
  console.log(
    "[AddFeedDialog] Render sırasında şu anki önizleme durumu:",
    isPreviewMode
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            {t("feeds.addFeed.title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "p-0 gap-0 transition-all duration-300 ease-in-out",
          "h-auto max-h-[90vh] overflow-y-auto",
          dialogSizeClass
        )}
      >
        {console.log(
          "[AddFeedDialog] DialogContent render ediliyor, isPreviewMode:",
          isPreviewMode
        )}
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Kapat</span>
        </DialogClose>

        {/* Eklemeye devam et kontrolü - her zaman görünür */}
        {isPreviewMode && (
          <div className="absolute right-12 top-4 flex items-center gap-2 z-50">
            <Label
              htmlFor="keep-adding-top"
              className="text-xs font-normal cursor-pointer hidden sm:block text-muted-foreground"
            >
              {t("feeds.addFeed.keepAdding")}
            </Label>
            <Switch
              id="keep-adding-top"
              checked={keepAdding}
              onCheckedChange={setKeepAdding}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        )}

        {!selectedPlatform || !isCardFlipped ? (
          <>
            <DialogHeader className="p-6 pb-2 pr-12">
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                {t("feeds.addFeed.title")}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t("feeds.addFeed.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 p-6 pt-2">
              <AnimatePresence>
                {FEED_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 1, y: 0 }}
                      exit={
                        selectedPlatform && selectedPlatform !== platform.id
                          ? { opacity: 0, y: 20, transition: { duration: 0.3 } }
                          : {}
                      }
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all",
                        "hover:border-primary/50 hover:shadow-md group",
                        selectedPlatform &&
                          selectedPlatform !== platform.id &&
                          "hidden"
                      )}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => handlePlatformSelect(platform.id)}
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div
                            className={cn(
                              "flex-shrink-0 p-4 sm:p-6 flex items-center justify-center",
                              platform.id === "rss"
                                ? "bg-orange-50"
                                : "bg-red-50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center",
                                platform.color
                              )}
                            >
                              <Icon
                                className={cn("w-8 h-8", platform.iconColor)}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 p-4 sm:p-6">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-lg font-medium">
                                {platform.name}
                              </h3>
                              {platform.badge && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs font-normal",
                                    platform.badgeColor
                                  )}
                                >
                                  {platform.id === "youtube" ? (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Globe className="w-3 h-3 mr-1" />
                                  )}
                                  {platform.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              {platform.description}
                            </p>

                            <div className="space-y-1.5">
                              {platform.features.map((feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-center text-sm text-muted-foreground"
                                >
                                  <Zap className="w-3.5 h-3.5 mr-2 text-primary" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        ) : isPreviewMode ? (
          <>
            <DialogHeader className="p-6 pb-2 pr-12">
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPreviewMode(false)}
                  className="mr-2 h-8 w-8 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Geri</span>
                </Button>
                <DialogTitle className="truncate">
                  {`${activePlatformInfo?.name || ""} Önizleme`}
                </DialogTitle>
              </div>
            </DialogHeader>
            <AddFeedErrorBoundary>
              <div className="p-4 sm:p-6 pt-2 sm:pt-4 w-full">
                {console.log(
                  "[AddFeedDialog] ActiveComponent render ediliyor:",
                  {
                    ActiveComponent: !!ActiveComponent,
                    componentName: ActiveComponent?.name,
                    selectedPlatform,
                  }
                )}
                {selectedPlatform === "rss" && (
                  <RssFeedForm
                    onCancel={handleBackToSelection}
                    onSuccess={handleSuccess}
                    onPreviewModeChange={handlePreviewModeChange}
                    initialQuery={searchQuery}
                    isParentPreviewMode={isPreviewMode}
                  />
                )}
                {selectedPlatform === "youtube" && (
                  <YoutubeFeedForm
                    onCancel={handleBackToSelection}
                    onSuccess={handleSuccess}
                    onPreviewModeChange={handlePreviewModeChange}
                    initialQuery={searchQuery}
                    isParentPreviewMode={isPreviewMode}
                  />
                )}

                {/* Mobil için eklemeye devam et kontrolü - altta görünür */}
                <div className="flex items-center justify-center gap-2 sm:hidden pt-4 mt-4 border-t">
                  <Label
                    htmlFor="keep-adding-bottom"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t("feeds.addFeed.keepAdding")}
                  </Label>
                  <Switch
                    id="keep-adding-bottom"
                    checked={keepAdding}
                    onCheckedChange={setKeepAdding}
                  />
                </div>
              </div>
            </AddFeedErrorBoundary>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: isCardFlipped ? 180 : 0 }}
              exit={{ rotateY: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full"
            >
              <motion.div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                className="p-6"
              >
                <DialogHeader className="pb-6">
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToSelection}
                      className="mr-2 h-8 w-8 flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Geri</span>
                    </Button>
                    <DialogTitle className="truncate">
                      {activePlatformInfo?.name || t("feeds.addFeed.title")}
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder={
                        selectedPlatform === "rss"
                          ? "RSS, Atom veya JSON besleme URL'si girin..."
                          : "YouTube kanal adı veya URL'si girin..."
                      }
                      className="pl-10 pr-4 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!searchQuery.trim()}
                  >
                    {selectedPlatform === "rss"
                      ? "RSS Beslemesini Ara"
                      : "YouTube Kanalını Ara"}
                  </Button>

                  <div className="pt-4 text-sm text-muted-foreground">
                    <p className="flex items-center">
                      <Newspaper className="w-4 h-4 mr-2" />
                      {selectedPlatform === "rss"
                        ? "RSS, Atom veya JSON besleme URL'sini girin"
                        : "YouTube kanal adı, URL'si veya @kullanıcıadı girin"}
                    </p>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}

AddFeedDialog.propTypes = {
  onSuccess: PropTypes.func,
  defaultPlatform: PropTypes.oneOf(["rss", "youtube"]),
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
};
