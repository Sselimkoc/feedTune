"use client";
import { useFeedStore } from "@/store/feed-store";
import React from "react";
import FeedCards from "./FeedCards";

function ShowFeeds() {
    const feeds = useFeedStore((state) => state.feeds);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeds.length > 0 ? (
                feeds.map((feed) => <FeedCards key={feed.id} feed={feed} />)
            ) : (
                <p className="text-gray-500">No feeds added yet.</p>
            )}
        </div>
    );
}

export default ShowFeeds;
