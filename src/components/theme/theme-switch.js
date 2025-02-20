"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/settings-store";
import { Moon } from "lucide-react";

export function ThemeSwitch() {
  const { settings, toggleTheme } = useSettingsStore();

  return (
    <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/10">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-primary" />
          <Label>Dark Mode</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Toggle between light and dark themes
        </p>
      </div>
      <Switch
        checked={settings.theme === "dark"}
        onCheckedChange={toggleTheme}
      />
    </div>
  );
}
