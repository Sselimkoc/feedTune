"use client";

import { memo } from "react";
import { ContentCard } from "@/components/shared/ContentCard";

export const FavoriteItem = memo(function FavoriteItem(props) {
  return <ContentCard cardType="favorite" {...props} />;
});
