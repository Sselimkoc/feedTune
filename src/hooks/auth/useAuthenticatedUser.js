"use client";

import { useAuthStore } from "@/store/useAuthStore";

export function useAuthenticatedUser() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  return {
    userId: user?.id || null,
    isLoading,
    error,
  };
}
