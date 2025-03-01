import { Suspense } from "react";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getFavoriteItems() {
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
    .eq("is_favorite", true)
    .order("published_at", { ascending: false });

  return items || [];
}

export default async function FavoritesPage() {
  const items = await getFavoriteItems();

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Favorites</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <FavoritesList initialItems={items} />
      </Suspense>
    </main>
  );
}
