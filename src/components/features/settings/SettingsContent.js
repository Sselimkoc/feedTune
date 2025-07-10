"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/core/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/core/ui/card";
import { Label } from "@/components/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/core/ui/select";
import { Switch } from "@/components/core/ui/switch";
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
  Trash2,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/core/ui/separator";
import { motion } from "framer-motion";
import { ProfileSettings } from "@/components/features/settings/ProfileSettings";
import { useToast } from "@/components/core/ui/use-toast";
import { useCleanupService } from "@/hooks/features/useCleanupService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/core/ui/dialog";
import { Input } from "@/components/core/ui/input";

export function SettingsContent() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t, language, changeLanguage } = useLanguage();
  const [themeChanging, setThemeChanging] = useState(false);
  const [languageChanging, setLanguageChanging] = useState(false);
  const { toast } = useToast();

  // Cleanup service
  const {
    isLoading: isCleanupLoading,
    getCleanupStats,
    previewCleanup,
    runCleanup,
    canRunCleanup,
  } = useCleanupService();

  // Cleanup dialog state
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupStats, setCleanupStats] = useState(null);
  const [cleanupOptions, setCleanupOptions] = useState({
    olderThanDays: 30,
    keepFavorites: true,
    keepReadLater: true,
  });

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

  // Cleanup handlers
  const handleGetCleanupStats = async () => {
    try {
      const stats = await getCleanupStats(cleanupOptions.olderThanDays);
      setCleanupStats(stats);
    } catch (error) {
      console.error("Error getting cleanup stats:", error);
    }
  };

  const handlePreviewCleanup = async () => {
    try {
      await previewCleanup(cleanupOptions);
      await handleGetCleanupStats(); // Refresh stats
    } catch (error) {
      console.error("Error previewing cleanup:", error);
    }
  };

  const handleRunCleanup = async () => {
    try {
      await runCleanup(cleanupOptions);
      await handleGetCleanupStats(); // Refresh stats
      setCleanupDialogOpen(false);
    } catch (error) {
      console.error("Error running cleanup:", error);
    }
  };

  // Load cleanup stats when dialog opens
  useEffect(() => {
    if (cleanupDialogOpen && canRunCleanup()) {
      handleGetCleanupStats();
    }
  }, [cleanupDialogOpen, cleanupOptions.olderThanDays]);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <section className="py-4 px-2 sm:py-6 sm:px-0 lg:py-8 relative">
      {/* Background animated patterns */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 right-1/3 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        ></div>
        <div
          className="absolute top-1/2 left-2/3 w-40 h-40 sm:w-64 sm:h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s" }}
        ></div>
      </div>

      <div className="container relative z-10 px-0 sm:px-4">
        <motion.div
          className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">
                {t("settings.title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("settings.description")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1">
          {/* Appearance & Language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300 w-full">
              <CardHeader className="bg-blue-500/5 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4 text-blue-500" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-blue-500" />
                  )}
                  <CardTitle className="text-sm sm:text-base">
                    {t("settings.appearance.title")}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {t("settings.appearance.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 space-y-4 sm:space-y-6">
                {/* Theme Selection */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm text-muted-foreground">
                    {t("settings.theme.title")}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm text-muted-foreground">
                    {t("settings.language.title")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                      <span className="text-2xl mb-1">🇬🇧</span>
                      <span className="text-sm font-medium">English</span>
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
                      <span className="text-2xl mb-1">🇹🇷</span>
                      <span className="text-sm font-medium">Türkçe</span>
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
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300 w-full">
              <CardHeader className="bg-blue-500/5 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm sm:text-base">
                    {t("settings.profile.title")}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {t("settings.profile.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4">
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
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300 w-full">
              <CardHeader className="bg-blue-500/5 pb-2 sm:pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm sm:text-base">
                    {t("settings.data.title")}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {t("settings.data.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
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

          {/* Data Cleanup */}
          {canRunCleanup() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-blue-900/30 shadow-sm hover:shadow-md transition-all duration-300 w-full">
                <CardHeader className="bg-blue-500/5 pb-2 sm:pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm sm:text-base">
                      {t("cleanup.title")}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {t("cleanup.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        {t("cleanup.title")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("cleanup.description")}
                      </p>
                    </div>
                    <Dialog
                      open={cleanupDialogOpen}
                      onOpenChange={setCleanupDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          disabled={isCleanupLoading}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          {t("cleanup.runCleanup")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {t("cleanup.title")}
                          </DialogTitle>
                          <DialogDescription>
                            {t("cleanup.description")}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Cleanup Options */}
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label
                                htmlFor="olderThanDays"
                                className="text-sm font-medium"
                              >
                                {t("cleanup.olderThanDays", {
                                  days: cleanupOptions.olderThanDays,
                                })}
                              </Label>
                              <Input
                                id="olderThanDays"
                                type="number"
                                min="1"
                                max="365"
                                value={cleanupOptions.olderThanDays}
                                onChange={(e) =>
                                  setCleanupOptions((prev) => ({
                                    ...prev,
                                    olderThanDays:
                                      parseInt(e.target.value) || 30,
                                  }))
                                }
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="keepFavorites"
                                  className="text-sm font-medium"
                                >
                                  {t("cleanup.keepFavorites")}
                                </Label>
                                <Switch
                                  id="keepFavorites"
                                  checked={cleanupOptions.keepFavorites}
                                  onCheckedChange={(checked) =>
                                    setCleanupOptions((prev) => ({
                                      ...prev,
                                      keepFavorites: checked,
                                    }))
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="keepReadLater"
                                  className="text-sm font-medium"
                                >
                                  {t("cleanup.keepReadLater")}
                                </Label>
                                <Switch
                                  id="keepReadLater"
                                  checked={cleanupOptions.keepReadLater}
                                  onCheckedChange={(checked) =>
                                    setCleanupOptions((prev) => ({
                                      ...prev,
                                      keepReadLater: checked,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Cleanup Statistics */}
                          {cleanupStats && (
                            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                              <h4 className="text-sm font-medium">
                                Statistics
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  RSS Items: {cleanupStats.old_rss_items}
                                </div>
                                <div>
                                  YouTube Items:{" "}
                                  {cleanupStats.old_youtube_items}
                                </div>
                                <div>
                                  Orphaned RSS:{" "}
                                  {cleanupStats.orphaned_rss_interactions}
                                </div>
                                <div>
                                  Orphaned YouTube:{" "}
                                  {cleanupStats.orphaned_youtube_interactions}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total: {cleanupStats.total_old_items} items
                                would be affected
                              </div>
                            </div>
                          )}

                          {/* Warning */}
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                              This action cannot be undone. Make sure you have
                              backups if needed.
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={handlePreviewCleanup}
                            disabled={isCleanupLoading}
                          >
                            {t("cleanup.previewCleanup")}
                          </Button>
                          <Button
                            onClick={handleRunCleanup}
                            disabled={isCleanupLoading}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isCleanupLoading ? (
                              <>
                                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                {t("cleanup.runCleanup")}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
