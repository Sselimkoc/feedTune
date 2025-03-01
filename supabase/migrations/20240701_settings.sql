-- Settings tablosu oluşturma
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeks oluşturma
CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);

-- Örnek veri
INSERT INTO settings (key, value)
VALUES ('logo_migration_completed', 'false')
ON CONFLICT (key) DO NOTHING; 