"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedStore } from "@/store/useFeedStore";
import {
  demoFeeds,
  demoRssItems,
  demoYoutubeItems,
  demoInteractions,
  demoStats,
  getDemoItemsWithInteractions,
  getDemoFavorites,
  getDemoReadLater,
} from "@/lib/demo/demoData";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";

const DEMO_MODE_KEY = "feedtune-demo-mode";
const DEMO_FEED_LIMIT = 2;

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoInteractionsState, setDemoInteractionsState] =
    useState(demoInteractions);
  const [demoFeedsState, setDemoFeedsState] = useState(
    demoFeeds.slice(0, DEMO_FEED_LIMIT)
  );
  const { user } = useAuthStore();
  const { setFeeds, setItems, setSelectedFeed, clearStore } = useFeedStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Initialize demo mode from localStorage
  useEffect(() => {
    const storedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
    if (storedDemoMode === "true" && !isAuthenticated) {
      setIsDemoMode(true);
      initializeDemoData();
    }
  }, [isAuthenticated]);

  // Initialize demo data
  const initializeDemoData = useCallback(() => {
    setFeeds(demoFeedsState);
    setItems(getDemoItemsWithInteractions());
  }, [setFeeds, setItems, demoFeedsState]);

  // Enter demo mode
  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    localStorage.setItem(DEMO_MODE_KEY, "true");
    initializeDemoData();

    toast({
      title: t("demo.modeEntered"),
      description: t("demo.modeEnteredDescription"),
    });
  }, [initializeDemoData, toast, t]);

  // Exit demo mode
  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_MODE_KEY);
    clearStore();

    toast({
      title: t("demo.modeExited"),
      description: t("demo.modeExitedDescription"),
    });
  }, [clearStore, toast, t]);

  // Toggle demo mode
  const toggleDemoMode = useCallback(() => {
    if (isDemoMode) {
      exitDemoMode();
    } else {
      enterDemoMode();
    }
  }, [isDemoMode, enterDemoMode, exitDemoMode]);

  // Add demo feed (limited to 2 feeds)
  const addDemoFeed = useCallback(
    (feedData) => {
      if (demoFeedsState.length >= DEMO_FEED_LIMIT) {
        toast({
          title: t("demo.feedLimitReached"),
          description: t("demo.feedLimitDescription"),
          variant: "destructive",
        });
        return false;
      }

      const newFeed = {
        ...feedData,
        id: `demo-feed-${Date.now()}`,
        user_id: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setDemoFeedsState((prev) => [...prev, newFeed]);
      setFeeds([...demoFeedsState, newFeed]);

      toast({
        title: t("demo.feedAdded"),
        description: t("demo.feedAddedDescription"),
      });

      return true;
    },
    [demoFeedsState, setFeeds, toast, t]
  );

  // Remove demo feed
  const removeDemoFeed = useCallback(
    (feedId) => {
      setDemoFeedsState((prev) => prev.filter((feed) => feed.id !== feedId));
      setFeeds(demoFeedsState.filter((feed) => feed.id !== feedId));

      toast({
        title: t("demo.feedRemoved"),
        description: t("demo.feedRemovedDescription"),
      });
    },
    [demoFeedsState, setFeeds, toast, t]
  );

  // Demo interaction handlers (limited functionality)
  const toggleDemoFavorite = useCallback(
    (itemId, itemType) => {
      if (!isDemoMode) return;

      toast({
        title: t("demo.featureNotAvailable"),
        description: t("demo.favoritesNotAvailable"),
        variant: "destructive",
      });
    },
    [isDemoMode, toast, t]
  );

  const toggleDemoReadLater = useCallback(
    (itemId, itemType) => {
      if (!isDemoMode) return;

      toast({
        title: t("demo.featureNotAvailable"),
        description: t("demo.readLaterNotAvailable"),
        variant: "destructive",
      });
    },
    [isDemoMode, toast, t]
  );

  const markDemoAsRead = useCallback(
    (itemId, itemType) => {
      if (!isDemoMode) return;

      setDemoInteractionsState((prev) => {
        const newState = { ...prev };
        const type = itemType === "youtube" ? "youtube" : "rss";

        const existingIndex = newState[type].findIndex(
          (i) => i.item_id === itemId
        );

        if (existingIndex >= 0) {
          // Update existing interaction
          newState[type][existingIndex] = {
            ...newState[type][existingIndex],
            is_read: true,
          };
        } else {
          // Add new interaction
          newState[type].push({
            item_id: itemId,
            user_id: "demo-user",
            is_favorite: false,
            is_read: true,
            is_read_later: false,
          });
        }

        return newState;
      });

      // Update items with new interaction state
      setItems(getDemoItemsWithInteractions());
    },
    [isDemoMode, setItems]
  );

  // Get demo data based on current interactions
  const getDemoData = useCallback(() => {
    if (!isDemoMode) return null;

    return {
      feeds: demoFeedsState,
      items: getDemoItemsWithInteractions(),
      favorites: [], // No favorites in demo mode
      readLater: [], // No read later in demo mode
      stats: {
        ...demoStats,
        totalFeeds: demoFeedsState.length,
        totalFavorites: 0,
        totalReadLater: 0,
      },
    };
  }, [isDemoMode, demoFeedsState, demoInteractionsState]);

  // Check if demo mode should be available
  const isDemoModeAvailable = !isAuthenticated;

  // Check if demo mode is at feed limit
  const isAtFeedLimit = demoFeedsState.length >= DEMO_FEED_LIMIT;

  return {
    // State
    isDemoMode,
    isDemoModeAvailable,
    isAuthenticated,
    isAtFeedLimit,
    demoFeedCount: demoFeedsState.length,
    demoFeedLimit: DEMO_FEED_LIMIT,

    // Actions
    enterDemoMode,
    exitDemoMode,
    toggleDemoMode,
    addDemoFeed,
    removeDemoFeed,

    // Demo interaction handlers (limited)
    toggleDemoFavorite,
    toggleDemoReadLater,
    markDemoAsRead,

    // Data
    getDemoData,

    // Demo data exports
    demoFeeds: demoFeedsState,
    demoRssItems,
    demoYoutubeItems,
    demoStats,
  };
}
