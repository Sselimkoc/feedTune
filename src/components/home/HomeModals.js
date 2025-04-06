"use client";

import { AuthModal } from "@/components/features/auth/AuthModal";
import { AddFeedDialog } from "../features/feeds/dialogs/AddFeedDialog";
import { DeleteFeedDialog } from "../features/feeds/dialogs/DeleteFeedDialog";

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
