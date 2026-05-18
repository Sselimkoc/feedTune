/**
 * Shared helper for fetching items tied to a user interaction flag.
 * Used by /api/favorites and /api/read-later.
 *
 * @param {object} supabase  - Server-side Supabase client
 * @param {string} userId
 * @param {"is_favorite"|"is_read_later"} flag
 * @returns {Promise<Array>} Transformed item list
 */
export async function fetchInteractionItems(supabase, userId, flag) {
  const ITEM_SELECT =
    "id,title,description,url,thumbnail,published_at,feed_id,feeds(id,title,icon,type)";

  const { data: interactions, error: interactionsError } = await supabase
    .from("user_interactions")
    .select("id,item_id,item_type,is_favorite,is_read_later,created_at")
    .eq("user_id", userId)
    .eq(flag, true)
    .order("created_at", { ascending: false });

  if (interactionsError) throw interactionsError;
  if (!interactions.length) return [];

  const rssIds = interactions
    .filter((i) => i.item_type === "rss")
    .map((i) => i.item_id);
  const youtubeIds = interactions
    .filter((i) => i.item_type === "youtube")
    .map((i) => i.item_id);

  const [rssResult, youtubeResult] = await Promise.all([
    rssIds.length
      ? supabase.from("rss_items").select(ITEM_SELECT).in("id", rssIds)
      : { data: [], error: null },
    youtubeIds.length
      ? supabase.from("youtube_items").select(ITEM_SELECT).in("id", youtubeIds)
      : { data: [], error: null },
  ]);

  if (rssResult.error) throw rssResult.error;
  if (youtubeResult.error) throw youtubeResult.error;

  const rssMap = new Map(rssResult.data.map((item) => [item.id, item]));
  const youtubeMap = new Map(youtubeResult.data.map((item) => [item.id, item]));

  return interactions
    .map((interaction) => {
      const item =
        interaction.item_type === "rss"
          ? rssMap.get(interaction.item_id)
          : youtubeMap.get(interaction.item_id);

      if (!item) return null;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url,
        thumbnail: item.thumbnail,
        published_at: item.published_at,
        feed_id: item.feed_id,
        feed_title: item.feeds?.title ?? "",
        feed_type: interaction.item_type,
        channelName: item.feeds?.title ?? "",
        channelLogo: item.feeds?.icon ?? "",
        type: interaction.item_type,
        is_favorite: interaction.is_favorite ?? false,
        is_read_later: interaction.is_read_later ?? false,
        created_at: interaction.created_at,
      };
    })
    .filter(Boolean);
}
