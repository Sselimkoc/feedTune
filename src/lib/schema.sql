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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('rss', 'youtube', 'atom')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  last_fetched TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, url)
);

-- Feed öğeleri tablosu
CREATE TABLE feed_items (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (feed_id, guid)
);

-- Kullanıcı-öğe etkileşimleri tablosu
CREATE TABLE user_item_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_read_later BOOLEAN DEFAULT false,
  read_progress INTEGER DEFAULT 0,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, item_id)
);

-- Etiketler tablosu
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, name)
);

-- Öğe-etiket ilişkileri
CREATE TABLE item_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (item_id, tag_id, user_id)
);

-- İndeksler (Performans için)
CREATE INDEX feeds_user_id_idx ON feeds(user_id);
CREATE INDEX feeds_category_id_idx ON feeds(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX feed_items_feed_id_published_at_idx ON feed_items(feed_id, published_at DESC);
CREATE INDEX feed_items_published_at_idx ON feed_items(published_at DESC);

CREATE INDEX user_item_interactions_user_id_idx ON user_item_interactions(user_id);
CREATE INDEX user_item_interactions_item_id_idx ON user_item_interactions(item_id);
CREATE INDEX user_item_interactions_is_favorite_idx ON user_item_interactions(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX user_item_interactions_is_read_later_idx ON user_item_interactions(user_id, is_read_later) WHERE is_read_later = true;
CREATE INDEX user_item_interactions_is_read_idx ON user_item_interactions(user_id, is_read);

CREATE INDEX item_tags_user_id_idx ON item_tags(user_id);
CREATE INDEX item_tags_tag_id_idx ON item_tags(tag_id);

-- Güvenlik politikaları (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_item_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY categories_policy ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY feeds_policy ON feeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY feed_items_select_policy ON feed_items FOR SELECT USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));
CREATE POLICY user_item_interactions_policy ON user_item_interactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY tags_policy ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY item_tags_policy ON item_tags FOR ALL USING (auth.uid() = user_id);

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