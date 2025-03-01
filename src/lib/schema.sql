-- Ana feeds tablosu
CREATE TABLE feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('rss', 'youtube')),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, type, link)
);

-- RSS feedleri için özel tablo
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY REFERENCES feeds(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  site_favicon TEXT,
  update_frequency INTEGER DEFAULT 30, -- varsayılan 30 dakika
  UNIQUE(feed_url)
);

-- YouTube feedleri için özel tablo
CREATE TABLE youtube_feeds (
  id UUID PRIMARY KEY REFERENCES feeds(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_avatar TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,
  playlist_id TEXT,
  UNIQUE(channel_id)
);

-- Feed içerikleri için tablo
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_read_later BOOLEAN DEFAULT FALSE, -- Okuma listesi için yeni alan
  -- YouTube'a özel alanlar
  video_id TEXT,
  duration TEXT,
  view_count INTEGER,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feed_id, link)
);

-- İndeksler
CREATE INDEX feed_items_feed_id_idx ON feed_items(feed_id);
CREATE INDEX feed_items_published_at_idx ON feed_items(published_at DESC);
CREATE INDEX feed_items_is_favorite_idx ON feed_items(is_favorite) WHERE is_favorite = true;
CREATE INDEX feed_items_is_read_later_idx ON feed_items(is_read_later) WHERE is_read_later = true; -- Okuma listesi için yeni indeks
CREATE INDEX feeds_user_id_idx ON feeds(user_id);
CREATE INDEX feeds_link_idx ON feeds(link); 