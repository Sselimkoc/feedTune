import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { HomeContent } from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export default async function HomePage() {
  const session = await getSession();

  return (
    <main className="container py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <HomeContent initialSession={session} />
      </Suspense>
    </main>
  );
}
