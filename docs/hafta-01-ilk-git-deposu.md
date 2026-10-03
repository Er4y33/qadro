# Hafta 1: İlk Git Deposu

## Görev

> Proje klasörü oluştur, Git deposunu başlat, ilk dosyayı ekle ve kaydet.
> **Teslim:** Depoyu GitHub'a yükleyin ve bağlantıyı paylaşın.
> **İpucu:** Anlamlı commit mesajları yazın.

## Yapılanlar

| Adım | Slayttaki komut | Qadro'daki karşılığı |
|---|---|---|
| 1. Proje klasörü | `mkdir oyun-portali && cd oyun-portali` | `npx create-next-app qadro` ile Next.js projesi oluşturuldu |
| 2. Git deposu | `git init` | `git init` |
| 3. İlk commit | `git add . && git commit -m "ilk commit"` | `git add . && git commit -m "chore: Next.js + TypeScript + Tailwind iskeleti oluşturuldu"` |
| 4. GitHub'a yükleme | – | `git remote add origin …` ve `git push -u origin main` |

## Commit mesajı kuralı

Mesajlar [Conventional Commits](https://www.conventionalcommits.org/) biçiminde, Türkçe yazıldı:

| Ön ek | Anlamı | Örnek |
|---|---|---|
| `feat` | Yeni özellik | `feat(mac): maç detayı, saha dizilimi ve maç oluşturma formu` |
| `style` | Görünüm değişikliği | `style(tema): koyu tema renkleri Figma değerleriyle güncellendi` |
| `docs` | Belgeleme | `docs: README eklendi` |
| `chore` | Altyapı, temizlik | `chore: varsayılan başlangıç sayfası kaldırıldı` |

Commit geçmişini görmek için:

```bash
git log --oneline
```

## Depo bağlantısı

`https://github.com/<kullanici-adi>/qadro`
