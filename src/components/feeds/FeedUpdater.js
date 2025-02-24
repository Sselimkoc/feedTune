"use client";

import { useEffect } from "react";
import { useFeedStore } from "@/store/useFeedStore";
import { useSettingsStore } from "@/store/useSettingsStore";

export function FeedUpdater() {
  const { updateAllFeeds, lastUpdated } = useFeedStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    // İlk yükleme kontrolü
    const shouldUpdate =
      !lastUpdated ||
      new Date() - new Date(lastUpdated) >
        parseInt(settings.updateInterval) * 60 * 1000;

    if (shouldUpdate) {
      updateAllFeeds();
    }

    // Periyodik güncelleme
    const interval = setInterval(() => {
      updateAllFeeds();
    }, parseInt(settings.updateInterval) * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateAllFeeds, lastUpdated, settings.updateInterval]);

  return null;
}
