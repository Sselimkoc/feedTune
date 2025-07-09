"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";
import { useFeedService } from "@/hooks/features/useFeedService";

export function useAddFeed(onSubmit) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addFeed: addFeedFromService, isAddingFeed } = useFeedService();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dialog handlers
  const openAddFeedDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeAddFeedDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Add feed handler
  const addFeed = useCallback(
    async (url, type, extraData = {}) => {
      try {
        await addFeedFromService({ url, type, ...extraData });

        // Call onSubmit callback if provided
        if (onSubmit && typeof onSubmit === "function") {
          onSubmit();
        }

        return true;
      } catch (error) {
        console.error("Error in addFeed:", error);
        return false;
      }
    },
    [addFeedFromService, onSubmit]
  );

  return {
    isDialogOpen,
    openAddFeedDialog,
    closeAddFeedDialog,
    isLoading: isAddingFeed,
    addFeed,
  };
}
