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
  LogOut,
  User,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SidebarNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuthStore();

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
      protected: true, // Ayarlar sayfasını da koruma altına aldık
    },
  ];

  const activeMenuItems = [...publicMenuItems];
  if (user) {
    activeMenuItems.push(...protectedMenuItems);
  }

  return (
    <div className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 border-r border-border/40 bg-white dark:bg-background shadow-sm shadow-border/5 z-40">
      {/* Top Logo Section */}
      <div className="p-5 flex items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Rss className="w-5 h-5 text-primary" />
            <div className="absolute -inset-0.5 bg-primary/5 blur-sm rounded-lg -z-10"></div>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            FeedTune
          </span>
        </Link>
      </div>

      <Separator className="bg-border/30" />

      {/* Main Menu */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1.5">
          {activeMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span
                className={
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </div>
      </ScrollArea>

      <Separator className="bg-border/30" />

      {/* Bottom Menu */}
      <div className="p-3 space-y-1.5">
        {bottomMenuItems.map((item) => {
          if (item.protected && !user) {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span
                className={
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}

        {/* User Info */}
        {user && (
          <>
            <Separator className="my-3 bg-border/30" />
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/30 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              {t("navigation.signOut")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
