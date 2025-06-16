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
import { useAuthStore } from "@/store/useAuthStore";
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
import { toast } from "sonner";
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
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
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
  const { user } = useAuthStore();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
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

      toast.success(t("feeds.addFeedSuccess"));

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close the dialog
      handleOpenChange(false);
    } catch (error) {
      console.error("Error adding feed:", error);
      toast.error(error.message || t("feeds.addFeedError"));
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

  if (isLoadingUser) {
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
            {t("feeds.previewRssDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow">
              <Input
                value={feedUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/feed.xml"
                className="pr-10"
                onKeyDown={(e) => e.key === "Enter" && handlePreviewFeed()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Rss className="h-4 w-4 text-muted-foreground" />
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
              {t("feeds.preview")}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("feeds.loadingPreview")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t("feeds.loadingPreviewDescription")}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("feeds.previewError")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setError(null)}
              >
                {t("common.tryAgain")}
              </Button>
            </div>
          ) : feedPreview ? (
            <div className="space-y-6">
              {/* Feed Information */}
              <div className="flex flex-col md:flex-row gap-6">
                {feedPreview.image && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={getProxiedImageUrl(feedPreview.image)}
                      alt={feedPreview.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          feedPreview.title
                        )}&background=random&color=fff&size=128`;
                      }}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">
                    {feedPreview.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3" />
                      {feedPreview.itemCount} {t("feeds.entries")}
                    </Badge>

                    {feedPreview.language && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <AlignLeft className="h-3 w-3" />
                        {feedPreview.language.toUpperCase()}
                      </Badge>
                    )}

                    {feedPreview.lastUpdated && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        {timeAgo(new Date(feedPreview.lastUpdated))}
                      </Badge>
                    )}

                    {feedPreview.link && (
                      <a
                        href={feedPreview.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("common.visitWebsite")}
                      </a>
                    )}
                  </div>

                  {feedPreview.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {feedPreview.description}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Preview items */}
              {feedPreview.preview && feedPreview.preview.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    {t("feeds.recentEntries")}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {feedPreview.preview.slice(0, 4).map((item, index) => (
                      <Card key={index} className="overflow-hidden">
                        {item.thumbnail && (
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={getProxiedImageUrl(item.thumbnail)}
                              alt={item.title}
                              className="h-full w-full object-cover transition-all hover:scale-105"
                              onError={(e) => {
                                e.target.src = null;
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <CardHeader className={item.thumbnail ? "pt-3" : ""}>
                          <CardTitle className="text-base line-clamp-2">
                            {item.title}
                          </CardTitle>
                          {item.pubDate && (
                            <CardDescription className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {timeAgo(new Date(item.pubDate))}
                            </CardDescription>
                          )}
                        </CardHeader>

                        {item.description && (
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description.replace(/<[^>]*>/g, "")}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("feeds.noPreviewItemsAvailable")}
                  </p>
                </div>
              )}

              <Separator />

              {/* Feed settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">
                  {t("feeds.feedSettings")}
                </h4>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-title">
                      {t("feeds.customTitle")}
                    </Label>
                    <Input
                      id="custom-title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={feedPreview.title}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("feeds.customTitleDescription")}
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="fetch-full-content"
                      checked={fetchFullContent}
                      onCheckedChange={setFetchFullContent}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="fetch-full-content"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("feeds.fetchFullContent")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("feeds.fetchFullContentDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Rss className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("feeds.enterRssUrl")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {t("feeds.enterRssUrlDescription")}
              </p>
            </div>
          )}
        </div>

        {feedPreview && (
          <div className="border-t border-border/50 p-4">
            <DialogFooter className="flex sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
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
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
