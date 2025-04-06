"use client";

import { RssIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

import { motion } from "framer-motion";
import { AddFeedDialog } from "../../../components/features/feeds/dialogs/AddFeedDialog";

export function EmptyState() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center h-[calc(100vh-200px)]"
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <RssIcon className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {t("feeds.emptyState.title")}
          </h2>

          <p className="text-muted-foreground mb-6">
            {t("feeds.emptyState.description")}
          </p>

          <Button onClick={() => setIsOpen(true)}>
            {t("feeds.emptyState.addFeedButton")}
          </Button>

          <AddFeedDialog isOpen={isOpen} onOpenChange={setIsOpen} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
