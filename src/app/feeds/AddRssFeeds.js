"use client";
import { useState } from "react";
import { useFeedStore } from "@/store/feed-store";

export default function AddRssFeed() {
    const [url, setUrl] = useState("");
    const [feedData, setFeedData] = useState(null);
    const feedStore = useFeedStore();

    const handleAddFeed = async () => {
        try {
            const response = await fetch(
                `https://api.rss2json.com/v1/api.json?rss_url=${url}`
            );
            const data = await response.json();
            if (data && data.items) {
                // Veriyi formatla
                const formattedData = {
                    title: data.feed.title,
                    link: data.feed.link,
                    description: data.feed.description,
                    items: data.items.map((item) => ({
                        title: item.title,
                        link: item.link,
                        description: item.description,
                    })),
                };
                setFeedData(formattedData);
                feedStore.addFeed(formattedData); // Formatlanmış veriyi feedStore'a ekle
                setUrl(""); // Input alanını temizle
            }
        } catch (error) {
            console.error("Error fetching or processing feed data", error);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter RSS feed URL"
            />
            <button onClick={handleAddFeed}>Add</button>
        </div>
    );
}
