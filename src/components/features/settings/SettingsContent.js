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
import {
  Moon,
  Sun,
  Monitor,
  Globe,
  LayoutGrid,
  RefreshCw,
  User,
  RotateCcw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ProfileSettings } from "@/components/features/settings/ProfileSettings";

export function SettingsContent() {
  const { settings, updateSettings, setLanguage } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t, language, changeLanguage } = useLanguage();
  const [themeChanging, setThemeChanging] = useState(false);
  const [languageChanging, setLanguageChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme) => {
    if (theme === newTheme) return;

    setThemeChanging(true);
    setTimeout(() => {
      setTheme(newTheme);
      setTimeout(() => {
        setThemeChanging(false);
      }, 300);
    }, 300);
  };

  const handleLanguageChange = (newLanguage) => {
    if (language === newLanguage) return;

    setLanguageChanging(true);
    setTimeout(() => {
      changeLanguage(newLanguage);
      setTimeout(() => {
        setLanguageChanging(false);
      }, 300);
    }, 300);
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div
      className={`max-w-3xl mx-auto transition-all duration-500 ease-in-out ${
        themeChanging || languageChanging
          ? "opacity-0 scale-[0.98]"
          : "opacity-100 scale-100"
      }`}
    >
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4 text-primary" />
              ) : (
                <Monitor className="h-4 w-4 text-primary" />
              )}
              <CardTitle className="text-base">
                {t("settings.theme.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.theme.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 ${
                  theme === "light"
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleThemeChange("light")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Sun
                  className={`h-5 w-5 mb-1 transition-all duration-300 ${
                    theme === "light" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm">{t("settings.theme.light")}</span>
              </motion.div>
              <motion.div
                className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 ${
                  theme === "dark"
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleThemeChange("dark")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Moon
                  className={`h-5 w-5 mb-1 transition-all duration-300 ${
                    theme === "dark" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm">{t("settings.theme.dark")}</span>
              </motion.div>
              <motion.div
                className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 ${
                  theme === "system"
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleThemeChange("system")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Monitor
                  className={`h-5 w-5 mb-1 transition-all duration-300 ${
                    theme === "system"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm">{t("settings.theme.system")}</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Profil Settings */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t("settings.profile.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.profile.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ProfileSettings />
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t("settings.language")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.languageDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                className={`flex items-center justify-center p-2 rounded-md border cursor-pointer transition-all duration-300 ${
                  language === "tr"
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleLanguageChange("tr")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-sm">Türkçe</span>
              </motion.div>
              <motion.div
                className={`flex items-center justify-center p-2 rounded-md border cursor-pointer transition-all duration-300 ${
                  language === "en"
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleLanguageChange("en")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-sm">English</span>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Feed Preferences */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t("settings.preferences")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.preferencesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <motion.div
              className="flex items-center justify-between bg-accent/10 p-3 rounded-md transition-all duration-300 hover:bg-accent/20"
              whileHover={{
                y: -2,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    {t("settings.compactMode")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.compactModeDescription")}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.compactMode || false}
                onCheckedChange={(checked) =>
                  updateSettings({ compactMode: checked })
                }
              />
            </motion.div>

            <motion.div
              className="flex items-center justify-between bg-accent/10 p-3 rounded-md transition-all duration-300 hover:bg-accent/20"
              whileHover={{
                y: -2,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">
                    {t("settings.feedRefresh")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.feedRefreshDescription")}
                  </p>
                </div>
              </div>
              <Select
                value={(settings.refreshInterval || 30).toString()}
                onValueChange={(value) =>
                  updateSettings({ refreshInterval: parseInt(value) })
                }
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
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
            </motion.div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t("settings.account.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.account.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <motion.div
              className="bg-accent/10 p-3 rounded-md mb-3 transition-all duration-300 hover:bg-accent/20"
              whileHover={{
                y: -2,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {t("settings.account.freePlan")}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Active
                </span>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="destructive" size="sm" className="text-xs">
                {t("settings.account.deleteAccount")}
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => {
                setThemeChanging(true);
                setTimeout(() => {
                  setTheme("system");
                  updateSettings({
                    compactMode: false,
                    refreshInterval: 30,
                  });
                  setLanguage("tr");
                  setTimeout(() => {
                    setThemeChanging(false);
                  }, 300);
                }, 300);
              }}
            >
              <RotateCcw className="h-3 w-3" />
              {t("settings.resetToDefaults")}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
