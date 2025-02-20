"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Dark Mode</Label>
        <p className="text-sm text-muted-foreground">
          Toggle between light and dark themes
        </p>
      </div>
      <Switch 
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
    </div>
  );
} 