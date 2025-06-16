"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AddFeedButton({ onAddFeed }) {
  const { t } = useLanguage();

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="default"
        size="sm"
        className={cn(
          "h-9 px-3 gap-1.5 bg-primary hover:bg-primary/90",
          "text-primary-foreground"
        )}
        onClick={onAddFeed}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">
          {t("common.add")}
        </span>
      </Button>
    </motion.div>
  );
}
