"use client";

import { useState } from "react";

export function useHomeModals() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddFeedDialog, setShowAddFeedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState(null);

  return {
    showAuthModal,
    setShowAuthModal,
    showAddFeedDialog,
    setShowAddFeedDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    feedToDelete,
    setFeedToDelete,
  };
}
