"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/auth/useAuth";
import { useFeedActions } from "@/hooks/features/feed-screen/useFeedActions";
import { feedService } from "@/services/feedService";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Rss,
  Search,
  Loader2,
  ExternalLink,
  Plus,
  Calendar,
  AlignLeft,
  AlertCircle,
  CheckCircle,
  FileText,
  Hash,
  Image,
} from "lucide-react";
import { timeAgo } from "@/utils/dateUtils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

/**
 * Helper to get a proxied image URL for CORS-restricted images
 * @param {string} url - Original image URL
 * @returns {string} - Proxied image URL or default
 */
const getProxiedImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

/**
 * Dialog component for previewing and adding RSS feeds
 */
export function RssPreviewDialog({
  isOpen = false,
  onOpenChange = () => {},
  onSuccess = () => {},
}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const userId = user?.id;
  const [feedUrl, setFeedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [feedPreview, setFeedPreview] = useState(null);
  const [error, setError] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [fetchFullContent, setFetchFullContent] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog closes
  const handleOpenChange = (open) => {
    if (!open) {
      // Small delay to prevent visual glitches during animation
      setTimeout(() => {
        setFeedUrl("");
        setFeedPreview(null);
        setError(null);
        setCustomTitle("");
        setFetchFullContent(false);
      }, 300);
    }
    onOpenChange(open);
  };

  // Setup feed actions
  const refreshFeeds = useCallback(() => {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
  }, [onSuccess]);

  const { addFeed } = useFeedActions(
    user,
    refreshFeeds,
    refreshFeeds,
    feedService
  );

  // Handle feed URL change
  const handleUrlChange = (e) => {
    setFeedUrl(e.target.value);
    // Clear previous results when input changes
    if (feedPreview) {
      setFeedPreview(null);
    }
    if (error) {
      setError(null);
    }
  };

  // Handle feed preview
  const handlePreviewFeed = async () => {
    if (!feedUrl.trim() || isLoading) return;

    setIsLoading(true);
    setFeedPreview(null);
    setError(null);

    try {
      // Call the RSS preview API
      const response = await fetch("/api/rss-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: feedUrl }),
      });

      if (!response.ok) {
        throw new Error(`Preview failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.title) {
        setError(t("feeds.invalidRssFeed"));
        return;
      }

      // Store preview data
      setFeedPreview({
        title: data.title || "Untitled Feed",
        description: data.description || "",
        link: data.link || feedUrl,
        itemCount: Array.isArray(data.items) ? data.items.length : 0,
        image: data.image || null,
        preview: Array.isArray(data.preview) ? data.preview : [],
        language: data.language || "en",
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      });

      // Set custom title to feed title by default
      setCustomTitle(data.title || "");
    } catch (error) {
      console.error("RSS preview error:", error);

      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (
        error.message.includes("not found") ||
        error.message.includes("access") ||
        error.message.includes("CORS")
      ) {
        errorMessage = t("feeds.cannotAccessFeed");
      } else if (
        error.message.includes("parse") ||
        error.message.includes("invalid")
      ) {
        errorMessage = t("feeds.invalidRssFeed");
      } else if (error.message.includes("timeout")) {
        errorMessage = t("feeds.timeoutError");
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a feed
  const handleAddFeed = async () => {
    if (!feedUrl.trim() || isAdding || !feedPreview) return;

    setIsAdding(true);

    try {
      // Prepare feed data
      const feedData = {
        url: feedUrl,
        title: customTitle || feedPreview.title,
        type: "rss",
        fetch_full_content: fetchFullContent,
      };

      // Add the feed
      await addFeed(feedUrl, "rss", feedData);

      toast({
        title: t("common.success"),
        description: t("feeds.addSuccess"),
        variant: "default",
      });

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close the dialog
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding feed:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.addError"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Set custom title when feed preview is loaded
  useEffect(() => {
    if (feedPreview && feedPreview.title) {
      setCustomTitle(feedPreview.title);
    }
  }, [feedPreview]);

  if (isLoadingAuth) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0 border-border/50 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-0 border-b-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
              <Rss className="h-4 w-4 text-blue-500" />
              <div className="absolute -inset-1 animate-pulse rounded-full bg-blue-500/10 blur-sm -z-10"></div>
            </div>
            {t("feeds.previewRssFeed")}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-muted-foreground">
            {t("feeds.previewRssFeedDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow">
              <Input
                value={feedUrl}
                onChange={handleUrlChange}
                placeholder={t("feeds.enterFeedUrl")}
                className="pr-10"
                onKeyDown={(e) => e.key === "Enter" && handlePreviewFeed()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button
              onClick={handlePreviewFeed}
              disabled={!feedUrl.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {t("common.preview")}
            </Button>
          </div>
        </div>

        <Separator />

        {feedPreview ? (
          <div className="flex-1 overflow-auto flex flex-col md:flex-row">
            {/* Left Column: Preview Content */}
            <div className="w-full md:w-2/3 border-r border-border/50 overflow-y-auto">
              <div className="p-6 space-y-4">
                {feedPreview.image && (
                  <div className="relative h-40 w-full overflow-hidden rounded-md">
                    <img
                      src={getProxiedImageUrl(feedPreview.image)}
                      alt={feedPreview.title}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
                <h3 className="text-xl font-bold text-foreground">
                  {feedPreview.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {feedPreview.description || t("feeds.noDescription")}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {feedPreview.language && (
                    <Badge variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {feedPreview.language.toUpperCase()}
                    </Badge>
                  )}
                  {feedPreview.lastUpdated && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {timeAgo(feedPreview.lastUpdated, t)}
                    </Badge>
                  )}
                  {feedPreview.itemCount > 0 && (
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      {t("feeds.itemCount", { count: feedPreview.itemCount })}
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                <h4 className="text-lg font-semibold text-foreground mb-3">
                  {t("feeds.latestArticles")}
                </h4>
                <div className="space-y-4">
                  {feedPreview.preview.length > 0 ? (
                    feedPreview.preview.map((item, index) => (
                      <motion.div
                        key={item.link || index}
                        className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <h5 className="font-medium text-base line-clamp-2">
                          {item.title}
                        </h5>
                        <p className="text-xs text-muted-foreground line-clamp-3 mt-1">
                          {item.description || t("feeds.noDescription")}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          {item.image && <Image className="h-3 w-3" />}
                          {item.published_at && (
                            <Calendar className="h-3 w-3" />
                          )}
                          {item.published_at && timeAgo(item.published_at, t)}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("common.readMore")}
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                      <p>{t("feeds.noArticlesAvailable")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Settings */}
            <div className="w-full md:w-1/3 p-6 space-y-6">
              <Card className="bg-card/50 border-border/70 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {t("feeds.feedSettings")}
                  </CardTitle>
                  <CardDescription>
                    {t("feeds.feedSettingsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customTitle">
                      {t("feeds.customTitle")}
                    </Label>
                    <Input
                      id="customTitle"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={feedPreview.title}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fetchFullContent"
                      checked={fetchFullContent}
                      onCheckedChange={setFetchFullContent}
                    />
                    <Label
                      htmlFor="fetchFullContent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("feeds.fetchFullContent")}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("feeds.fetchFullContentDescription")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">{t("common.error")}</p>
            <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => handleOpenChange(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Rss className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("feeds.enterFeedUrl")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {t("feeds.enterFeedUrlDescription")}
            </p>
          </div>
        )}

        <DialogFooter className="flex justify-end p-4 border-t border-border/50">
          {feedPreview && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddFeed} disabled={isAdding}>
                {isAdding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t("feeds.addFeed")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
