import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/core/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";

/**
 * Hook for managing cleanup operations
 * Provides functions to run cleanup jobs and get statistics
 */
export function useCleanupService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState(null);

  /**
   * Get cleanup statistics without performing cleanup
   */
  const getCleanupStats = useCallback(
    async (olderThanDays = 30) => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase.rpc("get_cleanup_stats", {
          older_than_days: olderThanDays,
        });

        if (error) throw error;

        return data;
      } catch (error) {
        console.error("Error getting cleanup stats:", error);
        toast({
          title: t("common.error"),
          description: t("cleanup.statsError"),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, t]
  );

  /**
   * Run cleanup job via API
   */
  const runCleanup = useCallback(
    async (options = {}) => {
      const {
        olderThanDays = 30,
        keepFavorites = true,
        keepReadLater = true,
        dryRun = false,
      } = options;

      try {
        setIsLoading(true);

        // Build query parameters
        const params = new URLSearchParams({
          olderThanDays: olderThanDays.toString(),
          keepFavorites: keepFavorites.toString(),
          keepReadLater: keepReadLater.toString(),
          dryRun: dryRun.toString(),
        });

        const response = await fetch(`/api/cron/cleanup?${params}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Note: In production, this would be called by a cron service with proper auth
            Authorization: `Bearer ${
              process.env.NEXT_PUBLIC_CRON_SECRET || "dev-secret"
            }`,
          },
        });

        if (!response.ok) {
          throw new Error(`Cleanup failed: ${response.statusText}`);
        }

        const result = await response.json();
        setLastCleanupResult(result);

        // Show success toast
        toast({
          title: t("common.success"),
          description: t("cleanup.success", {
            count: result.details?.rssItems + result.details?.youtubeItems || 0,
            action: dryRun ? t("cleanup.wouldDelete") : t("cleanup.deleted"),
          }),
        });

        return result;
      } catch (error) {
        console.error("Error running cleanup:", error);
        toast({
          title: t("common.error"),
          description: t("cleanup.error"),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, t]
  );

  /**
   * Run dry run cleanup (preview what would be deleted)
   */
  const previewCleanup = useCallback(
    async (options = {}) => {
      return runCleanup({ ...options, dryRun: true });
    },
    [runCleanup]
  );

  /**
   * Clean up orphaned interactions only
   */
  const cleanupOrphanedInteractions = useCallback(
    async (dryRun = false) => {
      try {
        setIsLoading(true);

        if (dryRun) {
          // Count orphaned interactions
          const [rssResult, youtubeResult] = await Promise.all([
            supabase.rpc("count_orphaned_rss_interactions"),
            supabase.rpc("count_orphaned_youtube_interactions"),
          ]);

          const total = (rssResult.data || 0) + (youtubeResult.data || 0);

          toast({
            title: t("common.info"),
            description: t("cleanup.orphanedPreview", { count: total }),
          });

          return {
            total,
            rss: rssResult.data || 0,
            youtube: youtubeResult.data || 0,
          };
        } else {
          // Actually clean up
          const [rssResult, youtubeResult] = await Promise.all([
            supabase.rpc("cleanup_orphaned_rss_interactions"),
            supabase.rpc("cleanup_orphaned_youtube_interactions"),
          ]);

          const total = (rssResult.data || 0) + (youtubeResult.data || 0);

          toast({
            title: t("common.success"),
            description: t("cleanup.orphanedSuccess", { count: total }),
          });

          return {
            total,
            rss: rssResult.data || 0,
            youtube: youtubeResult.data || 0,
          };
        }
      } catch (error) {
        console.error("Error cleaning orphaned interactions:", error);
        toast({
          title: t("common.error"),
          description: t("cleanup.orphanedError"),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, t]
  );

  /**
   * Get last cleanup result
   */
  const getLastCleanupResult = useCallback(() => {
    return lastCleanupResult;
  }, [lastCleanupResult]);

  /**
   * Check if user has admin privileges for cleanup operations
   */
  const canRunCleanup = useCallback(() => {
    // In a real app, you'd check user roles/permissions
    // For now, allow any authenticated user in development
    return (
      !!user &&
      (process.env.NODE_ENV === "development" || user.role === "admin")
    );
  }, [user]);

  return {
    // State
    isLoading,
    lastCleanupResult,

    // Functions
    getCleanupStats,
    runCleanup,
    previewCleanup,
    cleanupOrphanedInteractions,
    getLastCleanupResult,
    canRunCleanup,

    // User
    user,
  };
}
