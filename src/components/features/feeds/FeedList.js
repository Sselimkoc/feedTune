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
import { EmptyState } from "./EmptyState";
import { EmptyFilterState } from "./EmptyFilterState";
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
    <div className="w-full">
      <AnimatePresence>
        {showKeyboardHelp && (
          <KeyboardShortcutsHelp
            open={showKeyboardHelp}
            onOpenChange={setShowKeyboardHelp}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("feeds.feedList.title")}</h1>
          <p className="text-muted-foreground">
            {t("feeds.feedList.description")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardHelp(true)}
            title={t("feeds.keyboardShortcuts.title")}
          >
            <KeyboardIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {t("feeds.keyboardShortcuts.title")}
            </span>
          </Button>

          {/* add feed button */}
          <AddFeedButton />
        </div>
      </div>

      {/* Çoklu Kanal Seçimi */}
      {feeds?.length > 0 && (
        <div className="mb-6 bg-background/60 backdrop-blur-sm sticky top-0 z-10 py-2 border-b">
          <div className="flex justify-between items-center gap-2">
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex space-x-2 p-1">
                {/* Tüm Seçimleri Kaldır Butonu */}
                {selectedFeedIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleAllFeeds}
                    className="h-8 px-3 transition-all duration-200 flex items-center gap-1.5 rounded-full"
                  >
                    <span className="text-xs font-medium">
                      Tüm Seçimleri Kaldır
                    </span>
                  </Button>
                )}

                {feeds.map((feed) => {
                  const isSelected = selectedFeedIds.includes(feed.id);
                  const isYoutube = feed.type === "youtube";

                  return (
                    <Button
                      key={feed.id}
                      onClick={() => handleFeedSelect(feed.id)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 px-3 transition-all duration-200 flex items-center gap-1.5 rounded-full",
                        isSelected ? "shadow-sm" : "hover:bg-muted"
                      )}
                    >
                      {feed.site_favicon && (
                        <div className="relative w-4 h-4 flex-shrink-0">
                          <Image
                            src={feed.site_favicon}
                            alt=""
                            width={16}
                            height={16}
                            className={cn(
                              "object-cover",
                              isYoutube ? "rounded-full" : "rounded"
                            )}
                            unoptimized
                          />
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-xs font-medium truncate max-w-[120px]",
                          isSelected ? "" : "text-muted-foreground"
                        )}
                      >
                        {feed.title}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterDialogOpen(true)}
                className="h-8 rounded-full ml-1"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Filtrele</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />

      {/* Yükleniyor */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] loading-container rounded-xl p-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
            <div className="relative z-10 bg-background/80 backdrop-blur-sm rounded-full p-4 shadow-lg border">
              <Rss className="h-12 w-12 text-primary loading-spinner" />
            </div>
          </div>

          <h3 className="text-xl font-medium mb-2 loading-pulse">
            {t("feeds.title")}
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-4 loading-pulse">
            {t("common.loading")}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <div
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      ) : !feeds || feeds.length === 0 ? (
        // Empty State - No Feeds
        <div className="space-y-6">
          <EmptyState />
        </div>
      ) : filteredItems.length === 0 ? (
        // Empty State - No Items Match Filters
        <EmptyFilterState onOpenFilters={() => setIsFilterDialogOpen(true)} />
      ) : (
        // Feed Items
        <div className="space-y-6">
          <div
            ref={containerRef}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  ref={(el) => {
                    if (el) itemRefs.current[index] = el;
                    if (index === focusedItemIndex)
                      selectedItemRef.current = el;
                  }}
                  className={cn(
                    "transition-all duration-150 ease-in-out",
                    index === focusedItemIndex &&
                      settings.enableKeyboardNavigation &&
                      "ring-2 ring-primary ring-offset-2"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                >
                  <div id={`feed-item-${item.id}`}>
                    <FeedCard
                      item={item}
                      feed={feeds.find((f) => f.id === item.feed_id)}
                      compact={settings.compactView}
                      onToggleRead={toggleItemRead}
                      onToggleFavorite={toggleItemFavorite}
                      onToggleReadLater={toggleItemReadLater}
                      isFocused={focusedItemIndex === index}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
// Memoized FeedCard component
const FeedCardMemo = memo(FeedCard);
