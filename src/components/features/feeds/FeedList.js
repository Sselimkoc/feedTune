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
  LayoutGrid,
  LayoutList,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { FilterDialog } from "./FilterDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { RssIcon, Tag, KeyboardIcon, Youtube } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    toggleCompactMode,
  } = useFeedStore();
  const { settings } = useSettingsStore();
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();
  const { t, language } = useLanguage();

  // Varsayılan filtreler - setFilters için gereken reset değeri
  const defaultFilters = {
    sortBy: "newest",
    showRead: true,
    showUnread: true,
    feedTypes: {
      rss: true,
      youtube: true,
    },
  };

  // State management
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const itemRefs = useRef({});
  const containerRef = useRef(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  // References
  const listRef = useRef(null);
  const selectedItemRef = useRef(null);

  // Seçili feed ID'leri için state
  const [selectedFeedIds, setSelectedFeedIds] = useState([]);

  // Memoized values
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = [...items];

    // Sekmeler için filtre ekle
    if (selectedTab === "unread") {
      result = result.filter((item) => !item.is_read);
    } else if (selectedTab === "favorites") {
      result = result.filter((item) => item.is_favorite);
    }

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
  }, [items, feeds, selectedFeedIds, filters, selectedTab]);

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
        case "r":
          // İçeriği yenile
          e.preventDefault();
          handleRefresh();
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
        toggleItemRead(itemId, isRead);
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
        toggleItemFavorite(itemId, isFavorite);
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
          toggleItemReadLater(itemId, isReadLater);
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
        toggleItemRead(itemId, true);
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

  // Veri yenileme işlemi
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success(t("feeds.refreshSuccess"));
    } catch (error) {
      toast.error(t("feeds.refreshError"));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Kart Layout Hesaplama
  const cardLayoutClass = useMemo(() => {
    if (compactMode) {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3";
    } else {
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4";
    }
  }, [compactMode]);

  // Render
  return (
    <div
      className="container max-w-[1600px] py-6 space-y-6"
      role="feed"
      aria-label={t("feeds.feedList.contentList")}
    >
      {/* Üst Bilgi Çubuğu */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-3 rounded-xl border shadow-sm">
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
            >
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder={t("feeds.feedList.allFeeds")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{t("feeds.feedList.allFeeds")}</span>
                  </div>
                </SelectItem>

                {feeds && feeds.length > 0 ? (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      RSS Beslemeleri
                    </div>
                    {feeds
                      .filter((feed) => feed.type === "rss")
                      .map((feed) => (
                        <SelectItem key={feed.id} value={feed.id}>
                          <div className="flex items-center gap-2">
                            {feed.site_favicon ? (
                              <Image
                                src={feed.site_favicon}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-sm"
                                unoptimized={true}
                              />
                            ) : (
                              <Rss className="h-4 w-4 text-orange-500" />
                            )}
                            <span className="truncate">{feed.title}</span>
                          </div>
                        </SelectItem>
                      ))}

                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      YouTube Kanalları
                    </div>
                    {feeds
                      .filter((feed) => feed.type === "youtube")
                      .map((feed) => (
                        <SelectItem key={feed.id} value={feed.id}>
                          <div className="flex items-center gap-2">
                            {feed.site_favicon ? (
                              <Image
                                src={feed.site_favicon}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-full"
                                unoptimized={true}
                              />
                            ) : (
                              <Youtube className="h-4 w-4 text-red-500" />
                            )}
                            <span className="truncate">{feed.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </>
                ) : null}
              </SelectContent>
            </Select>

            {/* Yenile Butonu */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9"
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")}
              />
              <span>
                {isRefreshing ? t("feeds.refreshing") : t("feeds.refresh")}
              </span>
            </Button>

            {/* Filtre Butonu */}
            <Button
              variant={activeFilterCount > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsFilterDialogOpen(true)}
              className="h-9"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              <span>{t("feeds.feedList.filters")}</span>
              {activeFilterCount > 0 && (
                <Badge variant="primary" className="ml-1 h-5 min-w-5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Klavye Kısayolları */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyboardHelp(true)}
              className="h-9"
            >
              <KeyboardIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">
                {t("feeds.feedList.keyboardShortcuts")}
              </span>
            </Button>
          </div>

          {/* Sağ Taraf Butonları */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Görünüm Modu Değiştirici */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCompactMode}
              className="h-9"
              title={
                compactMode
                  ? t("feeds.feedList.normalView")
                  : t("feeds.feedList.compactView")
              }
            >
              {compactMode ? (
                <LayoutList className="h-4 w-4 mr-1" />
              ) : (
                <LayoutGrid className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">
                {compactMode
                  ? t("feeds.feedList.normalView")
                  : t("feeds.feedList.compactView")}
              </span>
            </Button>

            {/* Feed Ekle Butonu */}
            <AddFeedButton />
          </div>
        </div>

        {/* Sekme Seçicisi */}
        <div className="mt-3">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 max-w-[400px]">
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tümü</span>
                {items && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {items.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5" />
                <span>Okunmamış</span>
                {items && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {items.filter((item) => !item.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5" />
                <span>Favoriler</span>
                {items && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {items.filter((item) => item.is_favorite).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Feed İçeriği */}
      {isLoading ? (
        /* Yükleme durumu için gelişmiş iskelet animasyonu */
        <div className={cardLayoutClass}>
          {Array(12)
            .fill(null)
            .map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="h-full overflow-hidden">
                  <div className="aspect-video bg-muted-foreground/10 relative">
                    <div className="absolute inset-0 skeleton-wave"></div>
                  </div>
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-3" />

                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>

                    <div className="pt-2 border-t flex gap-2 mt-2">
                      <Skeleton className="h-6 w-6 rounded-md" />
                      <Skeleton className="h-6 w-6 rounded-md" />
                      <Skeleton className="h-6 w-6 rounded-md" />
                      <div className="flex-1"></div>
                      <Skeleton className="h-6 w-6 rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        /* Içerik kartları */
        <div className={cardLayoutClass}>
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: Math.min(index * 0.04, 0.5),
                }}
                id={`feed-item-${item.id}`}
                className="h-full"
              >
                <FeedCard
                  item={item}
                  feed={feeds && feeds.find((f) => f.id === item.feed_id)}
                  compact={compactMode}
                  onToggleRead={handleToggleRead}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleReadLater={handleToggleReadLater}
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
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        onApplyFilters={setFilters}
      />

      {/* Klavye Kısayolları */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}

// EmptyState bileşeni
export const EmptyState = memo(function EmptyState({ onAddFeed }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-14 px-4 text-center"
    >
      <motion.div
        className="bg-primary/10 rounded-full p-8 mb-8"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Rss className="h-16 w-16 text-primary" />
      </motion.div>

      <h2 className="text-3xl font-bold mb-4">{t("feeds.emptyState.title")}</h2>
      <p className="text-muted-foreground max-w-md mb-10 text-lg">
        {t("feeds.emptyState.description")}
      </p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg w-full mb-10"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div
          className="bg-card border rounded-lg p-6 text-left hover:shadow-md transition-all"
          whileHover={{ y: -5 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center mb-3">
            <div className="bg-orange-100 dark:bg-orange-950/30 p-2 rounded-full mr-3">
              <Rss className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-medium">RSS Beslemeleri</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Haber siteleri, bloglar ve podcast'leri takip edin
          </p>
          <Button onClick={() => onAddFeed("rss")} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            RSS Ekle
          </Button>
        </motion.div>

        <motion.div
          className="bg-card border rounded-lg p-6 text-left hover:shadow-md transition-all"
          whileHover={{ y: -5 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center mb-3">
            <div className="bg-red-100 dark:bg-red-950/30 p-2 rounded-full mr-3">
              <Youtube className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-medium">YouTube Kanalları</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Favori YouTube kanallarınızı takip edin
          </p>
          <Button onClick={() => onAddFeed("youtube")} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            Kanal Ekle
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <KeyboardIcon className="h-4 w-4" />
        <span>
          Klavye kısayolları için{" "}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background border rounded">
            ?
          </kbd>{" "}
          tuşuna basın
        </span>
      </motion.div>
    </motion.div>
  );
});

// EmptyFilterState bileşeni
export const EmptyFilterState = memo(function EmptyFilterState({
  onResetFilters,
}) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <motion.div
        className="bg-yellow-100 dark:bg-yellow-950/30 rounded-full p-6 mb-6"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Filter className="h-12 w-12 text-yellow-500" />
      </motion.div>

      <h2 className="text-2xl font-bold mb-3">
        {t("feeds.emptyFilterState.title")}
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        {t("feeds.emptyFilterState.description")}
      </p>

      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Button onClick={onResetFilters} className="mb-6 px-6" size="lg">
          <Filter className="h-4 w-4 mr-2" />
          {t("feeds.emptyFilterState.resetFilters")}
        </Button>
      </motion.div>

      <motion.div
        className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center bg-background rounded-full p-3">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-center sm:text-left">
          Ayarladığınız filtreler sonucunda gösterilecek içerik bulunamadı.
          Lütfen filtrelerinizi düzenleyin veya sıfırlayın.
        </p>
      </motion.div>
    </motion.div>
  );
});
