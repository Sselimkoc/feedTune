import { HomeContent } from "@/components/home/HomeContent";
import { getSecureUser } from "@/lib/auth/serverAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
