# Qadro Oyunlaştırma Entegrasyon Rotası

> **Ders:** Oyunlaştırma Uygulamaları
> **Proje:** Qadro, oyunlaştırılmış spor eşleştirme uygulaması
> **Hazırlayan:** Eray Çocuk · **Tasarım:** Melih Atahan Akgün

Bu belge, Qadro'ya hangi oyun mekaniklerinin, **hangi kurama dayanarak** ve **hangi sırayla** ekleneceğini anlatır. Rota, Werbach ve Hunter'ın **D6 çerçevesi** üzerine kurulmuştur.

---

## 1. Oyunlaştırma Nedir, Qadro Neden Oyunlaştırılıyor?

**Oyunlaştırma**, oyun tasarımı öğelerinin oyun dışı bağlamlarda kullanılmasıdır (Deterding ve ark., 2011). Qadro bir oyun değildir. Amaç, gerçek hayattaki bir süreci, yani **maç bulma ve maça gelme** sürecini oyunsu (*gameful*) hale getirmektir.

Oyunlaştırma burada eğlence için değil, gerçek bir sorunu çözmek için kullanılıyor: **"maça gelmeyen oyuncu"** sorunu. Halı saha organizasyonlarında son dakika iptalleri ve gelmeyen oyuncular maçların iptal olmasına yol açar.

---

## 2. D6 Çerçevesine Göre Tasarım

### 1. Define: İş hedeflerini tanımla

| Hedef | Ölçüt |
|---|---|
| Maçların dolma oranını artırmak | Dolan maç / açılan maç |
| **Maça gelmeme (no-show) oranını düşürmek** | Gelmeyen oyuncu / katılım sözü veren oyuncu |
| Son dakika eksiklerini hızlı kapatmak | S.O.S çağrısının yanıtlanma süresi |
| Topluluk kalitesini korumak | Maç sonu değerlendirme ortalaması |

### 2. Delineate: Hedef davranışları belirle

Puan verilecek davranışlar, iş hedeflerine doğrudan hizmet edenlerdir:

1. Maça katılmak ve **gerçekten gelmek**
2. **Zamanında** gelmek
3. Maç sonunda takım arkadaşlarını **değerlendirmek**
4. **S.O.S** çağrısına yanıt vermek
5. Maç **organize etmek**

"Uygulamaya giriş yapmak" gibi iş hedefine katkısı olmayan davranışlar **ödüllendirilmez**.

### 3. Describe: Oyuncuları tanı (Hexad)

Marczewski'nin **Hexad** modeline göre Qadro kullanıcıları ve onlara hitap eden mekanikler:

| Hexad tipi | Motivasyonu | Qadro'daki karşılığı |
|---|---|---|
| **Achiever** (Başarıcı) | Ustalık, ilerleme | Seviye, "Demir Adam" rozeti |
| **Socialiser** (Sosyalleşen) | Aidiyet, ilişki | Takım sohbeti, "Organizatör" ve "Adil Oyuncu" rozetleri |
| **Philanthropist** (Yardımsever) | Anlam, yardım etmek | S.O.S sistemi, "Kurtarıcı" rozeti |
| **Free Spirit** (Özgür Ruh) | Özerklik, keşif | Harita, "Saha Kaşifi" ve "Çok Yönlü" rozetleri |
| **Player** (Oyuncu) | Ödül | MVP seçimi, sezon sonu sıralaması |
| **Disruptor** (Bozucu) | Değişim, sınırları zorlamak | Kötüye kullanım bildirimi, değerlendirme sistemi |

Disruptor tipi için özel bir ödül yoktur. Bu tipin enerjisi, sistemi kandırmaya çalışanları bildirme gibi olumlu bir yöne kanalize edilir.

### 4. Devise: Etkinlik döngülerini kur

**Katılım döngüsü (engagement loop):**

```
Motivasyon        →  Eylem            →  Geri bildirim
"Bu akşam maç var"   Maça katıl ve git    XP, güvenilirlik artışı,
                                          takım arkadaşından değerlendirme
         ↑                                         │
         └─────────── yeni motivasyon ←────────────┘
```

**İlerleme döngüsü (progression loop):** Seviye → rozet → sezon sıralaması. Seviye eğrisi yükseldikçe yavaşlar (`xpForNextLevel`), böylece ilk seviyeler hızlı gelir ve yeni kullanıcı başarı hissini erken yaşar.

### 5. Don't forget the fun: Eğlenceyi unutma

Qadro'nun asıl eğlencesi **sporun kendisidir**, uygulama bunu gölgelememelidir. Uygulama içindeki eğlence öğeleri:

- **Saha dizilimi:** Maça katılırken sahada mevki seçmek
- **Oyuncu kartı:** FIFA kartlarını andıran radar grafiği
- **Highlights:** En iyi anları paylaşmak (planlanan)

### 6. Deploy: Uygun araçları kullan

Bölüm 4'teki aşamalı rota.

---

## 3. MDA Analizi

Hunicke, LeBlanc ve Zubek'in **MDA** (Mekanik – Dinamik – Estetik) çerçevesiyle:

| Mekanik (tasarımcı kurar) | Dinamik (kullanımda ortaya çıkar) | Estetik (oyuncunun hissettiği) |
|---|---|---|
| Güvenilirlik puanı | Oyuncular gelmeyenlerle oynamak istemez, herkes puanını korur | Güven, topluluk |
| Saha dizilimi ve mevki seçimi | Eksik mevkiye göre oyuncu aranır | Strateji, sahiplenme |
| S.O.S çağrısı | Yakındaki oyuncular hızla eksiği kapatır | Kahramanlık, aciliyet |
| Yerel liderlik tablosu | Mahalleler arası rekabet | Meydan okuma, aidiyet |
| Rozetler | Farklı oyun tarzlarının keşfedilmesi | Keşif, başarı |

---

## 4. Aşamalı Entegrasyon Rotası

| Aşama | Mekanik | Hedef davranış | Dayandığı kuram | Durum |
|---|---|---|---|---|
| **1** | XP ve seviye | Maça gelmek | ÖBK: **yetkinlik** | ✅ Kodda (`src/lib/gamification.ts`) |
| **2** | Güvenilirlik (Qadro Puanı) | Gelmek, zamanında gelmek | ÖBK: **ilişkisellik**, güven | ✅ Kodda |
| **3** | Rozetler (8 adet) | Davranış çeşitliliği | Hexad, hedef belirleme | ✅ Kodda (`src/lib/badges.ts`, profil ekranı) |
| **4** | Takımı Değerlendir: Geldi/Gelmedi + övgüler | Gelmek, değerlendirmek | ÖBK: ilişkisellik; Malone ve Lepper: **tanınma** | ✅ Arayüz (`src/components/TeamReview.tsx`), çoğunluk oyu kuralı (`resolveAttendance`) |
| **5** | S.O.S (Joker) sistemi | Son dakika eksiğini kapatmak | Malone ve Lepper: **iş birliği** | ✅ Arayüz (`/sos`), bildirim gönderimi ⏳ |
| **6** | Şehrin En İyileri (ilçe bazlı sıralama) | Topluluk içi rekabet | Akış (Flow), ulaşılabilir zorluk | ✅ Arayüz (`/siralama`, ISR) |
| **6b** | Haftalık oynama serisi ve sezonlar | Düzenli katılım | Hook modeli (alışkanlık) | ⏳ Planlandı |
| **7** | Dashboard ile ölçüm | – | D6'nın 1. adımındaki ölçütler | ⏳ Planlandı (Web Programlama ile ortak) |

---

## 5. Kuramsal Gerekçeler

### Öz Belirleme Kuramı (Deci ve Ryan)

İçsel motivasyonun üç temel ihtiyaca dayandığını söyler:

| İhtiyaç | Qadro'da nasıl destekleniyor? |
|---|---|
| **Özerklik** | Oyuncu maçını, mevkisini ve sahasını kendisi seçer. Hiçbir görev zorunlu değildir |
| **Yetkinlik** | Seviye, radar grafiğindeki özellikler, rozet ilerleme çubukları |
| **İlişkisellik** | Takım sohbeti, değerlendirme, S.O.S ile birbirine yardım |

### Aşırı Gerekçelendirme (Overjustification) Riski

Futbolu zaten seven birine her maç için ödül vermek, içsel motivasyonun yerini dış ödüle bırakmasına yol açabilir. Önlemler:

- **Qadro Puanı harcanamaz.** Bir para birimi değil, itibar ölçüsüdür. Mağaza veya indirim yoktur.
- **Rozetler XP vermez.** Yalnızca bilgilendirici geri bildirimdir. Bilgilendirici ödüller, kontrol edici ödüllere göre içsel motivasyonu daha az zayıflatır.

### PBL Eleştirisi

Sadece puan, rozet ve liderlik tablosu (PBL) eklemek yüzeysel oyunlaştırma olarak eleştirilir. Qadro'da:

- Her mekanik **bir hedef davranışa** bağlıdır (Bölüm 2.2).
- Asıl oyunlaştırma güvenilirlik ve S.O.S gibi **ürünün işleyişine gömülü** mekaniklerdedir. Rozetler bu yapının üzerine eklenmiş bir katmandır.

### Akış (Csikszentmihalyi) ve Liderlik Tabloları

**Küresel liderlik tablosu kullanılmaz.** Kullanıcıların büyük çoğunluğu en altta kalır ve motivasyonu düşer. Bunun yerine **yerel ve göreli** tablolar kullanılır: mahalle, arkadaşlar ve benzer seviyedeki oyuncular. Böylece zorluk ulaşılabilir kalır.

Maç oluştururken seçilen **minimum seviye** de aynı amaca hizmet eder: "Ne çok kolay, ne de imkânsız" maçlar.

---

### Başarımlar ve Övgüler

İki tür tanınma vardır ve bilinçli olarak ayrı tutulur:

| | Başarım | Övgü |
|---|---|---|
| **Kim verir?** | Sistem, davranışa göre | Takım arkadaşı, maç sonunda |
| **Örnek** | Demir Adam, Kurtarıcı | Kaya Gibi, Centilmen |
| **Kuram** | Yetkinlik, hedef belirleme | Sosyal tanınma (Malone ve Lepper) |
| **XP verir mi?** | Hayır | Hayır |

## 6. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Bir kişi kötü niyetle "Gelmedi" der | En az 3 oy ve çoğunluk gerekir, eşitlikte oyuncu lehine karar verilir (`resolveAttendance`) ✅ |
| Arkadaşlar birbirine sürekli 5 yıldız verir | Hep aynı puanı veren hesapların değerlendirme ağırlığı düşürülür *(planlanan)* |
| Sahte maç açıp XP toplamak | XP yalnızca birden fazla oyuncunun onayladığı maçlarda verilir *(planlanan)* |
| Yeni kullanıcının tek maçla puanı 0 ya da 5 olur | Güvenilirlik hesabında 5 maçlık nötr başlangıç (`reliabilityScore`) ✅ |
| Rozet avcılığı, sporun önüne geçer | Rozetler az sayıda tutulur ve tamamen davranışa bağlıdır ✅ |

---

## 7. Başarı Nasıl Ölçülecek?

Oyunlaştırmanın işe yarayıp yaramadığı **yönetici dashboard'unda** izlenecek:

- Oyunlaştırma öncesi ve sonrası **no-show oranı**
- **S.O.S** yanıt süresi
- Haftalık aktif kullanıcı
- Rozet dağılımı: Hangi rozet çok kolay, hangisi kimse tarafından kazanılamıyor?

---

## Kaynaklar

- Deterding, S., Dixon, D., Khaled, R. ve Nacke, L. (2011). *From game design elements to gamefulness: Defining "gamification".*
- Werbach, K. ve Hunter, D. (2012). *For the Win: How Game Thinking Can Revolutionize Your Business.*
- Hunicke, R., LeBlanc, M. ve Zubek, R. (2004). *MDA: A Formal Approach to Game Design and Game Research.*
- Deci, E. L. ve Ryan, R. M. (1985). *Intrinsic Motivation and Self-Determination in Human Behavior.*
- Marczewski, A. (2015). *Even Ninja Monkeys Like to Play.* (Hexad oyuncu tipleri)
- Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience.*
- Malone, T. W. ve Lepper, M. R. (1987). *Making Learning Fun: A Taxonomy of Intrinsic Motivations for Learning.*
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products.*
