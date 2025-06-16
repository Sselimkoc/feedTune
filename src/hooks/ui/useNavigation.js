"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Navigasyon için gerekli state ve fonksiyonları sağlayan hook
 * @returns {{
 *   items: Array,
 *   signOut: Function,
 *   isLoading: boolean
 * }}
 */
export function useNavigation() {
  const { t } = useTranslation();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const { toast } = useToast();
  const router = useRouter();

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
    (item) => !item.protected || (item.protected && userId)
  );

  return {
    items: filteredItems,
    signOut: handleSignOut,
    isLoading: isLoadingUser,
  };
}
