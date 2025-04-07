"use client";

import { SidebarNavigation } from "@/components/features/navigation/SidebarNavigation";
import { MobileNavigation } from "@/components/features/navigation/MobileNavigation";

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobil Navigasyon */}
      <MobileNavigation />

      {/* Masaüstü Yan Menü */}
      <SidebarNavigation />

      {/* Ana İçerik */}
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
