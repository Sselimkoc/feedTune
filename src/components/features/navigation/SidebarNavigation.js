"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

import {
  HomeIcon,
  BookmarkIcon,
  StarIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";

export function SidebarNavigation() {
  const { t } = useTranslation();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t("errors.signOutFailed"));
    }
  }, [router, toast, t]);

  const items = [
    {
      title: t("navigation.home"),
      href: "/",
      icon: HomeIcon,
    },
    {
      title: t("navigation.readLater"),
      href: "/read-later",
      icon: BookmarkIcon,
    },
    {
      title: t("navigation.favorites"),
      href: "/favorites",
      icon: StarIcon,
    },
    {
      title: t("navigation.settings"),
      href: "/settings",
      icon: SettingsIcon,
    },
  ];

  if (isLoadingUser) {
    return null;
  }

  return (
    <ScrollArea className="h-full py-6">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <nav className="grid gap-2 px-2">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent" : "transparent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4 px-5">
          {userId && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOutIcon className="h-4 w-4" />
              {t("auth.signOut")}
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
