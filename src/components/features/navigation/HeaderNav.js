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
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg shadow-sm dark:border-b dark:shadow-none">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        {/* Logo - Removed from HeaderNav as it's now in SidebarNavigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Removed the entire Link component that contained the Rss icon */}
        </motion.div>

        {/* Sağ taraf - Tema ve Dil Değiştirme */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Theme Switcher - Client-side rendering check */}
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
                <div className="relative">
                  <Sun className="h-[18px] w-[18px] text-primary" />
                </div>
              ) : (
                <div className="relative">
                  <Moon className="h-[18px] w-[18px] text-primary" />
                </div>
              )
            ) : (
              // Static content for initial render during hydration
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
                    <Languages className="h-[18px] w-[18px] text-primary" />
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
        </motion.div>
      </div>
    </header>
  );
}
