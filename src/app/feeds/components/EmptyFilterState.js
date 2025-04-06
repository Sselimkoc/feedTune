"use client";

import { FilterX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export function EmptyFilterState({ onResetFilters }) {
  const { t } = useLanguage();

  return (
    <motion.div
      className="w-full flex items-center justify-center min-h-[40vh] mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <FilterX className="h-8 w-8 text-amber-500" />
          </div>

          <h2 className="text-xl font-bold mb-2 text-center">
            {t("feeds.emptyFilter.title")}
          </h2>

          <p className="text-muted-foreground text-center mb-6">
            {t("feeds.emptyFilter.description")}
          </p>

          {onResetFilters && (
            <Button onClick={onResetFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("feeds.emptyFilter.resetFilters")}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
