# FeedTune Hata Ayıklama ve Test Rehberi

Bu belge, FeedTune uygulamasında veri akışı veya bağlantı sorunlarını teşhis etmek ve çözmek için kullanılacak araçları ve yöntemleri açıklar.

## Teşhis Araçları

Uygulama içinde sorunları teşhis etmek için bir dizi araç geliştirilmiştir:

### 1. `/tests` Sayfası

Bu sayfa, üç katman üzerinden veri erişimini test etmenizi sağlar:

- **Doğrudan Supabase Testi**: Veritabanına doğrudan erişim testi, ara katmanlar olmadan
- **Repository Testi**: EnhancedFeedRepository kullanarak veri erişimi testi
- **Servis Testi**: EnhancedFeedService kullanarak üst düzey işlevsellik testi

URL: `http://localhost:3000/tests`

### 2. `/direct-test` Sayfası

Doğrudan Supabase bağlantısını ve temel tablo erişimini kontrol etmeye odaklanır.

URL: `http://localhost:3000/direct-test`

### 3. `/debug-test` Sayası

Daha ayrıntılı teşhis bilgileri ve veritabanı bağlantısı kontrolleri sunar.

URL: `http://localhost:3000/debug-test`

### 4. Geliştirici Araçları

#### JavaScript Konsol Yardımcıları

**Küresel Debug Nesnesi**:
`window.debugTools` nesnesini kullanarak FeedTune'u test edebilirsiniz:

```javascript
// Repository testi çalıştır
debugTools.testRepository();

// Servis testi çalıştır
debugTools.testService();

// Doğrudan Supabase testi çalıştır
debugTools.testDirect();

// Test sonuçlarını görüntüle
debugTools.getResults();
```

**Doğrudan Supabase testi**:

```javascript
window.testSupabase();
```

## Bilinen Sorunlar ve Çözümleri

### 1. Modül Import Yolu Sorunları

**Belirti**: `Module not found` hataları veya beklenmedik `undefined` değerler

**Çözüm**: Import yollarını kontrol edin. Örneğin:

```javascript
// Hatalı import
import dbClient from "@/lib/db";

// Doğru import
import dbClient from "@/lib/db/index";
```

### 2. Veritabanı Bağlantı Sorunları

**Belirti**: `Cannot read properties of undefined` veya `Error connecting to database` hataları

**Kontrol**:

1. `/tests` sayfasını açın ve "Doğrudan Supabase Testi" düğmesine tıklayın
2. Konsolda hata mesajlarını kontrol edin
3. Supabase yapılandırma anahtarlarını doğrulayın (`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. FeedType Ayrıştırma Sorunları

**Belirti**: RSS öğelerinin gelmesi, YouTube öğelerinin gelmemesi (veya tam tersi)

**Çözüm**: Feed türü filtrelerini kontrol edin:

```javascript
// Sorunlu filtre
const rssFeeds = feeds.filter((f) => f.type === "rss").map((f) => f.id);

// Doğru filtre (atom türünü de içermeli)
const rssFeeds = feeds
  .filter((f) => f.type === "rss" || f.type === "atom")
  .map((f) => f.id);
```

### 4. Önbellek Sorunları

**Belirti**: Güncel olmayan veriler veya yanıt yok

**Çözüm**: Önbelleği temizleyin:

```javascript
// Konsol'da
import dbClient from "@/lib/db/index";
dbClient.clearCache();
```

## Teşhis İş Akışı

Veri veya bağlantı sorunlarıyla karşılaşırsanız, şu adımları izleyin:

1. Önce **Doğrudan Supabase Testi** çalıştırın - veritabanı bağlantısını ve verilerin mevcut olduğunu doğrulayın
2. Sorun yoksa, **Repository Testi** çalıştırın - repository katmanının verileri doğru şekilde alıp almadığını kontrol edin
3. Sorun yoksa, **Servis Testi** çalıştırın - servis katmanının uygun şekilde çalışıp çalışmadığını doğrulayın
4. Hata mesajlarını kontrol edin ve yukarıdaki "Bilinen Sorunlar" bölümüne başvurun

Hatalar genellikle şu kategorilere ayrılır:

- **Bağlantı Hataları**: Veritabanına bağlanma sorunları
- **Erişim Hataları**: İzin sorunları veya yanlış sorgu yapıları
- **Tip Hataları**: Beklenen veri tiplerindeki uyumsuzluklar
- **Parsing Hataları**: Veriyi işlerken oluşan hatalar

## Kullanıcı Kimliği (User ID) Hataları

Çoğu işlem geçerli bir User ID gerektirir. Test sayfalarındaki kullanıcı kimliği girişini kullanarak:

1. Oturum açtıysanız, kimliğiniz otomatik olarak algılanır
2. Manuel olarak bir ID girebilir ve localStorage'a kaydedebilirsiniz

## Yardımcı İpuçları

- Tarayıcı konsolunu açık tutun (`F12` veya sağ tıklayın → "İncele" → "Konsol")
- Network sekmesinde API çağrılarını izleyin
- Hata ile karşılaştığınızda, en basit katmandan başlayıp yukarı doğru ilerleyin

## Geliştirici Notları

- `enhancedFeedRepository.js` ve ilgili bileşenler, merkezi `dbClient` üzerinden sorguları önbelleklemek için özel bir mantık kullanır
- Hata ayıklamak için genellikle konsol loglarına bakın - repository ve servis katmanları, eylemlerini günlüğe kaydeder
- Supabase bağlantılarının hem istemci hem de sunucu tarafında tutarlı olmasını sağlayın

---

Bu hata ayıklama sayfaları ve araçlar yalnızca geliştirme ortamında kullanılmak üzere tasarlanmıştır. Canlı ortamda bu araçları kullanmaktan kaçının.
