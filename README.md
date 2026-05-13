# İlker Efe İpek — Portfolio

> MBP 206 Sistem Analizi ve Tasarımı dersi final projesi.
> İzmir Ekonomi Üniversitesi · Bilgisayar Programcılığı önlisans programı.

**🌐 Live:** [https://ilkerefeipek.github.io/ilkerefeipek-portfolio/](https://ilkerefeipek.github.io/ilkerefeipek-portfolio/)
**📧 İletişim:** [ilkerefeipek00@gmail.com](mailto:ilkerefeipek00@gmail.com)
**💼 LinkedIn:** [ilker-efe-ipek](https://www.linkedin.com/in/ilker-efe-ipek-b261122b9/)
**📄 CV (PDF):** [Türkçe](assets/files/cv-tr.pdf) · [English](assets/files/cv-en.pdf)

---

## Hakkında

Backend ve veritabanı odaklı bir .NET geliştirici olarak ürettiğim projeleri,
yetkinliklerimi ve CV'mi sergilediğim kişisel portfolyo sitesidir. Tasarım kavramı
**"Layered Mind — Architectural Showcase"**: katmanlı mimari, repository pattern
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
| **Lighthouse** | mobile 86–92 / desktop 99–100 (Performance) · A11y / BP / SEO ≥ 95 |
| **Test** | Playwright E2E + axe-core a11y + visual regression + cross-browser |

## Mimari

```
ilkerefeipek-portfolio/
├─ index.html, about.html, skills.html, projects.html,
│  cv.html, contact.html, 404.html             ← 7 sayfa
├─ data/                                        ← TR/EN içerik (JSON)
│  ├─ content.json    UI copy + links + microcopy
│  ├─ projects.json   4 proje (TR/EN açıklama + features)
│  ├─ skills.json     30 skill, 5 kategori, bento layout
│  ├─ education.json, experience.json, certificates.json, languages.json
├─ assets/
│  ├─ files/          CV PDF (TR + EN)
│  ├─ images/         favicon set, og-cover, avatar SVG, project placeholder
│  ├─ icons/skills/   30 self-hosted SVG (Devicon + Simple Icons)
│  └─ fonts/          Inter + JetBrains Mono woff2 (~176KB total)
├─ styles/
│  ├─ tokens.css      Phantom dark design tokens
│  ├─ base.css        reset, typography, font-face, layout primitives
│  ├─ components.css  10 component (button/pill/card/nav/modal/...)
│  ├─ effects.css     animation keyframes + hero sequence + magnetic-tilt
│  ├─ skills.css      bento grid (sk-* namespace, single source of truth)
│  └─ pages.css       page-specific layouts
├─ scripts/
│  ├─ core/           i18n, data-loader, nav, reduced-motion utilities
│  ├─ effects/        8 visual efekt modülü
│  └─ main.js         orchestrator (page detection, modal, counter, form)
├─ tests/             Playwright E2E + axe + visual regression
└─ .github/workflows/ Playwright CI + Lighthouse CI
```

## 8 Görsel Efekt

Tasarım kavramının "architectural showcase" kimliğini destekleyen efektler.
Hepsi `prefers-reduced-motion: reduce` ve mobile breakpoint constraint'leri ile
disipline edilmiştir.

| # | Efekt | Sayfa |
|---|-------|-------|
| 1 | Code-rain background canvas | hero |
| 2 | Name decode reveal | hero h1 |
| 3 | Cursor-following gradient blob + custom cursor | tüm sayfalar (desktop) |
| 4 | Animated layered architecture diagram | hero (sağ) |
| 5 | Magnetic tilt + glow trail | proje kartları |
| 6 | Skills bento grid (editorial layout, animated gradient borders) | skills |
| 7 | Scroll-driven layer assembly (IntersectionObserver) | tüm sayfalar |
| 8 | View Transitions API (page navigation + lang toggle) | inter-page |

## Geliştirme

Build adımı yok. Local geliştirme için bir HTTP server gerekli (`file://`
protokolü modül import'u ve fetch'i blokar):

```powershell
# Python ile (önerilen — tüm makinelerde Python varsa hazır):
python -m http.server 8765 --bind 127.0.0.1

# veya Node ile:
npx http-server -p 8765

# veya VS Code Live Server extension (auto-refresh bonus)
```

Tarayıcıda `http://127.0.0.1:8765/`.

## Test çalıştırma

Playwright E2E suite — 7 sayfa × multiple viewport, cross-browser
(chromium + firefox + webkit), audit spec'leri (i18n, dead links, console errors,
accessibility, network failures, visual regression).

```powershell
cd tests
npm install
npx playwright install chromium
npx playwright test                              # tüm testler
npx playwright test --project=chromium-desktop   # sadece chromium desktop
npx playwright test --reporter=html              # HTML rapor
npx playwright show-report                       # raporu aç
```

Lighthouse CI:

```powershell
cd tests
npx lhci autorun --config=./lighthouserc.json          # desktop
npx lhci autorun --config=./lighthouserc.mobile.json   # mobile
```

## Deployment (GitHub Pages)

Site GitHub Pages üzerinden otomatik deploy edilir:

1. **Repo public.** Settings → General → Public.
2. **GitHub Pages aktif.** Settings → Pages → Source: `Deploy from a branch`
   → Branch: `main` / `(root)` → Save.
3. Push sonrası ~30-60sn içinde canlı:
   `https://ilkerefeipek.github.io/ilkerefeipek-portfolio/`

GitHub Pages **project site** path mantığı: `username.github.io/{repo}/` —
tüm internal navigation `index.html`, `about.html` gibi **relative path**
kullanır (root absolute `/` user root'una çıkar, kullanılmaz).

## Özellikler

- **TR/EN i18n** — 7 sayfada eksiksiz, `data-i18n` + `data-i18n-attr` pattern,
  JSON-driven render hooks ile `onLangChange` observer
- **30 skill bento grid** — hero (C#) + 4 featured (.NET Core / ASP.NET MVC /
  MSSQL / EF Core) + 18 standard + 7 compact, animated gradient borders
- **CV TR + EN PDFs** — HTML→PDF pipeline ile content.json'dan generate edilir
- **OWASP-compliant external links** — `target="_blank" + rel="noopener noreferrer"`
- **WCAG 2.1 AA accessibility** — 0 axe violation 7 sayfa, keyboard nav, focus
  management, semantic HTML, ARIA labels
- **Responsive** — 375 / 768 / 1440 viewport'larda full coverage
- **Cross-browser** — chromium + firefox + webkit hepsinde test edilir

## CI/CD

- **`.github/workflows/playwright.yml`** — push ve PR'da E2E + a11y + visual
  regression. Artifact olarak HTML rapor + screenshot diff.
- **`.github/workflows/lighthouse.yml`** — push ve PR'da Lighthouse CI.
  Performance/A11y/BP/SEO threshold check.

## Lisans

MIT — kişisel ve eğitim amaçlı kullanıma açık.

## Teşekkür

- [Inter](https://rsms.me/inter/) ve [JetBrains Mono](https://www.jetbrains.com/mono/) — typografi
- [Devicon](https://devicon.dev) ve [Simple Icons](https://simpleicons.org) — skill icon set
- [Web3Forms](https://web3forms.com) — backend-free form forwarder
- [Playwright](https://playwright.dev/), [axe-core](https://github.com/dequelabs/axe-core), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) — test altyapısı
