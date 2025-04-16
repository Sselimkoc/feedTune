"use client";

import { memo, forwardRef } from "react";
import { ContentCard } from "@/components/shared/ContentCard";

export const FeedItem = memo(
  forwardRef(function FeedItem(props, ref) {
    return <ContentCard ref={ref} cardType="feed" {...props} />;
  })
);
