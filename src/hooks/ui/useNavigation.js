"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/use-toast";
import { useRouter, usePathname } from "next/navigation";

/**
 * Navigation hook that provides necessary state and functions
 * @returns {{
 *   user: Object,
 *   signOut: Function,
 *   isLoading: boolean,
 *   isOpen: boolean,
 *   setIsOpen: Function,
 *   pathname: string,
 *   setPathname: Function
 * }}
 */
export function useNavigation() {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  console.log("Navigation hook - User:", user); // Debug log

  const handleSignOut = useCallback(async () => {
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
  }, [router, signOut, toast, t]);

  const items = [
    {
      title: t("navigation.home"),
      href: "/",
      icon: "home",
      protected: false,
    },
    {
      title: t("navigation.feeds"),
      href: "/feeds",
      icon: "rss",
      protected: true,
    },
    {
      title: t("navigation.favorites"),
      href: "/favorites",
      icon: "star",
      protected: true,
    },
    {
      title: t("navigation.readLater"),
      href: "/read-later",
      icon: "bookmark",
      protected: true,
    },
    {
      title: t("navigation.settings"),
      href: "/settings",
      icon: "settings",
      protected: true,
    },
  ];

  const filteredItems = items.filter(
    (item) => !item.protected || (item.protected && user)
  );

  return {
    user,
    items: filteredItems,
    handleSignOut,
    isLoading: false,
    isOpen,
    setIsOpen,
    pathname,
  };
}
