# Geliştirilmiş Feed Servis ve Repository Mimarisi

Bu dokümantasyon, FeedTune uygulaması için geliştirilen optimize edilmiş veri erişim ve servis katmanı mimarisini detaylandırır.

## Mimariye Genel Bakış

Yeni mimari, aşağıdaki üç ana katmandan oluşur:

1. **Veritabanı İstemcisi (DbClient)**: Merkezi veritabanı bağlantı ve sorgu yönetimi.
2. **Geliştirilmiş Repository Katmanı (EnhancedFeedRepository)**: Veri erişim mantığı, sorgu optimizasyonu ve paralel işlemler.
3. **Geliştirilmiş Servis Katmanı (EnhancedFeedService)**: İş mantığı, hata yönetimi ve kullanıcı arayüzü entegrasyonu.

## Klasik ve Yeni Mimari Karşılaştırması

| Özellik | Klasik Mimari | Geliştirilmiş Mimari |
|---------|---------------|----------------------|
| **Veri Erişimi** | Doğrudan Supabase çağrıları | Merkezi dbClient üzerinden erişim |
| **Önbellekleme** | Sınırlı, manuel | Otomatik, sorgu bazlı TTL önbellekleme |
| **Paralel Sorgular** | Sınırlı | RSS ve YouTube içeriği için paralel sorgular |
| **Hata Yönetimi** | Temel düzeyde | Kapsamlı ve tutarlı hata yakalama |
| **Timestamp Yönetimi** | Kısıtlı | İşlemler arasında tutarlı timestamp desteği |
| **Arayüz** | Her serviste farklı | Tüm servislerde standart arayüz |

## EnhancedFeedRepository

`EnhancedFeedRepository` veri erişim katmanını temsil eder ve DbClient üzerinden veritabanına erişir.

### Temel Yöntemler

- **getFeeds(userId, timestamp)**: Kullanıcının aboneliklerini getirir
- **getFeedItems(feedIds, limit, timestamp, userId)**: Feed içeriklerini getirir
- **getRssItems/getYoutubeItems**: İçerik türüne göre paralel sorgular yapar
- **getFavoriteItems/getReadLaterItems**: Kullanıcı koleksiyonlarını yönetir
- **getUserInteractions**: Kullanıcı etkileşimlerini getirir
- **updateItemInteraction**: Kullanıcı etkileşimlerini günceller

### Anahtar İyileştirmeler

1. **Parallel Querying**: RSS ve YouTube içeriği için eşzamanlı sorgular
   ```javascript
   // Önceki
   const allItems = await getItems(feedIds);
   
   // Geliştirilmiş
   const [rssItems, youtubeItems] = await Promise.all([
     getRssItems(rssFeedIds),
     getYoutubeItems(youtubeFeedIds)
   ]);
   ```

2. **Timestamp-Based Caching**: Veri değişikliklerini izlemek için tutarlı timestamp kullanımı
   ```javascript
   // Timestamp ile sorgu
   if (timestamp) {
     query.gt = { updated_at: timestamp };
   }
   ```

3. **Batch Processing**: Büyük veri kümeleri için toplu işlem desteği
   ```javascript
   // Veri partilere ayrılır
   for (let i = 0; i < items.length; i += batchSize) {
     const batch = items.slice(i, i + batchSize);
     // Batch işlenir
   }
   ```

## EnhancedFeedService

`EnhancedFeedService`, repository'yi kullanarak iş mantığını uygular ve UI entegrasyonu sağlar.

### Temel Yöntemler

- **getFeeds/getFeedItems**: Feed verilerini getirir
- **getFavorites/getReadLaterItems**: Kullanıcı koleksiyonlarını getirir
- **toggleItemXXXStatus**: Öğe durumlarını değiştirir (okudu, favori vb.)
- **addFeed/deleteFeed**: Feed yönetimi
- **cleanUpOldItems**: Eski içerik temizleme

### Anahtar İyileştirmeler

1. **Tutarlı Hata Yönetimi**: Tüm metodlarda tutarlı try-catch ve hata işleme
   ```javascript
   try {
     // İşlemler
   } catch (error) {
     console.error("Özel hata mesajı:", error);
     toast.error("UI dostu hata mesajı");
     return boşDeğer; // Uygun varsayılan değer
   }
   ```

2. **UI Bildirimleri**: Kullanıcı bilgilendirmesi için entegre toast bildirimleri

3. **Parameter Validation**: Tüm kullanıcı girişlerinin detaylı doğrulaması
   ```javascript
   if (!userId) throw new Error("User ID is required");
   if (!itemType || !["rss", "youtube"].includes(itemType)) {
     throw new Error("Invalid item type");
   }
   ```

## Mimari Katmanları Kullanma

### Hooks ile Entegrasyon

Feed işlevselliği, `useFeedService` custom hook'u aracılığıyla UI'ya sunulur. Bu hook, React Query ile entegre edilmiştir:

```javascript
export function useFeedService() {
  // React Query kullanımı
  const { data: feeds } = useQuery({
    queryKey: ["feeds", userId],
    queryFn: () => enhancedFeedService.getFeeds(userId)
  });
  
  // Eylemler için callback'ler
  const toggleRead = useCallback((itemId, isRead, itemType) => {
    toggleReadMutation.mutate({ itemId, isRead, itemType });
  }, []);
  
  return { feeds, toggleRead, /* diğer veri ve eylemler */ };
}
```

### Bileşenlerde Kullanım

UI bileşenleri, feed verilerine ve eylemlerine hook aracılığıyla erişir:

```jsx
function FeedComponent() {
  const { feeds, items, toggleRead, isLoading } = useFeedService();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {items.map(item => (
        <FeedItem 
          key={item.id}
          item={item}
          onReadToggle={() => toggleRead(item.id, !item.is_read, item.type)}
        />
      ))}
    </div>
  );
}
```

## Senkronizasyon ve Verimlilik Stratejileri

### Optimistic Updates

Kullanıcı eylemlerinde iyimser güncelleme stratejisi kullanılarak arayüz daha tepkisel hale getirilir:

```javascript
// 1. Mutasyon başlatma
toggleReadMutation.mutate({ itemId, isRead, itemType });

// 2. onMutate içinde yerel güncelleme
onMutate: async (variables) => {
  // Önce mevcut veriyi yedekle
  const previousData = queryClient.getQueryData([...]);
  
  // Optimistic update
  queryClient.setQueryData([...], oldData => (
    oldData.map(item => 
      item.id === variables.itemId 
        ? { ...item, is_read: variables.isRead } 
        : item
    )
  ));
  
  return { previousData };
}

// 3. Hata durumunda geri alma
onError: (error, variables, context) => {
  // Yedeklenen veriyi geri yükle
  queryClient.setQueryData([...], context.previousData);
}
```

### Batch Processing ve Pagination

Büyük veri kümeleri, parçalara ayrılarak işlenir:

- Feed listeleri ve öğeleri için sayfalama
- Çok sayıda öğe için toplu veritabanı işlemleri
- Her feed için öğe sayısı sınırlaması

## Performans İyileştirmeleri

1. **DbClient Önbellekleme**: Tekrarlanan sorguların önbelleklenmesi
2. **Paralel Veri Getirme**: Performans için Promise.all kullanımı
3. **Verimli Timestamp Kullanımı**: Yalnızca değişen verilerin getirilmesi
4. **Gereksiz Yeniden Oluşturmaları Önleme**: useMemo ve useCallback ile optimizasyon
5. **React Query Önbellekleme**: UI tarafında veri önbellekleme

## Yaygın Kullanım Örnekleri

### Feed Listesi Getirme

```javascript
// UI Bileşeni
const { feeds, isLoadingFeeds } = useFeedService();

// Hook İçinde
const { data: feeds } = useQuery({
  queryKey: ["feeds", userId],
  queryFn: () => enhancedFeedService.getFeeds(userId)
});

// Servis Katmanı
async getFeeds(userId, timestamp = null) {
  try {
    return await this.repository.getFeeds(userId, timestamp);
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return [];
  }
}

// Repository Katmanı
async getFeeds(userId, timestamp = null) {
  const query = {
    select: "id, title, url, icon, category_id, type, last_fetched_at, error_count",
    eq: { user_id: userId, is_active: true }
  };
  
  if (timestamp) {
    query.gt = { updated_at: timestamp };
  }
  
  const { data } = await dbClient.query("feeds", query);
  return data || [];
}
```

### Feed İçeriği Getirme

```javascript
// Servis Katmanı
async getFeedItems(feedIds, limit = 10, userId = null, timestamp = null) {
  try {
    return await this.repository.getFeedItems(feedIds, limit, timestamp, userId);
  } catch (error) {
    console.error("Error fetching feed items:", error);
    return [];
  }
}

// Repository Katmanı
async getFeedItems(feedIds, limit = 10, timestamp = null, userId = null) {
  // RSS ve YouTube feed'lerini ayır
  const feedTypeMap = await this._getFeedTypeMap(feedIds);
  const rssFeedIds = [...];
  const youtubeFeedIds = [...];
  
  // Paralel sorgular
  const [rssItems, youtubeItems] = await Promise.all([
    this.getRssItems(rssFeedIds, limit, timestamp),
    this.getYoutubeItems(youtubeFeedIds, limit, timestamp)
  ]);
  
  // Kullanıcı etkileşimlerini getir (varsa)
  let userInteractions = {};
  if (userId) {
    const allItemIds = [...rssItems.map(i => i.id), ...youtubeItems.map(i => i.id)];
    userInteractions = await this.getUserInteractions(userId, allItemIds);
  }
  
  // İçerikleri birleştir ve kullanıcı etkileşimlerini ekle
  return this._combineAndEnrichItems(rssItems, youtubeItems, userInteractions);
}
```

## Sonuç

Geliştirilmiş feed servis ve repository mimarisi, veritabanı etkileşimlerinde tutarlılık, verimlilik ve güvenilirlik sağlar. Repository ve servis katmanları, iş mantığını veri erişiminden temiz bir şekilde ayırır, test edilebilirliği artırır ve kodun bakımını kolaylaştırır. Paralel sorgular, önbellekleme ve optimize edilmiş veri işleme, yüksek performans sağlar. 