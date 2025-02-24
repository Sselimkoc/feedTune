import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useFeeds() {
  const queryClient = useQueryClient();

  // Fetch all feeds
  const {
    data: feeds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feeds")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Add new feed
  const addFeedMutation = useMutation({
    mutationFn: async (feed) => {
      const { data, error } = await supabase
        .from("feeds")
        .insert([feed])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  // Delete feed
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId) => {
      const { error } = await supabase.from("feeds").delete().eq("id", feedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  // Update feed
  const updateFeedMutation = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from("feeds")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  return {
    feeds,
    isLoading,
    error,
    addFeed: addFeedMutation.mutate,
    deleteFeed: deleteFeedMutation.mutate,
    updateFeed: updateFeedMutation.mutate,
    isAddingFeed: addFeedMutation.isPending,
    isDeletingFeed: deleteFeedMutation.isPending,
    isUpdatingFeed: updateFeedMutation.isPending,
  };
}
