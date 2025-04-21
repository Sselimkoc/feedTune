import { useState, useEffect } from "react";
import { useFeedService } from "@/services/useFeedService";

export function useFeedScreen() {
  const [feeds, setFeeds] = useState([]);
  const { getFeeds, refreshFeed } = useFeedService();

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    const feedsList = await getFeeds();
    setFeeds(feedsList);
  };

  const refreshFeeds = async () => {
    const feedsList = await getFeeds();
    setFeeds(feedsList);
  };

  return {
    feeds,
    refreshFeeds,
  };
}
