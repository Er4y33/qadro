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

## 3. Branşa özel övgüler ve 6 eksenli radar (ekip kararı)

`src/lib/praise.ts`: her branşın **6 beceri övgüsü** radarın 6 eksenini besler (altıgen); 🤝 **Centilmen** her branşta ortaktır ve radarda ekseni yoktur.

| Branş | Radar ekseni ← övgü |
|---|---|
| Futbol | Hız ← ⚡ Dinamik · Refleks ← 🧤 Refleks Ustası · Fizik ← 💪 Güç Merkezi · Defans ← 🧱 Kaya Gibi · Pas ← 🎯 Pas Makinesi · Vizyon ← 🧠 Taktiksel |
| Basketbol | Şut ← 🎯 Keskin Şutör · Ribaund ← 🧱 Ribaund Canavarı · Fizik ← 💪 Güç Merkezi · Savunma ← 🛡️ Savunma Duvarı · Asist ← 🧠 Oyun Kurucu · T. Çalma ← 🦊 Top Hırsızı |
| Voleybol | Smaç ← 💥 Smaç Ustası · Blok ← 🧱 Blok Duvarı · Refleks ← 🐱 Kedi Refleksi · Manşet ← 🙌 Manşet Ustası · Pas ← 🎯 Altın Pas · Servis ← 🚀 Servis Makinesi |
| Tenis | Servis ← 🚀 Servis Canavarı · Forehand ← 💪 Forehand Ustası · Backhand ← 🎾 Backhand Ustası · Vole (File Önü) ← 🕸️ File Ustası · Hız ← ⚡ Şimşek · Kondisyon ← 🔋 Yorulmaz |

- Eksenler Figma'daki profillerden (futbol, basketbol, voleybol) ve ekibin tenis kararından alındı.
- **Değer nasıl hesaplanır:** oyuncu kendine puan veremez; her eksen takım arkadaşlarının verdiği övgü sayısıdır. En çok övgü alınan beceri 100, diğerleri ona oranla çizilir (güçlü yönlerin şekli).
- Maç sonu değerlendirmede yalnızca o maçın branşının övgüleri çıkar; başka branşın övgüsü API'de reddedilir (400).
- **Active Context:** profilde branş sekmesine dokununca bütün ekran (alt menü dahil) o branşın rengini alır; profilden çıkınca önceki tema döner. Maç Oluştur sihirbazı da seçilen branşın rengindedir.

## 3b. Takımlar = kayıtlı kadrolar (ekip kararı)

Kalıcı bir klan değil; "Cuma Halı Saha Tayfası" gibi sık oynanan kemik kadro. `src/lib/teams.ts`, ekran: **Profil → Takımlarım** (`/takimlar`).

1. Kadro bir kez kaydedilir (ad, branş, üyeler). Yalnızca **daha önce birlikte oynadığın** oyuncular eklenebilir (tanımadığın kişilere toplu davet/spam yok).
2. Maç Oluştur'un son adımında **Takımını Davet Et** seçilir (ya da takım kartında **Bu Takımla Maç Aç**).
3. Kadroda olmayan bütün üyelere **maç daveti** gider: Bildirimler'de "X seni maça davet etti", maç detayında davet kartı.
4. Davet edilenler maçın **takım sohbetini** hemen görür ve yazabilir; katılmak için yine sahada yerini seçer (kontenjan ve onaylı katılım kuralları değişmez).

Veritabanı: `teams`, `team_members`, `match_invites`. API: `GET/POST /api/teams`, `DELETE /api/teams/:id`, `POST /api/matches` gövdesinde `teamId`.

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

- Keşfet ekranında arama sekmeleri (Tesisler / Oyuncular / Takımlar), son aramalar, "Bu hafta yükselişte". (Takımlar artık var; Keşfet'teki arama sekmesi henüz yok.)
- Maç Oluştur'da süre, aranan mevkiler, tenis için kort zemini ve oyuncu tipi (Rakip / Partner).

## Testler

`tests/gamification.test.ts` ve `tests/database.test.ts`'e yeni testler eklendi: saha bölgeleri, tenis rolleri, branş övgüleri, 6 eksenli radar, kademe, yanlış branş övgüsünün reddi, Maç Geçmişi, takım kurma kuralı, takımla davet ve sohbet erişimi, takım silme yetkisi. Toplam: **93 test**.
