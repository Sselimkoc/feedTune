"use client";

import { memo, useRef } from "react";
import { Button } from "@/components/core/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/core/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const languages = [
  { code: "tr", name: "Türkçe", flag: "fi fi-tr" },
  { code: "en", name: "English", flag: "fi fi-gb" },
];

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage();
  const buttonRef = useRef(null);
  const animatingRef = useRef(false);

  const handleLanguageChange = (langCode) => {
    if (language === langCode || animatingRef.current) return;
    animatingRef.current = true;

    const el = buttonRef.current;
    if (el) {
      el.style.transition = "opacity 150ms ease, transform 150ms ease";
      el.style.opacity = "0";
      el.style.transform = "scale(0.85)";
    }

    setTimeout(() => {
      changeLanguage(langCode);
      if (el) {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }
      setTimeout(() => { animatingRef.current = false; }, 150);
    }, 150);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button ref={buttonRef} variant="ghost" size="icon" className="rounded-full w-10 h-10 border border-transparent hover:border-accent hover:bg-transparent hover:text-foreground transition-all duration-300">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t("settings.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] p-1 flex flex-col gap-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`py-3 px-3 gap-3 text-sm font-medium ${language === lang.code ? "bg-accent" : ""}`}
          >
            <span className={`${lang.flag} rounded-sm w-5 h-4`} />
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
