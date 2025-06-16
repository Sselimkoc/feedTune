"use client";

import { useState, useEffect } from "react";
import { feedService } from "@/services/feedService";
import { FeedRepository } from "@/repositories/feedRepository";
import { useAuthenticatedUser } from "@/hooks/auth/useAuthenticatedUser";

/**
 * Debug Test Page
 * This page is used to test the newly configured repository and service modules.
 */
export default function DebugTestPage() {
  const [logs, setLogs] = useState([]);
  const [testRunning, setTestRunning] = useState(false);
  const { userId, isLoading: isLoadingUser } = useAuthenticatedUser();
  const feedRepository = new FeedRepository();

  useEffect(() => {
    if (userId) {
      log(`User session found: ${userId.slice(0, 8)}...`);
    }
  }, [userId]);

  const log = (message, type = "info") => {
    setLogs((prev) => [...prev, { message, type, time: new Date() }]);
  };

  const runBasicTests = async () => {
    if (!userId) {
      log("User session required. Please log in.", "error");
      return;
    }

    setTestRunning(true);
    log("🔍 Starting test...");

    try {
      // 1. FeedRepository test
      log("1. Starting FeedRepository test...");
      const feeds = await feedRepository.getFeeds(userId);
      log(`✅ Found ${feeds.length} feeds`);

      if (feeds.length > 0) {
        // 2. Get feed contents
        log("2. Getting feed contents...");
        const feedIds = feeds.map((feed) => feed.id);
        const items = await feedRepository.getFeedItems(
          feedIds,
          5,
          null,
          userId
        );
        log(
          `✅ Feed contents successfully retrieved: ${JSON.stringify(
            items,
            null,
            2
          ).slice(0, 100)}...`
        );

        // 3. FeedService test
        log("3. Starting FeedService test...");
        const serviceFeeds = await feedService.getFeeds(userId);
        log(`✅ Found ${serviceFeeds.length} feeds through FeedService`);

        const serviceItems = await feedService.getFeedItems(feedIds, 5, userId);
        log(`✅ Feed contents successfully retrieved through FeedService`);
      }

      log("🎉 All tests completed successfully!");
    } catch (error) {
      log(`❌ Error during test: ${error.message}`, "error");
      console.error("Test error:", error);
    } finally {
      setTestRunning(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Test Page</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">User Status</h2>
        {userId ? (
          <p className="text-green-600">
            ✅ Session active: {userId.slice(0, 8)}...
          </p>
        ) : (
          <p className="text-red-600">❌ No active session</p>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={runBasicTests}
          disabled={!userId || testRunning}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {testRunning ? "Test running..." : "Run Basic Tests"}
        </button>
      </div>

      <div className="bg-gray-800 text-green-400 p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
        <h2 className="text-white text-lg font-semibold mb-2">Log Output</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`${
                  log.type === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                [{log.time.toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
