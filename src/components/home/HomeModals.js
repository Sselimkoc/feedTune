"use client";

import { AuthModal } from "@/components/features/auth/AuthModal";
import { AddFeedDialog } from "@/components/features/feeds/AddFeedDialog";
import { DeleteFeedDialog } from "@/components/home/DeleteFeedDialog";

export function HomeModals({
  showAuthModal,
  setShowAuthModal,
  showAddFeedDialog,
  setShowAddFeedDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  onDeleteFeed,
  isDeleting,
  onFeedAdded,
}) {
  return (
    <>
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultTab="login"
      />

      <AddFeedDialog
        open={showAddFeedDialog}
        onOpenChange={setShowAddFeedDialog}
        onSuccess={() => {
          setShowAddFeedDialog(false);
          if (onFeedAdded) onFeedAdded();
        }}
      />

      <DeleteFeedDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={onDeleteFeed}
        isDeleting={isDeleting}
      />
    </>
  );
}
