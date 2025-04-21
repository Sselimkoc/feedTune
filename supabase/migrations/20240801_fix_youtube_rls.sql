-- YouTube öğeleri için RLS politikasını daha izin verici hale getirme
DROP POLICY IF EXISTS youtube_items_insert_policy ON youtube_items;

-- Yeni, daha esnek insert politikası
CREATE POLICY youtube_items_insert_policy ON youtube_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feeds 
      WHERE feeds.id = youtube_items.feed_id 
      AND feeds.user_id = auth.uid()
    )
  );

-- RLS aktif olduğundan emin ol
ALTER TABLE youtube_items ENABLE ROW LEVEL SECURITY;

-- Servis için bypass yetkisi
GRANT BYPASS RLS ON TABLE youtube_items TO service_role;

-- Uygulama uyarısı
DO $$
BEGIN
  RAISE NOTICE 'YouTube RLS politikaları başarıyla güncellendi';
END $$; 