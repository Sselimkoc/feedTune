-- YouTube öğeleri için RLS politikalarını güncelleme
DROP POLICY IF EXISTS youtube_items_select_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_insert_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_update_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_delete_policy ON youtube_items;

-- SELECT Politikası: Kullanıcı, kendi feedlerine ait YouTube öğelerini görüntüleyebilir
CREATE POLICY youtube_items_select_policy ON youtube_items
  FOR SELECT
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- INSERT Politikası: Kullanıcı, kendi feedlerine ait YouTube öğeleri ekleyebilir
CREATE POLICY youtube_items_insert_policy ON youtube_items
  FOR INSERT
  WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- UPDATE Politikası: Kullanıcı, kendi feedlerine ait YouTube öğelerini güncelleyebilir
CREATE POLICY youtube_items_update_policy ON youtube_items
  FOR UPDATE
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- DELETE Politikası: Kullanıcı, kendi feedlerine ait YouTube öğelerini silebilir
CREATE POLICY youtube_items_delete_policy ON youtube_items
  FOR DELETE
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Aynı şekilde RSS öğeleri için de politikaları güncelleme
DROP POLICY IF EXISTS rss_items_select_policy ON rss_items;
DROP POLICY IF EXISTS rss_items_insert_policy ON rss_items;
DROP POLICY IF EXISTS rss_items_update_policy ON rss_items;
DROP POLICY IF EXISTS rss_items_delete_policy ON rss_items;

-- SELECT Politikası: Kullanıcı, kendi feedlerine ait RSS öğelerini görüntüleyebilir
CREATE POLICY rss_items_select_policy ON rss_items
  FOR SELECT
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- INSERT Politikası: Kullanıcı, kendi feedlerine ait RSS öğeleri ekleyebilir  
CREATE POLICY rss_items_insert_policy ON rss_items
  FOR INSERT
  WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- UPDATE Politikası: Kullanıcı, kendi feedlerine ait RSS öğelerini güncelleyebilir
CREATE POLICY rss_items_update_policy ON rss_items
  FOR UPDATE
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- DELETE Politikası: Kullanıcı, kendi feedlerine ait RSS öğelerini silebilir
CREATE POLICY rss_items_delete_policy ON rss_items
  FOR DELETE
  USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Bu migration'ın uygulandığını göstermek için bir fonksiyon
CREATE OR REPLACE FUNCTION apply_youtube_items_rls_migration() RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'YouTube ve RSS öğeleri için RLS politikaları güncellendi';
END;
$$ LANGUAGE plpgsql;

-- Test çalıştırma
SELECT apply_youtube_items_rls_migration(); 