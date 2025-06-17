import { Metadata } from "next";
import { FeedPage } from "@/components/features/feeds/FeedPage";

export const metadata = {
  title: "Feeds | FeedTune",
  description: "Manage your RSS feeds and subscriptions",
};

export default function FeedsPage() {
  return <FeedPage />;
}
