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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ThemeToggle } from "@/components/features/theme/themeToggle";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { settings } = useSettingsStore();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
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
  const getNextTheme = () => {
    if (theme === "dark") return "light";
    if (theme === "light") return "system";
    return "dark";
  };

  // Get icon based on theme
  const getThemeIcon = () => {
    if (theme === "dark") return <Moon className="w-5 h-5 mr-3 text-primary" />;
    if (theme === "light") return <Sun className="w-5 h-5 mr-3 text-primary" />;
    return <Laptop className="w-5 h-5 mr-3 text-primary" />;
  };

  // Get theme name for display
  const getThemeName = () => {
    if (theme === "dark") return t("settings.theme.dark");
    if (theme === "light") return t("settings.theme.light");
    return t("settings.theme.system");
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
      setOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("errors.signOutFailed"));
    }
  };

  if (isLoadingUser) {
    return null;
  }

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-50 px-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-primary" />
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
            <span className="sr-only">Menü</span>
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
                <Rss className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">FeedTune</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full flex items-center justify-center"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Kapat</span>
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

            {/* Bottom Menu */}
            <div className="p-3 space-y-1">
              {/* Bottom Menu Items - Only show relevant users */}
              {bottomMenuItems.map((item) => {
                if (item.protected && !userId) {
                  return null;
                }

                return (
                  <Link
                    key={`bottom-menu-${item.href}`}
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
                );
              })}

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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  {t("auth.signOut")}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
