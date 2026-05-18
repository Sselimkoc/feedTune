"use client";

import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/core/ui/button";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

const LANGS = {
  tr: { flag: "fi fi-tr", label: "TR" },
  en: { flag: "fi fi-gb", label: "EN" },
};

export function LandingControls() {
  const { resolvedTheme, setTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const targetLang = language === "tr" ? "en" : "tr";
  const { flag, label } = LANGS[language] ?? LANGS["tr"];

  return (
    <div className="fixed top-4 right-5 z-50 flex items-center gap-1.5 bg-background/75 backdrop-blur-md border border-border/50 rounded-full px-2.5 py-1.5 shadow-md">
      {/* Language toggle — shows target language to switch to */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 rounded-full text-xs font-semibold hover:bg-accent/60 transition-colors gap-2"
        onClick={() => changeLanguage(targetLang)}
        title={targetLang === "tr" ? "Türkçe'ye geç" : "Switch to English"}
      >
        <span className={`${flag} rounded-[3px] shrink-0 shadow-sm`} style={{ width: 20, height: 15 }} />
        {label}
      </Button>

      <div className="w-px h-5 bg-border/60" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 rounded-full text-xs hover:bg-accent/60 transition-colors gap-1.5"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Açık tema" : "Koyu tema"}
      >
        {isDark ? (
          <><Moon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("settings.theme.dark")}</span></>
        ) : (
          <><Sun className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("settings.theme.light")}</span></>
        )}
      </Button>
    </div>
  );
}
