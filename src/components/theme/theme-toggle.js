"use client";

import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/settings-store";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { settings, toggleTheme } = useSettingsStore();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="w-10 h-10 rounded-full"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
