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
    <div className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 border-r bg-background z-40">
      {/* Top Logo Section */}
      <div className="p-4 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Rss className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl">FeedTune</span>
        </Link>
      </div>

      <Separator />

      {/* Main Menu */}
      <ScrollArea className="flex-1 py-2">
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
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Bottom Menu */}
      <div className="p-3 space-y-1">
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
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}

        {/* User Info */}
        {user && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center gap-3 px-3 py-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive px-3 py-2 rounded-md text-sm font-medium"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t("navigation.signOut")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
