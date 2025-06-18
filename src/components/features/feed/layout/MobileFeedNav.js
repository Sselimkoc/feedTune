"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/core/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/core/ui/sheet";
import { Menu } from "lucide-react";
import { FeedSidebar } from "./FeedSidebar";

/**
 * MobileFeedNav Component
 * Mobile navigation for feeds page
 */
export function MobileFeedNav({
  feeds,
  selectedFeedIds,
  activeFilters,
  searchQuery,
  statistics,
  onSelectFeed,
  onToggleFilter,
  onSearchChange,
  onClearFilters,
}) {
  const { t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("common.menu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h2 className="text-lg font-semibold">{t("feeds.navigation")}</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <FeedSidebar
              feeds={feeds}
              selectedFeedIds={selectedFeedIds}
              activeFilters={activeFilters}
              searchQuery={searchQuery}
              statistics={statistics}
              onSelectFeed={onSelectFeed}
              onToggleFilter={onToggleFilter}
              onSearchChange={onSearchChange}
              onClearFilters={onClearFilters}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
