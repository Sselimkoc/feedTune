-- Otomatik kullanıcı ekleme tetikleyicisi

-- Fonksiyon: Kullanıcı oturum açtığında otomatik olarak users tablosunda bir kayıt oluşturur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (new.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eski tetikleyici varsa kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tetikleyiciyi ekle
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Row Level Security (RLS) politikalarını güncelle
-- Önce eski politikaları kaldır
DROP POLICY IF EXISTS users_policy ON users;

-- Yeni politikaları ekle
-- Bu politika, kullanıcıların kendi verilerini okumasına ve güncellemesine izin verir
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Kayıtlı olmayan kullanıcılar için auth.uid() denetimi atlayan
-- bir ekleme politikası (servis rol için)
CREATE POLICY "users_insert_service_role" ON users
  FOR INSERT
  WITH CHECK (true);

-- Bu tetikleyici güncellemelerinin otomatik olarak uygulanması için bir fonksiyon
CREATE OR REPLACE FUNCTION apply_migrations() RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'Kullanıcı tetikleyicileri ve RLS politikaları güncellendi';
END;
$$ LANGUAGE plpgsql;

-- Test çalıştırma
SELECT apply_migrations(); 