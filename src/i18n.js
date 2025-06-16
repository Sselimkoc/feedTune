import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "@/locales/en.json";
import trTranslations from "@/locales/tr.json";

// Initialize i18next
const i18nConfig = {
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
  react: {
    useSuspense: false,
  },
};

// Only initialize if it hasn't been initialized yet
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init(i18nConfig);
}

export default i18n;
export { i18nConfig };
