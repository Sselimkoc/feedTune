# FeedTune Tanılama ve Hata Ayıklama Araçları

Bu belge, FeedTune uygulamasının tanılama ve hata ayıklama yeteneklerini açıklar.

## Genel Bakış

Veri akışı sorunlarını teşhis etmek için, FeedTune şu araçları içerir:

1. **Debug Paneli**: Uygulama arayüzünde açılabilir bir panel
2. **Console Debugger**: Tarayıcı konsolunda kullanılabilen global nesneler
3. **Test Sayfası**: Veritabanı, beslemeler ve içerikleri test etmek için özel bir sayfa

## Debug Paneli

Uygulamanın sağ alt köşesinde bulunan "🐞 Debug" düğmesi ile erişilir.

**Özellikler**:
- Kullanıcı ID'sini görüntüleme
- Veritabanı bağlantısını test etme
- Tüm katmanlardan verileri kontrol etme (DB, Repository, Service)
- Hızlı tanılama sonuçları

**Nasıl Kullanılır**:
1. Paneli açmak için "🐞 Debug" düğmesine tıklayın
2. "Tanılama Çalıştır" veya "Konsolda Tanıla" butonlarını kullanın

## Console Debugger

Browser konsolunda kullanılabilen global objeler:

**`window.feedDebugger`**:
```javascript
// Veritabanı bağlantısını test et
await window.feedDebugger.testDbConnection();

// Kullanıcı ID'sini al
const userId = await window.feedDebugger.getCurrentUserId();

// Beslemeleri doğrudan veritabanından getir
const feeds = await window.feedDebugger.getDirectFeeds(userId);

// Tüm katmanları test et
await window.feedDebugger.diagnoseFullSystem();
```

## Test Sayfası

URL: `/debug-test`

Bu sayfa, veri akışında sorun giderme için görsel bir arayüz sağlar:

**Özellikler**:
- Kullanıcı bilgilerini görüntüleme
- Veritabanı bağlantı testleri
- Besleme listesini görüntüleme
- İçerik öğelerini görüntüleme
- Tam sistem tanılama

**Bölümler**:
1. **Veritabanı Testi**: Veritabanı bağlantısını kontrol eder
2. **Besleme Testi**: Kullanıcının besleme aboneliklerini getirir
3. **İçerik Testi**: Seçilen beslemelere ait içerik öğelerini getirir
4. **Tam Tanılama**: Tüm veri akışı için kapsamlı bir teşhis çalıştırır

## Katmanları Teşhis Etme

FeedTune'un katmanlı mimarisi nedeniyle, sorunun hangi katmanda olduğunu belirlemek önemlidir:

### 1. Veritabanı Katmanı
Veritabanında verilerin mevcut olup olmadığını kontrol eder:
```javascript
window.feedDebugger.getDirectFeeds(userId);
window.feedDebugger.getDirectRssItems(feedIds);
window.feedDebugger.getDirectYoutubeItems(feedIds);
```

### 2. Repository Katmanı
Repository'nin verileri doğru şekilde alıp alamadığını kontrol eder:
```javascript
window.feedDebugger.getRepositoryFeeds(userId);
window.feedDebugger.getRepositoryFeedItems(feedIds, userId);
```

### 3. Servis Katmanı
Servis katmanının verileri doğru şekilde işleyip işlemediğini kontrol eder:
```javascript
window.feedDebugger.getServiceFeeds(userId);
window.feedDebugger.getServiceFeedItems(feedIds, userId);
```

### 4. UI Entegrasyonu
UI bileşenlerinin servisten gelen verileri doğru şekilde görüntüleyip görüntülemediğini kontrol eder.

## Tanılama Raporu Örneği

Tam tanılama çalıştırıldığında şuna benzer bir çıktı görürsünüz:

```
🔍 Feed Sistemi Tanılama Başlıyor
Tanılama tarihi: 2023-05-10T15:30:45.123Z
1. Veritabanı bağlantısı kontrol ediliyor...
Veritabanı bağlantısı: ✅ Başarılı
2. Kullanıcı bilgisi kontrol ediliyor...
Kullanıcı ID: ✅ Bulundu (abc123)
3. Veritabanından besleme kayıtları kontrol ediliyor...
Kullanıcı (abc123) için 5 besleme bulundu: [...]
Doğrudan veritabanından besleme kayıtları: ✅ Bulundu (5)
4. Veritabanından RSS öğeleri kontrol ediliyor...
20 RSS öğesi bulundu: [...]
Doğrudan veritabanından RSS öğeleri: ✅ Bulundu (20)
...
```

## SSS ve Sorun Giderme

### S: Debug paneli görünmüyor, neden?
C: Debug paneli ve tanılama araçları sadece geliştirme ortamında (`NODE_ENV=development`) aktiftir.

### S: "Kullanıcı ID bulunamadı" hatası alıyorum
C: Oturum açtığınızdan emin olun. Sorun devam ederse, tarayıcı çerezlerini temizleyin ve yeniden giriş yapın.

### S: Veritabanı bağlantısı başarılı, ancak besleme göremiyorum
C: Aşağıdakileri kontrol edin:
1. Kullanıcıya ait besleme kayıtları olduğundan emin olun
2. Önbelleği temizleyin: `window.feedDebugger.supabase.auth.signOut()`
3. Repository katmanını test edin: `window.feedDebugger.getRepositoryFeeds(userId)`

### S: Repository beslemeleri var, ancak UI'da göremiyorum
C: Servis katmanında ve React Query önbelleğinde bir sorun olabilir. Aşağıdakileri deneyin:
1. `window.feedDebugger.getServiceFeeds(userId)`
2. Sayfayı yeniden yükleyin
3. React Query önbelleğini temizleyin (bu özel bir işleve ihtiyaç duyar)

## Sonuç

Bu tanılama ve hata ayıklama araçları, FeedTune uygulamasındaki veri akışı sorunlarını tespit etmek ve çözmek için oluşturulmuştur. Sorunun tam olarak hangi katmanda olduğunu belirlemeye yardımcı olurlar, böylece çözümü daha hızlı ve doğru bir şekilde uygulayabilirsiniz.

Daha ayrıntılı rehberlik için [Hata Ayıklama Rehberi](DEBUGGING_GUIDE.md) belgesine bakın. 