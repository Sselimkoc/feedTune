"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Rss, Moon, Sun, Languages, User } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export function HeaderNav() {
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  // Hydration uyumsuzluğunu önlemek için client-side rendering kontrolü
  const [mounted, setMounted] = useState(false);

  // Client-side rendering kontrolü
  useEffect(() => {
    setMounted(true);
  }, []);

  // Desteklenen diller
  const languages = Object.entries(supportedLanguages).map(
    ([code, langInfo]) => ({
      code,
      name: langInfo.nativeName,
      flag: langInfo.flag,
    })
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#151c29] shadow border-b border-blue-900">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 h-full">
          <Image
            src="/images/feedtunelogo.png"
            alt="FeedTune Logo"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <span className="font-bold text-xl text-blue-500 hover:text-blue-600 transition-colors">
            FeedTune
          </span>
        </Link>

        {/* Center: (optional, empty for now) */}
        <div className="flex-1 flex justify-center"></div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-10 h-10 flex items-center justify-center border border-transparent hover:border-accent hover:bg-transparent transition-all duration-300"
            aria-label={
              mounted
                ? theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
                : "Toggle theme"
            }
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-[18px] w-[18px] text-foreground" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-foreground" />
              )
            ) : (
              <div className="w-[18px] h-[18px]"></div>
            )}
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-10 h-10 flex items-center justify-center border border-transparent hover:border-accent hover:bg-transparent transition-all duration-300"
                aria-label="Change language"
              >
                <div className="relative">
                  {mounted && (
                    <Languages className="h-[18px] w-[18px] text-foreground" />
                  )}
                  {!mounted && <div className="h-[18px] w-[18px]"></div>}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] p-1 rounded-lg border border-border/50 shadow-lg"
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`py-2.5 px-3 rounded-md transition-colors ${
                    language === lang.code
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="mr-2 text-base">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
