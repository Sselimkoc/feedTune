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
  CheckCircle2,
  XCircle,
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

const categories = [
  { value: "general", label: "General" },
  { value: "tech", label: "Tech" },
  { value: "news", label: "News" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

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
  const { toast } = useToast();

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

  // States
  const [rssUrl, setRssUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Preview states
  const [rssPreview, setRssPreview] = useState(null);
  const [youtubeChannel, setYoutubeChannel] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [fetchFullContent, setFetchFullContent] = useState(false);

  // New states for YouTube search
  const [ytSearchResults, setYtSearchResults] = useState([]);
  const [ytSearchLoading, setYtSearchLoading] = useState(false);
  const [ytSearchError, setYtSearchError] = useState("");

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("youtube");
      setRssUrl("");
      setYoutubeUrl("");
      setRssPreview(null);
      setYoutubeChannel(null);
      setPreview(null);
      setPreviewLoading(false);
      setPreviewError("");
      setShowAdvanced(false);
      setTitle("");
      setCategory("general");
      setFetchFullContent(false);
      setYtSearchResults([]);
      setYtSearchLoading(false);
      setYtSearchError("");
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

  // Helper: is input a YouTube URL?
  function isYoutubeUrl(val) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(val);
  }

  // YouTube search logic
  const handleYoutubePreviewOrSearch = async () => {
    setPreview(null);
    setPreviewError("");
    setShowAdvanced(false);
    setYtSearchResults([]);
    setYtSearchError("");
    if (!youtubeUrl) return;
    if (isYoutubeUrl(youtubeUrl)) {
      // Direct preview for URL
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/youtube/channel-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: youtubeUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data || (!data.title && !data.channelTitle)) {
          throw new Error(data.error || t("feeds.addFeed.invalidUrl"));
        }
        setPreview(data);
        setTitle(data.title || data.channelTitle || "");
        setShowAdvanced(true);
      } catch (err) {
        setPreviewError(err.message || t("feeds.addFeed.invalidUrl"));
      } finally {
        setPreviewLoading(false);
      }
    } else {
      // Search by keyword
      setYtSearchLoading(true);
      try {
        const res = await fetch("/api/youtube/channel-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: youtubeUrl }),
        });
        const data = await res.json();
        if (
          !res.ok ||
          !Array.isArray(data.results) ||
          data.results.length === 0
        ) {
          throw new Error(data.error || t("feeds.addFeed.noResults"));
        }
        setYtSearchResults(data.results);
      } catch (err) {
        setYtSearchError(err.message || t("feeds.addFeed.noResults"));
      } finally {
        setYtSearchLoading(false);
      }
    }
  };

  // When user selects a channel from search results
  const handleSelectYtChannel = (channel) => {
    setPreview({
      ...channel,
      title: channel.title,
      description: channel.description,
      thumbnail: channel.thumbnail,
      subscribersFormatted: channel.subscribersFormatted,
    });
    setTitle(channel.title || "");
    setShowAdvanced(true);
    setYtSearchResults([]);
    setPreviewError("");
  };

  // Preview fetch logic
  const handlePreview = async () => {
    if (activeTab === "youtube") {
      await handleYoutubePreviewOrSearch();
    } else {
      // RSS preview as before
      setPreview(null);
      setPreviewError("");
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/rss-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: rssUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data || !data.title) {
          throw new Error(data.error || t("feeds.addFeed.invalidUrl"));
        }
        setPreview(data);
        setTitle(data.title || "");
        setShowAdvanced(true);
      } catch (err) {
        setPreviewError(err.message || t("feeds.addFeed.invalidUrl"));
        setPreview(null);
        setShowAdvanced(false);
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  // Submit logic
  const handleAddFeed = async (e) => {
    e.preventDefault();
    if (!preview) return;
    const extraData = { title, category, fetch_full_content: fetchFullContent };
    const success = await addFeed(
      activeTab === "youtube" ? youtubeUrl : rssUrl,
      activeTab,
      extraData
    );
    if (success) {
      toast({
        title: t("feeds.addFeed.success"),
        description: t("feeds.addFeed.successDescription", { title }),
      });
      closeAddFeedDialog();
      onOpenChange(false);
    }
  };

  if (isLoadingUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 rounded-3xl overflow-hidden shadow-2xl border border-border/70 bg-gradient-to-br from-background to-background/80 backdrop-blur-xl">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="flex items-center gap-2 text-3xl font-extrabold tracking-tight drop-shadow-lg bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            <Plus className="h-7 w-7 text-primary drop-shadow" />
            {t("feeds.addFeed.title")}
          </DialogTitle>
          <DialogDescription className="mt-3 text-muted-foreground text-lg">
            {t("feeds.addFeed.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="px-8 py-8 flex flex-col gap-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/40 rounded-xl p-1 gap-2">
              <TabsTrigger
                value="youtube"
                className="flex items-center gap-2 text-lg py-4 rounded-xl transition-all font-semibold shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Youtube className="h-5 w-5 text-red-500" /> YouTube
              </TabsTrigger>
              <TabsTrigger
                value="rss"
                className="flex items-center gap-2 text-lg py-4 rounded-xl transition-all font-semibold shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Rss className="h-5 w-5 text-blue-500" /> RSS
              </TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="space-y-2">
              <form onSubmit={handleAddFeed} className="flex flex-col gap-8">
                {activeTab === "youtube" && (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Label
                            htmlFor="yt-url"
                            className="text-lg font-semibold mb-1 block"
                          >
                            {t("feeds.addFeed.youtubeChannelUrl")}
                          </Label>
                          <Input
                            id="yt-url"
                            type="text"
                            className="h-14 text-lg bg-muted/60 border border-border/50 focus:ring-2 focus:ring-primary/30 rounded-xl px-6"
                            placeholder={
                              t("feeds.addFeed.youtubeUrlOrKeyword") ||
                              "YouTube URL or channel name"
                            }
                            value={youtubeUrl}
                            onChange={(e) => {
                              setYoutubeUrl(e.target.value);
                              setPreview(null);
                              setPreviewError("");
                              setShowAdvanced(false);
                              setTitle("");
                              setCategory("general");
                              setFetchFullContent(false);
                              setYtSearchResults([]);
                              setYtSearchError("");
                            }}
                            disabled={
                              previewLoading || isLoading || ytSearchLoading
                            }
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="ml-2 h-14 px-6 text-lg rounded-xl shadow-md"
                          onClick={handlePreview}
                          disabled={
                            !youtubeUrl ||
                            previewLoading ||
                            isLoading ||
                            ytSearchLoading
                          }
                        >
                          {previewLoading || ytSearchLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Search className="h-5 w-5" />
                          )}
                          <span className="ml-2 font-semibold">
                            {t("feeds.addFeed.previewOrSearch") ||
                              "Preview/Search"}
                          </span>
                        </Button>
                      </div>
                      {ytSearchError && (
                        <div className="rounded-xl border border-red-400 bg-red-900/10 text-red-400 flex items-center gap-2 text-base mt-3 px-4 py-3">
                          <XCircle className="h-5 w-5" />
                          {ytSearchError}
                        </div>
                      )}
                      {ytSearchResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {ytSearchResults.map((ch) => (
                            <button
                              type="button"
                              key={ch.id}
                              className="flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-br from-background/80 to-muted/60 hover:from-blue-900/10 hover:to-primary/10 transition shadow-lg"
                              onClick={() => handleSelectYtChannel(ch)}
                            >
                              <img
                                src={ch.thumbnail || "/images/feedtunelogo.png"}
                                alt={ch.title}
                                className="w-16 h-16 rounded-full object-cover border shadow"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="font-bold truncate text-lg">
                                  {ch.title}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {ch.description}
                                </div>
                                {ch.subscribersFormatted && (
                                  <div className="text-xs text-blue-400 mt-1">
                                    {ch.subscribersFormatted} subscribers
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {activeTab === "rss" && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label
                        htmlFor="rss-url"
                        className="text-lg font-semibold mb-1 block"
                      >
                        {t("feeds.addFeed.rssUrl")}
                      </Label>
                      <Input
                        id="rss-url"
                        type="url"
                        className="h-14 text-lg bg-muted/60 border border-border/50 focus:ring-2 focus:ring-primary/30 rounded-xl px-6"
                        placeholder="https://example.com/feed.xml"
                        value={rssUrl}
                        onChange={(e) => {
                          setRssUrl(e.target.value);
                          setPreview(null);
                          setPreviewError("");
                          setShowAdvanced(false);
                          setTitle("");
                          setCategory("general");
                          setFetchFullContent(false);
                        }}
                        disabled={previewLoading || isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="ml-2 h-14 px-6 text-lg rounded-xl shadow-md"
                      onClick={handlePreview}
                      disabled={!rssUrl || previewLoading || isLoading}
                    >
                      {previewLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                      <span className="ml-2 font-semibold">
                        {t("feeds.addFeed.preview")}
                      </span>
                    </Button>
                  </div>
                )}
                {previewError && (
                  <div className="rounded-xl border border-red-400 bg-red-900/10 text-red-400 flex items-center gap-2 text-base mt-3 px-4 py-3">
                    <XCircle className="h-5 w-5" />
                    {previewError}
                  </div>
                )}
                {preview && (
                  <div className="rounded-2xl border bg-gradient-to-br from-background/90 to-muted/60 p-6 flex items-center gap-6 mt-4 shadow-xl">
                    {activeTab === "youtube" ? (
                      <img
                        src={preview.thumbnail || "/images/feedtunelogo.png"}
                        alt={preview.title || "YouTube Channel"}
                        className="w-20 h-20 rounded-full object-cover border shadow-lg"
                      />
                    ) : (
                      <img
                        src={preview.image || "/images/feedtunelogo.png"}
                        alt={preview.title || "Feed"}
                        className="w-20 h-20 rounded object-cover border shadow-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-2xl truncate">
                        {preview.title || preview.channelTitle}
                      </div>
                      <div className="text-base text-muted-foreground truncate mt-1">
                        {preview.description || preview.channelDescription}
                      </div>
                      {activeTab === "youtube" &&
                        preview.subscribersFormatted && (
                          <div className="text-xs text-blue-400 mt-2">
                            {preview.subscribersFormatted} subscribers
                          </div>
                        )}
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500 drop-shadow" />
                  </div>
                )}
                {showAdvanced && preview && (
                  <div className="flex flex-col gap-6 mt-4 bg-gradient-to-br from-muted/60 to-background/80 rounded-2xl p-6 border border-border/40 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label
                          htmlFor="feed-title"
                          className="text-lg font-semibold mb-1 block"
                        >
                          {t("feeds.addFeed.customTitle")}
                        </Label>
                        <Input
                          id="feed-title"
                          className="h-12 text-lg bg-muted/60 border border-border/50 focus:ring-2 focus:ring-primary/30 rounded-xl px-4"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={t(
                            "feeds.addFeed.leaveBlankForAutoTitle"
                          )}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="feed-category"
                          className="text-lg font-semibold mb-1 block"
                        >
                          {t("feeds.addFeed.category")}
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger
                            id="feed-category"
                            className="h-12 text-lg rounded-xl px-4"
                          >
                            <SelectValue
                              placeholder={t("feeds.addFeed.selectCategory")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem
                                key={cat.value}
                                value={cat.value}
                                className="text-lg"
                              >
                                {t(`feeds.addFeed.categories.${cat.value}`) ||
                                  cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {activeTab === "rss" && (
                      <div className="flex gap-4 items-center mt-2">
                        <Label className="mr-2 text-lg font-semibold">
                          {t("feeds.addFeed.contentOptions")}
                        </Label>
                        <Button
                          type="button"
                          size="lg"
                          variant={fetchFullContent ? "default" : "outline"}
                          onClick={() => setFetchFullContent(true)}
                          className="rounded-xl px-4"
                        >
                          {t("feeds.addFeed.useFullContent")}
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          variant={!fetchFullContent ? "default" : "outline"}
                          onClick={() => setFetchFullContent(false)}
                          className="rounded-xl px-4"
                        >
                          {t("feeds.addFeed.useSummary")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter className="mt-10 flex flex-row justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading || previewLoading || ytSearchLoading}
                    className="px-8 py-3 text-lg rounded-xl font-semibold shadow"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !preview || isLoading || previewLoading || ytSearchLoading
                    }
                    className="font-bold px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg hover:from-blue-500 hover:to-primary transition"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-5 w-5" />
                    )}
                    {t("feeds.addFeed.add")}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
