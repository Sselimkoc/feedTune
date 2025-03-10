"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/features/theme/themeToggle";
import {
  Home,
  Library,
  Settings,
  Star,
  LogOut,
  Menu,
  X,
  Rss,
  BookmarkCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigation } from "@/hooks/ui/useNavigation";

// Navigasyon öğeleri
const navigationItems = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/feeds", icon: Rss, labelKey: "nav.feeds" },
  { href: "/favorites", icon: Star, labelKey: "nav.favorites" },
  { href: "/read-later", icon: BookmarkCheck, labelKey: "nav.readLater" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
];

// Giriş yapmamış kullanıcı için öğeler
const authItems = [
  { icon: LogIn, labelKey: "nav.login", href: "/auth/login" },
  { icon: UserPlus, labelKey: "nav.register", href: "/auth/register" },
];

function NavigationComponent() {
  const { isOpen, setIsOpen, pathname, user, handleSignOut } = useNavigation();
  const { t } = useLanguage();

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 hidden w-72 border-r bg-card/50 backdrop-blur-xl md:block">
      <div className="flex h-full flex-col">
        {/* Logo ve Tema */}
        <div className="flex h-24 flex-col border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Rss className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                FeedTune
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("navigation.tagline")}
          </p>
        </div>

        {/* Ana Menü */}
        <div className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigationItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start space-x-3",
                pathname === item.href && "font-medium"
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Alt Menü */}
        <div className="border-t p-4">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-2">
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
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>{t("nav.logout")}</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {authItems.map((item) => (
                <Button
                  key={item.href}
                  variant={
                    item.labelKey === "nav.login" ? "default" : "outline"
                  }
                  className="w-full justify-start space-x-3"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobil Menü */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-24 flex-col border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center space-x-3"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Rss className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold tracking-tight">
                    FeedTune
                  </span>
                </Link>
                <ThemeToggle />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("navigation.tagline")}
              </p>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {navigationItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start space-x-3",
                    pathname === item.href && "font-medium"
                  )}
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </Button>
              ))}
            </div>

            <div className="border-t p-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-2">
                    <Avatar className="h-9 w-9 border-2 border-primary/10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.account.freePlan")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start space-x-3 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {authItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={
                        item.labelKey === "nav.login" ? "default" : "outline"
                      }
                      className="w-full justify-start space-x-3"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

// Performans optimizasyonu için memo kullanıyoruz
export const Navigation = memo(NavigationComponent);
