"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Navigasyon için gerekli state ve fonksiyonları sağlayan hook
 * @returns {{
 *   isOpen: boolean,
 *   setIsOpen: Function,
 *   pathname: string,
 *   user: Object|null,
 *   handleSignOut: Function
 * }}
 */
export function useNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  // Sayfa değiştiğinde menüyü kapat
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Çıkış yap fonksiyonu
  const handleSignOut = async () => {
    await signOut();
  };

  return {
    isOpen,
    setIsOpen,
    pathname,
    user,
    handleSignOut,
  };
}
