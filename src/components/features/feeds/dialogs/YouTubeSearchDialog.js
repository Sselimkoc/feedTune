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
import { toast } from "sonner";
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
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
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
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
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
      toast.error(t("errors.emptySearchQuery"));
      return;
    }

    setIsLoading(true);

    try {
      const results = await youtubeService.searchChannels(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching YouTube channels:", error);
      toast.error(t("errors.youtubeSearchFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast, t]);

  // Handle adding a channel
  const handleAddChannel = useCallback(
    async (channelId) => {
      if (!userId) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      setIsLoading(true);

      try {
        await feedService.addFeed(channelId, "youtube", userId);
        toast.success(t("success.channelAdded"));
        onSuccess?.();
        onOpenChange(false);
      } catch (error) {
        console.error("Error adding YouTube channel:", error);
        toast.error(t("errors.addChannelFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, onSuccess, onOpenChange, toast, t]
  );

  if (isLoadingUser) {
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
                            )}&background=random&color=fff&size=60`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {channel.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users2 className="h-3 w-3" />
                            {channel.subscribersFormatted}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {channel.videoCountFormatted}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel details */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={getProxiedImageUrl(searchResults[0].thumbnail)}
                      alt={searchResults[0].title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          searchResults[0].title
                        )}&background=random&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">
                      {searchResults[0].title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Users2 className="h-3 w-3" />
                        {searchResults[0].subscribersFormatted}{" "}
                        {t("feeds.subscribers")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Film className="h-3 w-3" />
                        {selectedChannel.videoCountFormatted}{" "}
                        {t("feeds.videos")}
                      </Badge>
                      <a
                        href={selectedChannel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("common.viewOnYouTube")}
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {selectedChannel.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <DialogFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={() => handleAddChannel(selectedChannel)}
                      disabled={isAdding || selectedChannel.isAdded}
                      variant={selectedChannel.isAdded ? "outline" : "default"}
                      className={
                        selectedChannel.isAdded
                          ? "bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500/20"
                          : ""
                      }
                    >
                      {isAdding ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : selectedChannel.isAdded ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {selectedChannel.isAdded
                        ? t("feeds.channelAdded")
                        : t("feeds.addThisChannel")}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Youtube className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {t("feeds.selectChannelToViewDetails")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("feeds.searchAndSelectChannel")}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
