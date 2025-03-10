"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function ErrorState({ onRetry }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{t("error.title")}</h3>
      <p className="text-sm text-muted-foreground max-w-[400px]">
        {t("error.description")}
      </p>
      <Button onClick={onRetry} variant="outline">
        {t("error.retry")}
      </Button>
    </div>
  );
}
