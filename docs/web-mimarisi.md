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
| **4xx** | **İstemci** hatası | `400`: eksik/hatalı form · `404`: olmayan bir maç · `409`: maç dolu, zaten kadrodasın ya da e-posta kayıtlı · `401`: giriş yapılmamış ya da şifre hatalı |
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
| **SSR** | Server-Side Rendering | Sunucuda, **her istekte** | `/`, `/mac/[id]`: maçlar ve kontenjan veritabanından, hep güncel | `export const dynamic = "force-dynamic"` |
| **CSR** | Client-Side Rendering | **Tarayıcıda**, JavaScript ile | Maç oluşturma formu, harita, spor filtresi | Dosyanın başında `"use client"` |
| **ISR** | Incremental Static Regeneration | Statik, belirli aralıklarla **arka planda yenilenir** | `/siralama`: Şehrin En İyileri | `export const revalidate = 300` |

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
| `user_events` | Kullanıcı davranışları: `match_created`, `match_joined`, `match_left` → **dashboard** bunu kullanacak |

**Eşzamanlılık:** Son boş yere iki kişi aynı anda tıklarsa ikisi de girmesin diye kontenjan kontrolü ve ekleme **tek SQL cümlesinde** yapılır (`src/lib/matches.ts → joinMatch`). Kaybeden taraf `409 Conflict` alır.

### REST API

| Metot ve adres | Ne yapar | Yanıtlar |
|---|---|---|
| `GET /api/matches` | Maç listesi | `200` |
| `POST /api/matches` | Maç oluşturur | `201` + `Location` başlığı · `400` doğrulama hatası |
| `GET /api/matches/[id]` | Tek maç | `200` · `404` |
| `POST /api/matches/[id]/participants` | Maça katılır | `201` · `404` · `409` dolu / zaten kadroda |
| `DELETE /api/matches/[id]/participants` | Maçtan ayrılır | `204` · `404` · `409` organizatör ayrılamaz |
| `POST /api/auth/register` | Kayıt olur, oturum açar | `201` + `Set-Cookie` · `400` · `409` e-posta kayıtlı |
| `POST /api/auth/login` | Giriş yapar | `200` + `Set-Cookie` · `401` e-posta ya da şifre hatalı |
| `POST /api/auth/logout` | Çıkış yapar | `204` |
| `GET /api/auth/me` | Giriş yapan oyuncu | `200` · `401` |
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

## 8. Sıradaki Adımlar

- [ ] Şifremi unuttum (e-posta ile sıfırlama), Google ile giriş
- [ ] Panelde tarih aralığı filtresi ve yalnızca yöneticinin görmesi (rol sistemi)
