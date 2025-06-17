-- Mevcut tabloları sil
DROP TABLE IF EXISTS user_interaction CASCADE;
DROP TABLE IF EXISTS youtube_items CASCADE;
DROP TABLE IF EXISTS rss_items CASCADE;
DROP TABLE IF EXISTS feeds CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Feed tablosu
CREATE TABLE feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'rss',
  icon TEXT,
  category_id UUID,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RSS öğeleri tablosu
CREATE TABLE rss_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  link TEXT,
  pub_date TIMESTAMP DEFAULT NULL,
  guid VARCHAR(255),
  thumbnail TEXT,
  author VARCHAR(255),
  feed_title VARCHAR(255),
  feed_type VARCHAR(50) DEFAULT 'rss',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feed FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
);

-- YouTube öğeleri tablosu
CREATE TABLE youtube_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  published_at TIMESTAMP DEFAULT NULL,
  channel_title VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feed FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
);

-- Kullanıcı etkileşimleri tablosu
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_read_later BOOLEAN DEFAULT false,
  read_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Feed kategorileri tablosu
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX idx_feeds_user_id ON feeds(user_id);
CREATE INDEX idx_rss_items_feed_id ON rss_items(feed_id);
CREATE INDEX idx_youtube_items_feed_id ON youtube_items(feed_id);
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_item_id ON user_interactions(item_id);
CREATE INDEX idx_categories_user_id ON categories(user_id); 