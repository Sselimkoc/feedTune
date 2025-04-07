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

  // Menü öğeleri
  const menuItems = [
    {
      name: t("navigation.home"),
      href: "/",
      icon: <Home className="w-5 h-5" />,
    },
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

  // Alt menü öğeleri
  const bottomMenuItems = [
    {
      name: t("navigation.settings"),
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background z-50 px-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-primary" />
        <span className="font-bold text-lg">FeedTune</span>
      </Link>

      {/* Mobil Menü Trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Menü</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex flex-col h-full">
            {/* Üst Kısım - Logo ve Kapat */}
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
                className="w-8 h-8 p-0"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Kapat</span>
              </Button>
            </div>

            <Separator />

            {/* Ana Menü */}
            <div className="flex-1 py-2 overflow-auto">
              <div className="px-3 space-y-1">
                {menuItems.map((item) => (
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

            {/* Alt Menü */}
            <div className="p-3 space-y-1">
              {bottomMenuItems.map((item) => (
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

              {/* Tema Değiştirme */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 py-2 rounded-md text-sm font-medium"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 mr-3" />
                ) : (
                  <Moon className="w-5 h-5 mr-3" />
                )}
                {theme === "dark"
                  ? t("navigation.lightMode")
                  : t("navigation.darkMode")}
              </Button>

              {/* Kullanıcı Bilgisi */}
              {user && (
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
                    {t("auth.signOut")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
