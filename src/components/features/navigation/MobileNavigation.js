"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  Home,
  Settings,
  Bookmark,
  Clock,
  Rss,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  User,
  Laptop,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ThemeToggle } from "@/components/features/theme/themeToggle";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { settings } = useSettingsStore();
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Public menu items - visible to all users
  const publicMenuItems = [
    {
      name: t("navigation.home"),
      href: "/",
      icon: <Home className="w-5 h-5" />,
    },
  ];

  // Protected menu items - visible to logged in users
  const protectedMenuItems = [
    {
      name: t("navigation.feeds"),
      href: "/feeds",
      icon: <Rss className="w-5 h-5" />,
    },
    {
      name: t("navigation.favorites"),
      href: "/favorites",
      icon: <Bookmark className="w-5 h-5" />,
    },
    {
      name: t("navigation.readLater"),
      href: "/read-later",
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  // Bottom menu items
  const bottomMenuItems = [
    {
      name: t("navigation.settings"),
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
      protected: true,
    },
  ];

  const activeMenuItems = [...publicMenuItems];
  if (userId) {
    activeMenuItems.push(...protectedMenuItems);
  }

  // Next theme in rotation (dark -> light -> system -> dark)
  const getNextTheme = useCallback(() => {
    if (theme === "dark") return "light";
    if (theme === "light") return "system";
    return "dark";
  }, [theme]);

  // Get icon based on theme
  const getThemeIcon = useCallback(() => {
    if (theme === "dark") return <Moon className="w-5 h-5 mr-3 text-primary" />;
    if (theme === "light") return <Sun className="w-5 h-5 mr-3 text-primary" />;
    return <Laptop className="w-5 h-5 mr-3 text-primary" />;
  }, [theme]);

  // Get theme name for display
  const getThemeName = useCallback(() => {
    if (theme === "dark") return t("settings.theme.dark");
    if (theme === "light") return t("settings.theme.light");
    return t("settings.theme.system");
  }, [theme, t]);

  const handleSignOutClick = useCallback(async () => {
    try {
      const { success, error } = await signOut({
        toastSuccess: (message) =>
          toast({
            title: t("common.success"),
            description: t(message),
          }),
        toastError: (message) =>
          toast({
            title: t("common.error"),
            description: t(message),
            variant: "destructive",
          }),
      });

      if (success) {
        router.push("/");
        setOpen(false);
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: t("common.error"),
        description: t("auth.logoutError"),
        variant: "destructive",
      });
    }
  }, [signOut, router, toast, t]);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-50 px-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/feedtunelogo.png"
          alt="FeedTune Logo"
          width={24}
          height={24}
          className="w-6 h-6 text-primary"
        />
        <span className="font-bold text-lg">FeedTune</span>
      </Link>

      {/* Mobile Menu Trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full hover:bg-accent/50 flex items-center justify-center"
          >
            <Menu className="w-[18px] h-[18px]" />
            <span className="sr-only">{t("common.menu")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full">
            {/* Top Section - Logo and Close */}
            <div className="p-4 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/images/feedtunelogo.png"
                  alt="FeedTune Logo"
                  width={24}
                  height={24}
                  className="w-5 h-5 text-primary"
                />
                <span className="font-bold text-lg">FeedTune</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full flex items-center justify-center"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">{t("common.close")}</span>
              </Button>
            </div>

            <Separator />

            {/* Main Menu */}
            <div className="flex-1 py-2 overflow-auto">
              <div className="px-3 space-y-1">
                {activeMenuItems.map((item) => (
                  <Link
                    key={`menu-item-${item.href}`}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            {/* Bottom Menu - User Info and Sign Out */}
            <div className="p-3 space-y-1">
              {userId && (
                <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-2 mb-2">
                  <Avatar className="h-9 w-9 border-2 border-primary/10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.account.freePlan")}
                    </p>
                  </div>
                </div>
              )}
              {/* Theme Change */}
              <div className="flex flex-col p-3 rounded-md bg-muted/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getThemeIcon()}
                    <span className="text-sm font-medium">
                      {getThemeName()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full flex items-center justify-center"
                    onClick={() => setTheme(getNextTheme())}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sign Out */}
              {userId && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={handleSignOutClick}
                >
                  <LogOut className="w-5 h-5" />
                  {t("nav.logout")}
                </Button>
              )}
              {!userId && (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" passHref>
                    <Button
                      variant="default"
                      className="w-full justify-start gap-3"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/auth/register" passHref>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("nav.register")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
