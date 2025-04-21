# FeedTune Hata Ayıklama Rehberi

Bu rehber, FeedTune uygulamasında veri akışı sorunlarının tespit edilmesi ve giderilmesi için oluşturulmuştur. Özellikle beslemeler ve içerik görüntüleme sorunlarıyla ilgilidir.

## Genel Bakış

FeedTune, çok katmanlı bir mimari ile çalışır:

1. **Veritabanı İstemcisi (DbClient)**: Supabase ile etkileşim ve önbellekleme
2. **Repository Katmanı (enhancedFeedRepository)**: Veri erişim ve manipülasyon mantığı
3. **Servis Katmanı (enhancedFeedService)**: İş mantığı ve kullanıcı arayüzü entegrasyonu
4. **UI Bileşenleri**: React komponentleri ve hooklar

Sorunlar genellikle bu katmanlardan birinde meydana gelir ve verinin UI'ya ulaşmasını engeller.

## Hata Ayıklama Araçları

### Tarayıcı Konsolu

Tarayıcı konsolunda `feedDebugger` nesnesi bulunur. Bu araç aşağıdaki işlemleri yapmanızı sağlar:

```javascript
// Tam tanılama çalıştırır
window.feedDebugger.diagnoseFullSystem();

// Veritabanı bağlantısını test eder
window.feedDebugger.testDbConnection();

// Repository katmanıyla beslemeleri test eder
window.feedDebugger.getRepositoryFeeds("kullanıcı-id");

// Servis katmanıyla beslemeleri test eder
window.feedDebugger.getServiceFeeds("kullanıcı-id");
```

### Debug Paneli

Uygulamanın sağ alt köşesinde bulunan "🐞 Debug" düğmesine tıklayarak hata ayıklama paneline erişebilirsiniz. Panel şunları yapmanızı sağlar:

- Veritabanı bağlantısını kontrol etme
- Kullanıcı ID'sini görüntüleme
- Katman bazlı veri testleri çalıştırma
- Sonuçları grafiksel olarak görüntüleme

## Yaygın Sorunlar ve Çözümleri

### 1. Hiç Veri Görünmüyor

**Belirtiler**:

- Beslemeler yüklenmiyor
- "Veri bulunamadı" mesajı görünüyor
- Boş listeler gösteriliyor

**Çözüm Adımları**:

1. **Kullanıcı Oturumu**: Kullanıcının oturum açtığından emin olun

   ```javascript
   // Konsolda kontrol et
   const { data } = await window.feedDebugger.supabase.auth.getSession();
   console.log("Oturum durumu:", data);
   ```

2. **Veritabanı Bağlantısı**: Bağlantının çalıştığını doğrulayın

   ```javascript
   // Debug düğmesine tıklayın ve "Tanılama Çalıştır" butonunu kullanın
   // veya konsoldan çalıştırın:
   window.feedDebugger.testDbConnection();
   ```

3. **Besleme Kayıtları**: Kullanıcının beslemeleri olduğundan emin olun

   ```javascript
   // Veritabanını doğrudan kontrol et
   window.feedDebugger.getDirectFeeds("kullanıcı-id");
   ```

4. **Repository Katmanı**: Repository'nin verileri alabildiğini doğrulayın

   ```javascript
   window.feedDebugger.getRepositoryFeeds("kullanıcı-id");
   ```

5. **Servis Katmanı**: Servisin verileri işleyebildiğini doğrulayın
   ```javascript
   window.feedDebugger.getServiceFeeds("kullanıcı-id");
   ```

### 2. İçerik Öğeleri Görünmüyor

**Belirtiler**:

- Beslemeler gösteriliyor, ancak içerik öğeleri yok
- "İçerik bulunamadı" mesajı görünüyor

**Çözüm Adımları**:

1. **Feed ID'leri**: Feed ID'lerinin doğru olduğunu kontrol edin

   ```javascript
   // Feed ID'lerini alın
   const feeds = await window.feedDebugger.getDirectFeeds("kullanıcı-id");
   const feedIds = feeds.map((f) => f.id);
   console.log("Feed ID'leri:", feedIds);
   ```

2. **RSS ve YouTube Öğeleri**: Öğelerin veritabanında olduğunu doğrulayın

   ```javascript
   // Feed ID'leri ile öğeleri kontrol edin
   window.feedDebugger.getDirectRssItems(feedIds);
   window.feedDebugger.getDirectYoutubeItems(feedIds);
   ```

3. **Repository ve Servis Katmanları**: Katmanların öğeleri alabildiğini doğrulayın
   ```javascript
   window.feedDebugger.getRepositoryFeedItems(feedIds, "kullanıcı-id");
   window.feedDebugger.getServiceFeedItems(feedIds, "kullanıcı-id");
   ```

### 3. Yeni Eklenen Beslemeler Görünmüyor

**Belirtiler**:

- Yeni besleme başarıyla eklendiği bildirildi, ancak listede görünmüyor
- Sayfa yenileme işe yaramıyor

**Çözüm Adımları**:

1. **Önbellek Kontrolü**: Önbelleğin güncel verileri engellediğini kontrol edin

   ```javascript
   // Tam tanılama çalıştırın ve önbellek durumunu kontrol edin
   window.feedDebugger.diagnoseFullSystem();
   ```

2. **Doğrudan Veritabanı Kontrolü**: Veritabanında yeni beslemenin olduğunu doğrulayın

   ```javascript
   window.feedDebugger.getDirectFeeds("kullanıcı-id");
   ```

3. **Timestamp Sorunu**: Timestamp filtrelerinin doğru çalıştığını doğrulayın
   ```javascript
   // Timestamp olmadan direkt sorgu yapın
   const feeds = await window.feedDebugger.supabase
     .from("feeds")
     .select("*")
     .eq("user_id", "kullanıcı-id")
     .is("deleted_at", null);
   console.log("Doğrudan besleme sonuçları:", feeds);
   ```

## Tanılama Sonuçlarını Yorumlama

Tanılama sonuçlarını değerlendirirken şu noktalara dikkat edin:

1. **Aşama Analizi**: Verinin hangi aşamada kaybolduğunu belirlemeye çalışın

   - Veritabanında veri var, ancak repository'de yoksa: Repository sorunu
   - Repository'de veri var, ancak serviste yoksa: Servis sorunu
   - Tüm katmanlarda veri var, ancak UI'da yoksa: UI entegrasyon sorunu

2. **Hata Tipleri**:

   - `404 Not Found`: Kaynak bulunamadı
   - `403 Forbidden`: Yetkilendirme sorunu
   - `ReferenceError` veya `TypeError`: Kodlama hatası
   - `undefined` değerler: Veri yapısı uyumsuzluğu

3. **Darboğazlar**:
   - Önbellek temizleme: Eski veriler görüntüleniyor olabilir
   - Feed türü filtreleme: Feed türleri doğru filtrelenmemiş olabilir

## Gelişmiş Teşhis Araçları

Daha karmaşık sorunlar için konsol'da şu gelişmiş teşhis araçlarını kullanabilirsiniz:

```javascript
// EnhancedFeedRepository'yi doğrudan test edin
import { enhancedFeedRepository } from "@/repositories/enhancedFeedRepository";
const result = await enhancedFeedRepository.getFeeds("kullanıcı-id");
console.log(result);

// EnhancedFeedService'i doğrudan test edin
import { enhancedFeedService } from "@/services/enhancedFeedService";
const result = await enhancedFeedService.getFeeds("kullanıcı-id");
console.log(result);

// DbClient önbelleğini temizleyin
import dbClient from "@/lib/db";
dbClient.clearCache();
```

## Geliştirici Notları

- `enhancedFeedRepository` ve `enhancedFeedService` singleton nesnelerdir, yani uygulamada tek bir örnek bulunur.
- Veritabanı sorguları genellikle önbelleğe alınır, bu da nadiren eski verilerin görüntülenmesine neden olabilir.
- RSS ve YouTube içerikleri paralel sorgulanır, bu nedenle birinde sorun olduğunda diğeri hala çalışabilir.

## Kontrol Listesi

Veri sorunlarını giderirken şu kontrol listesini kullanın:

1. ✓ Kullanıcı oturumu aktif mi?
2. ✓ Veritabanı bağlantısı çalışıyor mu?
3. ✓ Veritabanında besleme kayıtları var mı?
4. ✓ Veritabanında içerik öğeleri var mı?
5. ✓ Repository katmanı verileri alabiliyor mu?
6. ✓ Servis katmanı verileri işleyebiliyor mu?
7. ✓ Önbellek eski verileri göstermiyor mu?
8. ✓ Feed türleri doğru filtreleniyor mu?

---

Bu rehber, FeedTune uygulamasında veri akışını anlamanıza ve sorunları teşhis etmenize yardımcı olmak için oluşturulmuştur. Sorunlar devam ederse, geliştirici ekibine başvurun ve tanılama sonuçlarınızı paylaşın.
