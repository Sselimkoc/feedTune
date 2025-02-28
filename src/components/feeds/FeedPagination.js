"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeedPagination({
  currentPage,
  totalPages,
  prevPage,
  nextPage,
  feedId,
  items,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          prevPage(feedId);
        }}
        disabled={currentPage === 0}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          nextPage(feedId, items);
        }}
        disabled={currentPage === totalPages - 1}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
