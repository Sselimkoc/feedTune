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

  // Önce kullanıcının okuma listesi etkileşimlerini al
  const { data: interactions, error: interactionsError } = await supabase
    .from("user_item_interactions")
    .select("item_id")
    .eq("user_id", session.user.id)
    .eq("is_read_later", true);

  if (interactionsError) {
    console.error("Error fetching read later interactions:", interactionsError);
    return [];
  }

  if (!interactions || interactions.length === 0) {
    return [];
  }

  // Ardından bu öğelerin detaylarını al
  const itemIds = interactions.map((interaction) => interaction.item_id);
  const { data: items, error: itemsError } = await supabase
    .from("feed_items")
    .select(
      `
      *,
      feeds:feed_id (
        title,
        type,
        site_favicon
      )
    `
    )
    .in("id", itemIds)
    .order("published_at", { ascending: false });

  if (itemsError) {
    console.error("Error fetching read later items:", itemsError);
    return [];
  }

  // Etkileşim bilgilerini öğelere ekle
  const itemsWithInteractions = items.map((item) => ({
    ...item,
    is_read_later: true, // Zaten okuma listesinde olduğunu biliyoruz
  }));

  return itemsWithInteractions || [];
}

export default async function ReadLaterPage() {
  const items = await getReadLaterItems();

  return (
    <main className="container max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
        Okuma Listem
      </h1>
      <Suspense
        fallback={
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <ReadLaterList initialItems={items} />
      </Suspense>
    </main>
  );
}
