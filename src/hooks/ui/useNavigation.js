"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const supabase = createClientComponentClient();

  // Sayfa değiştiğinde menüyü kapat
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Çıkış yapma işlemi
  const handleSignOut = async () => {
    await signOut();
    await supabase.auth.signOut();
  };

  return {
    isOpen,
    setIsOpen,
    pathname,
    user,
    handleSignOut,
  };
}
