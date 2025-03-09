-- Kullanıcı feed istatistiklerini almak için fonksiyon
CREATE OR REPLACE FUNCTION get_user_feed_stats(user_id_param UUID)
RETURNS TABLE (
  total_feeds BIGINT,
  total_items BIGINT,
  unread_items BIGINT,
  favorite_items BIGINT,
  read_later_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_feeds AS (
    SELECT id FROM feeds WHERE user_id = user_id_param AND is_active = true
  ),
  user_feed_items AS (
    SELECT fi.id 
    FROM feed_items fi
    JOIN user_feeds uf ON fi.feed_id = uf.id
  ),
  user_interactions AS (
    SELECT 
      uii.item_id,
      uii.is_read,
      uii.is_favorite,
      uii.is_read_later
    FROM user_item_interactions uii
    WHERE uii.user_id = user_id_param
  )
  SELECT
    (SELECT COUNT(*) FROM user_feeds) AS total_feeds,
    (SELECT COUNT(*) FROM user_feed_items) AS total_items,
    (
      SELECT COUNT(*) 
      FROM user_feed_items ufi
      LEFT JOIN user_interactions ui ON ufi.id = ui.item_id
      WHERE ui.is_read IS NULL OR ui.is_read = false
    ) AS unread_items,
    (
      SELECT COUNT(*) 
      FROM user_interactions
      WHERE is_favorite = true
    ) AS favorite_items,
    (
      SELECT COUNT(*) 
      FROM user_interactions
      WHERE is_read_later = true
    ) AS read_later_items;
END;
$$ LANGUAGE plpgsql; 