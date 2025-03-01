import { Suspense } from "react";
import { ReadLaterList } from "@/components/read-later/ReadLaterList";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getReadLaterItems() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return [];
  }

  const { data: items } = await supabase
    .from("feed_items")
    .select("*")
    .eq("is_read_later", true)
    .order("published_at", { ascending: false });

  return items || [];
}

export default async function ReadLaterPage() {
  const items = await getReadLaterItems();

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Okuma Listem</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ReadLaterList initialItems={items} />
      </Suspense>
    </main>
  );
}
