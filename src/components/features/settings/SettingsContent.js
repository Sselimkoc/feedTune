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
    <section className="py-6 lg:py-8 relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
      </div>

      <div className="container relative z-10">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("settings.description")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {/* Appearance & Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-blue-500/5 pb-3">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-blue-500" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-blue-500" />
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
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 shadow-sm
                        ${
                          theme === "light"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
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
                          theme === "light"
                            ? "text-foreground"
                            : "text-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {t("settings.theme.light")}
                      </span>
                    </motion.div>
                    <motion.div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 shadow-sm
                        ${
                          theme === "dark"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
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
                          theme === "dark"
                            ? "text-foreground"
                            : "text-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {t("settings.theme.dark")}
                      </span>
                    </motion.div>
                    <motion.div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 shadow-sm
                        ${
                          theme === "system"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
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
                          theme === "system"
                            ? "text-foreground"
                            : "text-foreground"
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
                    {t("settings.language.title")}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 shadow-sm
                        ${
                          language === "en"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
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
                          language === "en"
                            ? "text-foreground"
                            : "text-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">🇬🇧 English</span>
                    </motion.div>
                    <motion.div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all duration-300 shadow-sm
                        ${
                          language === "tr"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:border-primary/30 text-foreground hover:text-foreground"
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
                          language === "tr"
                            ? "text-foreground"
                            : "text-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">🇹🇷 Türkçe</span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-blue-500/5 pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
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
          </motion.div>

          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="bg-blue-500/5 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">
                    {t("settings.data.title")}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {t("settings.data.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      {t("settings.data.refresh.title")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.data.refresh.description")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      // Handle refresh
                      toast({
                        title: t("settings.data.refresh.success"),
                        description: t(
                          "settings.data.refresh.successDescription"
                        ),
                      });
                    }}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    {t("settings.data.refresh.button")}
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      {t("settings.data.reset.title")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.data.reset.description")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      // Handle reset
                      toast({
                        title: t("settings.data.reset.success"),
                        description: t(
                          "settings.data.reset.successDescription"
                        ),
                      });
                    }}
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    {t("settings.data.reset.button")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
