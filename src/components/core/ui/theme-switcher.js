"use client";

import { memo, useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/core/ui/button";
import { Moon, Sun } from "lucide-react";

export const ThemeSwitcher = memo(function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);
  const animatingRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const handleThemeChange = () => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const el = buttonRef.current;
    if (el) {
      el.style.transition = "opacity 150ms ease, transform 150ms ease";
      el.style.opacity = "0";
      el.style.transform = "scale(0.85)";
    }

    setTimeout(() => {
      setTheme(theme === "dark" ? "light" : "dark");
      if (el) {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }
      setTimeout(() => { animatingRef.current = false; }, 150);
    }, 150);
  };

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      className="rounded-full w-10 h-10 border border-transparent hover:border-accent hover:bg-transparent hover:text-foreground transition-all duration-300"
      aria-label={mounted ? (theme === "dark" ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"}
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <div className="w-4 h-4" />
      )}
    </Button>
  );
});
