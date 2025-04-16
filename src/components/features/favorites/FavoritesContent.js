"use client";

import { useState, useCallback, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavoritesScreen } from "@/hooks/features/useFavoritesScreen";
import { useHotkeys } from "react-hotkeys-hook";
import { Bookmark } from "lucide-react";
import { ContentContainer } from "@/components/shared/ContentContainer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const FavoritesContent = memo(function FavoritesContent() {
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

  // State
  const [viewMode, setViewMode] = useState("grid");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Event Handlers
  const handleShowKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts(true);
  }, []);

  const handleKeyboardShortcutsChange = useCallback((isOpen) => {
    setShowKeyboardShortcuts(isOpen);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleToggleFavorite = useCallback(
    async (itemId, newValue) => {
      return await toggleFavorite(itemId, newValue);
    },
    [toggleFavorite]
  );

  const handleToggleReadLater = useCallback(
    async (itemId, newValue) => {
      return await toggleReadLater(itemId, newValue);
    },
    [toggleReadLater]
  );

  const handleItemClick = useCallback(
    async (url, item) => {
      if (url) {
        window.open(url, "_blank");
        if (item && !item.is_read) {
          try {
            await toggleRead(item.id, true);
            toast.success(t("notifications.itemRead"), {
              position: "bottom-right",
              duration: 2000,
            });
          } catch (error) {
            console.error("İçerik okundu işaretlenemedi:", error);
          }
        }
      }
    },
    [toggleRead, t]
  );

  // Keyboard Shortcuts
  useHotkeys("r", refresh, { enableOnFormTags: false });
  useHotkeys("v", () => setViewMode(viewMode === "grid" ? "list" : "grid"), {
    enableOnFormTags: false,
  });
  useHotkeys("k", () => setShowKeyboardShortcuts(true), {
    enableOnFormTags: false,
  });

  return (
    <ContentContainer
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onRefresh={refresh}
      headerIcon={<Bookmark className="h-6 w-6 text-yellow-500" />}
      headerTitle={t("favorites.title")}
      headerDescription={t("favorites.description")}
      items={items}
      isLoading={isLoading}
      isError={isError}
      error={error}
      cardType="favorite"
      emptyIcon={<Bookmark className="h-10 w-10 opacity-20" />}
      emptyTitle={t("favorites.emptyTitle")}
      emptyDescription={t("favorites.emptyDescription")}
      onToggleFavorite={handleToggleFavorite}
      onToggleReadLater={handleToggleReadLater}
      onItemClick={handleItemClick}
      showKeyboardShortcuts={showKeyboardShortcuts}
      onShowKeyboardShortcuts={handleShowKeyboardShortcuts}
      onKeyboardShortcutsChange={handleKeyboardShortcutsChange}
    />
  );
});
