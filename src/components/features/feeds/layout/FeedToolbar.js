"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import {
  RefreshCw,
  LayoutGrid,
  List,
  Filter,
  CheckSquare,
  CheckCheck,
  Star,
  BookMarked,
  Keyboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

/**
 * Feed sayfası için toolbar bileşeni
 */
export const FeedToolbar = memo(function FeedToolbar({
  viewMode = "grid",
  onViewModeChange = () => {},
  onRefresh = () => {},
  onOpenKeyboardShortcuts = () => {},
  bulkActions = null,
}) {
  const { t } = useLanguage();

  // Bulk seçim modu aktif mi kontrol et
  const isBulkMode = bulkActions?.isBulkSelectionMode;
  const selectedCount = bulkActions?.selectedCount || 0;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Görünüm modu değiştirme */}
      <div className="hidden sm:flex border rounded-md overflow-hidden">
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          className="rounded-none px-2.5 border-0"
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid size={16} />
          <span className="sr-only">{t("common.gridView")}</span>
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          className="rounded-none px-2.5 border-0"
          onClick={() => onViewModeChange("list")}
        >
          <List size={16} />
          <span className="sr-only">{t("common.listView")}</span>
        </Button>
      </div>

      {/* Yenileme butonu */}
      <Button variant="ghost" size="sm" className="px-2.5" onClick={onRefresh}>
        <RefreshCw size={16} />
        <span className="sr-only">{t("common.refresh")}</span>
      </Button>

      {/* Toplu işlem kontrolleri - Sadece aktifse göster */}
      {isBulkMode && (
        <>
          <Badge variant="outline" className="ml-2">
            {t("feeds.selectedItems", { count: selectedCount })}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            onClick={() => bulkActions.markSelectedAsRead()}
            disabled={selectedCount === 0}
          >
            <CheckCheck size={16} />
            <span className="sr-only md:not-sr-only md:ml-2">
              {t("feeds.markAsRead")}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            onClick={() => bulkActions.toggleSelectedFavorite(true)}
            disabled={selectedCount === 0}
          >
            <Star size={16} />
            <span className="sr-only md:not-sr-only md:ml-2">
              {t("feeds.addToFavorites")}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            onClick={() => bulkActions.toggleSelectedReadLater(true)}
            disabled={selectedCount === 0}
          >
            <BookMarked size={16} />
            <span className="sr-only md:not-sr-only md:ml-2">
              {t("feeds.addToReadLater")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="ml-auto px-2.5"
            onClick={() => bulkActions.toggleBulkSelectionMode()}
          >
            {t("feeds.cancelSelection")}
          </Button>
        </>
      )}

      {/* Toplu seçim modu değilse, filtre ve kısayollar */}
      {!isBulkMode && (
        <>
          {/* Filtre menüsü */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2.5">
                <Filter size={16} />
                <span className="sr-only md:not-sr-only md:ml-2">
                  {t("common.filter")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                {t("feeds.showAll")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                {t("feeds.unreadOnly")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {}}>
                {t("feeds.sortByNewest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>
                {t("feeds.sortByOldest")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toplu seçim butonu */}
          {bulkActions && (
            <Button
              variant="ghost"
              size="sm"
              className="px-2.5"
              onClick={() => bulkActions.toggleBulkSelectionMode()}
            >
              <CheckSquare size={16} />
              <span className="sr-only md:not-sr-only md:ml-2">
                {t("feeds.selectItems")}
              </span>
            </Button>
          )}

          {/* Klavye kısayolları */}
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5"
            onClick={onOpenKeyboardShortcuts}
          >
            <Keyboard size={16} />
            <span className="sr-only">{t("common.keyboardShortcuts")}</span>
          </Button>
        </>
      )}
    </div>
  );
});
