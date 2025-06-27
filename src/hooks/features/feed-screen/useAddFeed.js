"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/core/ui/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

export function useAddFeed(onSubmit) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async ({ url, type, extraData = {} }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const feedData = {
        user_id: user.id,
        url,
        type,
        title: extraData.title || "",
        category: extraData.category || "general",
        fetch_full_content: extraData.fetch_full_content || false,
      };

      const { data, error } = await supabase
        .from("feeds")
        .insert([feedData])
        .select()
        .single();

      if (error) {
        console.error("Error adding feed:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: t("feeds.addFeed.success"),
        description: t("feeds.addFeed.successDescription", {
          title: data.title,
        }),
      });

      // Invalidate and refetch feeds
      queryClient.invalidateQueries(["feeds", user?.id]);
      queryClient.invalidateQueries(["items", user?.id]);

      // Call onSubmit callback if provided
      if (onSubmit && typeof onSubmit === "function") {
        onSubmit();
      }
    },
    onError: (error) => {
      console.error("Error adding feed:", error);
      toast({
        title: t("feeds.addFeed.error"),
        description: error.message || t("feeds.addFeed.errorDescription"),
        variant: "destructive",
      });
    },
  });

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
        await addFeedMutation.mutateAsync({ url, type, extraData });
        return true;
      } catch (error) {
        console.error("Error in addFeed:", error);
        return false;
      }
    },
    [addFeedMutation]
  );

  return {
    isDialogOpen,
    openAddFeedDialog,
    closeAddFeedDialog,
    isLoading: addFeedMutation.isPending,
    addFeed,
  };
}
