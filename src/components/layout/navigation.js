import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Home, Library, Settings, Star } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Library, label: "My Feeds", href: "/feeds" },
    { icon: Star, label: "Favorites", href: "/favorites" },
    { icon: Settings, label: "Settings", href: "/settings" },
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
          {menuItems.map((item) => (
            <Button
              key={item.href}
              variant="outline"
              className="w-full justify-start bg-transparent"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t">
          <Button variant="default" className="w-full">
            <Star className="mr-2 h-5 w-5" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </nav>
  );
}
