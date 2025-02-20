import { useFeedStore } from "@/store/feed-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FilterFeeds from "./FilterFeeds";
import FeedCards from "./FeedCards";
import AddRssFeed from "./AddRssFeeds";
import ShowFeeds from "./ShowFeeds";

export default function FeedsPage() {
    return (
        <main className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">My Feeds</h1>
                    <div className="flex gap-4">
                        <FilterFeeds />
                        <AddRssFeed />
                    </div>
                </div>
                <ShowFeeds />
            </div>
        </main>
    );
}
