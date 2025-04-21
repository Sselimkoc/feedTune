-- RLS'yi YouTube öğeleri için geçici olarak devre dışı bırakma
-- UYARI: Bu, tüm kullanıcıların tüm YouTube öğelerine erişmesine izin verir.
-- Yalnızca sorun giderilene kadar kullanın ve sonra yeniden etkinleştirin.

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS youtube_items_insert_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_select_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_update_policy ON youtube_items;
DROP POLICY IF EXISTS youtube_items_delete_policy ON youtube_items;

-- RLS'yi kaldır
ALTER TABLE youtube_items DISABLE ROW LEVEL SECURITY;

-- Service role için bypass yetkisi
GRANT ALL ON youtube_items TO service_role;
GRANT ALL ON youtube_items TO authenticated;

-- Migration'ın uygulandığını göstermek için bir fonksiyon
CREATE OR REPLACE FUNCTION disable_youtube_rls_applied() RETURNS TEXT AS $$
BEGIN
  RETURN 'YouTube öğeleri için RLS geçici olarak devre dışı bırakıldı.';
END;
$$ LANGUAGE plpgsql;

-- Test çalıştırma
SELECT disable_youtube_rls_applied(); 