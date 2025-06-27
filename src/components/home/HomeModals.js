"use client";

import { AuthModal } from "@/components/features/auth/AuthModal";
import { AddFeedDialog } from "../features/feed/dialogs/AddFeedDialog";
import { DeleteFeedDialog } from "../features/feed/dialogs/DeleteFeedDialog";

export function HomeModals({
  showAuthModal,
  setShowAuthModal,
  isDialogOpen,
  openAddFeedDialog,
  closeAddFeedDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  onDeleteFeed,
  isDeleting,
  onFeedAdded,
  feedToDelete,
}) {
  return (
    <>
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultTab="login"
      />

      <AddFeedDialog
        isOpen={isDialogOpen}
        onOpenChange={closeAddFeedDialog}
        onSuccess={onFeedAdded}
      />

      <DeleteFeedDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={() => {
          if (feedToDelete) {
            onDeleteFeed(feedToDelete);
          }
          setShowDeleteDialog(false);
        }}
        isDeleting={isDeleting}
      />
    </>
  );
}
