"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { t } from "i18next";

export function LanguageSwitcher({ isMobile = false }) {
  const { language, changeLanguage } = useLanguage();

  const sizeClass = isMobile ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <span className={`${sizeClass} text-muted-foreground`}>
        {t("home.hero.availableIn")}:
      </span>
      <button
        className={`${sizeClass} font-medium px-1 py-0.5 rounded transition-colors ${
          language === "tr" ? "bg-primary/10 text-primary" : "hover:bg-muted"
        }`}
        onClick={() => changeLanguage("tr")}
        type="button"
      >
        <span className="fi fi-tr " /> Türkçe
      </button>
      <span className={`${sizeClass} font-medium`}>·</span>
      <button
        className={`${sizeClass} font-medium px-1 py-0.5 rounded transition-colors ${
          language === "en" ? "bg-primary/10 text-primary" : "hover:bg-muted"
        }`}
        onClick={() => changeLanguage("en")}
        type="button"
      >
        <span className="fi fi-gb " /> English
      </button>
    </div>
  );
}
