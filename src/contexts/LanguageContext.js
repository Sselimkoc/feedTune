"use client";

import { createContext, useContext, useState, useEffect } from "react";
import trTranslations from "@/locales/tr.json";
import enTranslations from "@/locales/en.json";
// Yeni dil eklemek için buraya import ekleyebiliriz
// import deTranslations from "@/locales/de.json";
// import frTranslations from "@/locales/fr.json";
import { useSettingsStore } from "@/store/useSettingsStore";

// Desteklenen tüm diller
const supportedLanguages = {
  tr: {
    name: "Türkçe",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    translations: trTranslations,
  },
  en: {
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    translations: enTranslations,
  },
  // Yeni diller buraya eklenebilir
  // de: {
  //   name: "German",
  //   nativeName: "Deutsch",
  //   flag: "🇩🇪",
  //   translations: deTranslations,
  // },
  // fr: {
  //   name: "French",
  //   nativeName: "Français",
  //   flag: "🇫🇷",
  //   translations: frTranslations,
  // },
};

// Dil çevirileri için daha kolay erişim
const translations = Object.entries(supportedLanguages).reduce(
  (acc, [code, langData]) => {
    acc[code] = langData.translations;
    return acc;
  },
  {}
);

// Varsayılan dil
const DEFAULT_LANGUAGE = "tr";

// Context oluşturma
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { settings, setLanguage: setStoreLanguage } = useSettingsStore();
  const [language, setLanguageState] = useState(
    settings.language || DEFAULT_LANGUAGE
  );

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
      } else {
        // Eğer desteklenen bir dil değilse varsayılan dile ayarla
        setLanguageState(DEFAULT_LANGUAGE);
        setStoreLanguage(DEFAULT_LANGUAGE);
      }
    }
  }, [settings.language, setStoreLanguage]);

  // Dil değiştirme fonksiyonu
  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
      setStoreLanguage(newLanguage);
    } else {
      console.warn(`Desteklenmeyen dil: ${newLanguage}`);
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
          // Eğer çeviri bulunamazsa, diğer dillerde ara
          // Önce İngilizce çeviriye bak (yaygın fallback)
          if (language !== "en" && translations["en"]) {
            let enValue = translations["en"];
            let found = true;

            for (const k2 of keys) {
              if (enValue && enValue[k2] !== undefined) {
                enValue = enValue[k2];
              } else {
                found = false;
                break;
              }
            }

            if (found) return enValue;
          }

          // Çeviri bulunamadıysa anahtar değerini döndür
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

  // Mevcut dile ait meta veriler
  const currentLanguageData =
    supportedLanguages[language] || supportedLanguages[DEFAULT_LANGUAGE];

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        languageName: currentLanguageData.name,
        nativeName: currentLanguageData.nativeName,
        flag: currentLanguageData.flag,
        supportedLanguages,
      }}
    >
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
