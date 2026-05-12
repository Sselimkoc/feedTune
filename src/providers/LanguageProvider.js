"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

export function LanguageProvider({ children, initialLanguage }) {
  const language = useSettingsStore((state) => state.settings.language);

  const resolvedLanguage = language || initialLanguage || "en";
  if (i18n.language !== resolvedLanguage) {
    i18n.changeLanguage(resolvedLanguage);
  }

  useEffect(() => {
    document.cookie = `language=${resolvedLanguage}; path=/; max-age=31536000; SameSite=Lax`;
  }, [resolvedLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
