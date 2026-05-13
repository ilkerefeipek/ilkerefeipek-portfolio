# İlker Efe İpek — Portfolio

> MBP 206 Sistem Analizi ve Tasarımı dersi final projesi.
> İzmir Ekonomi Üniversitesi · Bilgisayar Programcılığı önlisans programı.

**🌐 Live:** [https://ilkerefeipek.github.io/ilkerefeipek-portfolio/](https://ilkerefeipek.github.io/ilkerefeipek-portfolio/)
**📧 İletişim:** [ilkerefeipek00@gmail.com](mailto:ilkerefeipek00@gmail.com)
**📄 CV (PDF):** [Türkçe](assets/files/cv-tr.pdf) · [English](assets/files/cv-en.pdf)

---

## Hakkında

Backend ve veritabanı odaklı bir .NET geliştirici olarak ürettiğim projeleri,
yetkinliklerimi ve CV'mi sergilediğim kişisel portfolyo sitesidir. Tasarım kavramı
**"Layered Mind v3 — Architectural Showcase"**: katmanlı mimari, repository pattern
ve SOLID prensipleri görsel olarak somutlaştırılır.

| Özellik | Detay |
|---------|-------|
| **Stack** | HTML5 + CSS3 + Vanilla JavaScript (ES2022 modules) |
| **Framework** | _Yok_ — production'da React/Vue/Tailwind/Bootstrap/jQuery yok |
| **Build adımı** | _Yok_ — `index.html` doğrudan tarayıcıda çalışır |
| **Backend** | _Yok_ — Web3Forms ile static iletişim formu |
| **Hosting** | GitHub Pages (HTTPS auto via Let's Encrypt) |
| **Diller** | TR + EN (data-i18n switcher + localStorage persist) |
| **Fontlar** | Self-hosted Inter + JetBrains Mono (woff2, Latin + Latin-Ext) |
| **Lighthouse** | Performance/A11y/BP/SEO ≥ 95 (CI enforced) |
| **Test** | Playwright E2E + axe-core a11y + visual regression (168 test) |

## Mimari

```
ilkerefeipek-portfolio/
├─ index.html, about.html, skills.html, projects.html,
│  cv.html, contact.html, 404.html             ← 7 sayfa
├─ data/                                        ← TR/EN içerik (JSON)
│  ├─ content.json    UI copy + links + microcopy
│  ├─ projects.json   4 proje (TR/EN açıklama + features)
│  ├─ skills.json     25 skill, 5 kategori, 32 constellation edge
│  ├─ education.json, experience.json, certificates.json, languages.json
├─ assets/
│  ├─ files/          CV PDF (TR + EN)
│  ├─ images/         favicon set, og-cover, avatar SVG, project placeholder
│  └─ fonts/          Inter + JetBrains Mono woff2 (~176KB total)
├─ styles/
│  ├─ tokens.css      Phantom dark design tokens
│  ├─ base.css        reset, typography, font-face, layout primitives
│  ├─ components.css  10 component (button/pill/card/nav/modal/...)
│  ├─ effects.css     animation keyframes + hero sequence + magnetic-tilt
│  └─ pages.css       page-specific layouts
├─ scripts/
│  ├─ core/           i18n, data-loader, nav, reduced-motion utilities
│  ├─ effects/        8 visual efekt modülü (code-rain, name-decode,
│  │                  cursor-blob, arch-diagram, magnetic-tilt,
│  │                  skills-constellation, scroll-reveal, view-transitions)
│  └─ main.js         orchestrator (page detection, modal, counter, form)
├─ tests/             Playwright E2E + axe + visual regression (devDep only)
└─ .github/workflows/ Playwright CI + Lighthouse CI
```

## 8 Görsel Efekt (Show-off Layer)

Tasarım kavramının "architectural showcase" kimliğini destekleyen efektler.
Hepsi `prefers-reduced-motion: reduce` ve mobile breakpoint constraint'leri ile
disipline edilmiştir.

| # | Efekt | Sayfa | Spec |
|---|-------|-------|------|
| 1 | Code-rain background canvas | hero | [docs/feature_dev_plans/hero-sequence.md](docs/feature_dev_plans/hero-sequence.md) |
| 2 | Name decode reveal | hero h1 | aynı |
| 3 | Cursor-following gradient blob + custom cursor | tüm sayfalar | — |
| 4 | Animated layered architecture diagram | hero (sağ) | [docs/feature_dev_plans/arch-diagram.md](docs/feature_dev_plans/arch-diagram.md) |
| 5 | Magnetic tilt + glow trail | proje kartları | — |
| 6 | Skills constellation (force-directed canvas) | skills hero | [docs/feature_dev_plans/skills-constellation.md](docs/feature_dev_plans/skills-constellation.md) |
| 7 | Scroll-driven layer assembly (IntersectionObserver) | tüm sayfalar | — |
| 8 | View Transitions API (page navigation + lang toggle) | inter-page | — |

## Geliştirme

Build adımı yok. Projeyi açıp `index.html`'i tarayıcıda görüntüleyebilirsiniz.
Local geliştirme için bir HTTP server önerilir (file:// protokolü modül import'u
ve fetch'i blokar):

```powershell
# Python ile (tüm makinelerde Python varsa hazır):
python -m http.server 8765 --bind 127.0.0.1

# veya Node ile:
npx http-server -p 8765
```

Tarayıcıda `http://127.0.0.1:8765/`.

## Test çalıştırma

168 test (E2E + a11y + visual regression). 7 sayfa × 3 viewport = 21 baseline
screenshot.

```powershell
cd tests
npm install
npx playwright install chromium
npx playwright test                         # tüm testler
npx playwright test --project=chromium-desktop   # sadece desktop
npx playwright test --reporter=html         # HTML rapor
npx playwright show-report                  # raporu aç
```

Lighthouse CI (Performance/A11y/BP/SEO ≥ 95):

```powershell
cd tests
npx lhci autorun --config=./lighthouserc.json
```

## Deployment (GitHub Pages)

1. **Repo public yap.** Settings → General → Change visibility.
2. **GitHub Pages aç:** Settings → Pages → Source: **Deploy from a branch** →
   Branch: `main` / `(root)` → Save.
3. ~1-2 dakika sonra canlı:
   `https://ilkerefeipek.github.io/ilkerefeipek-portfolio/`

### Custom domain (opsiyonel)

DNS provider'da A record (GitHub Pages IP'lerine) veya CNAME (`ilkerefeipek.github.io`)
ekleyin. Repo köküne `CNAME` dosyası → tek satır `www.example.com.tr`.
Settings → Pages → Custom domain alanına yazın. HTTPS otomatik etkinleşir.

---

## ⚠️ Açık İşler (Kullanıcı Tarafı)

Sprint 2 sonunda hala kapanmamış öğeler — yönerge §1.3 ve §5 gereği deadline'dan
(18 Mayıs 2026) önce kapatılmalı. Tüm placeholder'lar tek dosyadan yönetilir:
[`data/content.json`](data/content.json) `links` objesi. JS otomatik olarak
placeholder pill'leri gerçek URL'lerle değiştirir — sadece content.json güncellenip
commit + push edilmesi yeterli.

### 🔴 ZORUNLU — yönerge §1.3 gereği

- [ ] **LinkedIn hesabı aç + URL'i yaz.** Kullanıcının hesabı henüz yok. Yönerge
  §1.3 LinkedIn'i CV'ye iletişim bilgisi olarak zorunlu kılıyor. 18 Mayıs'tan önce:
  1. linkedin.com/signup → hesap aç (e-posta: ilkerefeipek00@gmail.com)
  2. Profili minimum doldur: photo (gradient avatar yerine gerçek foto OK), eğitim, deneyim, beceriler
  3. Profil URL'ini `data/content.json` içinde `links.linkedin` alanına yaz
  4. Commit + push: `git add data/content.json && git commit -m "feat: add real LinkedIn URL" && git push`
- [ ] **3 CV projesinin GitHub repolarını public yap.** Yönerge §1.3 "≥3 proje + GitHub linki" istiyor:
  - Stock Management System (C# WinForms + SQL Server)
  - Multi-Layered E-Commerce DB Design (MSSQL)
  - Event Registration System (PHP + MySQL)
  Public yaptıktan sonra her birinin URL'ini `data/content.json`
  `links.projectRepos.{stockManagement, ecommerceDb, eventRegistration}`
  alanlarına yaz, commit + push.

### 🟡 OPSİYONEL

- [ ] **Profesyonel profil fotoğrafı.** Şu an gradient initial avatar (`İE`) kullanılıyor —
  Sprint 2'de korundu (kullanıcı tercihi). İstenirse `assets/images/avatar.jpg` ekle ve
  `about.html`'de `.avatar-initials` yerine `<img>` kullan.
- [ ] **Custom domain (opsiyonel).** `.com.tr` veya başka domain alındıysa
  DNS A/CNAME → `ilkerefeipek.github.io`, repo köküne `CNAME` dosyası, Settings → Pages → Custom domain.

### ✅ KAPALI (Sprint 2'de tamamlandı)

- [x] **Kişisel GitHub URL** → `https://github.com/ilkerefeipek` (`links.github`)
- [x] **Portfolio repo URL** → `https://github.com/ilkerefeipek/ilkerefeipek-portfolio` (`links.projectRepos.portfolio`)
- [x] **Web3Forms key** → real key (`links.web3formsKey`) — form aktif çalışır

Detaylı bilgi: [`docs/sprint2_user_inputs.md`](docs/sprint2_user_inputs.md)

## CI/CD

- **`.github/workflows/playwright.yml`** — push ve PR'da E2E + a11y + visual
  regression çalıştırır. Artifact olarak HTML rapor + screenshot diff yükler.
- **`.github/workflows/lighthouse.yml`** — push ve PR'da Lighthouse CI
  çalıştırır. Performance/A11y/BP/SEO < 95 durumunda fail eder.

## Dokümantasyon (docs/)

| Dosya | İçerik |
|-------|--------|
| [requirements_matrix.md](docs/requirements_matrix.md) | Yönerge §1.3, §2.1, §3, §4 → kabul kriteri tablosu |
| [sitemap.md](docs/sitemap.md) | URL inventory, layer mapping, nav, hreflang |
| [hr_checklist.md](docs/hr_checklist.md) | İK 7 kriter × sayfa-bazlı doğrulama |
| [design_system.md](docs/design_system.md) | Phantom tokens, typografi, spacing, motion + brainstorming kararları |
| [cv_translation_log.md](docs/cv_translation_log.md) | TR çeviri terminoloji rehberi |
| [fact_check_log.md](docs/fact_check_log.md) | CV ↔ JSON mapping, düzeltmeler |
| [owasp_review.md](docs/owasp_review.md) | OWASP Top 10 static-site analizi |
| [security_guidance_audit.md](docs/security_guidance_audit.md) | TLS, security headers, dependency posture |
| [feature_dev_plans/](docs/feature_dev_plans/) | hero-sequence, arch-diagram, skills-constellation, i18n, contact-form spec |
| [plans/](docs/plans/) | 5 ajan (PM, content-architect, uiux, frontend, qa) plan dosyaları |

## Lisans

MIT — kişisel ve eğitim amaçlı kullanıma açık.

## Teşekkür

- [Phantom Wallet](https://phantom.com) — dark elegance design dili referansı
- [Inter](https://rsms.me/inter/) ve [JetBrains Mono](https://www.jetbrains.com/mono/) — typografi
- [Web3Forms](https://web3forms.com) — backend-free form forwarder
- [Playwright](https://playwright.dev/), [axe-core](https://github.com/dequelabs/axe-core), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) — test altyapısı
