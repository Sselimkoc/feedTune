"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ViewToggle({ viewMode, onViewModeChange }) {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center rounded-md border border-input overflow-hidden"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "h-9 px-3 rounded-none border-r border-input",
                viewMode === "grid" && "bg-accent text-accent-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("feeds.gridView") || "Izgara Görünümü"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "h-9 px-3 rounded-none",
                viewMode === "list" && "bg-accent text-accent-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("feeds.listView") || "Liste Görünümü"}</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
