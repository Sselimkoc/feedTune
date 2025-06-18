import { ReadLaterContent } from "@/components/features/read-later/ReadLaterContent";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getReadLaterItems() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

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
    <div className="max-w-screen-2xl mx-auto py-8 px-2 md:px-6">
      <ReadLaterContent items={items} />
    </div>
  );
}
