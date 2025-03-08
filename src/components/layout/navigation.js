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
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, setUser, setSession } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();

  // Sayfa yüklendiğinde ve her yenilendiğinde oturum durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Supabase'den güncel oturum bilgisini al
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Oturum varsa, kullanıcı bilgilerini güncelle
          setSession(session);
          setUser(session.user);
        } else if (user) {
          // Oturum yoksa ama state'de kullanıcı varsa, state'i temizle
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setMounted(true);
      }
    };

    checkAuthStatus();

    // auth-state-change olayını dinle
    const handleAuthStateChange = (event) => {
      const { session } = event.detail;
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
      }
    };

    window.addEventListener("auth-state-change", handleAuthStateChange);

    return () => {
      window.removeEventListener("auth-state-change", handleAuthStateChange);
    };
  }, [supabase.auth, setUser, setSession, user]);

  const menuItems = [
    { icon: Home, label: "Ana Sayfa", href: "/" },
    ...(user
      ? [
          {
            icon: Library,
            label: "Beslemelerim",
            href: "/feeds",
          },
          { icon: Star, label: "Favoriler", href: "/favorites" },
          { icon: BookmarkCheck, label: "Okuma Listem", href: "/read-later" },
          { icon: Settings, label: "Ayarlar", href: "/settings" },
        ]
      : []),
  ];

  // Sayfa yüklenene kadar hiçbir şey gösterme
  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden glass"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <nav
        className={cn(
          "fixed lg:fixed lg:left-0 lg:top-0 h-full w-64 glass border-r p-4 z-40 transition-all duration-300 ease-in-out",
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
                  Your RSS Feed Reader
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
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary"
                  )}
                  asChild
                  onMouseEnter={item.onMouseEnter}
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4",
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

                    {/* Notification indicator example */}
                    {item.label === "Beslemelerim" && mounted && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
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
              <div className="mb-4 p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                </div>
              </div>
            )}

            {user ? (
              <Button variant="outline" className="w-full" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
