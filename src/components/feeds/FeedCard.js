"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FeedItem } from "./FeedItem";
import { FeedPagination } from "./FeedPagination";

export function FeedCard({
  feed,
  index,
  isFocused,
  focusedFeedIndex,
  focusedItemIndex,
  currentPages,
  itemsPerPage,
  getItemsForPage,
  getTotalPages,
  prevPage,
  nextPage,
  toggleItemRead,
  toggleItemFavorite,
  deleteFeed,
  setFocusedFeedIndex,
  focusedItemRef,
  position = "other",
}) {
  if (!feed) return null;

  const items = feed.items || [];
  const currentPage = currentPages[feed.id] || 0;
  const totalPages = getTotalPages(items);
  const currentItems = getItemsForPage(items, feed.id);

  return (
    <div className="w-full transition-all duration-500">
      <Card
        tabIndex={0}
        className={cn(
          "outline-none transition-all duration-500",
          isFocused
            ? "ring-2 ring-primary ring-offset-4 shadow-xl bg-card"
            : position === "top" || position === "bottom"
            ? "bg-card/95 hover:bg-card shadow-lg"
            : "bg-card/90 hover:bg-card/95 shadow-md"
        )}
        onClick={() => setFocusedFeedIndex(index)}
      >
        <CardHeader className="flex flex-col space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {feed.type === "youtube" && feed.channel_avatar && (
                <Image
                  src={feed.channel_avatar}
                  alt={feed.title}
                  width={40}
                  height={40}
                  className="rounded-full"
                  priority
                  placeholder="empty"
                />
              )}
              {feed.type === "rss" && feed.site_favicon && (
                <Image
                  src={feed.site_favicon}
                  alt={feed.title}
                  width={24}
                  height={24}
                  className="rounded"
                  placeholder="empty"
                />
              )}
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold truncate">
                  {feed.title}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  ({items.length} items)
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteFeed(feed.id);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {feed.description}
          </p>
          <div className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
              {currentItems.map((item, itemIndex) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  feed={feed}
                  isActive={
                    focusedFeedIndex === index && focusedItemIndex === itemIndex
                  }
                  itemRef={
                    focusedFeedIndex === index &&
                    focusedItemIndex === itemIndex &&
                    focusedItemRef
                      ? focusedItemRef
                      : null
                  }
                  toggleItemRead={toggleItemRead}
                  toggleItemFavorite={toggleItemFavorite}
                />
              ))}
            </div>

            {/* Feed Card Pagination Controls */}
            <FeedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              prevPage={prevPage}
              nextPage={nextPage}
              feedId={feed.id}
              items={items}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
