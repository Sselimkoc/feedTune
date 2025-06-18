"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/core/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/core/ui/tooltip";

export function FilterButton({ onOpenFilters }) {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-9 p-0",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={onOpenFilters}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("feeds.filterFeeds")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
