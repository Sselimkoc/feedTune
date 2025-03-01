"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

export function AdminPanel({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleMigrateLogos = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/migrate-logos");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Migration failed");
      }

      const data = await response.json();
      setResult(data);
      toast.success(`Migration completed. Updated ${data.updated} feeds.`);
    } catch (error) {
      console.error("Migration error:", error);
      toast.error(error.message || "Failed to migrate logos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              YouTube Feed Logos Migration
            </h3>
            <p className="text-sm text-muted-foreground">
              This operation will copy YouTube channel avatars from the
              youtube_feeds table to the site_favicon field in the feeds table.
            </p>
            <Button
              onClick={handleMigrateLogos}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Migrate YouTube Logos
                </>
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Migration Result:</h4>
                <p>Updated: {result.updated} feeds</p>
                <p>Errors: {result.errors}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
