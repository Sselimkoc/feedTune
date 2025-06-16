"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";
import { useToast } from "@/components/ui/use-toast";
import { feedService } from "@/services/feedService";

/**
 * Daha Sonra Oku ekranı için özelleştirilmiş hook
 * Bu hook, daha sonra okunacak içerikleri yönetmek için gerekli verileri ve fonksiyonları sağlar
 * @returns {Object} Daha sonra okunacak içeriklerle ilgili veriler ve fonksiyonlar
 */
export function useReadLaterScreen() {
  const { t } = useTranslation();
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!userId) {
      toast.error(t("errors.loginRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const data = await feedService.getReadLaterItems(userId);
      setItems(data);
    } catch (error) {
      console.error("Error fetching read later items:", error);
      toast.error(t("errors.fetchReadLaterFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, t]);

  const removeItem = useCallback(
    async (itemId) => {
      if (!userId) {
        toast.error(t("errors.loginRequired"));
        return;
      }

      try {
        await feedService.removeFromReadLater(itemId, userId);
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        toast.success(t("success.itemRemoved"));
      } catch (error) {
        console.error("Error removing item:", error);
        toast.error(t("errors.removeItemFailed"));
      }
    },
    [userId, toast, t]
  );

  return {
    items,
    isLoading: isLoading || isLoadingUser,
    fetchItems,
    removeItem,
  };
}
