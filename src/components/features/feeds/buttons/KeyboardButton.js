"use client";

import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function KeyboardButton({ onShowKeyboardShortcuts }) {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={onShowKeyboardShortcuts}
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("feeds.keyboardShortcuts")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
