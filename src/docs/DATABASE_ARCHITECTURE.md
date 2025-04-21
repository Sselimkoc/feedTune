# Veritabanı Mimarisi Dokümantasyonu

Bu dokümantasyon, FeedTune uygulaması için tasarlanan optimizasyon odaklı veritabanı mimarisini açıklar.

## Mimari Genel Bakış

FeedTune, üç katmanlı bir veritabanı etkileşim mimarisi kullanır:

1. **Veritabanı İstemcisi (DbClient)**: Supabase ile etkileşim için tek bir merkezi nokta sağlar.
2. **Repository Katmanı**: Veritabanı işlemlerini gerçekleştirirken veri erişimi ve manipülasyonu için yöntemler sunar.
3. **Servis Katmanı**: İş mantığını içeren ve kullanıcı arayüzüyle repository arasında aracılık yapan katman.

## DbClient

`DbClient` sınıfı tüm veritabanı işlemleri için tek bir merkezi nokta sağlar. Bu, veritabanı etkileşimlerinde tutarlılık, performans optimizasyonları ve önbellekleme mekanizmaları uygulamayı mümkün kılar.

### Önemli Özellikler

- **Otomatik İstemci Seçimi**: Sunucu veya istemci tarafında olduğunu otomatik olarak algılayarak uygun Supabase istemcisini oluşturur.
- **Önbellekleme**: QueryCache ile performansı artıran gelişmiş önbellekleme.
- **Yapılandırılabilir Sorgu Arayüzü**: Supabase sorgu oluşturma sürecini basitleştiren ve standartlaştıran akıcı bir API.
- **Batch İşlemleri**: Büyük veri setleri için performans sağlayan toplu işlem desteği.
- **Regex Önbellek Geçersiz Kılma**: Belirli bir desene göre önbellek girişlerini geçersiz kılma mekanizması.

### Sorgu Önbelleği

Önbellek sorgu sonuçlarını tutarak tekrarlayan sorguların doğrudan veritabanına erişmeden sonuç döndürmelerini sağlar. Bu, özellikle sık sorgulanan, nadiren değişen veriler için önemli performans artışları sağlar.

Önbelleğin temel özellikleri:
- TTL (Time-to-Live) tabanlı sona erme
- Anahtarları desenlere göre geçersiz kılma
- İsteğe bağlı özel önbellekleme kontrolü

## Repository Katmanı

Repository katmanı, `EnhancedFeedRepository` tarafından temsil edilir ve veri erişimini CRUD operasyonları halinde soyutlar.

### Önemli Özellikler
- Veri türüne göre paralel sorgular
- İstemciden bağımsız veri yapıları
- Veritabanı tablosu farkındalığı
- İlişkisel veri için join ve ilgili veri getirme

## Servis Katmanı

Servis katmanı (`EnhancedFeedService`), repository katmanı ile kullanıcı arayüzü arasında aracılık yapar. Temel iş mantığını içerir, hata işleme sağlar ve UI dostu cevaplar döndürür.

### Önemli Özellikler
- Kullanıcı giriş doğrulama ve kontrolü
- UI uyarıları ve bildirim entegrasyonu
- Karmaşık iş mantığı işleme
- Veri normalleştirme ve dönüştürme

## Performans Optimizasyonları

Bu mimari aşağıdaki performans optimizasyonlarını sağlar:

1. **Önbellekleme**: Önbellek kullanımı, sık erişilen veriler için veritabanı çağrılarını azaltır.
2. **Paralel Sorgular**: RSS ve YouTube içerikleri gibi farklı veri kaynakları paralel olarak sorgulanır.
3. **Batch İşlemleri**: Büyük veri setleri küçük parçalara bölünerek optimize şekilde işlenir.
4. **Önbellek Geçersiz Kılma Stratejileri**: Sadece etkilenen verilerin önbelleklerini geçersiz kılma.
5. **Tek Bağlantı Noktası**: Tüm DB erişimi için tek bir yapılandırılabilir istemci.

## Veri Akışı

Tipik bir akış şu şekilde ilerler:

1. Kullanıcı arayüzü servis metodlarını çağırır.
2. Servis, parametreleri doğrular ve repository metodlarını çağırır.
3. Repository, sorguları oluşturur ve DbClient'a iletir.
4. DbClient, önbelleği kontrol eder. Veri önbellekte varsa hemen döndürür.
5. Veri önbellekte yoksa, DbClient Supabase'e sorgu gönderir.
6. Sonuç önbelleğe alınır ve dönüş değeri olarak verilir.
7. Repository, sonuç verilerini işler ve servis katmanına döndürür.
8. Servis katmanı, verileri UI için biçimlendirir ve döndürür.

## Kullanım Örnekleri

### Beslemeleri Getirme

```javascript
// UI Katmanı
const feeds = await enhancedFeedService.getFeeds(userId);

// Servis Katmanı
async getFeeds(userId) {
  // Parametre kontrolü
  // Repository'ye istek
  return await this.repository.getFeeds(userId);
}

// Repository Katmanı
async getFeeds(userId) {
  // Sorgu oluşturma
  const result = await dbClient.query("feeds", { ... });
  return result.data;
}

// DbClient
async query(table, query, useCache = true) {
  // Önbellek kontrolü
  // Supabase sorgusu 
  // Önbellekleme
  return { data, source };
}
```

### Feed Ekleme

```javascript
// UI Katmanı
const result = await enhancedFeedService.addFeed(url, type, userId);

// Servis Katmanı
async addFeed(url, type, userId, extraData) {
  // İş mantığı kontrolü
  const feedData = { ... };
  return await this.repository.addFeed(feedData);
}

// Repository Katmanı
async addFeed(feedData) {
  // Veri doğrulama
  const { data } = await dbClient.insert("feeds", { ... });
  return { feed: data[0], isNew: true };
}

// DbClient
async insert(table, data, invalidatePatterns = []) {
  // Supabase insert
  // Önbellek geçersiz kılma
  return { data: result };
}
```

## Sonuç

Bu mimari, veritabanı etkileşimlerinde tutarlılık, performans ve bakım kolaylığı sağlar. Repository ve servis katmanları, iş mantığını veri erişiminden ayırarak değişikliklerin izole edilmesini ve test edilebilirliği artırır. DbClient önbellekleme ve batch işlemleri ile performansı optimize eder. 