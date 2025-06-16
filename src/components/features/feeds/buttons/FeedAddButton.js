"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAddFeed } from "@/hooks/features/feed-screen/useAddFeed";
import { FeedDialogManager } from "@/components/features/feeds/dialogs/FeedDialogManager";

/**
 * Button component to add new feeds
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant
 * @param {string} props.size - Button size
 * @param {boolean} props.showText - Whether to show button text
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onFeedAdded - Callback when a feed is successfully added
 */
export function FeedAddButton({
  variant = "default",
  size = "default",
  showText = true,
  className = "",
  onFeedAdded = () => {},
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Handle dialog open/close
  const handleOpenChange = useCallback((open) => {
    setIsOpen(open);
  }, []);

  // Handle feed added success
  const handleSuccess = useCallback(() => {
    if (typeof onFeedAdded === 'function') {
      onFeedAdded();
    }
  }, [onFeedAdded]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        {showText && t("feeds.addFeed")}
      </Button>

      <FeedDialogManager
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    </>
  );
} 