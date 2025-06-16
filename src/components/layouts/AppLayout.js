"use client";

import { usePathname } from "next/navigation";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { SidebarNavigation } from "@/components/features/navigation/SidebarNavigation";
import { MobileNavigation } from "@/components/features/navigation/MobileNavigation";
import { HeaderNav } from "@/components/features/navigation/HeaderNav";

export function AppLayout({ children }) {
  const pathname = usePathname();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If route is public, don't show navigation
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Show navigation only when user is authenticated */}
      {!!userId && (
        <>
          {/* Mobile Navigation */}
          <MobileNavigation />

          {/* Desktop Sidebar */}
          <SidebarNavigation />
        </>
      )}

      {/* Show header when user is not authenticated */}
      {!userId && <HeaderNav />}

      {/* Main Content */}
      <main
        className={`flex-1 ${!!userId ? "lg:pl-64 pt-14 lg:pt-0" : "pt-16"}`}
      >
        {children}
      </main>
    </div>
  );
}
