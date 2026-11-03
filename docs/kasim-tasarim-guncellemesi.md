# Kasım 2026: Branşa Özel Tasarım Güncellemesi

Melih'in Figma'daki yeni ekranları (futbol, basketbol, voleybol, tenis) uygulamaya taşındı.
Kaynak: Figma dosyası `Cp8Y3CEBaEeAWEdOOd1ikx`, renkler ve yerleşim Figma MCP ile tasarımdan okundu.

## 1. Branş temaları

Her branşın kendi vurgu rengi var. Renkler yalnızca `src/app/globals.css` dosyasında tanımlı (`data-sport` seçicileri).

| Branş | Koyu tema | Açık tema |
|---|---|---|
| ⚽ Futbol | `#00e676` | `#00c46a` |
| 🏀 Basketbol | `#ff8a00` | `#e67700` |
| 🏐 Voleybol | `#b388ff` | `#7c4dff` |
| 🎾 Tenis | `#00d4ff` | `#0096c7` |

- **Ana sayfa:** seçili branş filtresi `<html data-sport>` değerini değiştirir; alt menü, butonlar ve doluluk çubukları o rengi alır. "Tümü" seçiliyken futbol yeşili kullanılır.
- **Maç sayfaları:** `src/app/mac/[id]/layout.tsx` maçın branşını kapsayıcıya yazar; maç detayı, dizilim, değerlendirme ve istek ekranları maçın rengindedir.
- Açık temada, okunabilirlik için aynı tonların koyusu kullanılır.

## 2. Branşa özel saha dizilimi

`src/lib/courts.ts` (bölgeler) ve `src/components/CourtLines.tsx` (SVG saha çizgileri).

| Branş | Saha | Seçilebilir yerler |
|---|---|---|
| Futbol | Tam saha | Orta Saha, Sol/Sağ Bek, Libero |
| Basketbol | Yarım saha (pota üstte) | Pivot, Uzun Forvet, Şutör, Kanat, Oyun Kurucu |
| Voleybol | Filenin bir yanı, hücum çizgisi | Smaçör, Orta Oyuncu, Pasör Çaprazı, Arka Smaçör, Libero, Pasör |
| Tenis | Tam kort | Tekler: "Rakip Olarak Katıl" · Çiftler: boş yerin tarafına göre "Rakip" ya da "Partner" |

- Önceden yalnızca futbolda saha seçimi vardı; artık her branşta "Maça Katıl" dizilim ekranına gider.
- Tenis rolleri izleyiciye göredir: kadrodaysan kendi tarafın Partner, karşı taraf Rakip; değilsen organizatörün tarafı esas alınır.
- Bütün yerler doluysa ama kontenjan varsa **"Yedek Olarak Katıl"** ile mevkisiz katılınır.
- Örnek veri: `batipark-basket`, `salon-voleybol`, `merkez-kort-ciftler` maçları (`src/lib/db/seed.ts`).

## 3. Branşa özel övgüler ve radar grafiği

`src/lib/praise.ts`: her branşın 4 övgüsü var; **Centilmen** hepsinde ortak.

| Branş | Övgüler (radar ekseni) |
|---|---|
| Futbol | 🤝 Centilmen (Fair Play) · ⚡ Dinamik (Hız) · 🧱 Kaya Gibi (Savunma) · 🧠 Taktiksel (Taktik) |
| Basketbol | 🤝 Centilmen · 🎯 Keskin Şutör (Şut) · 🧠 Oyun Kurucu (Asist) · 🧱 Ribaund Canavarı (Ribaund) |
| Voleybol | 🤝 Centilmen · 💥 Smaç Ustası (Smaç) · 🧱 Blok Duvarı (Blok) · 🎯 Altın Pas (Pas) |
| Tenis | 🤝 Centilmen · 🚀 Servis Canavarı (Servis) · 🎾 File Ustası (Vole) · 🔋 Yorulmaz (Kondisyon) |

- Maç sonu değerlendirmede yalnızca **o maçın branşının** övgüleri çıkar; başka branşın övgüsü API'de reddedilir (400).
- Profilde branş sekmeleri var: her sekme o branşın övgülerini ve radar grafiğini gösterir. Eksenler = 4 övgü + Dakiklik + Güvenilirlik.
- **Tasarımdan bilinçli sapma:** Figma'daki radar eksenleri (Şut, Ribaund, Fizik, Savunma…) uygulamada **övgülerden** hesaplanır. Oyuncu kendine puan veremez; her değer takım arkadaşlarının oylarından gelir (Malone ve Lepper: tanınma; manipülasyona karşı).
- Eski basketbol/voleybol maçlarında verilmiş futbol övgüleri, şema güncellemesinde aynı sıradaki branş övgüsüne çevrildi (`schema.ts`).

## 4. Güvenilirlik kademesi ("EFSANEVİ")

`reliabilityTier()` (`src/lib/gamification.ts`): profildeki puanın altında görünür.

| Puan | Kademe |
|---|---|
| 4.7 ve üstü | Efsanevi |
| 4.0 – 4.6 | Güvenilir |
| 3.0 – 3.9 | Gelişiyor |
| 3.0 altı | Riskli |

## 5. Maç Geçmişi ekranı

`/profil/gecmis` (profil → Son Maçlar → **Tümünü Gör**), `src/lib/history.ts`.

- Üstte **Toplam Maç** ve **Kazanılan Övgü**, altta aylara göre maçlar.
- Durum oylardan gelir: **Oynandı** (çoğunluk "Geldi", XP verildi) · **Gidilmedi** ("Katılmadın (Puan Düştü)") · **Onay Bekliyor**.
- Her maçta alınan övgüler, MVP ve "Organizatördün" etiketi görünür. Branş filtresi vardır (`?brans=basketbol`).

## Sonraki adımlar (tasarımda olup henüz yapılmayanlar)

- Keşfet ekranında arama sekmeleri (Tesisler / Oyuncular / Takımlar), son aramalar, "Bu hafta yükselişte".
- Maç Oluştur'da süre, aranan mevkiler, tenis için kort zemini ve oyuncu tipi (Rakip / Partner).

## Testler

`tests/gamification.test.ts` ve `tests/database.test.ts`'e 9 yeni test eklendi (saha bölgeleri, tenis rolleri, branş övgüleri, radar eksenleri, kademe, yanlış branş övgüsünün reddi, Maç Geçmişi). Toplam: **90 test**.
