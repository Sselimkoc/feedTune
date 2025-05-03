# YouTube API Endpoints

Bu klasörde YouTube ile ilgili tüm API endpoint'leri yer almaktadır. Bu yapı, dağınık ve farklı klasörler altında bulunan YouTube ile ilgili API'leri tek bir yerde toplamak amacıyla oluşturulmuştur.

## Endpoint Yapısı

```
/api/youtube
├── add/                  # Yeni YouTube kanalı ekleme
├── channel-search/       # YouTube kanal arama (web scraping ile)
├── delete/               # YouTube kanalı silme
├── parse/                # YouTube URL/ID ayrıştırma
├── search/               # YouTube kanal arama (channel-search kullanır)
├── sync/                 # YouTube kanal içeriğini senkronize etme
├── to-rss/               # YouTube URL'lerini RSS feed URL'lerine dönüştürme
└── update/               # YouTube kanal bilgilerini güncelleme
```

## Endpoint'ler ve Kullanımları

### `/api/youtube/add`

**Amaç:** Yeni bir YouTube kanalı ekler.
**Metod:** POST
**Parametreler:** 
- `channelId`: Eklenecek YouTube kanal ID'si, URL'si veya kullanıcı adı.

### `/api/youtube/channel-search`

**Amaç:** YouTube kanallarını arar (web scraping yöntemiyle).
**Metod:** POST
**Parametreler:**
- `query`: Aranacak kanal adı.

### `/api/youtube/delete`

**Amaç:** Mevcut bir YouTube kanalını siler.
**Metod:** POST, DELETE
**Parametreler:**
- `feedId`: Silinecek besleme/kanal ID'si.

### `/api/youtube/parse`

**Amaç:** YouTube URL veya ID'sini ayrıştırır ve kanal bilgilerini döndürür.
**Metod:** GET
**Parametreler:**
- `channelId`: Ayrıştırılacak YouTube kanal ID'si, URL'si veya kullanıcı adı.

### `/api/youtube/search`

**Amaç:** YouTube kanallarını arar, ilk olarak özel API'yi kullanır, sonra channel-search'e geri döner.
**Metod:** POST
**Parametreler:**
- `url`: YouTube URL'si (isteğe bağlı)
- `keyword`: Arama anahtar kelimesi (isteğe bağlı)

### `/api/youtube/sync`

**Amaç:** YouTube kanal videolarını senkronize eder.
**Metod:** POST
**Parametreler:**
- `feedId`: Senkronize edilecek besleme/kanal ID'si.
- `userId`: Kullanıcı ID'si.

### `/api/youtube/to-rss`

**Amaç:** YouTube URL'lerini RSS feed URL'lerine dönüştürür.
**Metod:** POST
**Parametreler:**
- `url`: Dönüştürülecek YouTube URL'si.

### `/api/youtube/update`

**Amaç:** Mevcut bir YouTube kanal bilgilerini günceller.
**Metod:** POST, PUT
**Parametreler:**
- `feedId`: Güncellenecek besleme/kanal ID'si. 