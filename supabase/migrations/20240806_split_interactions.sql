-- Migration: Split user_interactions into rss_interactions and youtube_interactions

-- 1. Create rss_interactions table
CREATE TABLE rss_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES rss_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_read_later BOOLEAN DEFAULT false,
  read_progress INT DEFAULT 0,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, item_id)
);

-- 2. Create youtube_interactions table
CREATE TABLE youtube_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES youtube_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_read_later BOOLEAN DEFAULT false,
  read_progress INT DEFAULT 0,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, item_id)
);

-- 3. (Opsiyonel) Eski user_interactions tablosundan veri taşıma işlemi için ek script hazırlanabilir.
-- 4. (Opsiyonel) Eski tabloyu silmeden önce kod ve veri taşıma tamamlanmalı. 