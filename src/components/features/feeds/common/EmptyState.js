"use client";

import { memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "./ActionButton";
import {
  Rss,
  Star,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

const EMPTY_STATES = {
  feed: {
    icon: <Rss className="h-8 w-8" />,
    titleKey: "feeds.emptyFeedTitle",
    descriptionKey: "feeds.emptyFeedDescription",
  },
  favorites: {
    icon: <Star className="h-8 w-8" />,
    titleKey: "feeds.emptyFavoritesTitle",
    descriptionKey: "feeds.emptyFavoritesDescription",
  },
  readLater: {
    icon: <Clock className="h-8 w-8" />,
    titleKey: "feeds.emptyReadLaterTitle",
    descriptionKey: "feeds.emptyReadLaterDescription",
  },
  search: {
    icon: <Search className="h-8 w-8" />,
    titleKey: "feeds.emptySearchTitle",
    descriptionKey: "feeds.emptySearchDescription",
  },
  filter: {
    icon: <Filter className="h-8 w-8" />,
    titleKey: "feeds.emptyFilterTitle",
    descriptionKey: "feeds.emptyFilterDescription",
  },
  default: {
    icon: <AlertCircle className="h-8 w-8" />,
    titleKey: "feeds.emptyDefaultTitle",
    descriptionKey: "feeds.emptyDefaultDescription",
  },
};

export const EmptyState = memo(function EmptyState({
  type = "default",
  onRefresh,
  onResetFilters,
  onAddFeed,
}) {
  const { t } = useLanguage();
  const state = EMPTY_STATES[type] || EMPTY_STATES.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex items-center justify-center py-12"
    >
      <Card className="max-w-md w-full border shadow-md">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-primary/10 rounded-full">
            {state.icon}
          </div>

          <h3 className="text-xl font-bold mb-2">{t(state.titleKey)}</h3>

          <p className="text-muted-foreground mb-8 max-w-sm">
            {t(state.descriptionKey)}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {onResetFilters && (
              <ActionButton
                icon={<Filter className="h-4 w-4" />}
                label={t("feeds.resetFilters")}
                tooltip={t("feeds.resetFiltersTooltip")}
                onClick={onResetFilters}
                variant="outline"
              />
            )}

            {onRefresh && (
              <ActionButton
                icon={<RefreshCw className="h-4 w-4" />}
                label={t("feeds.refreshContent")}
                tooltip={t("feeds.refreshContentTooltip")}
                onClick={onRefresh}
                variant="outline"
              />
            )}

            {onAddFeed && (
              <ActionButton
                icon={<Plus className="h-4 w-4" />}
                label={t("feeds.addNewFeed")}
                tooltip={t("feeds.addNewFeedTooltip")}
                onClick={onAddFeed}
                variant="default"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
