import { HomeContent } from "@/components/home/HomeContent";
import { getSecureUser } from "@/lib/auth/serverAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "FeedTune - Modern RSS & YouTube Feed Manager",
  description: "Manage your RSS feeds and YouTube subscriptions in one place. Discover, organize, and stay updated with your favorite content.",
  keywords: ["RSS", "YouTube", "feed manager", "content aggregator", "news reader"],
  openGraph: {
    title: "FeedTune - Modern RSS & YouTube Feed Manager",
    description: "Manage your RSS feeds and YouTube subscriptions in one place.",
    type: "website",
  },
};

async function getSecureSession() {
  try {
    const user = await getSecureUser();
    return user ? { user } : null;
  } catch (error) {
    console.error("Error fetching secure session:", error);
    return null;
  }
}

export default async function HomePage() {
  const session = await getSecureSession();

  return (
    <HomeContent
      initialSession={session}
    />
  );
}
