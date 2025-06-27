"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { feedService } from "@/services/feedService";
import { Card, CardContent } from "@/components/core/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { Separator } from "@/components/core/ui/separator";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/core/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";
import { Users2, Film, Calendar, AlignLeft } from "lucide-react";
import axios from "axios";
import { youtubeService } from "@/lib/youtube/service";
import { cacheChannelInfo } from "@/lib/youtube/cache";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/core/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/core/ui/radio-group";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/core/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";

/**
 * Sayıları kullanıcı dostu formata dönüştüren yardımcı fonksiyon
 * @param {string|number} num - Formatlanacak sayı
 * @returns {string} - Formatlanmış sayı (örn: 1.2M, 5.7K)
 */
function formatNumber(num) {
  if (!num || isNaN(Number(num))) return "Bilinmiyor";

  num = Number(num);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

// URL'yi görüntü proxy üzerinden yüklemek için yardımcı fonksiyon
const getProxiedImageUrl = (url) => {
  if (!url) return null;
  // Eğer URL zaten yerel sunucudan geliyorsa (örneğin avatar), doğrudan kullan
  if (url.startsWith("/")) return url;
  // YouTube veya diğer harici URL'ler için proxy kullan
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

// Form şeması
const formSchema = z.object({
  title: z.string().optional(),
  url: z.string().url({ message: "Geçerli bir URL giriniz" }),
  type: z.enum(["rss", "youtube"]),
  category: z.string().optional(),
  fetch_full_content: z.boolean().optional(),
});

/**
 * Yeni feed eklemek için dialog bileşeni
 */
export function AddFeedDialog({
  isOpen = false,
  onOpenChange = () => {},
  onSubmit = async () => {},
}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingUser } = useAuthStore();
  const userId = user?.id;
  const { isLoading, addFeed, closeAddFeedDialog } = useAddFeed(onSubmit);

  // Form tanımlama
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      type: "youtube",
      category: "general",
      fetch_full_content: false,
    },
  });

  const [activeTab, setActiveTab] = useState("youtube");
  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      form.setValue("type", tab);
    },
    [form]
  );

  // Form submit handler
  const handleSubmit = async (values) => {
    const { url, type, ...extraData } = values;
    const success = await addFeed(url, type, extraData);
    if (success) {
      form.reset();
      closeAddFeedDialog();
      onOpenChange(false);
    }
  };

  // Düzgün bir refreshFeeds fonksiyonu tanımla
  const refreshFeeds = useCallback(() => {
    if (typeof onSubmit === "function") {
      onSubmit();
    }
  }, [onSubmit]);

  const { addFeed: oldAddFeed } = useFeedActions(
    userId,
    refreshFeeds,
    refreshFeeds,
    feedService
  );

  // States
  const [rssUrl, setRssUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Preview states
  const [rssPreview, setRssPreview] = useState(null);
  const [youtubeChannel, setYoutubeChannel] = useState(null);

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("youtube");
      setRssUrl("");
      setYoutubeUrl("");
      setRssPreview(null);
      setYoutubeChannel(null);
      setError(null);
    }
  }, [isOpen]);

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
                title: channelInfo.title || "",
                description: channelInfo.description || "",
                thumbnail: channelInfo.thumbnail || "",
                subscribers: channelInfo.statistics?.subscriberCount || "0",
                subscribersFormatted: channelInfo.statistics?.subscriberCount
                  ? formatNumber(channelInfo.statistics.subscriberCount)
                  : "Bilinmiyor",
                videoCount: channelInfo.statistics?.videoCount || "0",
                videoCountFormatted: channelInfo.statistics?.videoCount
                  ? formatNumber(channelInfo.statistics.videoCount)
                  : "0",
                url: `https://www.youtube.com/channel/${channelId}`,
              });

              return;
            }
          }
        } catch (error) {
          console.error("YouTube servis hatası:", error);
        }
      }

      const payload = isUrl ? { query: youtubeUrl } : { keyword: youtubeUrl };

      console.log("Sending request to YouTube API with payload:", payload);

      // Try using fetch with more options and detailed error handling
      const response = await fetch("/api/youtube/channel-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-cache",
      });

      console.log("API response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);

        throw new Error(
          `API request failed with status ${response.status}: ${
            response.statusText || errorText || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log("API response data:", data);

      // Thumbnail URL'sini özellikle kontrol edelim
      console.log("Thumbnail URL:", data.channel?.thumbnail);

      if (data.channel && data.channel.id) {
        // Bulunan kanalı önbelleğe kaydet
        if (data.channel.id) {
          try {
            await cacheChannelInfo(data.channel.id, {
              title: data.channel.title || "Bilinmeyen Kanal",
              thumbnail: data.channel.thumbnail || "",
              description: data.channel.description || "",
              channel_title: data.channel.title || "Bilinmeyen Kanal",
              rss_url: `https://www.youtube.com/feeds/videos.xml?channel_id=${data.channel.id}`,
            });
          } catch (cacheError) {
            console.error("Önbellekleme hatası:", cacheError);
            // Önbellekleme hatası olsa bile işleme devam et
          }
        }

        // UI'da kullanılacak verileri hazırla
        const channelThumbnail = data.channel.thumbnail || "";
        console.log("Setting thumbnail:", channelThumbnail);

        setYoutubeChannel({
          id: data.channel.id,
          title: data.channel.title || "Untitled Channel",
          description: data.channel.description || "",
          thumbnail: channelThumbnail,
          subscribers: data.channel.subscribers || "0",
          subscribersFormatted:
            data.channel.subscribersFormatted ||
            formatNumber(data.channel.subscribers) ||
            "Bilinmiyor",
          videoCount: data.channel.videoCount || "0",
          videoCountFormatted:
            data.channel.videoCountFormatted ||
            formatNumber(data.channel.videoCount) ||
            "0",
          url: data.channel.url || youtubeUrl,
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

  if (isLoadingUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 border border-border/60 bg-gradient-to-b from-background to-background/95 backdrop-blur-md shadow-2xl rounded-2xl">
        <DialogHeader className="px-8 pt-8 pb-0 border-b-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                <Plus className="h-5 w-5 text-primary" />
                {t("feeds.addFeed.title")}
              </DialogTitle>
              <DialogDescription className="mt-2 text-muted-foreground text-base">
                {t("feeds.addFeed.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          <Tabs
            defaultValue="youtube"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-8 bg-muted/40 rounded-lg">
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <span>YouTube</span>
              </TabsTrigger>
              <TabsTrigger value="rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-blue-500" />
                <span>RSS Feed</span>
              </TabsTrigger>
            </TabsList>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6 mt-2"
              >
                {/* YouTube tab content */}
                <TabsContent value="youtube">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("feeds.addFeed.youtubeChannelUrl")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/c/channelname"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("feeds.addFeed.youtubeUrlHelp")}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                {/* RSS tab content */}
                <TabsContent value="rss">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("feeds.addFeed.rssUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/feed.xml"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-4">
                    <FormLabel className="mb-1 block text-sm font-medium">
                      {t("feeds.addFeed.contentOptions")}
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="fetch_full_content"
                      render={({ field }) => (
                        <RadioGroup
                          defaultValue={field.value?.toString()}
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          className="flex flex-row gap-6 mt-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="summary" />
                            <Label htmlFor="summary">
                              {t("feeds.addFeed.useSummary")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="full" />
                            <Label htmlFor="full">
                              {t("feeds.addFeed.useFullContent")}
                            </Label>
                          </div>
                        </RadioGroup>
                      )}
                    />
                  </div>
                </TabsContent>
                {/* Common fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("feeds.addFeed.customTitle")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              "feeds.addFeed.leaveBlankForAutoTitle"
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("feeds.addFeed.category")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("feeds.addFeed.selectCategory")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">
                              {t("feeds.addFeed.categories.general")}
                            </SelectItem>
                            <SelectItem value="tech">
                              {t("feeds.addFeed.categories.tech")}
                            </SelectItem>
                            <SelectItem value="news">
                              {t("feeds.addFeed.categories.news")}
                            </SelectItem>
                            <SelectItem value="entertainment">
                              {t("feeds.addFeed.categories.entertainment")}
                            </SelectItem>
                            <SelectItem value="other">
                              {t("feeds.addFeed.categories.other")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="mt-8 gap-2 flex flex-row justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="font-semibold"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("feeds.addFeed.add")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
