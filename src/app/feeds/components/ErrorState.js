"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

export function ErrorState({ error, onRetry }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center h-[calc(100vh-200px)]"
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="bg-destructive/10 p-3 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>

          <h2 className="text-xl font-bold mb-4">{t("errors.general")}</h2>

          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error?.message || t("errors.unknownError")}
            </AlertDescription>
          </Alert>

          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
