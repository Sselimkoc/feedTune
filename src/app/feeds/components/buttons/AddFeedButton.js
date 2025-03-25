"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFeedDialog } from "../dialogs/AddFeedDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export function AddFeedButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="default"
          size="sm"
          className="h-9 px-3 gap-1.5 bg-primary"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">
            {t("common.add")}
          </span>
        </Button>
      </motion.div>

      <AddFeedDialog isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
