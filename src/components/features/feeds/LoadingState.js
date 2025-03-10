"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LoadingState() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">{t("common.loading")}</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t("feeds.loadingState.description")}
      </p>
    </div>
  );
}
