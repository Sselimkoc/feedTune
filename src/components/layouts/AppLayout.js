"use client";

import { SidebarNavigation } from "@/components/features/navigation/SidebarNavigation";
import { MobileNavigation } from "@/components/features/navigation/MobileNavigation";
import { useAuthStore } from "@/store/useAuthStore";
import { HeaderNav } from "@/components/features/navigation/HeaderNav";
import { usePathname } from "next/navigation";

export function AppLayout({ children }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  // Ana sayfa kontrolü
  const isHomePage = pathname === "/";

  // Navigasyon barını gösterme koşulları:
  // 1. Kullanıcı giriş yapmışsa her sayfada göster
  // 2. Kullanıcı giriş yapmamışsa ve ana sayfada değilse gösterme
  const showNavigation = !!user;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sadece navigasyon barı gösterildiğinde göster */}
      {showNavigation && (
        <>
          {/* Mobil Navigasyon */}
          <MobileNavigation />

          {/* Masaüstü Yan Menü */}
          <SidebarNavigation />
        </>
      )}

      {/* Kullanıcı giriş yapmamışsa üst bilgi (header) göster */}
      {!user && <HeaderNav />}

      {/* Ana İçerik */}
      <main
        className={`flex-1 ${
          showNavigation ? "lg:pl-64 pt-14 lg:pt-0" : "pt-16"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
