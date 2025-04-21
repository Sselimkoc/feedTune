-- YouTube öğeleri için RLS politikaları
-- Bu RLS politikaları, kullanıcıların sadece kendi feed'lerine ait YouTube içeriklerini 
-- görüntülemesini, eklemesini, güncellemesini ve silmesini sağlar.

-- Seçme (SELECT) politikası
-- Kullanıcı sadece kendi feed'lerine ait YouTube içeriklerini görebilir
CREATE POLICY youtube_items_select_policy 
ON youtube_items 
FOR SELECT 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Ekleme (INSERT) politikası
-- Kullanıcı sadece kendi feed'lerine YouTube içerikleri ekleyebilir
CREATE POLICY youtube_items_insert_policy 
ON youtube_items 
FOR INSERT 
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Güncelleme (UPDATE) politikası
-- Kullanıcı sadece kendi feed'lerine ait YouTube içeriklerini güncelleyebilir
CREATE POLICY youtube_items_update_policy 
ON youtube_items 
FOR UPDATE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()))
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Silme (DELETE) politikası
-- Kullanıcı sadece kendi feed'lerine ait YouTube içeriklerini silebilir
CREATE POLICY youtube_items_delete_policy 
ON youtube_items 
FOR DELETE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- RSS öğeleri için RLS politikaları (zaten var ise ihmal edilebilir)
-- Aynı prensip RSS öğeleri için de uygulanır
CREATE POLICY rss_items_insert_policy 
ON rss_items 
FOR INSERT 
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

CREATE POLICY rss_items_update_policy 
ON rss_items 
FOR UPDATE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()))
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

CREATE POLICY rss_items_delete_policy 
ON rss_items 
FOR DELETE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- Uygulama için yardımcı RPC fonksiyonu
-- Bu fonksiyon, belirli bir tablonun RLS politikalarını listeler
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
    policyname text,
    tablename text,
    operation text,
    using_expr text,
    check_expr text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.policyname,
        pc.tablename,
        pc.operation,
        pc.using_expr,
        pc.check_expr
    FROM 
        pg_catalog.pg_policies pc
    WHERE 
        pc.tablename = table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 