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
  const [isChanging, setIsChanging] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (isChanging) return; // Prevent rapid changes

    setIsChanging(true);

    const nextTheme =
      theme === "dark" ? "light" : theme === "light" ? "system" : "dark";

    // Animate icon before changing theme
    setTimeout(() => {
      setTheme(nextTheme);
      updateSettings({ theme: nextTheme });

      // Allow changes after animation completes
      setTimeout(() => {
        setIsChanging(false);
      }, 800);
    }, 150);
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
      disabled={isChanging}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isChanging && "opacity-70"
      )}
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
