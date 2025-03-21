"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFeeds,
  fetchFeeds,
  fetchFavorites,
  fetchReadLaterItems,
} from "@/hooks/features/useFeeds";
import { useFeedStore } from "@/store/useFeedStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, stripHtml } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardShortcutsHelp } from "@/components/features/feeds/KeyboardShortcutsHelp";
import { FeedCard } from "./FeedCard";
import { FeedNavigation } from "./FeedNavigation";
import { AddFeedButton } from "./AddFeedButton";
import {
  Loader2,
  Filter,
  Star,
  EyeOff,
  Eye,
  Clock,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  Search,
  X,
  PlusCircle,
  Rss,
} from "lucide-react";
import { FilterDialog } from "./FilterDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { RssIcon, Tag } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { KeyboardIcon } from "lucide-react";

// Constants
const ITEMS_PER_PAGE = 10;

// Main component
export function FeedList() {
  // Hooks and stores
  const { user } = useAuthStore();
  const {
    feeds,
    items,
    isLoading,
    refetch,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
    deleteFeed,
  } = useFeeds();
  const {
    showUnreadOnly,
    showFavoritesOnly,
    compactMode,
    selectedFeedId,
    setSelectedFeedId,
    filters,
    setFilters,
  } = useFeedStore();
  const { settings } = useSettingsStore();
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();
  const { t, language } = useLanguage();

  // State management
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const itemRefs = useRef({});
  const containerRef = useRef(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // References
  const listRef = useRef(null);
  const selectedItemRef = useRef(null);

  // Seçili feed ID'leri için yeni state
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);

  // Memoized values
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = [...items];

    // Seçili feed ID'lere göre filtrele
    if (selectedFeedIds.length > 0) {
      result = result.filter((item) => selectedFeedIds.includes(item.feed_id));
    }

    // Feed türüne göre filtrele
    if (!filters.feedTypes.rss || !filters.feedTypes.youtube) {
      const feedTypeMap = feeds.reduce((acc, feed) => {
        acc[feed.id] = feed.type;
        return acc;
      }, {});

      result = result.filter((item) => {
        const feedType = feedTypeMap[item.feed_id];
        return (
          (feedType === "rss" && filters.feedTypes.rss) ||
          (feedType === "youtube" && filters.feedTypes.youtube)
        );
      });
    }

    // Okunma durumuna göre filtrele
    if (!filters.showRead && !filters.showUnread) {
      return []; // Hiçbir şey gösterme
    } else if (!filters.showRead) {
      result = result.filter((item) => !item.is_read);
    } else if (!filters.showUnread) {
      result = result.filter((item) => item.is_read);
    }

    // Sıralama
    switch (filters.sortBy) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.published_at).getTime() -
            new Date(b.published_at).getTime()
        );
        break;
      case "unread":
        result.sort((a, b) => {
          if (a.is_read === b.is_read) {
            return (
              new Date(b.published_at).getTime() -
              new Date(a.published_at).getTime()
            );
          }
          return a.is_read ? 1 : -1;
        });
        break;
      case "favorites":
        result.sort((a, b) => {
          if (a.is_favorite === b.is_favorite) {
            return (
              new Date(b.published_at).getTime() -
              new Date(a.published_at).getTime()
            );
          }
          return a.is_favorite ? -1 : 1;
        });
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        );
        break;
    }

    return result;
  }, [items, feeds, selectedFeedIds, filters]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refetch();
      queryClient.prefetchQuery({
        queryKey: ["feeds", user.id],
        queryFn: () => fetchFeeds(user.id),
      });
      queryClient.prefetchQuery({
        queryKey: ["favorites", user.id],
        queryFn: () => fetchFavorites(user.id),
      });
      queryClient.prefetchQuery({
        queryKey: ["read-later", user.id],
        queryFn: () => fetchReadLaterItems(user.id),
      });
    }
  }, [user, refetch, queryClient]);

  // Klavye kısayolları için useEffect
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Eğer bir input veya textarea odaklanmışsa, kısayolları devre dışı bırak
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Yardımcı fonksiyon: Belirli bir öğeye scroll yap
      const scrollToIndex = (index) => {
        // Kaydırma özelliği şimdilik devre dışı bırakıldı
        // const itemId = filteredItems[index]?.id;
        // if (itemId) {
        //   const element = document.getElementById(`feed-item-${itemId}`);
        //   if (element) {
        //     element.scrollIntoView({ behavior: "smooth", block: "center" });
        //   }
        // }
      };

      switch (e.key) {
        case "j":
        case "ArrowDown":
          // Aşağı git
          e.preventDefault();
          setFocusedItemIndex((prev) => {
            const newIndex = Math.min(prev + 1, filteredItems.length - 1);
            // Kaydırma özelliği şimdilik devre dışı bırakıldı
            // requestAnimationFrame(() => scrollToIndex(newIndex));
            return newIndex;
          });
          break;
        case "k":
        case "ArrowUp":
          // Yukarı git
          e.preventDefault();
          setFocusedItemIndex((prev) => {
            const newIndex = Math.max(prev - 1, 0);
            // Kaydırma özelliği şimdilik devre dışı bırakıldı
            // requestAnimationFrame(() => scrollToIndex(newIndex));
            return newIndex;
          });
          break;
        case "o":
        case "Enter":
          // Öğeyi aç
          e.preventDefault();
          if (filteredItems[focusedItemIndex]?.link) {
            window.open(filteredItems[focusedItemIndex].link, "_blank");
            // Okunmadıysa okundu olarak işaretle
            if (!filteredItems[focusedItemIndex].is_read) {
              toggleItemRead(filteredItems[focusedItemIndex].id, true);
            }
          }
          break;
        case "m":
          // Okundu/Okunmadı olarak işaretle
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            toggleItemRead(
              filteredItems[focusedItemIndex].id,
              !filteredItems[focusedItemIndex].is_read
            );
          }
          break;
        case "s":
          // Favorilere ekle/çıkar
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            toggleItemFavorite(
              filteredItems[focusedItemIndex].id,
              !filteredItems[focusedItemIndex].is_favorite
            );
          }
          break;
        case "b":
          // Okuma listesine ekle/çıkar
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            toggleItemReadLater(
              filteredItems[focusedItemIndex].id,
              !filteredItems[focusedItemIndex].is_read_later
            );
          }
          break;
        case "?":
          // Klavye kısayolları yardımını göster
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    filteredItems,
    focusedItemIndex,
    toggleItemRead,
    toggleItemFavorite,
    toggleItemReadLater,
  ]);

  // İlk render'da ilk öğeye odaklan
  useEffect(() => {
    if (filteredItems.length > 0 && focusedItemIndex === 0) {
      // Kaydırma özelliği şimdilik devre dışı bırakıldı
      // const element = document.getElementById(
      //   `feed-item-${filteredItems[0]?.id}`
      // );
      // if (element) {
      //   element.scrollIntoView({ behavior: "auto", block: "nearest" });
      // }
    }
  }, [filteredItems, filteredItems.length, focusedItemIndex]);

  // Feed seçimi için yeni handler
  const handleFeedSelect = useCallback((feedId) => {
    setSelectedFeedIds((prev) => {
      // Eğer zaten seçiliyse, seçimi kaldır
      if (prev.includes(feedId)) {
        return prev.filter((id) => id !== feedId);
      }
      // Değilse, seçime ekle
      return [...prev, feedId];
    });
  }, []);

  // Tüm feed'leri seç/kaldır
  const handleToggleAllFeeds = useCallback(() => {
    // Tüm seçimleri kaldır
    setSelectedFeedIds([]);
  }, []);

  // Memoized item action handlers
  const handleToggleRead = useCallback(
    (itemId, isRead) => {
      console.log("Toggling read status:", itemId, isRead);

      // Optimistic update
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_read: isRead } : item
          ),
        };
      });

      if (typeof toggleItemRead === "function") {
        toggleItemRead({ itemId, isRead });
      } else {
        console.error("toggleItemRead is not a function");

        // Rollback optimistic update
        queryClient.setQueryData(["feeds"], (old) => {
          if (!old) return { feeds: [], items: [] };

          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId ? { ...item, is_read: !isRead } : item
            ),
          };
        });
      }
    },
    [toggleItemRead, queryClient]
  );

  const handleToggleFavorite = useCallback(
    (itemId, isFavorite) => {
      console.log("Toggling favorite status:", itemId, isFavorite);

      // Optimistic update
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_favorite: isFavorite } : item
          ),
        };
      });

      if (typeof toggleItemFavorite === "function") {
        toggleItemFavorite({ itemId, isFavorite });
      } else {
        console.error("toggleItemFavorite is not a function");

        // Rollback optimistic update
        queryClient.setQueryData(["feeds"], (old) => {
          if (!old) return { feeds: [], items: [] };

          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId ? { ...item, is_favorite: !isFavorite } : item
            ),
          };
        });
      }
    },
    [toggleItemFavorite, queryClient]
  );

  const handleToggleReadLater = useCallback(
    (itemId, isReadLater) => {
      console.log("FeedList: Toggling read later status:", itemId, isReadLater);

      // Optimistic update
      queryClient.setQueryData(["feeds"], (old) => {
        if (!old) return { feeds: [], items: [] };

        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_read_later: isReadLater } : item
          ),
        };
      });

      if (typeof toggleItemReadLater === "function") {
        console.log("toggleItemReadLater function exists, calling it now");
        try {
          toggleItemReadLater({ itemId, isReadLater });
        } catch (error) {
          console.error("Error calling toggleItemReadLater:", error);

          // Rollback optimistic update
          queryClient.setQueryData(["feeds"], (old) => {
            if (!old) return { feeds: [], items: [] };

            return {
              ...old,
              items: old.items.map((item) =>
                item.id === itemId
                  ? { ...item, is_read_later: !isReadLater }
                  : item
              ),
            };
          });
        }
      } else {
        console.error(
          "toggleItemReadLater is not a function",
          toggleItemReadLater
        );
      }
    },
    [toggleItemReadLater, queryClient]
  );

  const handleOpenLink = useCallback(
    (link, itemId) => {
      if (!link) {
        console.error("No link provided");
        return;
      }
      window.open(link, "_blank");
      // Automatically mark as read when opened
      if (itemId && typeof toggleItemRead === "function") {
        toggleItemRead({ itemId, isRead: true });
      }
    },
    [toggleItemRead]
  );

  // Aktif filtre sayısını hesapla
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.sortBy !== "newest") count++;
    if (!filters.showRead) count++;
    if (!filters.showUnread) count++;
    if (!filters.feedTypes.rss) count++;
    if (!filters.feedTypes.youtube) count++;

    return count;
  }, [filters]);

  // Aktif filtreleri yönetmek için yeni fonksiyon
  const handleFilterClick = useCallback(
    (filterType, value) => {
      const newFilters = { ...filters };

      switch (filterType) {
        case "sortBy":
          newFilters.sortBy = value;
          break;
        case "showRead":
          newFilters.showRead = !newFilters.showRead;
          break;
        case "showUnread":
          newFilters.showUnread = !newFilters.showUnread;
          break;
        case "feedType":
          newFilters.feedTypes[value] = !newFilters.feedTypes[value];
          break;
        default:
          break;
      }

      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  // Render
  return (
    <div
      className="container py-6 space-y-6"
      role="feed"
      aria-label={t("feeds.feedList.title")}
    >
      {/* Filtre ve Sıralama Araçları */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Feed Seçici */}
          <Select
            value={
              selectedFeedIds.length === 0 ? "all" : selectedFeedIds.join(",")
            }
            onValueChange={(value) => {
              if (value === "all") {
                setSelectedFeedIds([]);
              } else {
                setSelectedFeedIds(value.split(","));
              }
            }}
            aria-label={t("feeds.feedList.selectFeeds")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("feeds.feedList.allFeeds")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("feeds.feedList.allFeeds")}
              </SelectItem>
              {feeds.map((feed) => (
                <SelectItem key={feed.id} value={feed.id}>
                  <div className="flex items-center gap-2">
                    {feed.site_favicon ? (
                      <Image
                        src={feed.site_favicon}
                        alt={t("feeds.feedList.siteLogo", { site: feed.title })}
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    ) : (
                      <RssIcon className="h-4 w-4" />
                    )}
                    <span>{feed.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtre Butonu */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDialogOpen(true)}
            className="flex items-center gap-1.5"
            aria-label={t("feeds.feedList.openFilters")}
          >
            <Filter className="h-4 w-4" />
            <span>{t("feeds.feedList.filters")}</span>
            {Object.values(filters).some((value) =>
              typeof value === "object"
                ? Object.values(value).some((v) => !v)
                : !value
            ) && (
              <Badge variant="secondary" className="ml-1">
                {t("feeds.feedList.activeFilters")}
              </Badge>
            )}
          </Button>

          {/* Klavye Kısayolları */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center gap-1.5"
            aria-label={t("feeds.feedList.openKeyboardShortcuts")}
          >
            <KeyboardIcon className="h-4 w-4" />
            <span>{t("feeds.feedList.keyboardShortcuts")}</span>
          </Button>
        </div>

        {/* Feed Ekle Butonu */}
        <AddFeedButton />
      </div>

      {/* İçerik Listesi */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          role="status"
          aria-label={t("common.loading")}
        >
          {Array(6)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="h-[400px] rounded-lg bg-muted animate-pulse"
                aria-hidden="true"
              />
            ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          role="feed"
          aria-label={t("feeds.feedList.contentList")}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                id={`feed-item-${item.id}`}
              >
                <FeedCard
                  item={item}
                  feed={feeds.find((f) => f.id === item.feed_id)}
                  compact={compactMode}
                  onToggleRead={(id, value) => toggleItemRead(id, value)}
                  onToggleFavorite={(id, value) =>
                    toggleItemFavorite(id, value)
                  }
                  onToggleReadLater={(id, value) =>
                    toggleItemReadLater(id, value)
                  }
                  isFocused={focusedItemIndex === index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyFilterState onResetFilters={() => setFilters(defaultFilters)} />
      )}

      {/* Filtre Dialog */}
      <FilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Klavye Kısayolları */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}
// Memoized FeedCard component
const FeedCardMemo = memo(FeedCard);

// EmptyState bileşenini güncelleyelim
export const EmptyState = memo(function EmptyState({ onAddFeed }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-primary/5 rounded-full p-6 mb-6">
        <Rss className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3">{t("feeds.emptyState.title")}</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {t("feeds.emptyState.description")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full mb-8">
        <div className="bg-card border rounded-lg p-4 text-left">
          <div className="flex items-center mb-2">
            <Rss className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="font-medium">RSS Beslemeleri</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Haber siteleri, bloglar ve podcast'leri takip edin
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddFeed("rss")}
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            RSS Ekle
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-4 text-left">
          <div className="flex items-center mb-2">
            <RssIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="font-medium">YouTube Kanalları</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Favori YouTube kanallarınızı takip edin
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddFeed("youtube")}
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Kanal Ekle
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <KeyboardIcon className="h-4 w-4" />
        <span>
          Klavye kısayolları için{" "}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">?</kbd> tuşuna
          basın
        </span>
      </div>
    </div>
  );
});

// EmptyFilterState bileşenini güncelleyelim
export const EmptyFilterState = memo(function EmptyFilterState({
  onResetFilters,
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-yellow-50 rounded-full p-6 mb-6">
        <Filter className="h-12 w-12 text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3">
        {t("feeds.emptyFilterState.title")}
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {t("feeds.emptyFilterState.description")}
      </p>
      <Button onClick={onResetFilters} className="mb-4">
        <Filter className="h-4 w-4 mr-1.5" />
        {t("feeds.emptyFilterState.resetFilters")}
      </Button>

      <div className="flex flex-col sm:flex-row items-center gap-2 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground max-w-md">
        <div className="flex items-center justify-center bg-background rounded-full p-2">
          <Search className="h-4 w-4" />
        </div>
        <p className="text-center sm:text-left">
          Filtreleri sıfırlamak, tüm beslemelerinizi ve öğelerinizi
          görüntülemenizi sağlar.
        </p>
      </div>
    </div>
  );
});
