"use client";

import { Button } from "@/components/ui/button";
import { Filter, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useFeedStore } from "@/store/useFeedStore";
import { useLanguage } from "@/contexts/LanguageContext";

export function EmptyFilterState({ onOpenFilters }) {
  const { resetFilters } = useFeedStore();
  const { t, language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
    >
      <div className="bg-muted rounded-full p-3 mb-4">
        <Filter className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {t("feeds.feedList.emptyState")}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("feeds.feedList.emptyState")}
      </p>
      <div className="flex gap-3">
        <Button onClick={resetFilters} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("common.refresh")}
        </Button>
        <Button onClick={onOpenFilters} size="sm">
          <Filter className="mr-2 h-4 w-4" />
          {t("common.filter")}
        </Button>
      </div>
    </motion.div>
  );
}
