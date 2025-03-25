"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center h-[calc(100vh-200px)]"
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            {t("feeds.loadingState.description")}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
