"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettingsStore } from "@/store/useSettingsStore";

export function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  const languages = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
  ];

  const handleLanguageChange = (langCode) => {
    if (language === langCode) {
      setOpen(false);
      return;
    }

    setChanging(true);
    setTimeout(() => {
      changeLanguage(langCode);
      setOpen(false);
      setTimeout(() => {
        setChanging(false);
      }, 300);
    }, 300);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 transition-all duration-300 ${
            changing ? "opacity-0 scale-90" : "opacity-100 scale-100"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t("settings.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
