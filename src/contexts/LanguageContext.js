"use client";

import { createContext, useContext, useState, useEffect } from "react";
import trTranslations from "@/locales/tr.json";
import enTranslations from "@/locales/en.json";

// Dil çevirileri
const translations = {
  tr: trTranslations,
  en: enTranslations,
};

// Varsayılan dil
const DEFAULT_LANGUAGE = "tr";

// Context oluşturma
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Tarayıcı dilini veya localStorage'dan kaydedilmiş dili al
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  // Sayfa yüklendiğinde localStorage'dan dil tercihini al
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    } else {
      // Tarayıcı dilini kontrol et
      const browserLanguage = navigator.language.split("-")[0];
      if (translations[browserLanguage]) {
        setLanguage(browserLanguage);
      }
    }
  }, []);

  // Dil değiştirme fonksiyonu
  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem("language", newLanguage);
    }
  };

  // Çeviri fonksiyonu
  const t = (key) => {
    // Nokta notasyonu ile nested objelere erişim (örn: "home.title")
    const keys = key.split(".");
    let value = translations[language];

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Çeviri bulunamazsa key'i döndür
      }
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
