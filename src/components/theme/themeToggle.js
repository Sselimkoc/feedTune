"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme =
      theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(nextTheme);
    updateSettings({ theme: nextTheme });
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden"
    >
      {/* Sun icon */}
      <Sun
        className={cn(
          "h-5 w-5 transition-all duration-500",
          theme === "light"
            ? "rotate-0 scale-100"
            : "rotate-90 scale-0 absolute"
        )}
      />

      {/* Moon icon */}
      <Moon
        className={cn(
          "h-5 w-5 transition-all duration-500",
          theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0 absolute"
        )}
      />

      {/* System icon */}
      <Laptop
        className={cn(
          "h-5 w-5 transition-all duration-500",
          theme === "system"
            ? "rotate-0 scale-100"
            : "rotate-90 scale-0 absolute"
        )}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
