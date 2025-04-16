-- Kullanıcı profilleri
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Ana feeds tablosu
CREATE TABLE feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('rss', 'youtube', 'twitter', 'reddit')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  channel_id TEXT,
  description TEXT,
  site_favicon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  fetch_error TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  refresh_frequency INTEGER DEFAULT 60,
  UNIQUE(user_id, type, url)
);

-- RSS feedleri için özel tablo
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY REFERENCES feeds(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  last_build_date TIMESTAMP WITH TIME ZONE,
  language TEXT,
  categories TEXT[],
  UNIQUE(feed_url)
);

-- YouTube feedleri için özel tablo
CREATE TABLE youtube_feeds (
  id UUID PRIMARY KEY REFERENCES feeds(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,
  playlist_id TEXT,
  UNIQUE(channel_id)
);

-- Feed kategorileri
CREATE TABLE feed_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Feed ve kategori ilişkisi
CREATE TABLE feed_category_mappings (
  feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
  category_id UUID REFERENCES feed_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (feed_id, category_id)
);

-- Feed içerikleri için ana tablo
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  content TEXT,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  thumbnail TEXT,
  media_url TEXT,
  guid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feed_id, guid)
);

-- Kullanıcı-öğe etkileşimleri
CREATE TABLE user_item_interactions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_read_later BOOLEAN DEFAULT FALSE,
  read_position INTEGER DEFAULT 0,
  rating SMALLINT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- YouTube öğeleri için ek bilgiler
CREATE TABLE youtube_item_details (
  item_id UUID PRIMARY KEY REFERENCES feed_items(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  duration TEXT,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  UNIQUE(video_id)
);

-- Etiketler
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Öğe-etiket ilişkisi
CREATE TABLE item_tag_mappings (
  item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (item_id, tag_id, user_id)
);

-- Okuma istatistikleri
CREATE TABLE reading_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items_read INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Feed istatistikleri
CREATE TABLE feed_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items_count INTEGER DEFAULT 0,
  items_read INTEGER DEFAULT 0,
  UNIQUE(feed_id, date)
);

-- Feed öğeleri için indeksler
CREATE INDEX feed_items_feed_id_idx ON feed_items(feed_id);
CREATE INDEX feed_items_published_at_idx ON feed_items(published_at DESC);

-- Kullanıcı etkileşimleri için indeksler
CREATE INDEX user_item_interactions_user_id_idx ON user_item_interactions(user_id);
CREATE INDEX user_item_interactions_is_favorite_idx ON user_item_interactions(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX user_item_interactions_is_read_later_idx ON user_item_interactions(user_id, is_read_later) WHERE is_read_later = true;
CREATE INDEX user_item_interactions_is_read_idx ON user_item_interactions(user_id, is_read);

-- Feed'ler için indeksler
CREATE INDEX feeds_user_id_idx ON feeds(user_id);
CREATE INDEX feeds_type_idx ON feeds(type);
CREATE INDEX feeds_last_fetched_at_idx ON feeds(last_fetched_at);

-- updated_at alanını otomatik güncellemek için fonksiyon
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tetikleyicileri oluştur
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_item_interactions_updated_at
BEFORE UPDATE ON user_item_interactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 