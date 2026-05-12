"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/auth/useSession";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useFeedsSummary } from "@/hooks/features/useFeedsQuery";
import { useFeedService } from "@/hooks/features/useFeedService";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";
import { DashboardLoadingState } from "@/components/home/states/DashboardLoadingState";
import { DashboardWelcome } from "@/components/home/sections/DashboardWelcome";
import { DashboardFeeds } from "@/components/home/sections/DashboardFeeds";
import { DashboardActivity } from "@/components/home/sections/DashboardActivity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";

export default function DashboardContent() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);
  const { addFeedMutation, feedsQuery, itemsQuery, deleteFeed } =
    useFeedService();
  const { data: stats = {}, isLoading: isLoadingStats } = useFeedsSummary();
  const { t } = useTranslation();

  if (isLoading || isLoadingStats) return <DashboardLoadingState />;

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: ["feeds", user?.id],
        exact: true,
      }),
      queryClient.refetchQueries({
        queryKey: ["items", user?.id],
        exact: true,
      }),
      queryClient.refetchQueries({
        queryKey: ["feedsSummary", user?.id],
        exact: true,
      }),
    ]);
  };

  const handleConfirmDelete = () => {
    if (feedToDelete) {
      deleteFeed(feedToDelete);
      setFeedToDelete(null);
    }
  };

  return (
    <div className="relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "14s" }}
        />
        <div
          className="absolute top-2/3 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "18s" }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full px-4 pt-4 pb-8 max-w-6xl flex flex-col gap-4">
        <DashboardWelcome
          user={user}
          onAddFeed={() => setIsAddDialogOpen(true)}
          onRefresh={handleRefresh}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardFeeds
            feeds={feedsQuery.data || []}
            onAddFeed={() => setIsAddDialogOpen(true)}
            onViewAll={() => router.push("/feeds")}
            onDeleteFeed={(feedId) => setFeedToDelete(feedId)}
          />
          <DashboardActivity
            recentItems={itemsQuery.data?.slice(0, 6) || []}
            onViewAll={() => router.push("/feeds")}
          />
        </div>
      </div>

      <AddFeedDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        addFeedMutation={addFeedMutation}
      />

      <Dialog
        open={!!feedToDelete}
        onOpenChange={(open) => !open && setFeedToDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("home.dashboard.deleteConfirm.title", "Remove feed?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "home.dashboard.deleteConfirm.description",
                "This feed and its items will be removed from your list. This action cannot be undone.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedToDelete(null)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("common.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
