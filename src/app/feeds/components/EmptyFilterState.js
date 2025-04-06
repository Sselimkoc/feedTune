"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Filter, RefreshCw } from "lucide-react";

export function EmptyFilterState({ onResetFilters }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center h-[300px]"
    >
      <Card className="w-full max-w-md border border-muted bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Filter className="h-8 w-8 text-primary/80" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {t("feeds.emptyFilterState.title") || "İçerik Bulunamadı"}
          </h2>

          <p className="text-muted-foreground mb-6 max-w-sm">
            {t("feeds.emptyFilterState.description") ||
              "Filtreleme kriterlerinize uygun içerik bulunamadı. Filtrelerinizi değiştirmeyi veya tüm içerikleri görüntülemeyi deneyebilirsiniz."}
          </p>

          <div className="flex gap-3">
            <Button onClick={onResetFilters} className="gap-1.5">
              <Filter className="h-4 w-4" />
              {t("feeds.emptyFilterState.resetFilters") || "Filtreleri Sıfırla"}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              {t("feeds.emptyFilterState.refresh") || "Sayfayı Yenile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
