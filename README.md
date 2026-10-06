# Qadro

**Eksik oyuncu derdine son.** Qadro; futbol, basketbol ve voleybolda eksik oyuncu ya da oynanacak maç bulmayı sağlayan, oyunlaştırılmış bir spor eşleştirme uygulamasıdır.

Bu depo, **Web Programlama** ve **Oyunlaştırma Uygulamaları** derslerinin ortak dönem projesidir.

## Teknolojiler

| Katman | Seçim |
|---|---|
| Çatı | Next.js 15 (App Router), Node.js |
| Dil | TypeScript |
| Stil | Tailwind CSS 4 (Figma'dan alınan tasarım token'larıyla) |
| İkonlar | lucide-react |
| Harita | Leaflet + OpenStreetMap (ücretsiz, API anahtarı gerekmez) |
| Yayın | Vercel |
| Veritabanı (planlanan) | Supabase (PostgreSQL + Auth) |

## Kurulum

```bash
git clone https://github.com/Er4y33/qadro.git
cd qadro
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın. Uygulama mobil öncelikli tasarlandığı için en iyi görünüm tarayıcının mobil görünümündedir (F12 → cihaz simgesi).

## Ekranlar

| Yol | Ekran | Render stratejisi |
|---|---|---|
| `/hosgeldin` | Tanıtım (3 adım) | Statik (SSG) |
| `/giris` | Giriş | Statik (SSG) |
| `/` | Ana sayfa, spor filtresi, maç listesi | SSG + istemcide filtre (CSR) |
| `/mac/[id]` | Maç detayı | **SSR**: kontenjan her istekte güncel |
| `/mac/[id]/dizilim` | Saha dizilimi ve bölge seçimi | SSR + CSR |
| `/mac/olustur` | Maç oluşturma formu | CSR |
| `/sohbetler` | Takım sohbetleri | Statik (SSG) |
| `/sohbetler/[id]` | Sohbet odası | SSR |
| `/profil` | Oyuncu kartı, radar grafiği, tema değiştirme | Statik (SSG) |
| `/kesfet` | Haritada açık maçlar (Leaflet + OpenStreetMap) | SSG + harita istemcide (CSR) |
| `/saha/[id]` | Saha Konumu, yol tarifi | **SSG**: `generateStaticParams` ile her tesis build anında üretilir |

| `/siralama` | Şehrin En İyileri (ilçe sıralaması) | **ISR**: 5 dakikada bir arka planda yenilenir |
| `/mac/[id]/degerlendir` | Takımı Değerlendir | SSR + CSR |
| `/sos` | S.O.S çağrısı | SSR + CSR |
| `/bildirimler` | Bildirimler | Statik (SSG) |

## Klasör yapısı

```
src/
├── app/                 # Sayfalar (her klasör bir URL)
│   ├── (tabs)/          # Alt menülü sekmeler: /, /kesfet, /sohbetler, /profil (+ açılış ekranı)
│   ├── mac/             # Maç detayı, dizilim, oluşturma
│   ├── sohbetler/[id]/  # Sohbet odası
│   ├── saha/[id]/       # Saha Konumu (harita)
│   ├── hosgeldin/       # Tanıtım ekranları
│   ├── giris/           # Giriş ekranı
│   └── globals.css      # Tasarım token'ları: renkler, açık/koyu tema
├── components/          # Tekrar kullanılan bileşenler
│   └── map/             # Harita (yalnızca tarayıcıda yüklenir)
└── lib/
    ├── types.ts         # Veri tipleri
    ├── mock-data.ts     # Geçici örnek veri
    └── gamification.ts  # XP, seviye ve güvenilirlik kuralları
```

## Belgeler

| Belge | Ders |
|---|---|
| [Oyunlaştırma entegrasyon rotası](docs/oyunlastirma-rotasi.md) | Oyunlaştırma Uygulamaları |
| [Web mimarisi](docs/web-mimarisi.md) | Web Programlama |
| [1. hafta: İlk Git deposu](docs/hafta-01-ilk-git-deposu.md) | Web Programlama |

## Oyunlaştırma

Oyunlaştırma kuralları `src/lib/gamification.ts` dosyasındadır ve **D6 çerçevesine** göre tasarlanmıştır:

- **İş hedefi:** Maç dolma oranını artırmak, maça gelmeme (no-show) oranını düşürmek.
- **Hedef davranışlar:** Maça gelmek, zamanında gelmek, maç sonu değerlendirme yapmak, S.O.S çağrısına yanıt vermek. Her biri XP kazandırır.
- **Qadro Puanı (güvenilirlik):** Harcanabilir bir para birimi değil, itibar ölçüsüdür. Aşırı gerekçelendirme etkisinden kaçınmak için bilinçli olarak böyle tasarlandı.

## Tasarım

Arayüz, Melih Atahan Akgün'ün Figma tasarımlarından birebir koda aktarıldı. Renkler `src/app/globals.css` içinde CSS değişkeni olarak tanımlı; tema değiştirmek için yalnızca bu dosyayı güncellemek yeterli.

## Yol haritası

- [x] Proje iskeleti, Git deposu ([1. hafta](docs/hafta-01-ilk-git-deposu.md))
- [x] Figma ekranlarının koda aktarılması
- [ ] Supabase ile kimlik doğrulama ve veritabanı
- [ ] REST API (`/api/matches`, `/api/events`)
- [x] Harita (Leaflet + OpenStreetMap), Saha Konumu ekranı
- [x] Başarım (rozet) sistemi, Takımı Değerlendir, Şehrin En İyileri (ISR), S.O.S, Bildirimler
- [ ] S.O.S (Joker) sistemi
- [ ] Kullanıcı ve yönetici dashboard'u
- [ ] Mahalle ligleri (ISR)
- [x] PWA bildirimi ve ikonlar (ana ekrana ekleme)
- [ ] Çevrimdışı çalışma (service worker)

## Ekip

| Kişi | Rol |
|---|---|
| Eray Çocuk ([@Er4y33](https://github.com/Er4y33)) | Geliştirme, oyunlaştırma tasarımı |
| Melih Atahan Akgün | UI/UX tasarım (Figma) |
