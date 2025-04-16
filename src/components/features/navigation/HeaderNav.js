"use client";

import { useState } from "react";
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
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rss className="w-5 h-5 text-primary" />
              <div className="absolute -inset-0.5 bg-primary/10 blur-sm rounded-lg -z-10"></div>
            </div>
            <span className="font-bold text-xl hidden sm:inline bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              FeedTune
            </span>
          </Link>
        </motion.div>

        {/* Sağ taraf - Tema ve Dil Değiştirme */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Tema Değiştirme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent/50 transition-all duration-300"
            aria-label={
              theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"
            }
          >
            {theme === "dark" ? (
              <div className="relative">
                <Sun className="h-[18px] w-[18px] text-amber-400" />
                <div className="absolute -inset-1 bg-amber-400/20 blur-sm rounded-full -z-10"></div>
              </div>
            ) : (
              <div className="relative">
                <Moon className="h-[18px] w-[18px] text-blue-600" />
                <div className="absolute -inset-1 bg-blue-600/20 blur-sm rounded-full -z-10"></div>
              </div>
            )}
          </Button>

          {/* Dil Değiştirme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent/50 transition-all duration-300"
                aria-label="Dil değiştir"
              >
                <div className="relative">
                  <Languages className="h-[18px] w-[18px] text-primary" />
                  <div className="absolute -inset-1 bg-primary/10 blur-sm rounded-full -z-10"></div>
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
