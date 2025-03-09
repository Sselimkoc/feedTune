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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Rss,
  Youtube,
  Bell,
  CheckCircle,
  Keyboard,
  Moon,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeeds } from "@/hooks/useFeeds";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { AddFeedDialog } from "@/components/feeds/AddFeedDialog";
import { formatTimeAgo } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomeContent({ initialSession }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState(initialSession?.user);
  const supabase = createClientComponentClient();
  const { feeds, items, isLoading, refetch, deleteFeed } = useFeeds();
  const [recentFeeds, setRecentFeeds] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalItems: 0,
    unreadItems: 0,
    favoriteItems: 0,
    readLaterItems: 0,
  });

  // Update user state when authUser changes
  useEffect(() => {
    setUser(authUser || initialSession?.user);
  }, [authUser, initialSession?.user]);

  // Kullanıcı giriş yaptığında feed verilerini yükle
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          // Son eklenen 5 feed'i al
          const { data: feedsData, error: feedsError } = await supabase
            .from("feeds")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(5);

          if (feedsError) throw feedsError;
          setRecentFeeds(feedsData || []);

          // Son eklenen 10 içeriği al
          const { data: itemsData, error: itemsError } = await supabase
            .from("feed_items")
            .select(
              `
              *,
              feeds:feed_id (
                id,
                title,
                site_favicon,
                type
              )
            `
            )
            .in("feed_id", feedsData?.map((feed) => feed.id) || [])
            .order("published_at", { ascending: false })
            .limit(10);

          if (itemsError) throw itemsError;
          setRecentItems(itemsData || []);

          // İstatistikleri hesapla (get_user_feed_stats fonksiyonu yerine)
          try {
            // 1. Toplam feed sayısı
            const { count: totalFeeds, error: feedCountError } = await supabase
              .from("feeds")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("is_active", true);

            if (feedCountError) throw feedCountError;

            // 2. Toplam içerik sayısı
            const { data: userFeeds, error: userFeedsError } = await supabase
              .from("feeds")
              .select("id")
              .eq("user_id", user.id)
              .eq("is_active", true);

            if (userFeedsError) throw userFeedsError;

            let totalItems = 0;
            if (userFeeds && userFeeds.length > 0) {
              const { count, error: itemCountError } = await supabase
                .from("feed_items")
                .select("*", { count: "exact", head: true })
                .in(
                  "feed_id",
                  userFeeds.map((feed) => feed.id)
                );

              if (itemCountError) throw itemCountError;
              totalItems = count || 0;
            }

            // 3. Okunmamış, favori ve okuma listesi sayıları
            const { data: interactions, error: interactionsError } =
              await supabase
                .from("user_item_interactions")
                .select("is_read, is_favorite, is_read_later")
                .eq("user_id", user.id);

            if (interactionsError) throw interactionsError;

            const unreadItems = interactions
              ? interactions.filter((i) => !i.is_read).length
              : 0;
            const favoriteItems = interactions
              ? interactions.filter((i) => i.is_favorite).length
              : 0;
            const readLaterItems = interactions
              ? interactions.filter((i) => i.is_read_later).length
              : 0;

            setStats({
              totalFeeds: totalFeeds || 0,
              totalItems: totalItems || 0,
              unreadItems: unreadItems || 0,
              favoriteItems: favoriteItems || 0,
              readLaterItems: readLaterItems || 0,
            });
          } catch (statsError) {
            console.error("Error calculating stats:", statsError);
            // İstatistik hesaplama hatası olsa bile diğer verileri göster
            setStats({
              totalFeeds: 0,
              totalItems: 0,
              unreadItems: 0,
              favoriteItems: 0,
              readLaterItems: 0,
            });
          }
        } catch (error) {
          console.error("Error loading data:", error);
          toast.error("Veriler yüklenirken bir hata oluştu");
        }
      };

      loadData();
    }
  }, [user, supabase]);

  const handleRemoveFeed = async (feedId) => {
    try {
      // Silme işlemi başladı
      setIsDeleting(true);

      // İlerleme bildirimi göster
      const toastId = toast.loading("Feed siliniyor...");

      // 1. Önce feed'e ait tüm öğeleri bul
      const { data: feedItems, error: itemsError } = await supabase
        .from("feed_items")
        .select("id")
        .eq("feed_id", feedId);

      if (itemsError) {
        console.error("Feed öğeleri alınırken hata:", itemsError);
        toast.error("Feed öğeleri alınırken hata oluştu", { id: toastId });
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      // 2. Kullanıcı etkileşimlerini sil (eğer öğeler varsa)
      if (feedItems && feedItems.length > 0) {
        const itemIds = feedItems.map((item) => item.id);

        const { error: interactionsError } = await supabase
          .from("user_item_interactions")
          .delete()
          .in("item_id", itemIds);

        if (interactionsError) {
          console.error(
            "Kullanıcı etkileşimleri silinirken hata:",
            interactionsError
          );
          toast.error("Kullanıcı etkileşimleri silinirken hata oluştu", {
            id: toastId,
          });
          setIsDeleting(false);
          setShowDeleteDialog(false);
          return;
        }
      }

      // 3. Feed öğelerini sil
      const { error: deleteItemsError } = await supabase
        .from("feed_items")
        .delete()
        .eq("feed_id", feedId);

      if (deleteItemsError) {
        console.error("Feed öğeleri silinirken hata:", deleteItemsError);
        toast.error("Feed öğeleri silinirken hata oluştu", { id: toastId });
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      // 4. Feed türüne özel tablodan sil (rss_feeds veya youtube_feeds)
      const { data: feedData, error: feedTypeError } = await supabase
        .from("feeds")
        .select("type")
        .eq("id", feedId)
        .single();

      if (!feedTypeError && feedData) {
        if (feedData.type === "rss") {
          const { error: rssError } = await supabase
            .from("rss_feeds")
            .delete()
            .eq("id", feedId);

          if (rssError) {
            console.error("RSS feed detayları silinirken hata:", rssError);
            // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
          }
        } else if (feedData.type === "youtube") {
          const { error: youtubeError } = await supabase
            .from("youtube_feeds")
            .delete()
            .eq("id", feedId);

          if (youtubeError) {
            console.error(
              "YouTube feed detayları silinirken hata:",
              youtubeError
            );
            // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
          }
        }
      }

      // 5. Feed kategori ilişkilerini sil
      const { error: categoryMappingError } = await supabase
        .from("feed_category_mappings")
        .delete()
        .eq("feed_id", feedId);

      if (categoryMappingError) {
        console.error(
          "Feed kategori ilişkileri silinirken hata:",
          categoryMappingError
        );
        // Bu hatayı kritik olarak değerlendirmiyoruz, devam ediyoruz
      }

      // 6. Son olarak ana feed'i sil
      const { error: deleteFeedError } = await supabase
        .from("feeds")
        .delete()
        .eq("id", feedId);

      if (deleteFeedError) {
        console.error("Feed silinirken hata:", deleteFeedError);
        toast.error("Feed silinirken hata oluştu", { id: toastId });
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      // Başarılı bildirim göster
      toast.success("Feed ve ilişkili tüm veriler başarıyla silindi", {
        id: toastId,
      });

      // Verileri yenile
      refetch();

      // Güncel feed listesini al
      const { data: updatedFeeds } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentFeeds(updatedFeeds || []);

      // İşlem tamamlandı, dialog'u kapat
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Feed silme işlemi sırasında hata:", error);
      toast.error("Feed silme işlemi başarısız oldu");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // RSS feed URL'sini web sitesi URL'sine dönüştürme
  const getRealWebsiteUrl = (feedUrl) => {
    try {
      // URL'yi analiz et
      let url;
      try {
        url = new URL(feedUrl);
      } catch (e) {
        // Geçerli bir URL değilse, https:// ekle ve tekrar dene
        try {
          url = new URL(`https://${feedUrl}`);
        } catch (e2) {
          // Hala geçerli değilse, orijinal URL'yi döndür
          return feedUrl;
        }
      }

      // RSS feed URL'lerini tespit etmek için yaygın desenler
      const isRssFeed =
        /\/(rss|feed|atom|xml)($|\/|\.)/i.test(url.pathname) ||
        /feeds?\./i.test(url.hostname);

      if (!isRssFeed) {
        // RSS feed URL'si değilse, orijinal URL'yi döndür
        return feedUrl;
      }

      // Ana domain'i çıkar
      let hostname = url.hostname;

      // "feeds." gibi RSS subdomain'lerini temizle
      hostname = hostname.replace(/^feeds?\./i, "www.");

      // Path'i temizle
      let path = url.pathname;

      // RSS ile ilgili path bölümlerini kaldır
      path = path.replace(/\/(rss|feed|atom|xml)($|\/|\.)[^\/]*/gi, "");

      // Sondaki slash'ı kaldır
      if (path.endsWith("/") && path !== "/") {
        path = path.slice(0, -1);
      }

      // Eğer path boş kaldıysa, kök dizini kullan
      if (!path) {
        path = "/";
      }

      // Temizlenmiş URL'yi oluştur
      return `${url.protocol}//${hostname}${path}`;
    } catch (error) {
      console.error("URL dönüştürme hatası:", error);
      return feedUrl; // Hata durumunda orijinal URL'yi döndür
    }
  };

  // Giriş yapmış kullanıcı için içerik
  const renderLoggedInContent = () => {
    return (
      <div className="space-y-8">
        {/* Özet İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-3xl font-bold">{stats.totalFeeds}</h3>
                <p className="text-sm text-muted-foreground">Toplam Feed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-3xl font-bold">{stats.totalItems}</h3>
                <p className="text-sm text-muted-foreground">Toplam İçerik</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-3xl font-bold">{stats.unreadItems}</h3>
                <p className="text-sm text-muted-foreground">Okunmamış</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-3xl font-bold">{stats.favoriteItems}</h3>
                <p className="text-sm text-muted-foreground">Favoriler</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h3 className="text-3xl font-bold">{stats.readLaterItems}</h3>
                <p className="text-sm text-muted-foreground">Okuma Listesi</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feed Yönetimi */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Feed Yönetimi</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (window.addFeedDialogTrigger) {
                      window.addFeedDialogTrigger.click();
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {stats.totalFeeds === 0
                    ? "İlk Feed&apos;inizi Ekleyin"
                    : "Feed Ekle"}
                </Button>
              </div>
            </div>
            <CardDescription>
              Son eklenen feed&apos;lerinizi görüntüleyin ve yönetin
            </CardDescription>
          </CardHeader>

          <CardContent>
            {recentFeeds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Henüz hiç feed eklemediniz
                </p>
                <Button
                  onClick={() => {
                    if (window.addFeedDialogTrigger) {
                      window.addFeedDialogTrigger.click();
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Feed&apos;inizi Ekleyin
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5"
                  >
                    <div className="flex items-center gap-3">
                      {feed.site_favicon ? (
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={feed.site_favicon}
                            alt={feed.title || ""}
                            width={32}
                            height={32}
                            style={{ width: "100%", height: "auto" }}
                            loading="eager"
                            unoptimized={true}
                            className={
                              feed.type === "youtube"
                                ? "rounded-full"
                                : "rounded-sm"
                            }
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {feed.title?.substring(0, 2).toUpperCase() || "FT"}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-sm">{feed.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {feed.type === "rss" ? "RSS Feed" : "YouTube Kanalı"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => {
                          setFeedToDelete(feed.id);
                          setShowDeleteDialog(true);
                        }}
                        title="Feedi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {recentFeeds.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <Button variant="outline" asChild>
                      <Link href="/feeds">Tüm Feed&apos;leri Görüntüle</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Son İçerikler */}
        {recentItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Son İçerikler</CardTitle>
              <CardDescription>
                Feed&apos;lerinizden en son eklenen içerikler
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/5"
                  >
                    {item.thumbnail ? (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.thumbnail}
                          alt={item.title || ""}
                          width={64}
                          height={64}
                          style={{ width: "100%", height: "auto" }}
                          loading="eager"
                          unoptimized={true}
                          className="object-cover rounded-md"
                        />
                      </div>
                    ) : item.feeds?.site_favicon ? (
                      <div className="relative w-16 h-16 flex-shrink-0 bg-muted flex items-center justify-center">
                        <Image
                          src={item.feeds.site_favicon}
                          alt={item.feeds?.title || ""}
                          width={32}
                          height={32}
                          style={{ width: "auto", height: "auto" }}
                          loading="eager"
                          unoptimized={true}
                          className="opacity-50"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {item.feeds?.title?.substring(0, 2).toUpperCase() ||
                            "FT"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.feeds?.title || "Bilinmeyen Kaynak"}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(item.published_at))}
                        </span>
                      </div>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs mt-1"
                        asChild
                      >
                        <Link
                          href={getRealWebsiteUrl(item.link)}
                          target="_blank"
                        >
                          Oku <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-center mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/feeds">Tüm İçerikleri Görüntüle</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Giriş yapmamış kullanıcı için içerik
  const renderLoggedOutContent = () => {
    return (
      <>
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
      </>
    );
  };

  return (
    <div className="relative min-h-screen">
      <div className="container py-6 px-4 lg:py-12">
        {user ? renderLoggedInContent() : renderLoggedOutContent()}
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Feed Ekleme Dialog */}
      <AddFeedDialog
        onSuccess={() => {
          refetch();
          // Güncel feed listesini al
          if (user) {
            supabase
              .from("feeds")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(5)
              .then(({ data }) => {
                setRecentFeeds(data || []);
              });
          }
        }}
      >
        {/* Trigger butonu gizli, çünkü diğer butonlar tarafından açılacak */}
        <Button
          id="addFeedDialogTrigger"
          className="hidden"
          ref={(el) => {
            // Bu referansı global olarak erişilebilir yap
            window.addFeedDialogTrigger = el;
          }}
        >
          Open Dialog
        </Button>
      </AddFeedDialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedi Sil</DialogTitle>
            <DialogDescription>
              Bu feed&apos;i silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveFeed(feedToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
