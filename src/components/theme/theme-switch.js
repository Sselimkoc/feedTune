"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/settings-store";

export function ThemeSwitch() {
  const { settings, toggleTheme } = useSettingsStore();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Dark Mode</Label>
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
