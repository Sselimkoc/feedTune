"use client";

import { useState } from "react";
import { Button } from "@/components/core/ui/button";
import { AddFeedDialog } from "@/components/features/feed/dialogs/AddFeedDialog";

export default function TestPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddFeed = async (feedData) => {
    console.log("Feed added:", feedData);
    setIsDialogOpen(false);
  };

  const mockAddFeed = async (feedData) => {
    console.log("Mock addFeed called with:", feedData);
    return { success: true, feed: feedData };
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AddFeedDialog Test</h1>

        <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
          Open AddFeed Dialog
        </Button>

        <AddFeedDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddFeed}
          addFeed={mockAddFeed}
          isLoading={false}
        />
      </div>
    </div>
  );
}
