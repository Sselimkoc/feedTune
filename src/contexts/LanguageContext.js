"use client";

import { createContext, useContext, useState, useEffect } from "react";
import trTranslations from "@/locales/tr.json";
import enTranslations from "@/locales/en.json";
import { useSettingsStore } from "@/store/useSettingsStore";

// Dil çevirileri
const translations = {
  tr: trTranslations,
  en: enTranslations,
};

// Context oluşturma
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { settings, setLanguage: setStoreLanguage } = useSettingsStore();
  const [language, setLanguageState] = useState(settings.language || "tr");

  // Sayfa yüklendiğinde store'dan dil tercihini al
  useEffect(() => {
    if (settings.language && translations[settings.language]) {
      setLanguageState(settings.language);
    } else {
      // Tarayıcı dilini kontrol et
      const browserLanguage = navigator.language.split("-")[0];
      if (translations[browserLanguage]) {
        setLanguageState(browserLanguage);
        setStoreLanguage(browserLanguage);
      }
    }
  }, [settings.language, setStoreLanguage]);

  // Dil değiştirme fonksiyonu
  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
      setStoreLanguage(newLanguage);
    }
  };

  // Çeviri fonksiyonu
  const t = (key, params) => {
    // Nokta notasyonu ile nested objelere erişim (örn: "home.title")
    const keys = key.split(".");
    let value = translations[language];

    try {
      for (const k of keys) {
        if (value && value[k] !== undefined) {
          value = value[k];
        } else {
          // Eğer çeviri bulunamazsa, geri dönüş değeri olarak key'i döndürme
          console.warn(`Çeviri anahtarı bulunamadı: ${key}`);
          return key;
        }
      }

      // Parametre değişkenleri varsa değiştir
      if (params && typeof value === "string") {
        Object.keys(params).forEach((param) => {
          value = value.replace(`{{${param}}}`, params[param]);
        });
      }

      return value;
    } catch (error) {
      console.warn(`Çeviri anahtarı işlenirken hata: ${key}`, error);
      return key;
    }
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
