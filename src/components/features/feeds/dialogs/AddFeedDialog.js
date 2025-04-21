"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { feedService } from "@/services/feedService";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rss,
  Youtube,
  Search,
  Loader2,
  Plus,
  ArrowLeft,
  ExternalLink,
  Info,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users2, Film, Calendar, AlignLeft } from "lucide-react";
import axios from "axios";
import { youtubeService } from "@/services/youtubeService";

export function AddFeedDialog({ open, onOpenChange, onFeedAdded, onSuccess }) {
  const { t } = useLanguage();
  const { user } = useAuthStore();

  // Düzgün bir refreshFeeds fonksiyonu tanımla
  const refreshFeeds = useCallback(() => {
    if (typeof onFeedAdded === "function") {
      onFeedAdded();
    }
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  }, [onFeedAdded, onSuccess]);

  const { addFeed } = useFeedActions(
    user,
    refreshFeeds,
    refreshFeeds,
    feedService
  );

  // States
  const [activeTab, setActiveTab] = useState("rss");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rssUrl, setRssUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Preview states
  const [rssPreview, setRssPreview] = useState(null);
  const [youtubeChannel, setYoutubeChannel] = useState(null);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("rss");
      setRssUrl("");
      setYoutubeUrl("");
      setRssPreview(null);
      setYoutubeChannel(null);
      setError(null);
    }
  }, [open]);

  // Handle URL input change
  const handleRssInputChange = (e) => {
    setRssUrl(e.target.value);
    setRssPreview(null);
    setError(null);
  };

  const handleYoutubeInputChange = (e) => {
    setYoutubeUrl(e.target.value);
    setYoutubeChannel(null);
    setError(null);
  };

  // Handle RSS search
  const handleRssSearch = async () => {
    if (!rssUrl || searching) return;

    setSearching(true);
    setRssPreview(null);
    setError(null);

    // Timeout kontrolü için
    const timeoutId = setTimeout(() => {
      if (searching) {
        setSearching(false);
        setError(
          t("feeds.timeoutError") ||
            "İstek zaman aşımına uğradı. Lütfen tekrar deneyin."
        );
      }
    }, 20000); // 20 saniye timeout

    try {
      console.log("RSS önizleme isteği gönderiliyor:", rssUrl);
      const response = await fetch("/api/rss-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: rssUrl }),
      });

      const data = await response.json();

      clearTimeout(timeoutId); // Başarılı cevap aldığımız için timeout'u temizle

      if (!response.ok) {
        console.error("RSS önizleme API hatası:", data);
        throw new Error(data.error || "Failed to preview RSS feed");
      }

      if (!data || !data.title) {
        console.warn("Geçersiz RSS verisi:", data);
        setError(t("feeds.invalidRssFeed"));
        return;
      }

      console.log("RSS önizleme başarılı:", data);
      setRssPreview({
        title: data.title || "Untitled Feed",
        description: data.description || "",
        items: data.items || 0,
        url: rssUrl,
        image: data.image || null,
        preview: Array.isArray(data.preview) ? data.preview : [],
      });
    } catch (error) {
      clearTimeout(timeoutId); // Hata durumunda da timeout'u temizle

      console.error("RSS önizleme hatası:", error);

      // Hatayı ayrıştır ve daha kullanıcı dostu hata mesajları göster
      let errorMsg = error.message;

      if (
        errorMsg.includes("kaynağına erişilemedi") ||
        errorMsg.includes("not found") ||
        errorMsg.includes("access")
      ) {
        errorMsg =
          t("feeds.cannotAccessFeed") ||
          "Bu RSS kaynağına erişilemiyor. URL'yi kontrol edin veya site CORS kısıtlamaları olabilir.";
      } else if (
        errorMsg.includes("ayrıştırılamadı") ||
        errorMsg.includes("parse")
      ) {
        errorMsg =
          t("feeds.invalidRssFeed") || "Geçersiz RSS beslemesi formatı.";
      } else if (
        errorMsg.includes("timeout") ||
        errorMsg.includes("zaman aşımı")
      ) {
        errorMsg =
          t("feeds.timeoutError") ||
          "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
      }

      setError(errorMsg);
    } finally {
      setSearching(false);
    }
  };

  // Handle YouTube search
  const handleYoutubeSearch = async () => {
    if (!youtubeUrl || searching) return;

    setSearching(true);
    setYoutubeChannel(null);
    setError(null);

    try {
      const isUrl =
        youtubeUrl.includes("youtube.com") ||
        youtubeUrl.includes("youtu.be") ||
        youtubeUrl.startsWith("http");

      if (isUrl) {
        // YouTube URL'ini önce RSS URL'ine dönüştür
        try {
          const rssUrl = await youtubeService.getYoutubeRssUrl(youtubeUrl);
          if (rssUrl) {
            // URL'den YouTube ID'yi çıkarmak için düzenli ifade
            const channelIdMatch = rssUrl.match(/channel_id=([^&]+)/);
            if (channelIdMatch && channelIdMatch[1]) {
              const channelId = channelIdMatch[1];

              // Kanal bilgilerini önbellekten veya API'den al
              const channelInfo = await youtubeService.getChannelInfo(
                channelId
              );

              setYoutubeChannel({
                id: channelId,
                title: channelInfo.title || "Bilinmeyen Kanal",
                description: channelInfo.description || "",
                thumbnail: channelInfo.thumbnail || "",
                subscribers: "Bilinmiyor", // API değiştiğinde burası güncellenebilir
                url: `https://www.youtube.com/channel/${channelId}`,
                videoCount: "Bilinmiyor", // API değiştiğinde burası güncellenebilir
              });

              return;
            }
          }
        } catch (error) {
          console.error("YouTube servis hatası:", error);
          // Hata durumunda eski yönteme geri dön
        }
      }

      // Önbellekten bulunamazsa veya anahtar kelime araması ise API'yi kullan
      const payload = isUrl ? { query: youtubeUrl } : { keyword: youtubeUrl };

      const response = await fetch("/api/youtube-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search YouTube channel");
      }

      if (data.channel && data.channel.id) {
        // Bulunan kanalı önbelleğe kaydet
        if (data.channel.id) {
          try {
            await youtubeService.cacheChannelInfo(data.channel.id, {
              title: data.channel.title || "Bilinmeyen Kanal",
              thumbnail: data.channel.thumbnail || "",
              description: data.channel.description || "",
              channel_title: data.channel.title || "Bilinmeyen Kanal",
              rss_url: `https://www.youtube.com/feeds/videos.xml?channel_id=${data.channel.id}`,
            });
          } catch (cacheError) {
            console.error("Önbellekleme hatası:", cacheError);
          }
        }

        setYoutubeChannel({
          id: data.channel.id,
          title: data.channel.title || "Untitled Channel",
          description: data.channel.description || "",
          thumbnail: data.channel.thumbnail || "",
          subscribers: data.channel.subscribers || "0",
          url: data.channel.url || youtubeUrl,
          videoCount: data.channel.videoCount || "0",
        });
      } else {
        setError(t("feeds.youtubeChannelNotFound"));
      }
    } catch (error) {
      console.error("Error searching YouTube channel:", error);
      setError(`${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  // Handle feed add
  const handleAddFeed = async (url, type) => {
    setIsSubmitting(true);
    try {
      if (type === "youtube") {
        // YouTube URL'ini RSS'e dönüştür ve tür olarak rss belirle
        const rssUrl = await convertYoutubeToRss(url);

        if (!rssUrl) {
          throw new Error(t("feeds.addFeed.youtubeConversionFailed"));
        }

        // RSS URL'ini kullan ve tür olarak rss belirle (YouTube içerikleri de RSS olarak eklenecek)
        await addFeed(rssUrl, "rss");
      } else {
        // Normal RSS beslemeleri için
        await addFeed(url, type);
      }

      toast.success(t("feeds.addFeedSuccess"));
      onOpenChange(false);
      if (onFeedAdded) {
        onFeedAdded();
      }
    } catch (error) {
      console.error("Error adding feed:", error);
      toast.error(error.message || t("feeds.addFeedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // YouTube URL'lerini RSS beslemesine dönüştürür
  const convertYoutubeToRss = async (url) => {
    try {
      if (!url) {
        throw new Error(t("feeds.urlRequired"));
      }

      // Zaten RSS URL'i ise direkt kullan
      if (url.includes("youtube.com/feeds/videos.xml")) {
        return url;
      }

      console.log("Converting YouTube URL to RSS:", url);

      // YouTube servisini kullanarak RSS URL'ini al
      const rssUrl = await youtubeService.getYoutubeRssUrl(url);

      if (!rssUrl) {
        throw new Error(t("feeds.addFeed.youtubeConversionFailed"));
      }

      console.log("Converted to RSS URL:", rssUrl);
      return rssUrl;
    } catch (error) {
      console.error("YouTube URL dönüştürme hatası:", error);

      // Daha açıklayıcı ve kullanıcı dostu hata mesajları
      if (
        error.message.includes("not found") ||
        error.message.includes("bulunamadı")
      ) {
        throw new Error(t("feeds.addFeed.youtubeChannelNotFound"));
      } else if (
        error.message.includes("network") ||
        error.message.includes("ağ")
      ) {
        throw new Error(t("feeds.addFeed.networkError"));
      } else if (
        error.message.includes("CORS") ||
        error.message.includes("access")
      ) {
        throw new Error(t("feeds.addFeed.corsError"));
      } else if (
        error.message.includes("invalid") ||
        error.message.includes("geçersiz")
      ) {
        throw new Error(t("feeds.addFeed.invalidYoutubeUrl"));
      }

      // Genel hata mesajı
      throw new Error(
        `${t("feeds.addFeed.youtubeConversionFailed")}: ${error.message}`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 border-border/50 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-0 border-b-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-primary/10 blur-sm -z-10"></div>
                </div>
                {t("feeds.addFeed.title")}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-muted-foreground">
                {t("feeds.addFeed.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <Tabs
            defaultValue="rss"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                <span>RSS Feed</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                <span>YouTube</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rss" className="mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="rss-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden border-border/60">
                    <CardHeader className="px-6 py-5 bg-muted/30">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Rss className="h-5 w-5 text-primary" />
                        {t("feeds.addFeed.rssUrl")}
                      </CardTitle>
                      <CardDescription>
                        {t("feeds.addFeed.rssUrlHelp")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-5">
                      <div className="flex gap-3">
                        <Input
                          id="rssUrl"
                          value={rssUrl}
                          onChange={handleRssInputChange}
                          placeholder={t("feeds.addFeed.rssUrlPlaceholder")}
                          className="flex-1"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleRssSearch()
                          }
                        />
                        <Button
                          onClick={handleRssSearch}
                          disabled={!rssUrl || searching}
                          className="gap-2"
                        >
                          {searching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          <span>{t("common.search")}</span>
                        </Button>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="mt-4">
                          <Info className="h-4 w-4" />
                          <AlertTitle>{t("feeds.addDialog.error")}</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <AnimatePresence>
                    {rssPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden border-primary/20">
                          <CardHeader className="px-6 py-5 bg-primary/5 border-b border-primary/10 flex flex-row items-center gap-4">
                            {rssPreview.image && (
                              <div className="h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-muted border border-primary/10">
                                <img
                                  src={rssPreview.image}
                                  alt={rssPreview.title}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl truncate">
                                {rssPreview.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {rssPreview.description ||
                                  t("feeds.noDescription")}
                              </CardDescription>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  {rssPreview.items} {t("feeds.items")}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-primary/10 border-primary/20 text-primary"
                                >
                                  <Rss className="h-3 w-3 mr-1.5" />
                                  RSS
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          {rssPreview.preview &&
                            rssPreview.preview.length > 0 && (
                              <CardContent className="p-6">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <AlignLeft className="h-4 w-4 text-primary" />
                                  {t("feeds.addFeed.latestItems")}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {rssPreview.preview.map((item, index) => (
                                    <div
                                      key={index}
                                      className="p-3 rounded-md bg-accent/30 border border-border/40 hover:border-primary/30 hover:bg-accent/50 transition-all duration-200"
                                    >
                                      <h5 className="font-medium text-sm line-clamp-1">
                                        {item.title}
                                      </h5>
                                      {item.date && (
                                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                          <Calendar className="h-3 w-3" />
                                          <time
                                            dateTime={new Date(
                                              item.date
                                            ).toISOString()}
                                          >
                                            {new Date(
                                              item.date
                                            ).toLocaleDateString()}
                                          </time>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            )}

                          <CardFooter className="px-6 py-4 bg-muted/30 flex justify-end border-t border-border/30">
                            <Button
                              onClick={() =>
                                handleAddFeed(rssPreview.url, "rss")
                              }
                              disabled={isSubmitting}
                              className="gap-2"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              <span>{t("feeds.addFeed.addButton")}</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="youtube" className="mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="youtube-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden border-border/60">
                    <CardHeader className="px-6 py-5 bg-red-500/5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        {t("feeds.addFeed.youtubeSearch")}
                      </CardTitle>
                      <CardDescription>
                        {t("feeds.addDialog.youtubeUrlHint")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-5">
                      <div className="flex gap-3">
                        <Input
                          id="youtubeUrl"
                          value={youtubeUrl}
                          onChange={handleYoutubeInputChange}
                          placeholder={t(
                            "feeds.addDialog.youtubeUrlPlaceholder"
                          )}
                          className="flex-1"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleYoutubeSearch()
                          }
                        />
                        <Button
                          onClick={handleYoutubeSearch}
                          disabled={!youtubeUrl || searching}
                          className="gap-2"
                          variant="destructive"
                        >
                          {searching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          <span>{t("common.search")}</span>
                        </Button>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="mt-4">
                          <Info className="h-4 w-4" />
                          <AlertTitle>{t("feeds.addDialog.error")}</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <AnimatePresence>
                    {youtubeChannel && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden border-red-500/20">
                          <CardHeader className="px-6 py-5 bg-red-500/5 border-b border-red-500/10 flex flex-row gap-4">
                            <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-muted ring-1 ring-red-500/20 shadow-sm relative">
                              <img
                                src={youtubeChannel.thumbnail}
                                alt={youtubeChannel.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(youtubeChannel.title) +
                                    "&background=random&color=fff&size=120";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl truncate">
                                {youtubeChannel.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {youtubeChannel.description ||
                                  t("feeds.noDescription")}
                              </CardDescription>

                              <div className="flex flex-wrap gap-3 mt-3">
                                {youtubeChannel.subscribers && (
                                  <Badge
                                    variant="secondary"
                                    className="gap-1.5"
                                  >
                                    <Users2 className="h-3 w-3" />
                                    <span>{youtubeChannel.subscribers}</span>
                                  </Badge>
                                )}
                                {youtubeChannel.videoCount && (
                                  <Badge
                                    variant="secondary"
                                    className="gap-1.5"
                                  >
                                    <Film className="h-3 w-3" />
                                    <span>{youtubeChannel.videoCount}</span>
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="bg-red-500/10 border-red-500/20 text-red-500 gap-1.5"
                                >
                                  <Youtube className="h-3 w-3" />
                                  YouTube
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardFooter className="px-6 py-4 bg-muted/30 flex justify-between border-t border-border/30">
                            <a
                              href={youtubeChannel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t("feeds.openChannel")}
                            </a>

                            <Button
                              onClick={() =>
                                handleAddFeed(youtubeChannel.url, "youtube")
                              }
                              disabled={isSubmitting}
                              className="gap-2"
                              variant="destructive"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              <span>{t("feeds.addDialog.addChannel")}</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
