import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { HomeContent } from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSession() {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <HomeContent initialSession={session} />
      </Suspense>
    </main>
  );
}
