"use client";

import { useFeedStore } from "@/store/feed-store";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function FilterFeeds() {
  const [query, setQuery] = useState("");
  const { setSearchQuery } = useFeedStore();

  return (
    <div className="relative w-64">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSearchQuery(e.target.value);
        }}
        placeholder="Search feeds..."
        className="pl-8"
      />
    </div>
  );
}
