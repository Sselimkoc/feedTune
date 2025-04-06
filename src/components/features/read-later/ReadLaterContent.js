"use client";

import { ReadLaterList } from "@/components/features/read-later/ReadLaterList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadLaterScreen } from "@/hooks/features/useReadLaterScreen";

export function ReadLaterContent() {
  const { t } = useLanguage();
  const {
    items,
    isLoading,
    isError,
    error,
    refresh,
    toggleRead,
    toggleFavorite,
    toggleReadLater,
    totalReadLater,
  } = useReadLaterScreen();

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("readLater.title")}</h1>
          <p className="text-muted-foreground">{t("readLater.description")}</p>
        </div>
      </div>

      <ReadLaterList
        initialItems={items}
        isLoading={isLoading}
        onToggleRead={toggleRead}
        onToggleFavorite={toggleFavorite}
        onToggleReadLater={toggleReadLater}
        onRefresh={refresh}
        isError={isError}
        error={error}
      />
    </div>
  );
}
