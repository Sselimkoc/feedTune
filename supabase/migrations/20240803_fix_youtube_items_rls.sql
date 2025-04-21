-- YouTube öğeleri için Row Level Security politikalarını düzeltme
DROP POLICY IF EXISTS youtube_items_insert_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_select_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_update_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_delete_policy ON youtube_items;

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE youtube_items ENABLE ROW LEVEL SECURITY;

-- INSERT politikası - Daha esnek
CREATE POLICY youtube_items_insert_policy ON youtube_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feeds 
      WHERE id = feed_id 
      AND user_id = auth.uid()
    )
  );

-- SELECT politikası - Kullanıcı kendi beslemelerinden gelen öğeleri görebilmeli
CREATE POLICY youtube_items_select_policy ON youtube_items
  FOR SELECT
  USING (
    feed_id IN (
      SELECT id FROM feeds 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE politikası - Kullanıcı kendi beslemelerinden gelen öğeleri güncelleyebilmeli
CREATE POLICY youtube_items_update_policy ON youtube_items
  FOR UPDATE
  USING (
    feed_id IN (
      SELECT id FROM feeds 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE politikası - Kullanıcı kendi beslemelerinden gelen öğeleri silebilmeli  
CREATE POLICY youtube_items_delete_policy ON youtube_items
  FOR DELETE
  USING (
    feed_id IN (
      SELECT id FROM feeds 
      WHERE user_id = auth.uid()
    )
  );

-- service_role için RLS bypass yetkisi
GRANT BYPASS RLS ON TABLE youtube_items TO service_role;

-- Aynı iyileştirmeleri rss_items tablosuna da uygula
DROP POLICY IF EXISTS rss_items_insert_policy ON rss_items;

-- INSERT politikası - Daha esnek
CREATE POLICY rss_items_insert_policy ON rss_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feeds 
      WHERE id = feed_id 
      AND user_id = auth.uid()
    )
  );

-- service_role için RLS bypass yetkisi
GRANT BYPASS RLS ON TABLE rss_items TO service_role;

-- Bu migration'ın uygulandığını göstermek için bir fonksiyon
CREATE OR REPLACE FUNCTION apply_fixed_youtube_items_rls() RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'YouTube ve RSS öğeleri için RLS politikaları başarıyla güncellendi';
END;
$$ LANGUAGE plpgsql;

-- Test çalıştırma
SELECT apply_fixed_youtube_items_rls(); 