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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const [open, setOpen] = useState(false);

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
  if (user) {
    activeMenuItems.push(...protectedMenuItems);
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
                    key={item.href}
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
                if (item.protected && !user) {
                  return null;
                }

                return (
                  <Link
                    key={item.href}
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
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 mr-3 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 mr-3 text-blue-600" />
                )}
                {theme === "dark"
                  ? t("navigation.lightMode")
                  : t("navigation.darkMode")}
              </Button>

              {/* User Info */}
              {user ? (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-center gap-3 px-3 py-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive px-3 py-2 rounded-md text-sm font-medium"
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    {t("navigation.signOut")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start px-3 py-2 rounded-md text-sm font-medium"
                  asChild
                >
                  <Link href="/?modal=auth" onClick={() => setOpen(false)}>
                    <User className="w-5 h-5 mr-3" />
                    {t("navigation.signIn")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
