import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
    return (
        <main className="p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Welcome 👋</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add RSS Feed</CardTitle>
                            <CardDescription>
                                Enter the RSS feed URL you want to follow
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="RSS feed URL"
                                className="mb-4"
                            />
                            <Button variant="default" className="w-full">
                                Add Feed
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Start</CardTitle>
                            <CardDescription>
                                Start with popular RSS feeds
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                            >
                                🌐 Tech News
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                            >
                                📚 Blog Posts
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start bg-transparent"
                            >
                                🎮 Gaming News
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                            <CardDescription>
                                Your feed tracking statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Total Feeds</span>
                                    <span className="font-bold">0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Unread</span>
                                    <span className="font-bold">0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Categories</span>
                                    <span className="font-bold">0</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full bg-transparent"
                            >
                                Detailed Statistics
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </main>
    );
}
