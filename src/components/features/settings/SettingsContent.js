"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";

export function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t("settings.title")}</h1>
      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.theme")}</CardTitle>
            <CardDescription>{t("settings.themeDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.theme")}</Label>
                <div className="text-sm text-muted-foreground">
                  {t("settings.themeDescription")}
                </div>
              </div>
              <Select
                value={theme}
                onValueChange={(value) => {
                  setTheme(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("settings.theme")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feed Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.preferences")}</CardTitle>
            <CardDescription>
              {t("settings.preferencesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.compactMode")}</Label>
                <div className="text-sm text-muted-foreground">
                  {t("settings.compactModeDescription")}
                </div>
              </div>
              <Switch
                checked={settings.compactMode || false}
                onCheckedChange={(checked) =>
                  updateSettings({ compactMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("settings.feedRefresh")}</Label>
                <div className="text-sm text-muted-foreground">
                  {t("settings.feedRefreshDescription")}
                </div>
              </div>
              <Select
                value={(settings.refreshInterval || 30).toString()}
                onValueChange={(value) =>
                  updateSettings({ refreshInterval: parseInt(value) })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("settings.feedRefresh")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 {t("settings.minutes")}</SelectItem>
                  <SelectItem value="30">30 {t("settings.minutes")}</SelectItem>
                  <SelectItem value="60">1 {t("settings.hours")}</SelectItem>
                  <SelectItem value="180">3 {t("settings.hours")}</SelectItem>
                  <SelectItem value="360">6 {t("settings.hours")}</SelectItem>
                  <SelectItem value="720">12 {t("settings.hours")}</SelectItem>
                  <SelectItem value="1440">24 {t("settings.hours")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.account")}</CardTitle>
            <CardDescription>
              {t("settings.accountDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive">{t("settings.deleteAccount")}</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setTheme("system");
              updateSettings({
                updateInterval: "30",
                autoMarkAsRead: false,
                pushNotifications: false,
                emailNotifications: false,
              });
            }}
          >
            {t("settings.resetToDefaults")}
          </Button>
        </div>
      </div>
    </div>
  );
}
