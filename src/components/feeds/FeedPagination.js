"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo } from "react";

export const FeedPagination = memo(function FeedPagination({
  currentPage,
  pageCount,
  onPageChange,
  onPreviousPage,
  onNextPage,
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPreviousPage}
        disabled={currentPage === 1}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </Button>
      <span className="text-sm text-muted-foreground">
        Sayfa {currentPage} / {pageCount}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage === pageCount}
        className="flex items-center gap-2"
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});
