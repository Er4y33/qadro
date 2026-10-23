# Qadro Web Mimarisi

> **Ders:** Web Programlama
> **Konu:** Qadro'nun web uygulaması olarak nasıl kurulduğu ve ders kavramlarının projedeki karşılıkları

Bu belge iki amaca hizmet eder: Qadro'nun web sitesi olarak **yapılabilirliğini** gösterir ve derste işlenen kavramları **projedeki somut örneklerle** açıklar.

---

## 1. Geliştirme Ortamı Kurulumu

| Araç | Ne işe yarar? | Kurulum |
|---|---|---|
| **Node.js (LTS)** | JavaScript'i tarayıcı dışında, bilgisayarda çalıştırır. Next.js bunun üzerinde çalışır | nodejs.org → LTS sürümü |
| **npm** | Paket yöneticisi. Node.js ile birlikte gelir | – |
| **Git** | Sürüm kontrolü | git-scm.com |
| **VS Code** | Kod editörü | code.visualstudio.com |

Kurulumu kontrol etmek için:

```bash
node -v     # örn. v22.x
npm -v
git --version
```

Projeyi çalıştırmak için:

```bash
git clone https://github.com/Er4y33/qadro.git
cd qadro
npm install      # package.json'daki paketleri indirir
npm run dev      # geliştirme sunucusu: http://localhost:3000
npm run build    # yayın için derleme
```

---

## 2. HTTP: Tarayıcı ve Sunucu Nasıl Konuşur?

**HTTP (HyperText Transfer Protocol)**, tarayıcı (istemci) ile sunucu arasındaki **istek–yanıt** protokolüdür.

```
Tarayıcı (istemci)                     Sunucu (Next.js / Vercel)
     │  GET /mac/cuma-aksami-hali-saha       │
     │ ────────────────────────────────────► │
     │                                       │  Sayfayı üretir
     │  200 OK + HTML                        │
     │ ◄──────────────────────────────────── │
```

**Ders notuna küçük bir ek:** HTTP/1.1 **metin tabanlıdır**; istekler okunabilir satırlardan oluşur. Ancak günümüzde yaygın olan **HTTP/2 ve HTTP/3 ikili (binary)** çerçeveler kullanır. Anlam aynı kalır, sadece iletim biçimi değişir.

**Hypertext**, başka belgelere **bağlantı** (link) içeren metindir. Görsel, ses ve video gibi öğeleri de kapsayan genişletilmiş haline **hypermedia** denir.

### HTTP Durum Kodları

| Aralık | Anlamı | Qadro'daki örnek |
|---|---|---|
| **1xx** | Bilgilendirme | Doğrudan kullanılmıyor |
| **2xx** | Başarılı | `200 OK`: sayfa açıldı · `201 Created`: yeni maç oluşturuldu · `204 No Content`: maçtan ayrıldın |
| **3xx** | Yönlendirme (kaynak taşındı) | `307`: giriş yapmamış ziyaretçi `/hosgeldin` ekranına yönlendirilir (`src/middleware.ts`) |
| **4xx** | **İstemci** hatası | `400`: eksik/hatalı form · `404`: olmayan bir maç · `409`: maç dolu, zaten kadrodasın ya da e-posta kayıtlı · `401`: giriş yapılmamış ya da şifre hatalı · `403`: giriş var ama yetki yok (oynamadığın maçı değerlendirmek) |
| **5xx** | Sunucu hatası | `500`: sunucuda beklenmeyen hata |

**Not:** Ders notunda 4xx "işlemci hatası" olarak geçiyor. Doğrusu **istemci (client) hatası**: isteği gönderen tarafın hatası, örneğin yanlış adres ya da eksik yetki.

**Projede görmek için:** `npm run dev` çalışırken terminalde her isteğin kodu yazar:

```
GET /profil 200 in 61ms
```

Olmayan bir adres denenirse, örneğin `/mac/olmayan-mac`, Next.js `notFound()` fonksiyonuyla **404** döner (`src/app/mac/[id]/page.tsx`).

---

## 3. Statik ve Dinamik Web

| | Statik | Dinamik |
|---|---|---|
| **Ne zaman üretilir?** | Önceden, bir kez | Her istekte, kişiye veya veriye göre |
| **Hız** | Çok hızlı | Daha yavaş |
| **Esneklik** | Herkese aynı içerik | Kişiye özel içerik |
| **Karmaşıklık** | Basit | Daha karmaşık |
| **Qadro'da** | Giriş, tanıtım, saha sayfaları | Ana sayfa, maç detayı, keşfet (veritabanından) |

Qadro **ikisini birlikte** kullanır. Next.js her sayfa için ayrı strateji seçmeye izin verir.

---

## 4. Render Stratejileri

| Strateji | Açılımı | Nerede, ne zaman üretilir? | Qadro'daki sayfa | Koddaki karşılığı |
|---|---|---|---|---|
| **SSG** | Static Site Generation | Sunucuda, **build anında** bir kez | `/giris`, `/hosgeldin`, `/saha/[id]` | Varsayılan; dinamik sayfalarda `generateStaticParams()` |
| **SSR** | Server-Side Rendering | Sunucuda, **her istekte** | `/`, `/mac/[id]`, `/sohbetler`, `/profil`, `/oyuncu/[id]`, `/bildirimler`: hep güncel veri | `export const dynamic = "force-dynamic"` |
| **CSR** | Client-Side Rendering | **Tarayıcıda**, JavaScript ile | Maç oluşturma formu, harita, Filtreler, sohbet odasındaki yeni mesaj sorgusu | Dosyanın başında `"use client"` |
| **ISR** | Incremental Static Regeneration | Statik, belirli aralıklarla **arka planda yenilenir** | `/siralama`: Şehrin En İyileri (sorgu en fazla 5 dakikada bir çalışır, "Sen" satırı tarayıcıda eklenir) | `export const revalidate = 300` |

Build çıktısında hangi sayfanın hangi stratejiyle üretildiği görülür:

```
○  (Static)   prerendered as static content       → SSG
●  (SSG)      prerendered as static HTML           → generateStaticParams
ƒ  (Dynamic)  server-rendered on demand            → SSR
```

### Sunucu ve İstemci Bileşenleri

Next.js'te bileşenler **varsayılan olarak sunucuda** çalışır ve tarayıcıya hazır HTML gönderir. Etkileşim gerektiren küçük parçalar (`useState`, `onClick`) `"use client"` ile işaretlenir.

| Sunucu bileşeni | İstemci bileşeni |
|---|---|
| `src/app/mac/[id]/page.tsx` (maç detayı) | `src/components/LineupPicker.tsx` (bölge seçimi) |
| `src/app/(tabs)/profil/page.tsx` (profil) | `src/components/BadgeGrid.tsx` (rozete dokunma) |
| `src/app/(tabs)/page.tsx` (ana sayfa) | `src/components/MatchFeed.tsx` (spor filtresi) |

Bu ayrım sayesinde tarayıcıya yalnızca gereken JavaScript gönderilir.

---

### Responsive (duyarlı) tasarım

Aynı kod, ekran genişliğine göre farklı düzen üretir. Tailwind'in kırılım noktaları CSS **media query**'lerine dönüşür:
`lg:grid-cols-2` → `@media (width >= 1024px) { grid-template-columns: repeat(2, …) }`.

| Ekran | Genişlik | Düzen |
|---|---|---|
| Telefon | < 1024px | 430px tek kolon, altta sekme menüsü (`BottomNav`), eylem düğmeleri ekranın altına sabit |
| Masaüstü (`lg`) | ≥ 1024px | Solda kenar menü (`DesktopNav`), maç kartları iki sütun, maç detayı ve profil iki kolon, giriş ekranı bölünmüş |
| Geniş masaüstü (`xl`) | ≥ 1280px | Ana sayfada sağda harita ve özet kartları |

Odaklı akışlar (maç oluşturma, değerlendirme, sohbet, S.O.S) masaüstünde de ortada dar bir kolonda kalır; uzun formlar geniş ekranda okunmaz hale gelmesin diye bilinçli bir tercih (`FocusColumn`, `src/components/AppFrame.tsx`).

Kök düzen kullanıcı bilgisini sunucuda okumaz (kenar menüdeki ad istemcide `/api/auth/me` ile alınır). Okusaydı çerez okuması tüm siteyi dinamik yapar, `/giris` (SSG) ve `/siralama` (ISR) gibi sayfaların statik üretimi bozulurdu.

---

### Testler ve sürekli entegrasyon (CI)

`npm test` 81 testi çalıştırır (Vitest). Oyun kuralları saf fonksiyon olarak yazıldığı için (`src/lib/gamification.ts`) doğrudan test edilir. Veritabanı senaryoları ise bellekte açılan PGlite üzerinde koşar; gerçek veritabanına dokunmaz.

| Test edilen kural | Neden önemli |
|---|---|
| Kontenjan dolunca katılma reddedilir | Aynı yere iki kişinin girmesi engellenir (`409`) |
| Tek kişinin "Gelmedi" oyu yetmez | Kötüye kullanıma karşı oyunlaştırma kuralı |
| Oynamadığın maçı değerlendiremezsin | Yetkilendirme (`403`) |
| S.O.S çağrısını yalnızca bir kişi kabul eder | Eşzamanlılık |
| İşlemin ortasında hata olursa her şey geri alınır | Transaction (ya hepsi ya hiçbiri) |
| Kadroda olmayan takım sohbetini okuyamaz | Yetkilendirme (`403`) |
| 5 hatalı şifre denemesinden sonra giriş kilitlenir | Kaba kuvvet saldırısına karşı (`429`) |
| Onaylı katılımda istekleri yalnızca organizatör yönetir | Yetkilendirme (`403`) |
| Filtrelerde "bugün" Türkiye saatine göre hesaplanır | Saat dilimi hatası (UTC'de gece yarısı) |

GitHub Actions her push'ta lint → tip kontrolü → test → build adımlarını çalıştırır. Bir adım başarısız olursa GitHub'da kırmızı işaret görünür.

---

## 5. Neden Next.js?

| Ders gereksinimi | Next.js'teki karşılığı |
|---|---|
| Node.js | Next.js, Node.js üzerinde çalışır |
| SSG / SSR / CSR / ISR | Dördü de yerleşik; sayfa bazında seçilir |
| HTTP ve sunucu tarafı | API rotaları aynı projede yazılabilir (`app/api/.../route.ts`) |
| Ücretsiz yayın | Vercel, Next.js'i geliştiren şirket; GitHub'a bağlanınca otomatik yayın |
| Dashboard | Web arayüzü ve sunucu tarafı aynı projede |

**Değerlendirilen alternatif:** Expo (React Native). Gerçek mobil uygulama için güçlü, ancak ISR desteği yok ve SSR/SSG kısıtlı. Mobil sürüm ileride aynı veritabanını kullanarak Expo ile yapılabilir. Şimdilik Qadro **PWA** olarak telefona kurulabiliyor (`src/app/manifest.ts`).

---

## 6. Yayın: GitHub → Vercel

```
git push  ──►  GitHub (Er4y33/qadro)  ──►  Vercel  ──►  canlı site
                                            │
                                            └─ her push'ta otomatik build + yayın
```

1. vercel.com'a GitHub hesabıyla giriş yapılır.
2. **Add New → Project** ile `qadro` reposu seçilir.
3. Vercel projenin Next.js olduğunu otomatik algılar, **Deploy** yeterlidir.

---

## 7. Veritabanı ve REST API

### Veritabanı

| Ortam | Veritabanı | Kurulum |
|---|---|---|
| Geliştirme (`npm run dev`) | **PGlite**: WebAssembly ile çalışan gömülü PostgreSQL. Veriler `.qadro-db/` klasöründe | Gerekmez |
| Canlı (Vercel) | **Supabase** (PostgreSQL) | `DATABASE_URL` ya da `POSTGRES_URL` ortam değişkeni |

İkisinde de **aynı SQL** çalışır (`src/lib/db/`). Tablolar ilk istekte oluşturulur, boşsa örnek veri eklenir.

| Tablo | İçerik |
|---|---|
| `players` | Oyuncular |
| `matches` | Maçlar (branş, format, tarih, kontenjan, ücret, gizlilik) |
| `match_participants` | Kim hangi maçta, sahada hangi bölgede |
| `match_reviews` | Maç sonu oyları: kim, kimi, geldi mi, geç kaldı mı, hangi övgüyü verdi |
| `match_mvp_votes` | Maçın Oyuncusu oyları |
| `sos_calls` | Eksik oyuncu çağrıları |
| `join_requests` | Onaylı katılımlı maçlara gelen istekler (`pending` / `approved` / `declined`) |
| `messages`, `chat_reads` | Takım sohbeti mesajları ve her oyuncunun en son gördüğü mesaj (okunmamış sayısı) |
| `sessions`, `login_attempts` | Oturumlar (anahtarın özeti) ve hatalı giriş denemeleri |
| `user_events` | Kullanıcı davranışları: `match_created`, `match_joined`, `message_sent`… → **dashboard** |

**Eşzamanlılık:** Son boş yere iki kişi aynı anda tıklarsa ikisi de girmesin diye katılma bir **işlem (transaction)** içinde yapılır ve maç satırı `SELECT … FOR UPDATE` ile kilitlenir (`src/lib/matches.ts → joinMatch`). İkinci istek birincinin bitmesini bekler, güncel kayıt sayısını görür ve `409 Conflict` alır. Maç sonu oyları da tek işlemde kaydedilir: ortada hata olursa hiçbiri kaydedilmez (`src/lib/reviews.ts`). İşlem desteği `src/lib/db/index.ts → transaction()` içinde, iki sürücü için de (PGlite ve postgres.js) aynı arayüzle yazıldı.

### REST API

| Metot ve adres | Ne yapar | Yanıtlar |
|---|---|---|
| `GET /api/matches` | Maç listesi | `200` |
| `POST /api/matches` | Maç oluşturur | `201` + `Location` başlığı · `400` doğrulama hatası |
| `GET /api/matches/[id]` | Tek maç | `200` · `404` |
| `POST /api/matches/[id]/participants` | Maça katılır; onaylı katılımlı maçta istek gönderir | `201` kadrodasın · `202 Accepted` istek organizatöre iletildi · `404` · `409` dolu / zaten kadroda / isteğin zaten var |
| `DELETE /api/matches/[id]/participants` | Maçtan ayrılır ya da bekleyen isteği geri çeker; `?player=<id>` ile organizatör birini kadrodan çıkarır | `204` · `403` · `404` · `409` organizatör ayrılamaz |
| `GET /api/matches/[id]/requests` | Bekleyen istekler, her oyuncunun güvenilirliğiyle | `200` · `401` · `403` organizatör değilsin · `404` |
| `PATCH /api/matches/[id]/requests/[playerId]` | İsteği onaylar ya da reddeder `{ decision }` | `200` · `400` · `403` · `404` · `409` kadro dolu |
| `GET /api/matches/[id]/messages?after=<id>` | Takım sohbeti mesajları (yalnızca yeniler) | `200` · `401` · `403` kadroda değilsin · `404` |
| `POST /api/matches/[id]/messages` | Mesaj gönderir `{ body }` | `201` · `400` boş / 500 karakterden uzun · `403` · `404` |
| `GET /api/notifications` · `POST /api/notifications` | Bildirimler · tümünü okundu işaretle | `200` · `204` · `401` |
| `POST /api/share` | Paylaşımı olay günlüğüne yazar | `204` |
| `POST /api/auth/register` | Kayıt olur, oturum açar | `201` + `Set-Cookie` · `400` · `409` e-posta kayıtlı |
| `POST /api/auth/login` | Giriş yapar | `200` + `Set-Cookie` · `401` e-posta ya da şifre hatalı · `429 Too Many Requests` + `Retry-After` |
| `POST /api/auth/logout` | Çıkış yapar | `204` |
| `GET /api/auth/me` | Giriş yapan oyuncu | `200` · `401` |
| `PATCH /api/auth/me` · `DELETE /api/auth/me` | Ad değiştirir · hesabı siler (anonimleştirir) | `200` / `204` · `400` · `401` · `403` demo hesabı |
| `POST /api/auth/password` | Şifre değiştirir, diğer cihazlardaki oturumları kapatır | `200` · `400` · `401` mevcut şifre hatalı · `403` |
| `POST /api/matches/[id]/reviews` | Maç sonu "Takımı Değerlendir" (isteğe bağlı `mvpId`: Maçın Oyuncusu oyu) | `201` · `400` · `401` · `403` bu maçta oynamadın · `404` · `409` maç oynanmadı / zaten değerlendirdin |
| `GET /api/sos` | Giriş yapan oyuncuya açık S.O.S çağrıları | `200` · `401` |
| `POST /api/sos` | S.O.S çağrısı başlatır `{ matchId, position }` | `201` · `400` · `401` · `403` kadroda değilsin · `404` · `409` kadro tam / açık çağrı var |
| `POST /api/sos/[id]/answer` | Çağrıyı kabul eder, kadroya katılır | `201` · `401` · `404` · `409` başkası yanıtladı / maç doldu |
| `GET /api/season` | İçinde bulunulan sezonun XP sıralaması | `200` |
| `POST /api/demo/start` | Demo maçlarını yeniden kurar, demo oyuncusu olarak oturum açar | `201` + `Set-Cookie` |
| `GET /api/health` | Uygulama ve veritabanı durumu (`postgres` = Supabase, `pglite` = gömülü) | `200` · `503` veritabanına ulaşılamıyor |

Denemek için (sunucu açıkken):

```bash
curl -i http://localhost:3000/api/matches/olmayan-mac          # 404
curl -i -X POST http://localhost:3000/api/matches/elbistan-basket/participants   # 201, ikinci kez 409
```

Tarayıcıda F12 → **Network** sekmesinde de "Maça Katıl" dendiğinde giden `POST` isteği ve dönen `201` görülebilir.

Maç uç noktaları giriş ister; çerez yoksa `401 Unauthorized` döner.

### Kimlik doğrulama (kayıt ve giriş)

Hazır bir servis yerine kendimiz yazdık; böylece derste işlenen HTTP kavramları kodda doğrudan görülür (`src/lib/auth.ts`).

```
Tarayıcı                                   Sunucu
   │ POST /api/auth/login {email, şifre}     │
   │ ──────────────────────────────────────► │ şifreyi scrypt özetiyle karşılaştırır
   │ 200 OK                                  │
   │ Set-Cookie: qadro_session=…; HttpOnly   │ rastgele oturum anahtarı üretir
   │ ◄────────────────────────────────────── │ (veritabanında yalnızca SHA-256 özeti)
   │                                         │
   │ GET /profil                             │
   │ Cookie: qadro_session=…                 │ çerezden oyuncuyu bulur
   │ ──────────────────────────────────────► │
```

| Güvenlik önlemi | Neden |
|---|---|
| Şifreler **scrypt** + rastgele tuz ile özetlenir | Veritabanı sızsa bile şifreler okunamaz |
| Çerez **HttpOnly**, **SameSite=Lax**, canlıda **Secure** | JavaScript çereze erişemez (XSS), başka siteden istekle kullanılamaz (CSRF), yalnızca HTTPS'te gider |
| Veritabanında oturum anahtarının yalnızca **özeti** | Sızıntıda oturumlar çalınamaz |
| Hatalı girişte "e-posta **ya da** şifre hatalı" | Hangi e-postaların kayıtlı olduğu tahmin edilemez |
| Şifre karşılaştırması `timingSafeEqual` ile | Yanıt süresinden bilgi sızmaz |
| 15 dakikada aynı e-postaya 5, aynı IP'den 20 hatalı deneme sınırı (`429`) | Kaba kuvvetle şifre denemeyi durdurur (`login_attempts` tablosu) |
| Şifre değişince diğer oturumlar kapanır | Şifre çalındıysa saldırganın açık oturumu düşer |
| Hesap silme = anonimleştirme | E-posta ve şifre silinir; geçmiş maç kayıtları takım arkadaşlarının istatistiği bozulmasın diye "Silinmiş Oyuncu" olarak kalır |
| Süresi dolan oturumlar her yeni girişte silinir | Tablo şişmez |

**Demo hesabı:** Giriş ekranındaki "Demo hesabıyla dene" düğmesi, Figma tasarımındaki örnek oyuncu (Atahan) olarak giriş yapar. Hoca ve ekip kayıt olmadan uygulamayı deneyebilir.

### Dashboard: kullanıcı davranışı takibi (`/panel`)

Profil → **Kullanıcı Davranışı Paneli**. Tüm sayılar `user_events` tablosundan SQL ile hesaplanır (`src/lib/dashboard.ts`), sayfa her açılışta güncel üretilir (SSR).

| Bölüm | Soru | SQL'deki karşılığı |
|---|---|---|
| Özet kartları | Kaç kayıtlı kullanıcı, kaçı son 7 günde aktif, maçlar ne kadar dolu? | `count(DISTINCT player_id)`, ortalama `katılımcı / kontenjan` |
| Günlük etkinlik | Kullanım artıyor mu? | `generate_series` ile son 14 gün; olay olmayan günler 0 |
| Dönüşüm hunisi | Kayıt olanlar gerçekten oynuyor mu? | Kayıt → başkasının maçına katılan → maç organize eden |
| Olay türleri | Kullanıcılar en çok ne yapıyor? | `GROUP BY type` |
| Branşlar | Hangi sporda maç açılıyor, hangisi doluyor? | `GROUP BY sport` + ortalama doluluk |

**Oyunlaştırma bağlantısı:** Huni ve doluluk oranı, D6 çerçevesindeki iş hedefinin (maçların dolması, oyuncuların gelmesi) ölçüsüdür. Oyun mekaniklerinin (XP, başarım, S.O.S) işe yarayıp yaramadığı bu panelden izlenir.

### Takım sohbeti: neden WebSocket değil?

Sohbet odası ilk mesajları sunucuda okur (SSR), sonra tarayıcı 4 saniyede bir `GET …/messages?after=<son id>` ile yalnızca yeni mesajları sorar (**polling**). Sekme arka plandayken sorgu yapılmaz.

| Seçenek | Artı | Eksi |
|---|---|---|
| **Polling (seçilen)** | Ek servis gerektirmez, Vercel'in sunucusuz yapısıyla uyumlu, düz REST | En fazla 4 saniye gecikme, boşuna sorgular |
| WebSocket / Supabase Realtime | Anlık | Sunucusuz ortamda açık bağlantı tutulamaz; ek servis ve yetkilendirme (RLS politikaları) gerekir |

Maç kadrosu sohbeti için birkaç saniyelik gecikme kabul edilebilir; gerçek zamanlı sürüm yol haritasında.

### Paylaşım önizleme görseli (Open Graph)

`/oyuncu/[id]` bağlantısı WhatsApp'a yapıştırıldığında görünen kart, `src/app/oyuncu/[id]/opengraph-image.tsx` dosyasında sunucuda JSX'ten PNG olarak üretilir (`next/og`). Türkçe harfler için Inter yazı tipi projeyle gelir (`assets/fonts`, OFL lisanslı). "Başarını Paylaş" düğmesi telefonda Web Share API ile işletim sisteminin paylaşım menüsünü açar, masaüstünde bağlantıyı panoya kopyalar.

## 8. Sıradaki Adımlar

- [ ] Şifremi unuttum (e-posta ile sıfırlama), e-posta doğrulama, Google ile giriş
- [ ] Gerçek zamanlı sohbet (Supabase Realtime) ve anlık bildirim (Web Push)
- [ ] Şema değişiklikleri için migration aracı (Drizzle Kit ya da Supabase CLI)
- [ ] Panelde tarih aralığı filtresi ve yalnızca yöneticinin görmesi (rol sistemi)
