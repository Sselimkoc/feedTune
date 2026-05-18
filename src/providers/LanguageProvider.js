"use client";

import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

const detectBrowserLanguage = () => {
  const lang = navigator.language || navigator.languages?.[0] || "";
  return lang.toLowerCase().startsWith("tr") ? "tr" : "en";
};

export function LanguageProvider({ children, initialLanguage }) {
  const [mounted, setMounted] = useState(false);
  const { settings, setLanguage: setStoreLang } = useSettingsStore();
  const zustandLanguage = settings.language;

  const resolvedLanguage = mounted
    ? (zustandLanguage || initialLanguage || "tr")
    : (initialLanguage || "tr");

  if (i18n.language !== resolvedLanguage) {
    i18n.changeLanguage(resolvedLanguage);
  }

  useEffect(() => {
    setMounted(true);

    // First-ever visit: no cookie saved yet → auto-detect from browser
    const hasCookie = document.cookie.includes("language=");
    if (!hasCookie) {
      const detected = detectBrowserLanguage();
      if (detected !== zustandLanguage) {
        setStoreLang(detected);
        i18n.changeLanguage(detected);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.cookie = `language=${resolvedLanguage}; path=/; max-age=31536000; SameSite=Lax`;
  }, [resolvedLanguage]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
