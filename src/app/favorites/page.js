import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function FavoritesPage() {
    return (
        <main className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">Favorites</h1>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search favorites..."
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Favori Kartları */}
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardTitle>Favorite Feed {i}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Last read: {new Date().toLocaleDateString()}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Source</span>
                                        <span className="font-medium">
                                            Tech Blog {i}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Category</span>
                                        <span className="font-medium">
                                            Technology
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Total Articles</span>
                                        <span className="font-medium">24</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
}
