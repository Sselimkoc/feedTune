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
import { useLanguage } from "@/hooks/useLanguage";
import {
  Moon,
  Sun,
  Monitor,
  Globe,
  LayoutGrid,
  RefreshCw,
  User,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ProfileSettings } from "@/components/features/settings/ProfileSettings";
import { useToast } from "@/components/ui/use-toast";

export function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t, language, changeLanguage } = useLanguage();
  const [themeChanging, setThemeChanging] = useState(false);
  const [languageChanging, setLanguageChanging] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: t("settings.languageChanged"),
        description: t("settings.languageChangedDescription"),
      });
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
      <div className="flex items-center gap-3 mb-8">
        <Settings2 className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
      </div>

      <div className="grid gap-6">
        {/* Appearance & Language */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-accent/5 pb-3">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-accent" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4 text-accent" />
              ) : (
                <Monitor className="h-4 w-4 text-accent" />
              )}
              <CardTitle className="text-base">
                {t("settings.appearance.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.appearance.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                {t("settings.theme.title")}
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all duration-300 shadow-sm
                    ${
                      theme === "light"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-foreground hover:text-foreground"
                    }`}
                  onClick={() => handleThemeChange("light")}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sun
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      theme === "light" ? "text-foreground" : "text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {t("settings.theme.light")}
                  </span>
                </motion.div>
                <motion.div
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all duration-300 shadow-sm
                    ${
                      theme === "dark"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-foreground hover:text-foreground"
                    }`}
                  onClick={() => handleThemeChange("dark")}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Moon
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      theme === "dark" ? "text-foreground" : "text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {t("settings.theme.dark")}
                  </span>
                </motion.div>
                <motion.div
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all duration-300 shadow-sm
                    ${
                      theme === "system"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-foreground hover:text-foreground"
                    }`}
                  onClick={() => handleThemeChange("system")}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Monitor
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      theme === "system" ? "text-foreground" : "text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {t("settings.theme.system")}
                  </span>
                </motion.div>
              </div>
            </div>

            <Separator />

            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                {t("settings.language")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all duration-300 shadow-sm
                    ${
                      language === "tr"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-foreground hover:text-foreground"
                    }`}
                  onClick={() => handleLanguageChange("tr")}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Globe
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      language === "tr" ? "text-foreground" : "text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">Türkçe</span>
                </motion.div>
                <motion.div
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border cursor-pointer transition-all duration-300 shadow-sm
                    ${
                      language === "en"
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-foreground hover:text-foreground"
                    }`}
                  onClick={() => handleLanguageChange("en")}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Globe
                    className={`h-5 w-5 mb-1 transition-all duration-300 ${
                      language === "en" ? "text-foreground" : "text-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">English</span>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-accent/5 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
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

        {/* Feed Preferences */}
        <Card className="overflow-hidden border-none shadow-sm transition-all duration-300">
          <CardHeader className="bg-accent/5 pb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">
                {t("settings.feedPreferences.title")}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t("settings.feedPreferences.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.feedPreferences.autoRefresh")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.feedPreferences.autoRefreshDescription")}
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoRefresh: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("settings.feedPreferences.showImages")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.feedPreferences.showImagesDescription")}
                  </p>
                </div>
                <Switch
                  checked={settings.showImages}
                  onCheckedChange={(checked) =>
                    updateSettings({ showImages: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
