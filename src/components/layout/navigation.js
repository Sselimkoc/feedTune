"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Home,
  Library,
  Settings,
  Star,
  LogOut,
  Menu,
  X,
  Rss,
  BookmarkCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export function Navigation() {
  const pathname = usePathname();
  const { user, checkSession, signOut, setSession } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const session = await checkSession();
      if (session) {
        setSession(session);
      }
    };
    getUser();
    setMounted(true);
  }, [checkSession, setSession]);

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    ...(user
      ? [
          {
            icon: Library,
            label: "My Feeds",
            href: "/feeds",
          },
          { icon: Star, label: "Favorites", href: "/favorites" },
          { icon: BookmarkCheck, label: "Okuma Listem", href: "/read-later" },
          { icon: Settings, label: "Settings", href: "/settings" },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed top-4 right-4 z-50 lg:hidden",
          "h-9 px-2.5 transition-all duration-300",
          "bg-background/80 hover:bg-background",
          "border border-input",
          "backdrop-blur-sm"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <div className="relative w-5 h-5">
          <span
            className={cn(
              "absolute block h-0.5 w-5 bg-foreground transition-all duration-300",
              isOpen ? "top-2.5 rotate-45" : "top-1"
            )}
          />
          <span
            className={cn(
              "absolute block h-0.5 w-5 bg-foreground transition-all duration-300",
              "top-2.5",
              isOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "absolute block h-0.5 w-5 bg-foreground transition-all duration-300",
              isOpen ? "top-2.5 -rotate-45" : "top-4"
            )}
          />
        </div>
      </Button>

      <nav
        className={cn(
          "fixed lg:fixed lg:left-0 lg:top-0 h-full w-64 border-r p-4 z-40",
          "bg-background/95 backdrop-blur-md shadow-lg",
          "transition-all duration-300 ease-in-out",
          "transform lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-2 text-primary-foreground">
                <Rss className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">FeedTune</h1>
                <p className="text-xs text-muted-foreground">
                  RSS Besleme Okuyucunuz
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 px-3",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  asChild
                  onMouseEnter={item.onMouseEnter}
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label === "Home"
                        ? "Ana Sayfa"
                        : item.label === "My Feeds"
                        ? "Beslemelerim"
                        : item.label === "Favorites"
                        ? "Favoriler"
                        : item.label === "Settings"
                        ? "Ayarlar"
                        : item.label}
                    </span>

                    {/* Notification indicator example */}
                    {item.label === "My Feeds" && mounted && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-medium text-primary">
                        3
                      </span>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t">
            {user && (
              <div className="mb-4 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Ücretsiz Plan
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user ? (
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </Button>
            ) : (
              <Button variant="default" className="w-full" asChild>
                <Link href="/">Giriş Yap</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden",
          "transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
    </>
  );
}
