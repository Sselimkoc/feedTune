"use client";

import { useState, useCallback } from "react";
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
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  ExternalLink,
  Plus,
  Users2,
  Film,
  Youtube,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { youtubeService } from "@/lib/youtube/service";
import { cacheChannelInfo } from "@/lib/youtube/cache";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

/**
 * Format numbers in a user-friendly way (e.g., 1.2M, 5.7K)
 * @param {string|number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  if (!num || isNaN(Number(num))) return "Unknown";

  num = Number(num);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}

/**
 * Get proxied image URL to handle CORS restrictions
 * @param {string} url - Original image URL
 * @returns {string} - Proxied image URL
 */
const getProxiedImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

/**
 * Dialog component for searching and adding YouTube channels
 */
export function YouTubeSearchDialog({
  isOpen = false,
  onOpenChange = () => {},
  onSuccess = () => {},
}) {
  const { t } = useTranslation();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { toast } = useToast();

  // Reset state when dialog closes
  const handleOpenChange = (open) => {
    if (!open) {
      // Small delay to prevent visual glitches during animation
      setTimeout(() => {
        setSearchQuery("");
        setSearchResults([]);
      }, 300);
    }
    onOpenChange(open);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Clear previous results when input changes
    if (searchResults.length > 0) {
      setSearchResults([]);
    }
  };

  // Handle search submission
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: t("common.error"),
        description: t("errors.emptySearchQuery"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const results = await youtubeService.searchChannels(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching YouTube channels:", error);
      toast({
        title: t("common.error"),
        description: t("errors.youtubeSearchFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast, t]);

  // Handle adding a channel
  const handleAddChannel = useCallback(
    async (channelId) => {
      if (!userId) {
        toast({
          title: t("common.error"),
          description: t("errors.authRequired"),
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);

      try {
        await feedService.addFeed(channelId, "youtube", userId);
        toast({
          title: t("common.success"),
          description: t("feeds.addSuccess"),
          variant: "default",
        });
        onSuccess?.();
        onOpenChange(false);
      } catch (error) {
        console.error("Error adding YouTube channel:", error);
        toast({
          title: t("common.error"),
          description: error.message || t("feeds.addError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userId, onSuccess, onOpenChange, toast, t]
  );

  if (isLoadingAuth) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0 border-border/50 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-0 border-b-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
              <Youtube className="h-4 w-4 text-red-500" />
              <div className="absolute -inset-1 animate-pulse rounded-full bg-red-500/10 blur-sm -z-10"></div>
            </div>
            {t("feeds.searchYouTubeChannels")}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-muted-foreground">
            {t("feeds.searchYouTubeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow">
              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t("feeds.enterYouTubeChannelNameOrUrl")}
                className="pr-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {t("common.search")}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Search results sidebar */}
          <div className="w-full md:w-64 lg:w-72 border-r border-border/50 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 flex flex-col items-center justify-center text-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {t("common.searching")}
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-center h-full">
                <Search className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? t("feeds.noChannelsFound")
                    : t("feeds.searchForChannels")}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {searchResults.map((channel, index) => (
                  <div
                    key={channel.id || index}
                    className={`
                      p-2 rounded-lg cursor-pointer transition-colors
                      ${index === 0 ? "bg-muted" : "hover:bg-muted/50"}
                    `}
                    onClick={() => handleAddChannel(channel.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                        <img
                          src={getProxiedImageUrl(channel.thumbnail)}
                          alt={channel.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              channel.title
                            )}&background=random&color=fff`;
                          }}
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">
                          {channel.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users2 className="h-3 w-3" />
                          <span>{formatNumber(channel.subscriberCount)}</span>
                          <Film className="h-3 w-3 ml-2" />
                          <span>{formatNumber(channel.videoCount)}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddChannel(channel.id);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="sr-only">{t("feeds.addChannel")}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel Detail */}
          <div className="hidden md:flex flex-1 items-center justify-center p-6">
            {searchResults.length > 0 ? (
              <Card className="w-full max-w-sm">
                <CardHeader className="flex flex-col items-center text-center p-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full mb-4">
                    <img
                      src={getProxiedImageUrl(searchResults[0].thumbnail)}
                      alt={searchResults[0].title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          searchResults[0].title
                        )}&background=random&color=fff`;
                      }}
                    />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {searchResults[0].title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {searchResults[0].description}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 grid gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <Label>{t("feeds.subscribers")}</Label>
                    <Badge variant="outline">
                      {formatNumber(searchResults[0].subscriberCount)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Label>{t("feeds.videos")}</Label>
                    <Badge variant="outline">
                      {formatNumber(searchResults[0].videoCount)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Label>{t("feeds.views")}</Label>
                    <Badge variant="outline">
                      {formatNumber(searchResults[0].viewCount)}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                    disabled={!searchResults[0].url}
                  >
                    <a
                      href={searchResults[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("common.viewChannel")}
                    </a>
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleAddChannel(searchResults[0].id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {t("feeds.addChannel")}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="text-center text-muted-foreground">
                <Youtube className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {t("feeds.selectChannelToViewDetails")}
                </p>
                <p className="text-sm">{t("feeds.detailsWillAppearHere")}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
