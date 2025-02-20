"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeedCards({ feed }) {
    const [showItems, setShowItems] = useState(false);

    return (
        <Card className="cursor-pointer">
            <CardHeader onClick={() => setShowItems((prev) => !prev)}>
                <CardTitle className="flex items-center justify-between">
                    <span>{feed.title}</span>
                    <Button variant="ghost" size="icon">
                        <span className="sr-only">Toggle Items</span>{" "}
                        {showItems ? "🔼" : "🔽"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {feed.description}
                </p>
                <a
                    href={feed.link}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Visit Website
                </a>
                <p className="text-xs text-gray-500 mt-2">
                    Last Updated: {new Date().toLocaleDateString()}
                </p>

                {showItems && (
                    <div className="mt-4 space-y-4">
                        {feed.items.map((item) => (
                            <div key={item.guid} className="p-4 border rounded">
                                <h3 className="font-semibold">{item.title}</h3>
                                {/* <p className="text-sm">{item.description}</p> */}
                                <p className="text-xs text-gray-500">
                                    {item.pubDate}
                                </p>
                                <a
                                    href={item.link}
                                    className="text-blue-500 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Read more
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
