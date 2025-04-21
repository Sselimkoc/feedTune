-- YouTube önbellek tablosu oluşturma
CREATE TABLE IF NOT EXISTS youtube_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id TEXT NOT NULL UNIQUE,
  thumbnail TEXT,
  title TEXT,
  channel_title TEXT,
  description TEXT,
  rss_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeks oluşturma
CREATE INDEX IF NOT EXISTS youtube_cache_youtube_id_idx ON youtube_cache(youtube_id);

-- Önbelleğe alınan verilerin 30 gün sonra otomatik temizlenmesi için fonksiyon
CREATE OR REPLACE FUNCTION clean_youtube_cache() RETURNS void AS $$
BEGIN
  DELETE FROM youtube_cache
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Not: Cron görevini Supabase Dashboard'dan manuel olarak oluşturun
-- veya temizleme işlemini uygulama içinden periyodik olarak çağırın.
-- Örnek:
-- SELECT clean_youtube_cache(); 