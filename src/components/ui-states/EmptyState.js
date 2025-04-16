"use client";

import { RssIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

export function EmptyState({ onAddFeed }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center h-[calc(100vh-200px)]"
    >
      <div className="relative">
        {/* Arka plan efekti */}
        <div className="absolute -inset-10 bg-gradient-to-r from-primary/5 via-blue-500/5 to-primary/5 rounded-full blur-3xl opacity-50"></div>

        <Card className="w-full max-w-md border-border/40 bg-white/95 dark:bg-card/90 backdrop-blur-sm shadow-lg relative">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
            <motion.div
              className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-full mb-6 shadow-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-md"></div>
              <RssIcon className="h-10 w-10 text-primary relative z-10" />
            </motion.div>

            <motion.h2
              className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("feeds.emptyState.title")}
            </motion.h2>

            <motion.p
              className="text-muted-foreground mb-8 max-w-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t("feeds.emptyState.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={onAddFeed}
                className="px-6 py-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t("feeds.emptyState.addFeedButton")}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
