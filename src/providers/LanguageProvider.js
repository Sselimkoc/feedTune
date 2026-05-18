"use client";

import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

export function LanguageProvider({ children, initialLanguage }) {
  const [mounted, setMounted] = useState(false);
  const zustandLanguage = useSettingsStore((state) => state.settings.language);

  // Before mount: use cookie language so client matches server render
  // After mount: use Zustand value loaded from localStorage
  const resolvedLanguage = mounted
    ? (zustandLanguage || initialLanguage || "en")
    : (initialLanguage || "en");

  if (i18n.language !== resolvedLanguage) {
    i18n.changeLanguage(resolvedLanguage);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.cookie = `language=${resolvedLanguage}; path=/; max-age=31536000; SameSite=Lax`;
  }, [resolvedLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
