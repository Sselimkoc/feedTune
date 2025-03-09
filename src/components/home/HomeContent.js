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
  Loader2,
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
import { useLanguage } from "@/contexts/LanguageContext";

export function HomeContent({ initialSession }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState(initialSession?.user);
  const supabase = createClientComponentClient();
  const {
    feeds,
    items,
    isLoading: feedsLoading,
    refetch,
    deleteFeed,
  } = useFeeds();
  const [isLoading, setIsLoading] = useState(false);
  const [recentFeeds, setRecentFeeds] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalItems: 0,
    unreadItems: 0,
    favoriteItems: 0,
    readLaterItems: 0,
  });
  const { t } = useLanguage();
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);

  // Update user state when authUser changes
  useEffect(() => {
    setUser(authUser || initialSession?.user);
  }, [authUser, initialSession?.user]);

  // Kullanıcı giriş yaptığında feed verilerini yükle
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setIsLoading(true);
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
          toast.error(t("errors.general"));
        } finally {
          setIsLoading(false);
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
      const toastId = toast.loading(t("feeds.deleteFeed.deleting"));

      // 1. Önce feed'e ait tüm öğeleri bul
      const { data: feedItems, error: itemsError } = await supabase
        .from("feed_items")
        .select("id")
        .eq("feed_id", feedId);

      if (itemsError) {
        console.error("Feed öğeleri alınırken hata:", itemsError);
        toast.error(t("errors.general"), { id: toastId });
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
          toast.error(t("errors.general"), {
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
        toast.error(t("errors.general"), { id: toastId });
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
        toast.error(t("errors.general"), { id: toastId });
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      // Başarılı bildirim göster
      toast.success(t("feeds.deleteFeed.success"), {
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
      toast.error(t("feeds.deleteFeed.error"));
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
        {/* Stats */}
        <section className="py-8 lg:py-12">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xl text-center">
                    {stats.totalFeeds}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.stats.totalFeeds")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xl text-center">
                    {stats.totalItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.stats.totalItems")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xl text-center">
                    {stats.unreadItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.stats.unreadItems")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xl text-center">
                    {stats.favoriteItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.stats.favoriteItems")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xl text-center">
                    {stats.readLaterItems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.stats.readLaterItems")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feed Yönetimi */}
        <section className="py-8 lg:py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {t("home.feedManagement.title")}
                </h2>
                <p className="text-muted-foreground">
                  {t("home.feedManagement.description")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddFeedDialog(true)}
                >
                  {feeds.length === 0
                    ? t("home.feedManagement.addFirstFeed")
                    : t("home.feedManagement.addFeed")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex"
                  asChild
                >
                  <Link href="/feeds">
                    {t("home.feedManagement.viewAllFeeds")}
                  </Link>
                </Button>
              </div>
            </div>

            {recentFeeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentFeeds.map((feed) => (
                  <Card
                    key={feed.id}
                    className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                          {feed.logo ? (
                            <Image
                              src={feed.logo}
                              alt={feed.title}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                          ) : feed.type === "youtube" ? (
                            <Youtube className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          ) : (
                            <Rss className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base truncate">
                            {feed.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {feed.type === "youtube"
                              ? t("home.feedManagement.youtubeChannel")
                              : t("home.feedManagement.rssFeed")}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setFeedToDelete(feed.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {t("home.feedManagement.deleteFeed")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    {t("home.feedManagement.noFeeds")}
                  </p>
                  <Button onClick={() => setShowAddFeedDialog(true)}>
                    {t("home.feedManagement.addFirstFeed")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Son İçerikler */}
        <section className="py-8 lg:py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {t("home.recentContent.title")}
                </h2>
                <p className="text-muted-foreground">
                  {t("home.recentContent.description")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                asChild
              >
                <Link href="/feeds">
                  {t("home.recentContent.viewAllContent")}
                </Link>
              </Button>
            </div>

            {recentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm overflow-hidden"
                  >
                    {item.image && (
                      <div className="relative w-full h-40">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized={true}
                        />
                      </div>
                    )}
                    <CardHeader className={item.image ? "pt-3" : ""}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-primary/10">
                          {item.feed?.logo ? (
                            <Image
                              src={item.feed.logo}
                              alt={item.feed.title}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                          ) : item.feed?.type === "youtube" ? (
                            <Youtube className="h-4 w-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          ) : (
                            <Rss className="h-4 w-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.feed?.title ||
                            t("home.recentContent.unknownSource")}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.published_at)}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" asChild className="w-full">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t("home.recentContent.read")}
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    {t("home.feedManagement.noFeeds")}
                  </p>
                  <Button onClick={() => setShowAddFeedDialog(true)}>
                    {t("home.feedManagement.addFirstFeed")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
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
            {t("home.title")}
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground">
            {t("home.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => setShowAuthModal(true)}>
              {t("auth.login")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowAuthModal(true)}
            >
              {t("auth.register")}
            </Button>
          </div>
        </div>

        {/* Features */}
        <section className="py-12 lg:py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("home.features.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* RSS Feeds */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Rss className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t("home.features.rssFeeds.title")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.rssFeeds.desc")}
                  </p>
                </CardContent>
              </Card>

              {/* YouTube Integration */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Youtube className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t("home.features.youtube.title")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.youtube.desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Auto Updates */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>
                      {t("home.features.autoUpdates.title")}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.autoUpdates.desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Organization */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>
                      {t("home.features.organization.title")}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.organization.desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Keyboard className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t("home.features.keyboard.title")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.keyboard.desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Dark Mode */}
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Moon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{t("home.features.darkMode.title")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t("home.features.darkMode.desc")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 lg:py-16 bg-accent/10 rounded-xl">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">{t("home.getStarted")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("home.getStartedDesc")}
            </p>
            <Button size="lg" onClick={() => setShowAuthModal(true)}>
              {t("auth.register")}
            </Button>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="relative min-h-screen">
      <div className="container py-6 px-4 lg:py-12">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          renderLoggedInContent()
        ) : (
          renderLoggedOutContent()
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Add Feed Dialog Trigger (Hidden) */}
      <button
        id="add-feed-trigger"
        className="hidden"
        onClick={() => setShowAddFeedDialog(true)}
      />

      {/* Add Feed Dialog */}
      <AddFeedDialog
        open={showAddFeedDialog}
        onOpenChange={setShowAddFeedDialog}
        onSuccess={() => {
          setShowAddFeedDialog(false);
          refetch();
        }}
      />

      {/* Delete Feed Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("feeds.deleteFeed.title")}</DialogTitle>
            <DialogDescription>
              {t("feeds.deleteFeed.confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveFeed(feedToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.deleting")}
                </>
              ) : (
                t("common.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
