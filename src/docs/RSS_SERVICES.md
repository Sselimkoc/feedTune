# RSS Besleme İşlemleri Dokümantasyonu

Bu dokümantasyon, RSS beslemelerinin eklenmesi, ayrıştırılması, güncellenmesi ve silinmesi için uygulama mimarisini açıklar.

## Mimari Genel Bakış

RSS besleme işlemleri mimarisi aşağıdaki bileşenlerden oluşur:

1. **RSS Servisi (`src/lib/rss-service.js`)**: 
   - RSS beslemelerini ayrıştırma, ekleme, güncelleme ve silme işlemlerini gerçekleştiren temel fonksiyonları içerir.
   - Hem istemci tarafında hem de sunucu tarafında kullanılabilir.

2. **API Endpoint'leri**:
   - `/api/rss/parse`: RSS beslemelerini ayrıştırır ve meta verilerini döndürür.
   - `/api/rss/add`: RSS beslemelerini veritabanına ekler.
   - `/api/rss/update`: Mevcut bir RSS beslemesini günceller.
   - `/api/rss/delete`: Bir RSS beslemesini siler (soft delete).

3. **İstemci Entegrasyonu**:
   - `useRssFeeds` hook'u: React bileşenlerinin RSS servislerini kolayca kullanmasını sağlar.
   - `RssFeedForm` bileşeni: RSS beslemesi eklemek için kullanıcı arayüzü sağlar.

## Veri Akışı

1. **RSS Besleme Ekleme**:
   - Kullanıcı RSS URL'sini girer
   - `RssFeedForm` bileşeni URL'yi doğrular
   - İlk olarak RSS beslemesi ayrıştırılır (`/api/rss/parse` ile)
   - Başarılı ayrıştırma sonrası RSS beslemesi veritabanına eklenir (`/api/rss/add` ile)
   - Başarı veya hata durumu kullanıcıya bildirilir

2. **RSS Besleme Güncelleme**:
   - Kullanıcı bir beslemesini güncellemek ister
   - Besleme ID'si ile `/api/rss/update` endpoint'i çağrılır
   - İlgili besleme veritabanında güncellenir

3. **RSS Besleme Silme**:
   - Kullanıcı bir beslemesini silmek ister
   - Besleme ID'si ile `/api/rss/delete` endpoint'i çağrılır
   - İlgili beslemenin `is_active` değeri `false` olarak güncellenir (soft delete)

## Veritabanı Yapısı

RSS besleme verileri aşağıdaki tablolarda saklanır:

1. **`feeds`**: Tüm besleme türleri için temel tablo
   - `id`: UUID, birincil anahtar
   - `user_id`: Kullanıcı ID'si (auth.users tablosuyla ilişkili)
   - `type`: Besleme türü ('rss', 'youtube', vb.)
   - `title`: Besleme başlığı
   - `link`: Besleme bağlantısı
   - `description`: Besleme açıklaması
   - `site_favicon`: Site favicon URL'si
   - `is_active`: Beslemenin aktif olup olmadığı
   - ... diğer alanlar

2. **`rss_feeds`**: RSS beslemeleri için özel tablo
   - `id`: UUID, birincil anahtar (feeds tablosuyla ilişkili)
   - `feed_url`: RSS besleme URL'si
   - `last_build_date`: Son güncelleme tarihi
   - `language`: Besleme dili
   - `categories`: Kategoriler dizisi

3. **`feed_items`**: Besleme öğeleri için tablo
   - `id`: UUID, birincil anahtar
   - `feed_id`: Besleme ID'si (feeds tablosuyla ilişkili)
   - `title`: Öğe başlığı
   - `link`: Öğe bağlantısı
   - `description`: Öğe açıklaması
   - `content`: Öğe içeriği
   - `published_at`: Yayınlanma tarihi
   - `thumbnail`: Öğe görseli URL'si
   - ... diğer alanlar

## RSS Ayrıştırma İşlemi

RSS beslemeleri, `rss-parser` kütüphanesi kullanılarak ayrıştırılır. Bu işlem şunları içerir:

1. RSS beslemesini getirme ve XML içeriğini alma
2. XML içeriğini JavaScript nesnelerine dönüştürme
3. Besleme meta verilerini çıkarma (başlık, açıklama, vb.)
4. Besleme öğelerini çıkarma ve dönüştürme
5. Thumbnail ve medya bilgilerini işleme

## Hata İşleme

RSS besleme işlemleri sırasında oluşabilecek hatalar için aşağıdaki stratejiler uygulanır:

1. **API Endpoint'lerinde**:
   - Tüm hatalar yakalanır ve uygun HTTP durum kodları ile döndürülür
   - Hata mesajları log'lanır
   - İstemciye açıklayıcı hata mesajları gönderilir

2. **İstemci Tarafında**:
   - `useMutation` kullanılarak asenkron işlemler yönetilir
   - Hata durumları için toast bildirimleri gösterilir
   - Formlar, hata durumlarında uygun geri bildirimler sağlar

## Güvenlik Önlemleri

1. **Kimlik Doğrulama**:
   - Tüm API endpoint'leri oturum doğrulaması gerektirir
   - Kullanıcılar yalnızca kendi beslemelerine erişebilir

2. **URL Doğrulama**:
   - RSS besleme URL'leri eklemeden önce doğrulanır
   - Potansiyel kötü amaçlı URL'ler filtrelenir

3. **Veri Doğrulama**:
   - Tüm kullanıcı girdileri doğrulanır
   - API istekleri ve yanıtları için doğrulama yapılır

## Performans Optimizasyonları

1. **Veri Önbelleğe Alma**:
   - React Query kullanılarak veri önbelleğe alınır
   - Yalnızca gerektiğinde veri yenilenir

2. **Besleme Öğesi Limitleme**:
   - Her beslemeden sınırlı sayıda öğe alınır (varsayılan: 10)
   - Pagination desteği eklenmiştir

3. **Debouncing**:
   - Form girişleri 500ms debouncing ile işlenir
   - Gereksiz API çağrıları önlenir

## Özelleştirme ve Genişletme

Bu mimari, aşağıdaki şekillerde genişletilebilir:

1. Farklı besleme formatları desteği (Atom, JSON, vb.)
2. Besleme filtrelemeleri ve kategorileme
3. Gelişmiş besleme arama ve keşfetme özellikleri
4. Besleme içeriklerinin otomatik kategorize edilmesi
5. Favori ve okuma listesi yönetimi 