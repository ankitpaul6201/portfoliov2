# Security Policy & Vulnerability Disclosure

This document outlines the security policies, vulnerability reporting procedures, and production hardening standards for **Portfolio v2** (`https://ankitxdev.vercel.app`).

---

## 1. Vulnerability Disclosure Policy

We take the security of this portfolio and associated systems seriously. If you discover a vulnerability or security weakness, please report it responsibly according to this coordinated vulnerability disclosure policy.

### Reporting a Vulnerability
- **Primary Security Contact:** Ankit Paul (`ankitpaul9341@gmail.com`)
- **PGP/Encrypted Communications:** Upon request via email.
- **Please Include in Your Report:**
  - Clear, reproducible summary of the finding.
  - Affected endpoint, asset, or DOM component.
  - Conceptual explanation of the impact and potential risk.
  - **Do NOT** include weaponized exploit payloads, automated scanner spam, or denial-of-service attempts.

### Response Timeframes & Service Level Objectives (SLO)
- **Initial Acknowledgment:** Within **24 hours**.
- **Triage & Impact Assessment:** Within **48 hours**.
- **Fix & Deployment:** Within **72 hours** for high/critical issues; within **7 days** for lower-severity improvements.
- **Public Disclosure:** Coordinated after a fix is verified and deployed.

### Safe Harbor Statement
Security researchers acting in good faith who follow this policy will not face legal action. We ask that researchers:
- Give us reasonable time to remediate issues before making information public.
- Make every effort to avoid privacy violations, degradation of user experience, and disruption to production services.
- Never alter or destroy data.

---

## 2. Production Deployment & Hardening Checklist

When deploying to Vercel, Netlify, Cloudflare Pages, or an NGINX/Apache origin, ensure the following controls remain active:

### HTTP Response Headers
- [x] **Content-Security-Policy (CSP):** Strict configuration without `'unsafe-inline'` or `'unsafe-eval'` in `script-src`.
- [x] **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload` (qualifies for HSTS Preload List).
- [x] **X-Frame-Options:** `DENY` (enforces anti-clickjacking protection across legacy and modern user agents).
- [x] **X-Content-Type-Options:** `nosniff` (prevents MIME confusion and browser MIME sniffing).
- [x] **Referrer-Policy:** `strict-origin-when-cross-origin` (prevents path leakage on outbound navigation).
- [x] **Permissions-Policy:** Explicitly revokes unused hardware APIs (`camera=(), microphone=(), geolocation=(), payment=()`).
- [x] **Cross-Origin-Opener-Policy (COOP):** `same-origin`.
- [x] **Cross-Origin-Resource-Policy (CORP):** `same-origin`.

### Client-Side DOM Defenses
- [x] **DOM ID Sanitization:** All URL fragment (`window.location.hash`) lookups are checked against `^[a-zA-Z0-9_\-]+$` before querying the DOM via `document.getElementById()`.
- [x] **Image Source Validation:** All dynamic image modal triggers strictly permit only local assets and verified protocols, rejecting `javascript:` and executable URIs.
- [x] **Web Storage Guarding:** `localStorage` and `sessionStorage` accesses are wrapped in `try/catch` to prevent `SecurityError` crashes in sandboxed iframe or private browsing contexts.
- [x] **External Anchors:** Every external link opening in a new tab includes `rel="noopener noreferrer"`.
- [x] **Zero Inline Executable Scripts:** All client logic runs from externally linked, immutable scripts (`theme-init.js`, `main.js`).

---

## 3. Contact & Attribution

- **Maintainer:** Ankit Paul
- **Website:** [ankitxdev.vercel.app](https://ankitxdev.vercel.app)
- **GitHub:** [@ankitpaul6201](https://github.com/ankitpaul6201)
- **LinkedIn:** [ankitpaul007](https://www.linkedin.com/in/ankitpaul007/)
