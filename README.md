# FeedTune - Modern RSS Okuyucu Uygulaması

FeedTune, modern web teknolojileriyle geliştirilmiş kullanıcı dostu bir RSS ve YouTube abonelik yönetim uygulamasıdır. Bu uygulama, favori web sitelerinizi ve YouTube kanallarınızı tek bir yerde takip etmenizi sağlar.

## 🚀 Özellikler

- **RSS Feed Yönetimi**: Web sitelerinin RSS beslemelerini ekleyebilir, kategorize edebilir ve takip edebilirsiniz
- **YouTube RSS Desteği**: YouTube kanallarını RSS üzerinden takip edebilirsiniz
- **Favori İçerikler**: Beğendiğiniz içerikleri favorilere ekleyebilirsiniz
- **Daha Sonra Oku**: İlginizi çeken içerikleri daha sonra okumak üzere kaydedebilirsiniz
- **Kullanıcı Yönetimi**: Kayıt olabilir ve giriş yapabilirsiniz
- **Tema Desteği**: Karanlık ve aydınlık temalar arasında geçiş yapabilirsiniz
- **Dil Desteği**: Uygulama farklı dil seçenekleri sunar
- **Responsive Tasarım**: Mobil ve masaüstü cihazlara uyumlu arayüz
- **Performans Odaklı Mimari**: Çok katmanlı mimari ve önbellekleme ile optimize edilmiş performans
- **Paralel Veri İşleme**: RSS ve YouTube içeriklerini paralel olarak işleme

## 🔧 Kullanılan Teknolojiler

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Bileşenleri**: Radix UI ve Shadcn
- **Stil**: Tailwind CSS
- **Durum Yönetimi**: Zustand
- **Veri Çekme**: TanStack Query (React Query)
- **Veritabanı**: Supabase
- **Kimlik Doğrulama**: Supabase Auth
- **Dil Desteği**: react-i18next
- **Form Yönetimi**: react-hook-form
- **Şema Doğrulama**: Zod
- **İkonlar**: Lucide React

## 🏗️ Mimari Yapı

FeedTune, optimum performans, bakım kolaylığı ve ölçeklenebilirlik için çok katmanlı bir mimari kullanır:

1. **Veritabanı Katmanı**: Merkezi DbClient ile veritabanı etkileşimleri
2. **Repository Katmanı**: Veri erişim ve manipülasyon mantığı
3. **Servis Katmanı**: İş mantığı ve kullanıcı arayüzü entegrasyonu
4. **Hook Katmanı**: React bileşenleri için veri ve eylemler
5. **UI Katmanı**: Kullanıcı arayüzü bileşenleri

### Performans İyileştirmeleri

- **Merkezi Önbellekleme**: Her sorgu için önbellek desteği
- **Paralel Sorgular**: RSS ve YouTube içerikleri eşzamanlı getirme
- **Timestamp Tabanlı Değişiklik Takibi**: Yalnızca yeni/değişen veriyi getirme
- **Optimistic Updates**: Sunucu yanıtı beklenmeden arayüzü güncelleme
- **Toplu Veri İşleme**: Büyük veri kümeleri için optimize edilmiş işleme

## 📂 Proje Yapısı

```
src/
├── app/                  # Next.js App Router sayfaları
│   ├── api/              # API rotaları
│   ├── feeds/            # Feed listeleme sayfası
│   ├── favorites/        # Favoriler sayfası
│   ├── read-later/       # Daha sonra oku sayfası
│   ├── settings/         # Ayarlar sayfası
│   ├── layout.js         # Ana sayfa düzeni
│   └── page.js           # Ana sayfa
├── components/           # React bileşenleri
│   ├── ui/               # Temel UI bileşenleri
│   ├── layout/           # Düzen bileşenleri
│   └── features/         # Özellik bileşenleri
├── debug/                # Hata ayıklama araçları ve yardımcılar
├── hooks/                # Özel React hookları
│   └── features/         # Özelliklerle ilgili hooklar
├── lib/                  # Yardımcı fonksiyonlar ve kütüphaneler
│   └── db/               # Veritabanı bağlantı ve istemcisi
├── locales/              # Dil dosyaları
├── providers/            # Context sağlayıcılar
├── repositories/         # Veri erişim katmanı
├── services/             # Servis katmanı ve harici servislerle iletişim
├── store/                # Zustand durum mağazaları
└── docs/                 # Dokümantasyon dosyaları
```

## 🏁 Başlangıç

### Ön Koşullar

- Node.js (16.x veya üzeri)
- npm veya yarn
- Supabase hesabı

### Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/sselimkoc/feedtune.git
   cd feedtune
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   # veya
   yarn
   ```

3. `.env.local` dosyasını oluşturun ve gerekli ortam değişkenlerini ekleyin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📱 Uygulama Kullanımı

### RSS Besleme Ekleme

1. "Beslemeler" sayfasına gidin
2. "Yeni Besleme Ekle" düğmesine tıklayın
3. RSS URL'sini girin ve "Ekle" düğmesine tıklayın

### YouTube Kanalı Ekleme

1. "Beslemeler" sayfasına gidin
2. "YouTube Kanalı Ekle" düğmesine tıklayın
3. YouTube kanal URL'sini girin ve "Ekle" düğmesine tıklayın

### Favori İçerikler

1. Herhangi bir içeriğin yanındaki "Favorilere Ekle" simgesine tıklayın
2. Tüm favorilerinizi "Favoriler" sayfasında görüntüleyebilirsiniz

### Daha Sonra Oku

1. Herhangi bir içeriğin yanındaki "Daha Sonra Oku" simgesine tıklayın
2. Bu içerikleri "Daha Sonra Oku" sayfasında bulabilirsiniz

## 📚 Dokümantasyon

Daha detaylı teknik bilgi için:

- [Veritabanı Mimarisi](src/docs/DATABASE_ARCHITECTURE.md)
- [Geliştirilmiş Mimari](src/docs/ENHANCED_ARCHITECTURE.md)
- [Performans Optimizasyonları](src/docs/PERFORMANCE.md)

### Geliştirici Belgeleri

- [Hata Ayıklama Rehberi](src/docs/DEBUGGING_GUIDE.md) - Veri akışı sorunları ve çözüm önerileri
- [Sistem Tanılama](src/debug/feedDebugger.js) - Gelişmiş tanılama ve hata ayıklama araçları

## 💡 Gelecek Özellikler

- [ ] RSS içeriklerini otomatik güncelleme
- [ ] İçerik filtreleme ve sıralama
- [ ] İçerik paylaşma
- [ ] Mobil uygulama
- [ ] Daha gelişmiş kategorilendirme
- [ ] İçerik önerileri
- [ ] Offline modu
- [x] Performans optimizasyonları
- [x] Geliştirilmiş veritabanı mimarisi

## 🤝 Katkıda Bulunma

Katkıda bulunmak istiyorsanız:

1. Projeyi forklayın
2. Özellik dalını oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Dalınıza push yapın (`git push origin yeni-ozellik`)
5. Bir Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) ekibi
- [Tailwind CSS](https://tailwindcss.com/) ekibi
- [Radix UI](https://www.radix-ui.com/) ekibi
- [Supabase](https://supabase.io/) ekibi
- Açık kaynak topluluğu
