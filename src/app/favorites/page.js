import { Suspense } from "react";
import { FavoritesContent } from "@/components/features/favorites/FavoritesContent";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getFavoriteItems() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return [];
  }

  // Önce kullanıcının favori etkileşimlerini al
  const { data: interactions, error: interactionsError } = await supabase
    .from("user_item_interactions")
    .select("item_id")
    .eq("user_id", session.user.id)
    .eq("is_favorite", true);

  if (interactionsError) {
    console.error("Error fetching favorite interactions:", interactionsError);
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
    console.error("Error fetching favorite items:", itemsError);
    return [];
  }

  // Etkileşim bilgilerini öğelere ekle
  const itemsWithInteractions = items.map((item) => ({
    ...item,
    is_favorite: true, // Zaten favorilerde olduğunu biliyoruz
  }));

  return itemsWithInteractions || [];
}

export default function FavoritesPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-4 px-3 sm:px-4 md:py-6 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <FavoritesContent />
      </Suspense>
    </div>
  );
}
