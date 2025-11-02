-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for user profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Categories table
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

-- Feeds table (RSS and YouTube)
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

-- RSS items table
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

-- YouTube items table
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

-- User interactions table
CREATE TABLE user_interactions (
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
  UNIQUE (user_id, item_id)
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, name)
);

-- Item tags table
CREATE TABLE item_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('rss', 'youtube')),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (item_id, tag_id, user_id)
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube cache table
CREATE TABLE youtube_cache (
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

-- Performance indexes
CREATE INDEX feeds_user_id_idx ON feeds(user_id);
CREATE INDEX feeds_category_id_idx ON feeds(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX feeds_type_idx ON feeds(type);

CREATE INDEX rss_items_feed_id_published_at_idx ON rss_items(feed_id, published_at DESC);
CREATE INDEX rss_items_published_at_idx ON rss_items(published_at DESC);

CREATE INDEX youtube_items_feed_id_published_at_idx ON youtube_items(feed_id, published_at DESC);
CREATE INDEX youtube_items_published_at_idx ON youtube_items(published_at DESC);
CREATE INDEX youtube_items_video_id_idx ON youtube_items(video_id);

CREATE INDEX user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX user_interactions_item_id_idx ON user_interactions(item_id);
CREATE INDEX user_interactions_item_type_idx ON user_interactions(item_type);
CREATE INDEX user_interactions_is_favorite_idx ON user_interactions(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX user_interactions_is_read_later_idx ON user_interactions(user_id, is_read_later) WHERE is_read_later = true;
CREATE INDEX user_interactions_is_read_idx ON user_interactions(user_id, is_read);

CREATE INDEX item_tags_user_id_idx ON item_tags(user_id);
CREATE INDEX item_tags_tag_id_idx ON item_tags(tag_id);
CREATE INDEX item_tags_item_id_idx ON item_tags(item_id);
CREATE INDEX item_tags_item_type_idx ON item_tags(item_type);

CREATE INDEX settings_key_idx ON settings(key);
CREATE INDEX youtube_cache_youtube_id_idx ON youtube_cache(youtube_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies with Service Role bypass
CREATE POLICY users_select_policy ON users FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');
CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');
CREATE POLICY users_delete_policy ON users FOR DELETE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY categories_select_policy ON categories FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY categories_insert_policy ON categories FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY categories_update_policy ON categories FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY categories_delete_policy ON categories FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY feeds_select_policy ON feeds FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY feeds_insert_policy ON feeds FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY feeds_update_policy ON feeds FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY feeds_delete_policy ON feeds FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_interactions_select_policy ON user_interactions FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY user_interactions_insert_policy ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY user_interactions_update_policy ON user_interactions FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY user_interactions_delete_policy ON user_interactions FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY rss_items_select_policy ON rss_items FOR SELECT USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY rss_items_insert_policy ON rss_items FOR INSERT WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY rss_items_update_policy ON rss_items FOR UPDATE USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY rss_items_delete_policy ON rss_items FOR DELETE USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY youtube_items_select_policy ON youtube_items FOR SELECT USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY youtube_items_insert_policy ON youtube_items FOR INSERT WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY youtube_items_update_policy ON youtube_items FOR UPDATE USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY youtube_items_delete_policy ON youtube_items FOR DELETE USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()) OR auth.role() = 'service_role');

CREATE POLICY tags_select_policy ON tags FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY tags_insert_policy ON tags FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY tags_update_policy ON tags FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY tags_delete_policy ON tags FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY item_tags_select_policy ON item_tags FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY item_tags_insert_policy ON item_tags FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY item_tags_update_policy ON item_tags FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY item_tags_delete_policy ON item_tags FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY settings_select_policy ON settings FOR SELECT USING (true);
CREATE POLICY settings_insert_policy ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY settings_update_policy ON settings FOR UPDATE USING (true);
CREATE POLICY settings_delete_policy ON settings FOR DELETE USING (true);

CREATE POLICY youtube_cache_select_policy ON youtube_cache FOR SELECT USING (true);
CREATE POLICY youtube_cache_insert_policy ON youtube_cache FOR INSERT WITH CHECK (true);
CREATE POLICY youtube_cache_update_policy ON youtube_cache FOR UPDATE USING (true);
CREATE POLICY youtube_cache_delete_policy ON youtube_cache FOR DELETE USING (true);

-- User creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (new.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- YouTube cache cleanup function
CREATE OR REPLACE FUNCTION clean_youtube_cache() RETURNS void AS $$
BEGIN
  DELETE FROM youtube_cache
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO settings (key, value)
VALUES ('logo_migration_completed', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW(); 