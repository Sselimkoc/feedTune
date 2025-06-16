"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

/**
 * Button component to refresh feeds
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.showText - Whether to show button text
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onRefresh - Callback for refresh action
 * @param {boolean} props.isRefreshing - External refreshing state
 * @param {boolean} props.disabled - Whether the button is disabled
 */
export function FeedRefreshButton({
  variant = "outline",
  size = "default",
  showText = false,
  className = "",
  onRefresh = () => {},
  isRefreshing = false,
  disabled = false,
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle refresh click
  const handleRefresh = useCallback(async () => {
    if (isLoading || isRefreshing) return;

    setIsLoading(true);

    try {
      if (typeof onRefresh === "function") {
        await onRefresh();
      }

      // If onRefresh doesn't throw an error, show success
      toast({
        title: t("common.success"),
        description: t("feeds.refreshSuccess"),
      });
    } catch (error) {
      console.error("Feed refresh error:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("feeds.refreshError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh, isLoading, isRefreshing, t, toast]);

  const loading = isLoading || isRefreshing;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      className={cn("hover:bg-accent hover:text-accent-foreground", className)}
      disabled={loading || disabled}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}

      {showText && <span className="ml-2">{t("feeds.refresh")}</span>}
    </Button>
  );
}
