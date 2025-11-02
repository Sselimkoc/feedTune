"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Card, CardContent } from "@/components/core/ui/card";
import {
  Rss,
  Youtube,
  Search,
  Loader2,
  Plus,
  ArrowLeft,
  ArrowRight,
  XCircle,
  Globe,
  Sparkles,
  AlignLeft,
  Film,
  CheckCircle2,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/core/ui/alert";
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
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/core/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// URL proxy helper function
const getProxiedImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

// Form schema
const formSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(), // URL preview step'te otomatik set edilir
  type: z.enum(["rss", "youtube"]),
  category: z.string().optional(),
  fetch_full_content: z.boolean().optional(),
});

const categories = [
  { value: "general", label: "General", icon: Globe },
  { value: "tech", label: "Technology", icon: Sparkles },
  { value: "news", label: "News", icon: AlignLeft },
  { value: "entertainment", label: "Entertainment", icon: Film },
  { value: "other", label: "Other", icon: Plus },
];

/**
 * Modern AddFeedDialog component with improved UI/UX and service integration
 */
export function AddFeedDialog({
  isOpen = false,
  onOpenChange = () => {},
  onSubmit = null,
  addFeedMutation = null,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Form definition
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
  const [step, setStep] = useState("input"); // input, search, preview
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("youtube");
      setStep("input");
      setPreviewData(null);
      setPreviewLoading(false);
      setPreviewError("");
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      setIsSubmitting(false);
      form.reset();
    }
  }, [isOpen, form]);

  // Close dialog when feed is added successfully
  useEffect(() => {
    if (isSubmitting && addFeedMutation && !addFeedMutation.isPending) {
      setIsSubmitting(false);
      form.reset();
      onOpenChange(false);
    }
  }, [
    addFeedMutation?.isPending,
    isSubmitting,
    form,
    onOpenChange,
    addFeedMutation,
  ]);

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      setStep("input");
      setPreviewData(null);
      setPreviewError("");
      setSearchResults([]);
      setSearchError("");
      form.setValue("type", tab);
      form.setValue("url", "");
    },
    [form]
  );

  // Helper: is input a YouTube URL?
  function isYoutubeUrl(val) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(val);
  }

  // Preview/Search logic
  const handlePreviewOrSearch = async () => {
    const url = form.getValues("url");
    if (!url) return;

    setPreviewData(null);
    setPreviewError("");
    setSearchResults([]);
    setSearchError("");

    if (activeTab === "youtube") {
      if (isYoutubeUrl(url)) {
        // Direct preview for URL
        await handleYoutubePreview(url);
      } else {
        // Search by keyword
        await handleYoutubeSearch(url);
      }
    } else {
      // RSS preview
      await handleRssPreview(url);
    }
  };

  const handleYoutubePreview = async (url) => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/youtube/channel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("feeds.addFeed.invalidUrl"));
      }

      const channel = data.channel;
      setPreviewData({
        title: channel.title,
        description: channel.description,
        thumbnail: channel.thumbnail,
        subscribersFormatted: channel.subscribersFormatted,
        type: "youtube",
        url: channel.url,
      });
      form.setValue("title", channel.title || "");
      setStep("preview");
    } catch (err) {
      setPreviewError(err.message || t("feeds.addFeed.invalidUrl"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleYoutubeSearch = async (keyword) => {
    setSearchLoading(true);
    try {
      const res = await fetch("/api/youtube/channel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("feeds.addFeed.noResults"));
      }

      if (!data.channels || data.channels.length === 0) {
        throw new Error(t("feeds.addFeed.noResults"));
      }

      setSearchResults(data.channels);
      setStep("search");
    } catch (err) {
      setSearchError(err.message || t("feeds.addFeed.noResults"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRssPreview = async (url) => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/rss-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("feeds.addFeed.invalidUrl"));
      }

      setPreviewData({
        title: data.feed.title,
        description: data.feed.description,
        icon: data.feed.icon,
        type: "rss",
        url: url,
      });
      form.setValue("title", data.feed.title || "");
      setStep("preview");
    } catch (err) {
      setPreviewError(err.message || t("feeds.addFeed.invalidUrl"));
    } finally {
      setPreviewLoading(false);
    }
  };

  // When user selects a channel from search results
  const handleSelectSearchResult = (result) => {
    setPreviewData({
      title: result.title,
      description: result.description,
      thumbnail: result.thumbnail,
      subscribersFormatted: result.subscribersFormatted,
      type: "youtube",
      url: result.url,
    });
    form.setValue("title", result.title || "");
    form.setValue("url", result.url);
    form.setValue("type", "youtube");
    form.setValue("category", "general");
    setStep("preview");
    setSearchResults([]);
  };

  // Form submit handler
  const handleSubmit = async (values) => {
    if (!previewData || !addFeedMutation) return;

    const feedData = {
      url: previewData.url || values.url,
      type: activeTab,
      title: values.title || previewData.title,
      category_id: null, // TODO: Kategorileri UUID ile map et
      fetch_full_content: values.fetch_full_content,
    };

    setIsSubmitting(true);
    addFeedMutation.mutate(feedData);
  };

  const goBack = () => {
    if (step === "preview") {
      setStep("input");
      setPreviewData(null);
    } else if (step === "search") {
      setStep("input");
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 rounded-3xl overflow-hidden shadow-2xl border border-border/70 bg-gradient-to-br from-background to-background/80 backdrop-blur-xl">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="flex items-center gap-2 text-3xl font-extrabold tracking-tight drop-shadow-lg bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            <Plus className="h-7 w-7 text-primary drop-shadow" />
            {t("feeds.addFeed.title")}
          </DialogTitle>
          <DialogDescription className="mt-3 text-muted-foreground text-lg">
            {t("feeds.addFeed.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-8">
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

            <TabsContent value={activeTab} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === "input" && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Form {...form}>
                      <form className="space-y-6">
                        <FormField
                          control={form.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">
                                {activeTab === "youtube"
                                  ? t("feeds.addFeed.youtubeChannelUrl")
                                  : t("feeds.addFeed.rssUrl")}
                              </FormLabel>
                              <FormControl>
                                <div className="flex gap-3">
                                  <Input
                                    {...field}
                                    className="h-14 text-lg bg-muted/60 border border-border/50 focus:ring-2 focus:ring-primary/30 rounded-xl px-6"
                                    placeholder={
                                      activeTab === "youtube"
                                        ? t(
                                            "feeds.addFeed.youtubeUrlOrKeyword"
                                          ) || "YouTube URL or channel name..."
                                        : "https://example.com/feed.xml"
                                    }
                                    disabled={
                                      previewLoading ||
                                      isLoading ||
                                      searchLoading
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-14 px-6 text-lg rounded-xl shadow-md"
                                    onClick={handlePreviewOrSearch}
                                    disabled={
                                      !field.value ||
                                      previewLoading ||
                                      isLoading ||
                                      searchLoading
                                    }
                                  >
                                    {previewLoading || searchLoading ? (
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <Search className="h-5 w-5" />
                                    )}
                                    <span className="ml-2 font-semibold">
                                      {activeTab === "youtube"
                                        ? "Preview/Search"
                                        : "Preview"}
                                    </span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>

                    {previewError && (
                      <Alert
                        variant="destructive"
                        className="border-red-400 bg-red-900/10"
                      >
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{previewError}</AlertDescription>
                      </Alert>
                    )}

                    {searchError && (
                      <Alert
                        variant="destructive"
                        className="border-red-400 bg-red-900/10"
                      >
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Search Error</AlertTitle>
                        <AlertDescription>{searchError}</AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                )}

                {step === "search" && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t("feeds.addFeed.back")}
                      </Button>
                      <h3 className="text-xl font-semibold">
                        {t("feeds.addFeed.searchResults")}
                      </h3>
                    </div>

                    <div className="grid gap-4">
                      {searchResults.map((result, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-border/50"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={getProxiedImageUrl(result.thumbnail)}
                                alt={result.title}
                                className="w-16 h-16 rounded-full object-cover border shadow-md"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg truncate">
                                  {result.title}
                                </h4>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {result.description}
                                </p>
                                {result.subscribersFormatted && (
                                  <div className="text-xs text-blue-400 mt-1">
                                    {result.subscribersFormatted} subscribers
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === "preview" && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t("feeds.addFeed.back")}
                      </Button>
                      <h3 className="text-xl font-semibold">
                        {t("feeds.addFeed.feedPreview")}
                      </h3>
                    </div>

                    {/* Preview Card */}
                    <Card className="border border-border/50 bg-gradient-to-br from-background/90 to-muted/60">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <img
                            src={getProxiedImageUrl(
                              previewData.thumbnail || previewData.icon
                            )}
                            alt={previewData.title}
                            className={`w-20 h-20 rounded-full object-cover border shadow-lg ${
                              activeTab === "rss"
                                ? "rounded-lg"
                                : "rounded-full"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-2xl truncate">
                              {previewData.title}
                            </h3>
                            <p className="text-muted-foreground text-base line-clamp-2 mt-1">
                              {previewData.description}
                            </p>
                            {previewData.subscribersFormatted && (
                              <div className="text-sm text-blue-400 mt-2">
                                {previewData.subscribersFormatted} subscribers
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Advanced Options */}
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        noValidate
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-lg font-semibold">
                                  {t("feeds.addFeed.customTitle")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="h-12 text-lg rounded-xl px-4"
                                    placeholder={t(
                                      "feeds.addFeed.leaveBlankForAutoTitle"
                                    )}
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
                                <FormLabel className="text-lg font-semibold">
                                  {t("feeds.addFeed.category")}
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-12 text-lg rounded-xl px-4">
                                      <SelectValue
                                        placeholder={t(
                                          "feeds.addFeed.selectCategory"
                                        )}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((cat) => {
                                      const IconComponent = cat.icon;
                                      return (
                                        <SelectItem
                                          key={cat.value}
                                          value={cat.value}
                                          className="text-lg"
                                        >
                                          <div className="flex items-center gap-2">
                                            <IconComponent className="h-4 w-4" />
                                            {t(
                                              `feeds.addFeed.categories.${cat.value}`
                                            ) || cat.label}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="fetch_full_content"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                </FormControl>
                                <FormLabel className="text-base font-medium">
                                  {t("feeds.addFeed.useFullContent")}
                                </FormLabel>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {t("feeds.addFeed.fullContentDescription")}
                              </p>
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-row justify-end gap-4 pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={addFeedMutation?.isPending}
                            className="px-8 py-3 text-lg rounded-xl font-semibold shadow"
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            type="submit"
                            disabled={addFeedMutation?.isPending}
                            className="font-bold px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg hover:from-blue-500 hover:to-primary transition"
                          >
                            {addFeedMutation?.isPending ? (
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-5 w-5" />
                            )}
                            {t("feeds.addFeed.add")}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
