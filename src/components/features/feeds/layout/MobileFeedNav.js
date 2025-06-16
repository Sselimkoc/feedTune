import { memo, useCallback, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import FeedSidebar from "./FeedSidebar";
import { useTheme } from "@/hooks/useTheme";

/**
 * MobileFeedNav Component
 * Mobile navigation for feeds page
 */
function MobileFeedNav({
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
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Handle closing the sidebar after selecting a feed
  const handleSelectFeed = useCallback(
    (feedIds) => {
      onSelectFeed(feedIds);
      setIsOpen(false);
    },
    [onSelectFeed]
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("common.openMenu")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{t("feeds.navigation")}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="h-full overflow-auto p-4">
            <FeedSidebar
              feeds={feeds}
              selectedFeedIds={selectedFeedIds}
              activeFilters={activeFilters}
              searchQuery={searchQuery}
              statistics={statistics}
              onSelectFeed={handleSelectFeed}
              onToggleFilter={onToggleFilter}
              onSearchChange={onSearchChange}
              onClearFilters={onClearFilters}
              theme={theme}
              isMobile={true}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default memo(MobileFeedNav);
