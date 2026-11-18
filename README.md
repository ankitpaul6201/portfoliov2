# Ankit Paul - Portfolio v2

[![Security Audit](https://img.shields.io/badge/Security-Hardened-success)](docs/SECURITY_AUDIT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://ankitxdev.vercel.app)

Modern, performant, and security-hardened personal portfolio engineering platform designed with Apple-inspired minimalist aesthetics (SF Pro typography), Google XYZ quantifiable impact metrics, Generative Engine Optimization (GEO), and enterprise-grade HTTP security.

---

## 📁 Repository Structure

```text
portfoliov2/
├── .gitignore                   # Git exclusion rules
├── favicon.ico                  # Root favicon
├── index.html                   # Primary landing page
├── resume.html                  # Interactive CV & career timeline
├── 404.html                     # Custom 404 error page matching theme & typography
├── llms.txt                     # Compact AI crawler & LLM search engine context
├── llms-full.txt                # Comprehensive machine-readable profile documentation
├── robots.txt                   # Search crawler directives & bot permissions
├── sitemap.xml                  # XML sitemap with ISO timestamps
├── vercel.json                  # Edge routing, caching, and HTTP security headers
├── README.md                    # Project documentation & structure guide
├── SECURITY.md                  # Vulnerability reporting & responsible disclosure policy
│
├── assets/                      # Application static assets
│   ├── css/
│   │   └── style.css            # Responsive CSS3 stylesheet & design tokens
│   │
│   ├── js/
│   │   ├── theme-init.js        # Zero-FOUC early theme state initialiser
│   │   ├── main.js              # DOM interactions, modals, and download logic
│   │   └── resume-data.js       # Base64 binary resume payload for direct download
│   │
│   ├── fonts/                   # San Francisco (SF Pro Text & Display) web fonts
│   │   ├── SF-Pro-Display-Bold.otf
│   │   ├── SF-Pro-Display-Regular.otf
│   │   ├── SF-Pro-Display-Semibold.otf
│   │   ├── SF-Pro-Text-Bold.otf
│   │   ├── SF-Pro-Text-Medium.otf
│   │   ├── SF-Pro-Text-Regular.otf
│   │   ├── SF-Pro-Text-RegularItalic.otf
│   │   └── SF-Pro-Text-Semibold.otf
│   │
│   ├── education/               # Education institutional logos
│   ├── experience/              # Professional experience logos
│   ├── gallery/                 # UI screenshots and project showcases
│   ├── profile/                 # Profile photography
│   ├── projects/                # Featured engineering project screenshots
│   │
│   ├── Ankit_Paul_Resume.pdf    # Canonical PDF resume
│   ├── resume_page_1.png        # High-res preview image
│   ├── resume_page_1.webp       # Optimized WebP preview
│   └── icons & favicons         # Multi-resolution SVG & PNG favicons
│
├── docs/                        # Engineering documentation & audits
│   └── SECURITY_AUDIT.md        # Comprehensive STRIDE threat model & pen test audit
│
└── tests/                       # Automated test suites
    └── security.test.js         # Security assertion & header validation suite
```

---

## ⚡ Core Features

- **Google XYZ Resume Engineering:** Experience, achievements, and projects structured around Laszlo Bock's impact formula: *Accomplished [X] as measured by [Y] by doing [Z]*.
- **Direct Instant PDF Download:** Clicking "Download PDF" immediately saves `Ankit_Paul_Resume.pdf` via binary octet-stream blob, completely bypassing native in-browser PDF viewer hijacking.
- **Enterprise Security Hardening:**
  - Strict Content Security Policy (`CSP`) forbidding inline script execution (`'unsafe-inline'` disabled).
  - HTTP Strict Transport Security (`HSTS`) with `max-age=63072000; includeSubDomains; preload`.
  - Frame-busting protection (`X-Frame-Options: DENY`, `frame-ancestors: 'none'`).
  - MIME-type sniffing defense (`X-Content-Type-Options: nosniff`).
  - Strict Referrer & Permissions policies.
  - Client-side DOM sanitization and safe protocol validation (`isSafeImageUrl`, `isValidDomId`).
- **Generative Engine Optimization (GEO & AEO):** Complete Schema.org `Person` JSON-LD graphs, `llms.txt`, and `llms-full.txt` for AI answer engines (ChatGPT Search, Perplexity, Gemini, Copilot).
- **Zero-FOUC Theme Architecture:** Theme preference (`dark` / `light`) is resolved synchronously before render in `theme-init.js` to eliminate theme flicker.

---

## 🧪 Automated Testing

The repository includes an automated security and header verification test suite:

```bash
# Run test suite
node tests/security.test.js
```

### Verification Coverage (21 Automated Tests)
- `vercel.json` syntax & header completeness (HSTS, CSP, XFO, XCTO, Referrer, Permissions, COOP/CORP)
- Strict CSP directives (`'none'`, `'self'`, no `'unsafe-inline'`)
- Zero unauthorized inline executable scripts across all HTML templates
- Rel enforcement (`noopener noreferrer`) on all external links
- SVG hygiene (verification that vector graphics contain no malicious scripts or event handlers)
- Repository secret exposure scans (credential and API token detection)
- Client-side DOM injection & protocol validator unit tests

---

## 🚀 Local Development

To preview the portfolio locally without installing heavy frameworks:

```bash
# Using Python built-in HTTP server:
python -m http.server 8080

# Or using Node's npx serve:
npx serve .
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🛡️ Security & Disclosure

Please refer to [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines and [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for the complete application penetration test report.
