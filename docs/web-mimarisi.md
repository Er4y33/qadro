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
| **2xx** | Başarılı | `200 OK`: sayfa açıldı · `201 Created`: yeni maç oluşturuldu *(planlanan API)* |
| **3xx** | Yönlendirme (kaynak taşındı) | `301/308`: kalıcı yönlendirme · `307`: geçici yönlendirme |
| **4xx** | **İstemci** hatası | `404`: olmayan bir maç adresi · `401`: giriş yapılmamış · `409`: maç dolu *(planlanan)* |
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
| **Qadro'da** | Giriş, tanıtım, saha sayfaları | Maç detayı, sohbet odası |

Qadro **ikisini birlikte** kullanır. Next.js her sayfa için ayrı strateji seçmeye izin verir.

---

## 4. Render Stratejileri

| Strateji | Açılımı | Nerede, ne zaman üretilir? | Qadro'daki sayfa | Koddaki karşılığı |
|---|---|---|---|---|
| **SSG** | Static Site Generation | Sunucuda, **build anında** bir kez | `/giris`, `/hosgeldin`, `/saha/[id]` | Varsayılan; dinamik sayfalarda `generateStaticParams()` |
| **SSR** | Server-Side Rendering | Sunucuda, **her istekte** | `/mac/[id]`: kontenjan hep güncel olmalı | `export const dynamic = "force-dynamic"` |
| **CSR** | Client-Side Rendering | **Tarayıcıda**, JavaScript ile | Maç oluşturma formu, harita, spor filtresi | Dosyanın başında `"use client"` |
| **ISR** | Incremental Static Regeneration | Statik, belirli aralıklarla **arka planda yenilenir** | Mahalle lig tabloları *(planlanan)* | `export const revalidate = 300` |

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

## 7. Sıradaki Adımlar

- [ ] Supabase: kimlik doğrulama ve PostgreSQL veritabanı
- [ ] REST API: `POST /api/matches` (201), `GET /api/matches/[id]` (200 / 404)
- [ ] Olay günlüğü (`user_events`) ve **dashboard**: kullanıcıların yaptıklarının izlenmesi
- [ ] Mahalle ligleri (ISR)
