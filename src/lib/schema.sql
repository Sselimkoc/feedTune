-- Kullanıcılar tablosu
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Feed kategorileri
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, name)
);

-- Tüm feed'ler için tek tablo (RSS ve YouTube)
CREATE TABLE feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('rss', 'youtube', 'atom')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  last_fetched TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, url)
);

-- RSS feed öğeleri tablosu
CREATE TABLE rss_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  content TEXT,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  guid TEXT,
  language TEXT,
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (feed_id, guid)
);

-- YouTube feed öğeleri tablosu
CREATE TABLE youtube_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  channel_title TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration TEXT,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  is_short BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (feed_id, video_id)
);

-- Ortak içerik etkileşim tablosu
CREATE TABLE user_interaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('rss', 'youtube')),
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_read_later BOOLEAN DEFAULT false,
  read_progress INT DEFAULT 0,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  unique(user_id, item_id)
);

-- Etiketler tablosu
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, name)
);

-- Öğe-etiket ilişkileri
CREATE TABLE item_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('rss', 'youtube')),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (item_id, tag_id, user_id)
);

-- İndeksler (Performans için)
CREATE INDEX feeds_user_id_idx ON feeds(user_id);
CREATE INDEX feeds_category_id_idx ON feeds(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX feeds_type_idx ON feeds(type);

CREATE INDEX rss_items_feed_id_published_at_idx ON rss_items(feed_id, published_at DESC);
CREATE INDEX rss_items_published_at_idx ON rss_items(published_at DESC);

CREATE INDEX youtube_items_feed_id_published_at_idx ON youtube_items(feed_id, published_at DESC);
CREATE INDEX youtube_items_published_at_idx ON youtube_items(published_at DESC);
CREATE INDEX youtube_items_video_id_idx ON youtube_items(video_id);

CREATE INDEX user_interaction_user_id_idx ON user_interaction(user_id);
CREATE INDEX user_interaction_item_id_idx ON user_interaction(item_id);
CREATE INDEX user_interaction_item_type_idx ON user_interaction(item_type);
CREATE INDEX user_interaction_is_favorite_idx ON user_interaction(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX user_interaction_is_read_later_idx ON user_interaction(user_id, is_read_later) WHERE is_read_later = true;
CREATE INDEX user_interaction_is_read_idx ON user_interaction(user_id, is_read);

CREATE INDEX item_tags_user_id_idx ON item_tags(user_id);
CREATE INDEX item_tags_tag_id_idx ON item_tags(tag_id);
CREATE INDEX item_tags_item_id_idx ON item_tags(item_id);
CREATE INDEX item_tags_item_type_idx ON item_tags(item_type);

-- Güvenlik politikaları (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY categories_policy ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY feeds_policy ON feeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_interaction_policy ON user_interaction FOR ALL USING (auth.uid() = user_id);
CREATE POLICY rss_items_select_policy ON rss_items FOR SELECT USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));
CREATE POLICY youtube_items_select_policy ON youtube_items FOR SELECT USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));
CREATE POLICY tags_policy ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY item_tags_policy ON item_tags FOR ALL USING (auth.uid() = user_id);

-- Feed tablosu için daha detaylı RLS politikaları
DROP POLICY IF EXISTS feeds_policy ON feeds;
CREATE POLICY feeds_select_policy ON feeds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY feeds_insert_policy ON feeds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY feeds_update_policy ON feeds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY feeds_delete_policy ON feeds FOR DELETE USING (auth.uid() = user_id);

-- Tetikleyiciler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (new.id, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();