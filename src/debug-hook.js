"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { FeedRepository } from "@/repositories/feedRepository";
import { feedService } from "@/services/feedService";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Debug verisi toplamak ve test etmek için hook
 * Bu hook'u herhangi bir bileşene ekleyerek debug verisi toplayabilir ve
 * consol'da inceleyebilirsiniz
 */
export function useDebugTools() {
  const { user } = useAuthStore();
  const [results, setResults] = useState({
    repository: null,
    service: null,
    direct: null,
    loading: false,
    error: null,
  });

  // Repository örneği oluştur
  const feedRepository = new FeedRepository();

  // Repository katmanıyla test
  const testRepository = useCallback(async () => {
    if (!user?.id) return;

    try {
      setResults((prev) => ({ ...prev, loading: true, error: null }));

      // Beslemeleri getir
      const feeds = await feedRepository.getFeeds(user.id);

      if (!feeds || feeds.length === 0) {
        setResults((prev) => ({
          ...prev,
          repository: { feeds: [], message: "Hiç feed bulunamadı" },
          loading: false,
        }));
        return;
      }

      // Feed ID'lerini ayır
      const feedIds = feeds.map((feed) => feed.id);

      // İçerikleri getir
      const items = await feedRepository.getFeedItems(
        feedIds,
        10,
        null,
        user.id
      );

      setResults((prev) => ({
        ...prev,
        repository: {
          feeds,
          items,
          feedCount: feeds.length,
          itemCount: items.length,
          message: `${feeds.length} feed, ${items.length} içerik bulundu`,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Repository testi hatası:", error);
      setResults((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [user?.id, feedRepository]);

  // Servis katmanıyla test
  const testService = useCallback(async () => {
    if (!user?.id) return;

    try {
      setResults((prev) => ({ ...prev, loading: true, error: null }));

      // Beslemeleri getir
      const feeds = await feedService.getFeeds(user.id);

      if (!feeds || feeds.length === 0) {
        setResults((prev) => ({
          ...prev,
          service: { feeds: [], message: "Hiç feed bulunamadı" },
          loading: false,
        }));
        return;
      }

      // Feed ID'lerini ayır
      const feedIds = feeds.map((feed) => feed.id);

      // İçerikleri getir
      const items = await feedService.getFeedItems(feedIds, 10, user.id);

      setResults((prev) => ({
        ...prev,
        service: {
          feeds,
          items,
          feedCount: feeds.length,
          itemCount: items.length,
          message: `${feeds.length} feed, ${items.length} içerik bulundu`,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Servis testi hatası:", error);
      setResults((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [user?.id]);

  // Doğrudan Supabase ile test
  const testDirect = useCallback(async () => {
    if (!user?.id) return;

    try {
      setResults((prev) => ({ ...prev, loading: true, error: null }));
      const supabase = createClientComponentClient();

      // Beslemeleri getir
      const { data: feeds, error: feedError } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (feedError) throw feedError;

      if (!feeds || feeds.length === 0) {
        setResults((prev) => ({
          ...prev,
          direct: { feeds: [], message: "Hiç feed bulunamadı" },
          loading: false,
        }));
        return;
      }

      // Feed ID'lerini ayır
      const feedIds = feeds.map((feed) => feed.id);
      const rssFeeds = feeds
        .filter((f) => f.type === "rss" || f.type === "atom")
        .map((f) => f.id);
      const youtubeFeeds = feeds
        .filter((f) => f.type === "youtube")
        .map((f) => f.id);

      // İçerikleri getir
      const [rssResult, youtubeResult] = await Promise.all([
        rssFeeds.length
          ? supabase
              .from("rss_items")
              .select("*")
              .in("feed_id", rssFeeds)
              .order("published_at", { ascending: false })
              .limit(20)
          : { data: [] },

        youtubeFeeds.length
          ? supabase
              .from("youtube_items")
              .select("*")
              .in("feed_id", youtubeFeeds)
              .order("published_at", { ascending: false })
              .limit(20)
          : { data: [] },
      ]);

      const items = [
        ...(rssResult.data || []).map((i) => ({ ...i, itemType: "rss" })),
        ...(youtubeResult.data || []).map((i) => ({
          ...i,
          itemType: "youtube",
        })),
      ];

      setResults((prev) => ({
        ...prev,
        direct: {
          feeds,
          items,
          rssItems: rssResult.data || [],
          youtubeItems: youtubeResult.data || [],
          feedCount: feeds.length,
          itemCount: items.length,
          message: `${feeds.length} feed, ${items.length} içerik bulundu (${
            rssResult.data?.length || 0
          } RSS, ${youtubeResult.data?.length || 0} YouTube)`,
        },
        loading: false,
      }));
    } catch (error) {
      console.error("Doğrudan sorgu hatası:", error);
      setResults((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [user?.id]);

  // Global debug arayüzünü oluştur
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.debugTools = {
        testRepository,
        testService,
        testDirect,
        getResults: () => results,
      };

      console.log(
        "Debug araçları aktif! Konsol'da 'debugTools' objesi ile erişebilirsiniz"
      );
      console.log(
        "Örnek: debugTools.testRepository(), debugTools.testService() veya debugTools.testDirect()"
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.debugTools;
      }
    };
  }, [testRepository, testService, testDirect, results]);

  return {
    results,
    testRepository,
    testService,
    testDirect,
    isLoading: results.loading,
    error: results.error,
    user,
  };
}
