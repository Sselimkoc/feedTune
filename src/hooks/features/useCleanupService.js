import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/components/core/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

export function useCleanupService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState(null);

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

        const params = new URLSearchParams({
          olderThanDays: olderThanDays.toString(),
          keepFavorites: keepFavorites.toString(),
          keepReadLater: keepReadLater.toString(),
          dryRun: dryRun.toString(),
        });

        const response = await fetch(`/api/cleanup?${params}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Cleanup failed: ${response.statusText}`);
        }

        const result = await response.json();
        setLastCleanupResult(result);

        toast({
          title: t("common.success"),
          description: t("cleanup.success", {
            count: (result.details?.rssItems ?? 0) + (result.details?.youtubeItems ?? 0),
            action: dryRun ? t("cleanup.wouldDelete") : t("cleanup.deleted"),
          }),
        });

        return result;
      } catch (error) {
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

  const previewCleanup = useCallback(
    async (options = {}) => runCleanup({ ...options, dryRun: true }),
    [runCleanup]
  );

  const getLastCleanupResult = useCallback(() => lastCleanupResult, [lastCleanupResult]);

  const getCleanupStats = useCallback(async (olderThanDays = 30) => {
    const params = new URLSearchParams({ olderThanDays: olderThanDays.toString() });
    const response = await fetch(`/api/cleanup?${params}`);
    if (!response.ok) throw new Error(`Failed to get cleanup stats: ${response.statusText}`);
    const result = await response.json();
    return result.details;
  }, []);

  const canRunCleanup = useCallback(() => !!user, [user]);

  return {
    isLoading,
    lastCleanupResult,
    runCleanup,
    previewCleanup,
    getCleanupStats,
    getLastCleanupResult,
    canRunCleanup,
    user,
  };
}
