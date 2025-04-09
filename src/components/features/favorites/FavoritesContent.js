"use client";

import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { FavoritesList } from "@/components/features/favorites/FavoritesList";
import { FavoritesHeader } from "@/app/favorites/components/FavoritesHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavoritesScreen } from "@/hooks/features/useFavoritesScreen";
import { KeyboardShortcutsDialog } from "@/components/features/feeds/dialogs/KeyboardShortcutsDialog";
import { FilterDialog } from "@/components/features/feeds/dialogs/FilterDialog";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { EmptyState } from "@/components/features/feeds/common/EmptyState";

// Optimized components
const MemoizedKeyboardShortcutsDialog = memo(KeyboardShortcutsDialog);
const MemoizedFilterDialog = memo(FilterDialog);
const MemoizedFavoritesHeader = memo(FavoritesHeader);
const MemoizedFavoritesList = memo(FavoritesList);

export function FavoritesContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    items,
    isLoading,
    isError,
    error,
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    totalFavorites,
  } = useFavoritesScreen();

  // Cache state structure
  const [viewMode, setViewMode] = useState("card");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    readStatus: null,
    feedType: "all",
  });

  // Cache event handler functions
  const handleOpenFilters = useCallback(() => setShowFilterDialog(true), []);
  const handleShowKeyboardShortcuts = useCallback(
    () => setShowKeyboardShortcuts(true),
    []
  );
  const handleViewModeChange = useCallback((mode) => setViewMode(mode), []);

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setShowFilterDialog(false);
  }, []);

  const handleKeyboardShortcutsChange = useCallback((isOpen) => {
    setShowKeyboardShortcuts(isOpen);
  }, []);

  const handleFilterDialogChange = useCallback((isOpen) => {
    setShowFilterDialog(isOpen);
  }, []);

  // Cache header props
  const headerProps = useMemo(
    () => ({
      pageTitle: t("favorites.title"),
      pageDescription: t("favorites.description"),
      onRefresh: refresh,
      viewMode,
      onViewModeChange: handleViewModeChange,
      onOpenFilters: handleOpenFilters,
      onShowKeyboardShortcuts: handleShowKeyboardShortcuts,
    }),
    [
      t,
      refresh,
      viewMode,
      handleViewModeChange,
      handleOpenFilters,
      handleShowKeyboardShortcuts,
    ]
  );

  // Cache list props
  const listProps = useMemo(
    () => ({
      initialItems: items,
      isLoading,
      isError,
      error,
      onToggleRead: toggleRead,
      onToggleFavorite: toggleFavorite,
      onToggleReadLater: toggleReadLater,
      onRefresh: refresh,
      viewMode,
    }),
    [
      items,
      isLoading,
      isError,
      error,
      toggleRead,
      toggleFavorite,
      toggleReadLater,
      refresh,
      viewMode,
    ]
  );

  // Cache filter dialog props
  const filterDialogProps = useMemo(
    () => ({
      isOpen: showFilterDialog,
      onOpenChange: handleFilterDialogChange,
      filters,
      onApplyFilters: handleApplyFilters,
    }),
    [showFilterDialog, handleFilterDialogChange, filters, handleApplyFilters]
  );

  // Cache keyboard shortcut dialog props
  const keyboardDialogProps = useMemo(
    () => ({
      isOpen: showKeyboardShortcuts,
      onOpenChange: handleKeyboardShortcutsChange,
    }),
    [showKeyboardShortcuts, handleKeyboardShortcutsChange]
  );

  // Filtrelenmiş öğeleri hesapla
  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      // Okunma durumuna göre filtrele
      if (filters.readStatus === "read" && !item.read) return false;
      if (filters.readStatus === "unread" && item.read) return false;
      
      // Feed tipine göre filtrele (eğer "all" değilse)
      if (filters.feedType !== "all" && item.feed_type !== filters.feedType) return false;
      
      return true;
    });
  }, [items, filters]);

  // Filtreleri uygula
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setShowFilterDialog(false);
  }, []);

  // Filtreleri sıfırla
  const resetFilters = useCallback(() => {
    setFilters({
      readStatus: null,
      feedType: "all",
    });
  }, []);

  // Klavye kısayolları
  useHotkeys("r", () => refresh(), { enableOnFormTags: false });
  useHotkeys("f", () => setShowFilterDialog(true), { enableOnFormTags: false });
  
  // Favorilere gidince filtreleri sıfırla
  useEffect(() => {
    resetFilters();
  }, [resetFilters]);

  // Minimum stilleri memo'yla hesaplıyoruz
  const containerStyles = useMemo(
    () => ({
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "100%",
    }),
    []
  );

  // Boş durum kontrolü
  if (!isLoading && filteredItems.length === 0) {
  return (
      <div className="flex flex-col flex-grow">
        <FavoritesHeader {...headerProps} />
        <EmptyState
          type="favorites"
          onResetFilters={filters.readStatus !== null || filters.feedType !== "all" ? resetFilters : undefined}
        />
      </div>
    );
  }

  // Normal içerik gösterimi
  return (
    <motion.div
      style={containerStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-grow"
    >
      <FavoritesHeader {...headerProps} />
      <FavoritesList {...listProps} />

      <MemoizedFilterDialog {...filterDialogProps} />

      <MemoizedKeyboardShortcutsDialog {...keyboardDialogProps} />
    </motion.div>
  );
}
