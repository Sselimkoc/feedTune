-- YouTube içeriklerini eklemek için RLS bypass eden RPC fonksiyonu
CREATE OR REPLACE FUNCTION insert_youtube_items(
  items_json JSONB,
  feed_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  count INT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  item_count INT := 0;
  inserted_count INT := 0;
  current_item JSONB;
  video_id TEXT;
  existing_items TEXT[];
BEGIN
  -- Bu fonksiyon, çağıran kullanıcının beslemenin sahibi olduğunu doğrular
  -- ve ardından youtube_items tablosuna erişir
  
  -- Beslemenin sahibini kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM feeds 
    WHERE id = feed_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu beslemenin sahibi değilsiniz';
  END IF;
  
  -- Mevcut video ID'lerini al
  SELECT ARRAY_AGG(yi.video_id) INTO existing_items
  FROM youtube_items yi
  WHERE yi.feed_id = feed_id;
  
  -- Her öğeyi düşün ve ekle
  FOR current_item IN SELECT * FROM jsonb_array_elements(items_json)
  LOOP
    item_count := item_count + 1;
    
    -- Video ID'sini al
    video_id := current_item->>'video_id';
    
    -- Eğer bu video ID'si zaten yoksa, ekle
    IF video_id IS NOT NULL AND (existing_items IS NULL OR NOT (video_id = ANY(existing_items))) THEN
      INSERT INTO youtube_items (
        feed_id,
        video_id,
        title,
        url,
        description,
        thumbnail,
        channel_title,
        published_at,
        duration,
        view_count,
        like_count,
        comment_count,
        is_short
      ) VALUES (
        feed_id,
        video_id,
        current_item->>'title',
        current_item->>'url',
        current_item->>'description',
        current_item->>'thumbnail',
        current_item->>'channel_title',
        (current_item->>'published_at')::TIMESTAMP WITH TIME ZONE,
        current_item->>'duration',
        COALESCE((current_item->>'view_count')::INT, 0),
        COALESCE((current_item->>'like_count')::INT, 0),
        COALESCE((current_item->>'comment_count')::INT, 0),
        COALESCE((current_item->>'is_short')::BOOLEAN, false)
      );
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  -- Sonucu döndür
  RETURN QUERY SELECT TRUE AS success, inserted_count;
END;
$$;

-- Uygulama tamamlandı bildirimi
DO $$
BEGIN
  RAISE NOTICE 'YouTube içeriklerini eklemek için RPC fonksiyonu oluşturuldu';
END $$; 