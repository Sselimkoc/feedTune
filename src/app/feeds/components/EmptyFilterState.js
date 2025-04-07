"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, AlertCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyFilterState({ onRefresh, onResetFilters, onAddFeed }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex items-center justify-center py-12"
    >
      <Card className="max-w-md w-full border shadow-md">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="mb-4 p-4 bg-primary-foreground rounded-full">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-xl font-bold mb-2">
            {t("feeds.noContentFound")}
          </h3>

          <p className="text-muted-foreground mb-8 max-w-sm">
            {t("feeds.emptyContentDescription")}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {onResetFilters && (
              <Button
                onClick={onResetFilters}
                className="gap-2"
                variant="outline"
              >
                <Filter className="w-4 h-4" />
                <span>{t("feeds.resetFilters")}</span>
              </Button>
            )}

            {onRefresh && (
              <Button onClick={onRefresh} className="gap-2" variant="outline">
                <RefreshCw className="w-4 h-4" />
                <span>{t("feeds.refreshContent")}</span>
              </Button>
            )}

            {onAddFeed && (
              <Button onClick={onAddFeed} className="gap-2">
                <Plus className="w-4 h-4" />
                <span>{t("feeds.addNewFeed")}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
