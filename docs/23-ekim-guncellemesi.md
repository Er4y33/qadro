# 23 Ekim 2026 Güncellemesi: Değişiklikler ve Canlı Ortam Olay Raporu

Bu belge iki şeyi anlatır:

1. **Neler eklendi:** Uygulamadaki son örnek (sabit) verilerin kaldırılması ve eksik ekranların tamamlanması.
2. **Ne bozuldu, nasıl düzeltildi:** Aynı akşam canlı sitede (Vercel + Supabase) yaşanan kesintinin belirtileri, teşhisi ve çözümü.

İlgili commit'ler: `122d1a7` … `9bd8d59` (`git log --oneline` ile görülebilir).

---

## 1. Eklenenler

### Örnek veriden gerçek veriye

Bu güncellemeden önce bazı ekranlar kodun içine yazılmış örnek verilerle çalışıyordu. Artık **uygulamadaki tüm sayılar veritabanından hesaplanıyor.** Kodda tutulan tek veri saha kataloğu (`src/lib/venues.ts`): sahalar nadiren değişir ve sayfaları build anında üretilir (SSG).

| Ekran | Önce | Şimdi |
|---|---|---|
| Takım sohbeti | Sabit 4 mesaj | `messages` tablosu. Yalnızca kadrodakiler okur ve yazar (403), okunmamış sayısı `chat_reads` tablosundan |
| Bildirimler | Sabit kartlar | Veritabanındaki olaylardan üretiliyor: katılma isteği, istek sonucu, yeni mesaj, değerlendirme hatırlatması, övgü, MVP |
| Şehrin En İyileri | Kodda yazılı liste | Takım arkadaşlarının oylarından: güvenilirlik, onaylı maç, MVP |
| Profil ve radar grafiği | Demo hesabı için elle yazılmış değerler (42 maç, 12 MVP) | Herkes için oylardan hesaplanıyor |

Boş bir veritabanında ekranlar anlamsız görünmesin diye ilk açılışta son 8 haftanın örnek maçları ve oyları eklenir (`src/lib/db/seed-history.ts`). Ekrandaki sayılar bu oylardan, uygulamanın kendi kurallarıyla hesaplanır.

### Yeni ekranlar

| Ekran | Adres | Ne yapar |
|---|---|---|
| İstekleri Yönet + Onaylanan Kadro | `/mac/[id]/istekler` | Organizatör "Katılımı ben onaylayayım" seçtiyse "Maça Katıl" istek gönderir (**202 Accepted**). Organizatör istekleri oyuncunun güvenilirliğine ve gelmediği maç sayısına bakarak onaylar ya da reddeder, kadrodan oyuncu çıkarabilir |
| Filtreler | Ana sayfa | Tarih (Türkiye saatiyle), ücret, boş yer, seviye |
| Ayarlar | `/ayarlar` | Ad ve şifre değiştirme, tema, hesabı silme (anonimleştirme) |
| Herkese açık profil | `/oyuncu/[id]` | Giriş gerektirmez; "Başarını Paylaş" bağlantısı buraya gider, paylaşım önizleme görseli `opengraph-image` ile üretilir |

### Sağlamlık ve güvenlik

- **Kontenjan:** Maça katılma bir işlem (transaction) içinde ve maç satırı `SELECT … FOR UPDATE` ile kilitlenerek yapılır. İki kişi aynı anda son boş yere tıklasa bile kontenjan aşılmaz.
- **Maç sonu oyları:** Tek işlemde kaydedilir; ortada hata olursa hiçbiri kaydedilmez.
- **Giriş deneme sınırı:** 15 dakikada aynı e-postaya 5, aynı IP'den 20 hatalı denemeden sonra **429 Too Many Requests**.
- **Zamanında gelme:** Değerlendirmede "Geç kaldı" oyu; çoğunluk geç kaldı demezse +15 XP ve "Demir Adam" serisi.

Testler 57'den **81**'e çıktı (`tests/features.test.ts`, `tests/filters.test.ts` eklendi).

---

## 2. Olay raporu: canlı sitede kesinti (23 Ekim)

Yerelde (`npm run dev`) her şey çalışırken canlı sitede sorunlar yaşandı. Yayınlar sabahki `b1fb895` commit'inden beri başarısızdı (canlı site bu süre boyunca 22 Ekim sürümünde kaldı); sayfa sorunları ise yeni sürüm yayına çıktıktan sonra, akşam 22:30 ile 23:20 arasında görüldü. Yerelde Supabase yerine bilgisayardaki gömülü veritabanı (PGlite) kullanıldığı için sorunlar yalnızca canlıda görüldü. Dört ayrı sorun üst üste geldi:

| # | Belirti | Kök neden | Çözüm | Commit |
|---|---|---|---|---|
| 1 | Vercel'de her yayın "Build Failed" | Supabase'in ücretsiz planı kullanılmayan projeyi **duraklatmıştı**; Vercel yayından önce veritabanı bağlantısını kontrol edip başarısız oluyordu | Proje Supabase panelinden yeniden açıldı. Vercel artık her gün `/api/health` adresini çağırıyor (`vercel.json → crons`) | `7c5edd7` |
| 2 | Sayfalar "Sahaya iniliyor…" ekranında takılıyordu (Vercel Logs: "Task timed out after 300 seconds") | Vercel, istek bitince fonksiyonu dondurur. Uyandığında daha önce açılmış ama artık **kopmuş bir bağlantıyı** kullanmaya çalışıyor ve cevap bekliyordu | Bağlantılar boşta 10 sn sonra kapanıyor ve en fazla 5 dk yaşıyor; 12 sn'de cevap gelmeyen sorgu hata verip bağlantıyı yeniliyor. Şema güncellemeleri yalnızca şema değiştiğinde çalışıyor | `6627278`, `55c9aa0` |
| 3 | "Application error" (Vercel Logs: `write CONNECTION_DESTROYED …pooler.supabase.com:6543`) | Supabase bağlantı havuzunun **transaction modu (6543)** aynı bağlantıdan aynı anda giden birden çok sorguyu koparıyordu. Tek sorgulu `/api/health` çalışıyor, çok sorgulu sayfalar çöküyordu | Havuzun **session moduna (5432)** geçildi | `9bd8d59` |
| 4 | "Bu siteye ulaşılamıyor" (ERR_CONNECTION_RESET) | Evdeki internet bağlantısı (mobil veriyle site açıldı) | Uygulamayla ilgisi yok | – |

### Teşhis nasıl yapıldı?

1. **Vercel → Deployments:** "Provisioning Integrations: supabase-sky-window" kırmızıydı. Supabase panelinde proje "Suspended" görünüyordu → sorun 1.
2. **Supabase SQL Editor:** `pg_stat_activity` sorgusuyla veritabanında takılı ya da birbirini bekleyen sorgu olup olmadığına bakıldı. `pg_blocking_pids` boştu: veritabanının kendisi sağlamdı, sorun aradaki bağlantıdaydı.
3. **Vercel → Logs:** Hata mesajları sorunun yerini gösterdi. Önce 300 saniyelik zaman aşımları (sorun 2), düzeltmeden sonra aynı milisaniyede düşen çok sayıda `CONNECTION_DESTROYED` (sorun 3).
4. **`/api/health`:** Bu adres tek bir sorgu çalıştırır. Çalışıp diğer sayfaların çökmesi, sorunun "aynı anda birden çok sorgu" durumunda olduğunu gösterdi.

### Çıkarılan dersler

- **Yerelde çalışması, canlıda çalışacağı anlamına gelmez.** Canlıdaki ortam (sunucusuz fonksiyon + bağlantı havuzu) yereldekinden farklı davranır.
- **Her dış bağlantıya süre sınırı konmalı.** Sınır olmadan bir sorgu sonsuza kadar bekleyebiliyor ve kullanıcı yalnızca dönen bir yükleme ekranı görüyor. Sınırla birlikte hata Logs'a düşüyor ve teşhis edilebiliyor.
- **Sağlık ucu (`/api/health`) çok işe yaradı.** Uygulamanın ve veritabanının durumunu tek bakışta gösterdi.
- **Sunumdan önce:** Supabase panelinde projenin açık olduğunu ve `/api/health`'in `"status":"ok"` döndüğünü kontrol et; yedek olarak yerelde `npm run dev` hazır olsun.
