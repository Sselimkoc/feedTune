"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { SidebarNavigation } from "@/components/features/navigation/SidebarNavigation";
import { MobileNavigation } from "@/components/features/navigation/MobileNavigation";
import { HeaderNav } from "@/components/features/navigation/HeaderNav";
import { FullScreenLoader } from "@/components/core/states/LoadingState";
import { useAuthStore } from "@/store/useAuthStore";

export function AppLayout({ children }) {
  const pathname = usePathname();
  const { user, isLoading: isLoadingUser } = useAuth();
  const userId = user?.id;
  const { isLoggingOut } = useAuthStore();

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/register", "/auth/forgot-password"];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If route is public, don't show navigation
  if (isPublicRoute) {
    return <>{children}</>;
  }

  const showNav = !!userId && !isLoadingUser;

  return (
    <>
      {isLoggingOut && <FullScreenLoader text="Çıkış yapılıyor..." />}
      <div className="min-h-screen bg-background">
        {/* Header (existing) */}
        {showNav && (
          <div className="fixed top-0 left-0 right-0 z-30">
            <HeaderNav />
          </div>
        )}

        {/* Sidebar (desktop) */}
        {showNav && (
          <aside className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background/80 lg:backdrop-blur-xl">
            <SidebarNavigation />
          </aside>
        )}

        {/* Mobile Navigation (top) */}
        {showNav && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30">
            <MobileNavigation />
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            showNav ? "lg:pl-64 pt-16" : "pt-16"
          }`}
        >
          <div className="w-full px-0 py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
