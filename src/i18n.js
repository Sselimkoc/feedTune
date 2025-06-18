import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "@/locales/en/translation.json";
import trTranslations from "@/locales/tr/translation.json";

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    tr: {
      translation: trTranslations,
    },
  },
  lng: "tr", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
