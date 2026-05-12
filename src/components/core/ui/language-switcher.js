"use client";

import { memo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/core/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { Languages } from "lucide-react";

const languages = [
  { code: "tr", name: "Türkçe", flag: "fi fi-tr" },
  { code: "en", name: "English", flag: "fi fi-gb" },
];

export const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { language, changeLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const animatingRef = useRef(false);

  const handleSelect = (langCode) => {
    if (language === langCode || animatingRef.current) return;
    animatingRef.current = true;
    setOpen(false);

    const el = buttonRef.current;
    if (el) {
      el.style.transition = "opacity 140ms ease, transform 140ms ease";
      el.style.opacity = "0";
      el.style.transform = "scale(0.82)";
    }

    setTimeout(() => {
      changeLanguage(langCode);
      if (el) {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }
      setTimeout(() => { animatingRef.current = false; }, 140);
    }, 140);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          ref={buttonRef}
          aria-label={t("settings.language")}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-transparent hover:border-accent hover:text-foreground transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Languages className="w-[18px] h-[18px]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="p-1.5 min-w-[148px] rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-xl
          data-[state=open]:animate-none data-[state=closed]:animate-none"
      >
        <div className="flex flex-col gap-0.5">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 outline-none ${
                  isActive
                    ? "border border-foreground/20 text-foreground bg-foreground/5"
                    : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <span className={`${lang.flag} rounded-[3px] w-[20px] h-[15px] shrink-0 shadow-sm`} />
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
