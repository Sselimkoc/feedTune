"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFeeds,
  fetchFeeds,
  fetchFavorites,
  fetchReadLaterItems,
} from "@/hooks/useFeeds";
import { useFeedStore } from "@/store/useFeedStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { FeedSkeleton } from "./FeedSkeleton";
import { FeedCard } from "./FeedCard";
import { FeedNavigation } from "./FeedNavigation";
import { EmptyFeedState } from "./EmptyFeedState";
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
} from "lucide-react";
import { FilterDialog } from "./FilterDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { RssIcon, Tag } from "lucide-react";
import { formatTimeAgo, stripHtml } from "@/lib/utils";

// Constants
const ITEMS_PER_PAGE = 10;

// Supabase client'ını oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Kullanıcı kimliğini almak için bir fonksiyon
const getUserIdFromJWT = async () => {
  const { user } = await supabase.auth.getUser();
  return user ? user.id : null;
};

// toggleItemRead fonksiyonunu güncelle
const toggleItemRead = async (itemId) => {
  const userId = await getUserIdFromJWT();
  if (userId) {
    // Veritabanı işlemlerini burada yapın
    const { data, error } = await supabase
      .from("your_table_name")
      .update({ isRead: true })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating item:", error);
    } else {
      console.log("Item updated:", data);
    }
  }
};

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

  // Keyboard navigation
  useEffect(() => {
    if (!settings.enableKeyboardNavigation) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedItemIndex((prev) =>
            Math.min(prev + 1, filteredItems.length - 1)
          );
          setIsNavigating(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedItemIndex((prev) => Math.max(prev - 1, 0));
          setIsNavigating(true);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            window.open(item.link, "_blank");
            toggleItemRead(item.id, true);
          }
          break;
        case "r":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            toggleItemRead(item.id, !item.is_read);
          }
          break;
        case "f":
          e.preventDefault();
          if (filteredItems[focusedItemIndex]) {
            const item = filteredItems[focusedItemIndex];
            toggleItemFavorite(item.id, !item.is_favorite);
          }
          break;
        case "?":
          e.preventDefault();
          setShowKeyboardHelp((prev) => !prev);
          break;
        case "Escape":
          e.preventDefault();
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false);
          }
          break;
        case "c":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            refetch();
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedItemIndex(0);
          setIsNavigating(true);
          break;
        case "End":
          e.preventDefault();
          setFocusedItemIndex(filteredItems.length - 1);
          setIsNavigating(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    settings.enableKeyboardNavigation,
    filteredItems,
    focusedItemIndex,
    toggleItemRead,
    toggleItemFavorite,
    showKeyboardHelp,
    refetch,
  ]);

  // Scroll to selected item
  useEffect(() => {
    if (isNavigating && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      setIsNavigating(false);
    }
  }, [focusedItemIndex, isNavigating]);

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
          <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
        )}
      </AnimatePresence>

      {/* Çoklu Kanal Seçimi */}
      {feeds.length > 0 && (
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
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : feeds.length === 0 ? (
        // Empty State - No Feeds
        <div className="space-y-6">
          <EmptyFeedState />
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
                  <FeedCard
                    item={item}
                    feed={feeds.find((f) => f.id === item.feed_id)}
                    compact={compactMode}
                    onToggleRead={handleToggleRead}
                    onToggleFavorite={handleToggleFavorite}
                    onToggleReadLater={handleToggleReadLater}
                    onOpenLink={handleOpenLink}
                    isFocused={
                      index === focusedItemIndex &&
                      settings.enableKeyboardNavigation
                    }
                  />
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
