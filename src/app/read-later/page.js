import { Suspense } from "react";
import { ReadLaterList } from "@/components/features/read-later/ReadLaterList";
import { ReadLaterContent } from "@/components/features/read-later/ReadLaterContent";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Loader2 } from "lucide-react";

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

export default function ReadLaterPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-4 px-3 sm:px-4 md:py-6 md:px-6">
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReadLaterContent />
      </Suspense>
    </div>
  );
}
