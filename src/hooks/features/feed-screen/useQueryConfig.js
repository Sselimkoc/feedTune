"use client";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes

const baseQueryConfig = {
  staleTime: STALE_TIME,
  gcTime: CACHE_TIME,
  retry: 1,
  retryDelay: 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
};

export const getFeedsQueryConfig = (userId, isAuthenticated) => ({
  queryKey: ["feeds", userId],
  enabled: !!userId && isAuthenticated,
  ...baseQueryConfig,
});

export const getItemsQueryConfig = (userId, isAuthenticated) => ({
  queryKey: ["items", userId],
  enabled: !!userId && isAuthenticated,
  ...baseQueryConfig,
});

export const getFavoritesQueryConfig = (userId, isAuthenticated) => ({
  queryKey: ["favorites", userId],
  enabled: !!userId && isAuthenticated,
  ...baseQueryConfig,
});

export const getReadLaterQueryConfig = (userId, isAuthenticated) => ({
  queryKey: ["read_later", userId],
  enabled: !!userId && isAuthenticated,
  ...baseQueryConfig,
});

export const queryConstants = {
  STALE_TIME,
  CACHE_TIME,
};
