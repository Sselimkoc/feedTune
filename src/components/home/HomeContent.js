"use client";

import { useState, useEffect } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Rss, Youtube, Bell, CheckCircle, Keyboard, Moon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function HomeContent({ initialSession }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState(initialSession?.user);

  // Update user state when authUser changes
  useEffect(() => {
    setUser(authUser || initialSession?.user);
  }, [authUser, initialSession?.user]);

  return (
    <div className="relative min-h-screen">
      <div className="container py-6 px-4 lg:py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-6 lg:space-y-8 mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            FeedTune ile İçeriklerinizi Yönetin
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground">
            RSS beslemeleri ve YouTube kanallarınızı tek bir yerde toplayın,
            organize edin ve takip edin. Favori içerik üreticilerinizi
            kaçırmayın!
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => setShowAuthModal(true)}>
                Giriş Yap
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowAuthModal(true)}
              >
                Hesap Oluştur
              </Button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <Rss className="h-12 w-12 text-primary mb-4" />
              <CardTitle>RSS Beslemeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Favori blog ve haber sitelerinizden en son içerikleri takip
                edin. RSS beslemelerini kolayca ekleyin ve yönetin.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <Youtube className="h-12 w-12 text-primary mb-4" />
              <CardTitle>YouTube Entegrasyonu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sevdiğiniz YouTube kanallarını takip edin. Yeni videoları anında
                görün ve kaçırmayın.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <Bell className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Otomatik Güncellemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                İçerikler otomatik olarak güncellenir. Siz sadece okumaya ve
                izlemeye odaklanın.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-8">
            Özellikler
          </h2>
          <div className="grid gap-4 lg:gap-6">
            <div className="flex items-start gap-4 hover:bg-accent/5 p-4 rounded-lg transition-colors">
              <div className="p-2 rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Kolay Organizasyon</h3>
                <p className="text-muted-foreground">
                  İçeriklerinizi kategorilere ayırın, favorilere ekleyin ve
                  okundu olarak işaretleyin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 hover:bg-accent/5 p-4 rounded-lg transition-colors">
              <div className="p-2 rounded-full bg-primary/10">
                <Keyboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Klavye Kısayolları</h3>
                <p className="text-muted-foreground">
                  Klavye kısayolları ile hızlıca gezinin ve içerikleri yönetin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 hover:bg-accent/5 p-4 rounded-lg transition-colors">
              <div className="p-2 rounded-full bg-primary/10">
                <Moon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Karanlık Mod</h3>
                <p className="text-muted-foreground">
                  Gözlerinizi yormayan karanlık mod ile gece de rahatça okuyun.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!user && (
          <div className="max-w-3xl mx-auto mt-12 lg:mt-16 text-center px-4">
            <Card className="p-6 lg:p-8 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl lg:text-2xl">
                  Hemen Başlayın
                </CardTitle>
                <CardDescription>
                  FeedTune&apos;u ücretsiz kullanmaya başlayın ve içeriklerinizi
                  tek bir yerden yönetin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" onClick={() => setShowAuthModal(true)}>
                  Hesap Oluştur
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
