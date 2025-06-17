"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

import {
  HomeIcon,
  BookmarkIcon,
  StarIcon,
  SettingsIcon,
  LogOutIcon,
  Rss,
  LogInIcon,
  UserPlusIcon,
} from "lucide-react";

export function SidebarNavigation() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const userId = user?.id;
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  console.log("SidebarNavigation - user:", user);

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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300",
                    "border border-transparent",
                    pathname === item.href
                      ? "bg-accent/10 border-accent text-foreground"
                      : "text-foreground hover:bg-accent/5 hover:border-accent/30"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex-1">
          {/* This div will push content to the bottom */}
        </div>
        <Separator className="my-4" />
        {/* User Info Section and Sign Out Button */}
        <div className="grid gap-4 px-5 pb-4">
          {userId ? (
            <>
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
                className="w-full justify-start gap-3"
                onClick={handleSignOutClick}
              >
                <LogOutIcon className="h-4 w-4" />
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" passHref>
                <Button
                  variant="default"
                  className="w-full justify-start gap-3"
                >
                  <LogInIcon className="h-4 w-4" />
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/auth/register" passHref>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  {t("nav.register")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
