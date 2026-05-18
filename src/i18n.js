import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "@/locales/en/translation.json";
import trTranslations from "@/locales/tr/translation.json";

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "tr";
  return document.cookie.match(/language=([^;]+)/)?.[1] || "tr";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    tr: { translation: trTranslations },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
