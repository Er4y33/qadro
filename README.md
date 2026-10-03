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
| Yayın | Vercel |
| Veritabanı (planlanan) | Supabase (PostgreSQL + Auth) |

## Kurulum

```bash
git clone https://github.com/<kullanici-adi>/qadro.git
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
| `/kesfet` | Harita (yer tutucu) | Statik (SSG) |

Lig tabloları eklendiğinde **ISR** (belirli aralıklarla yenilenen statik sayfa) kullanılacak.

## Klasör yapısı

```
src/
├── app/                 # Sayfalar (her klasör bir URL)
│   ├── (tabs)/          # Alt menülü sekmeler: /, /kesfet, /sohbetler, /profil
│   ├── mac/             # Maç detayı, dizilim, oluşturma
│   ├── sohbetler/[id]/  # Sohbet odası
│   ├── hosgeldin/       # Tanıtım ekranları
│   ├── giris/           # Giriş ekranı
│   ├── loading.tsx      # Açılış (splash) ekranı
│   └── globals.css      # Tasarım token'ları: renkler, açık/koyu tema
├── components/          # Tekrar kullanılan bileşenler
└── lib/
    ├── types.ts         # Veri tipleri
    ├── mock-data.ts     # Geçici örnek veri
    └── gamification.ts  # XP, seviye ve güvenilirlik kuralları
```

## Oyunlaştırma

Oyunlaştırma kuralları `src/lib/gamification.ts` dosyasındadır ve **D6 çerçevesine** göre tasarlanmıştır:

- **İş hedefi:** Maç dolma oranını artırmak, maça gelmeme (no-show) oranını düşürmek.
- **Hedef davranışlar:** Maça gelmek, zamanında gelmek, maç sonu değerlendirme yapmak, S.O.S çağrısına yanıt vermek. Her biri XP kazandırır.
- **Qadro Puanı (güvenilirlik):** Harcanabilir bir para birimi değil, itibar ölçüsüdür. Aşırı gerekçelendirme etkisinden kaçınmak için bilinçli olarak böyle tasarlandı.

## Tasarım

Arayüz, ekip arkadaşımızın Figma tasarımlarından birebir koda aktarıldı. Renkler `src/app/globals.css` içinde CSS değişkeni olarak tanımlı; tema değiştirmek için yalnızca bu dosyayı güncellemek yeterli.

## Yol haritası

- [x] Proje iskeleti, Git deposu (1. hafta)
- [x] Figma ekranlarının koda aktarılması
- [ ] Supabase ile kimlik doğrulama ve veritabanı
- [ ] REST API (`/api/matches`, `/api/events`)
- [ ] Harita (Leaflet + OpenStreetMap)
- [ ] S.O.S (Joker) sistemi
- [ ] Kullanıcı ve yönetici dashboard'u
- [ ] Mahalle ligleri (ISR)
- [ ] PWA desteği

## Ekip

- Atahan
- _(ekip arkadaşının adı)_
