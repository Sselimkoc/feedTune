"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Home, Library, Settings, Star, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    ...(user
      ? [
          { icon: Library, label: "My Feeds", href: "/feeds" },
          { icon: Star, label: "Favorites", href: "/favorites" },
          { icon: Settings, label: "Settings", href: "/settings" },
        ]
      : []),
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-card border-r p-4">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">FeedTune</h1>
            <p className="text-sm text-muted-foreground">
              Your RSS Feed Reader
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon
                    className={cn(
                      "mr-2 h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      isActive
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t">
          {user ? (
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          ) : (
            <Button variant="default" className="w-full" asChild>
              <Link href="/">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
