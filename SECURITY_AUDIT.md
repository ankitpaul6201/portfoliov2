# Application Security Audit & Hardening Report

**Target:** Portfolio v2 (`https://ankitxdev.vercel.app`)  
**Repository Branch:** `security/hardening`  
**Audit Date:** November 2026  
**Auditor:** Principal Application Security Engineer & Penetration Tester  
**Status:** All Identified Vulnerabilities Remediated & Verified  

---

## 1. Executive Summary

A comprehensive application security audit, threat model, and defense hardening review was conducted on the **Portfolio v2** web application and its deployment architecture. 

The application is a high-performance, client-side static web application written in standard semantic HTML5, CSS3, and ES6+ JavaScript, hosted on Vercel's Edge CDN. While the application does not maintain persistent database connections or custom server-side authentication endpoints, several significant security weaknesses were identified in the default deployment configuration and client-side DOM processing pipelines:

1. **Missing Edge Security Headers & CSP**: Absence of a Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, and Permissions-Policy exposed the site to clickjacking, MIME sniffing, and script execution threats.
2. **DOM-Based Uncaught Selector Exception & Injection in `main.js`**: `document.querySelector(window.location.hash)` was vulnerable to unhandled DOMExceptions and selector injection when parsing malformed or crafted URL fragments.
3. **Storage Access Fragility**: Unguarded `localStorage` and `sessionStorage` calls were prone to fatal `SecurityError` exceptions in sandboxed or privacy-hardened browser environments.
4. **Inline Script Architectural Impediment**: Inline theme scripts in `<head>` previously prevented the enforcement of a strict `script-src 'self'` Content-Security-Policy.

All weaknesses have been resolved on the `security/hardening` branch, reinforced with a 21-test automated security suite (`tests/security.test.js`) and documented with an enterprise-grade `SECURITY.md` disclosure policy.

---

## 2. Threat Model & Architecture (STRIDE Analysis)

### 2.1 System Architecture & Trust Boundaries
```
+---------------------------------------------------------------------------------+
|                                 TRUST BOUNDARY 1                                |
|  Untrusted Internet / Attacker                                                  |
+---------------------------------------+-----------------------------------------+
                                        | HTTP Requests (URL, Hash, User-Agent)
                                        v
+---------------------------------------------------------------------------------+
|                                 TRUST BOUNDARY 2                                |
|  Edge CDN (Vercel Edge Network) - Enforces HTTP Response Headers & CSP          |
+---------------------------------------+-----------------------------------------+
                                        | Static Content Delivery (HTML, CSS, JS)
                                        v
+---------------------------------------------------------------------------------+
|                                 TRUST BOUNDARY 3                                |
|  Client Browser DOM & JavaScript Execution Environment (`main.js`, `theme-init.js`) |
+------------------+--------------------+--------------------+--------------------+
                   |                    |                    |
                   v                    v                    v
           +---------------+    +---------------+    +----------------+
           | Web Storage   |    | Dynamic DOM   |    | Outbound Links |
           | (Local/Sess.) |    | (Lightbox,    |    | (GitHub, L-In) |
           |               |    |  Accordion)   |    |                |
           +---------------+    +---------------+    +----------------+
           [TRUST BOUNDARY 4]   [TRUST BOUNDARY 5]   [TRUST BOUNDARY 6]
```

### 2.2 STRIDE Threat Matrix
| STRIDE Category | Threat Description | Attack Vector / Asset at Risk | Defense & Remediation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker frames portfolio to phish users or spoof identity. | Clickjacking via `<iframe>` overlaying malicious controls. | Configured `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`. |
| **Tampering** | Injected script or malicious extension alters page content or exfiltrates user context. | Client-side DOM, lack of CSP. | Deployed strict CSP: `default-src 'self'; script-src 'self'; object-src 'none'`. |
| **Repudiation** | Malicious reports or uncoordinated vulnerability drops. | Public reputation, project stability. | Published formal `SECURITY.md` coordinated disclosure policy with explicit SLA. |
| **Information Disclosure** | Outbound links or MIME sniffing expose client browsing data or cross-site metadata. | Referrer headers, MIME sniffing, Tabnabbing. | Set `Referrer-Policy: strict-origin-when-cross-origin`, `nosniff`, `COOP`, and `rel="noopener noreferrer"`. |
| **Denial of Service** | Malformed URL hash crashes client JavaScript execution for legitimate users. | `window.location.hash` thrown into `document.querySelector()`. | Strict regex validation (`^[a-zA-Z0-9_\-]+$`) and safe ID lookup via `document.getElementById()`. |
| **Elevation of Privilege** | Execution of unauthorized browser APIs (webcam, microphone, payment). | Browser device sensors & permissions. | Enforced strict `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`. |

---

## 3. Vulnerability Finding Table

| ID | Title | Severity | OWASP Category | Affected File & Line | Remediation Implemented | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **SEC-01** | Missing Content-Security-Policy (CSP) | **High** | A05:2021 – Security Misconfiguration | `vercel.json` (New) | Configured comprehensive CSP restricting `default-src 'self'`, `script-src 'self'`, and `object-src 'none'`. | **FIXED** |
| **SEC-02** | Missing Defense-in-Depth HTTP Security Headers | **Medium** | A05:2021 – Security Misconfiguration | `vercel.json` (New) | Configured HSTS (`preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`. | **FIXED** |
| **SEC-03** | DOM Selector Injection & Unhandled Exception in Hash Handler | **Medium** | A03:2021 – Injection | `main.js` (L90-149) | Added strict regex validation (`isValidDomId`) and switched to safe `document.getElementById()` lookup. | **FIXED** |
| **SEC-04** | Fragile Web Storage Access Causing DOM Crashes in Hardened Browsers | **Low** | A04:2021 – Insecure Design | `main.js` & `theme-init.js` | Built safe `safeStorage` wrapper guarded by `try/catch` blocks resilient to `SecurityError`. | **FIXED** |
| **SEC-05** | Inline Executable Script Violating Strict CSP Standard | **Low** | A05:2021 – Security Misconfiguration | All HTML files (Head) | Refactored inline theme script into dedicated `theme-init.js`, allowing zero `'unsafe-inline'` in `script-src`. | **FIXED** |
| **SEC-06** | Missing Repository Security Hygiene & Git Ignore Rules | **Info** | A05:2021 – Security Misconfiguration | `.gitignore` (New) | Created comprehensive `.gitignore` preventing accidental commits of keys, env files, and OS artifacts. | **FIXED** |

---

## 4. In-Depth Vulnerability Analysis & Fix Details

### SEC-01 & SEC-02: Missing Edge Security Headers & Strict CSP
- **Vulnerability Explanation:** Without explicit header directives defined for Vercel, responses were served with permissive browser defaults. Browsers permitted framing inside arbitrary domains (enabling UI redressing/clickjacking), MIME-type sniffing of files, unrestricted execution of third-party scripts, and unmitigated access to hardware APIs like microphones and cameras.
- **Defensive Implementation:** Created `vercel.json` delivering production headers on every route (`/(.*)`):
  ```json
  {
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content;"
  }
  ```
  Complementary headers: HSTS (2-year preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.

### SEC-03: DOM Selector Injection & Unhandled Exception in `main.js`
- **Vulnerability Explanation:** Previously, `main.js` executed:
  ```javascript
  if (window.location.hash) {
    const hashEl = document.querySelector(window.location.hash);
    ...
  }
  ```
  If an attacker shared a link with a crafted fragment (e.g. `/#<img/onerror=...>`, `/#123`, or `/#:invalid`), `document.querySelector` threw an uncaught `DOMException: Failed to execute 'querySelector' on 'Document': ... is not a valid selector`. This uncaught exception immediately terminated subsequent script execution, breaking navigation, accordions, and the theme switcher for the user.
- **Defensive Implementation:** Sanitized hash extraction using a strict identifier allowlist:
  ```javascript
  const isValidDomId = (id) => typeof id === "string" && /^[a-zA-Z0-9_\-]+$/.test(id);

  if (window.location.hash && window.location.hash.length > 1) {
    const rawHash = window.location.hash.slice(1);
    if (isValidDomId(rawHash)) {
      try {
        const hashEl = document.getElementById(rawHash);
        if (hashEl) {
          setTimeout(() => {
            const accordion = hashEl.querySelector("details") || hashEl.closest(".smooth-details");
            if (accordion) accordion.open = true;
          }, 300);
        }
      } catch (e) {
        // Safe suppression of any DOM lookup anomalies
      }
    }
  }
  ```

### SEC-04 & SEC-05: Web Storage Guarding & Clean Script Separation
- **Vulnerability Explanation:** Direct invocations of `localStorage.getItem` or `sessionStorage.setItem` in restricted contexts (e.g. cross-origin sandboxed iframes or browsers with aggressive third-party cookie/storage blocking) throw a fatal `SecurityError`. Furthermore, inline script tags in HTML files prevented configuring CSP without `'unsafe-inline'`.
- **Defensive Implementation:**
  1. Extracted the early theme bootstrap into `theme-init.js` and wrapped storage calls inside `try/catch`.
  2. Implemented `safeStorage` in `main.js` with fallback error suppression.
  3. Replaced inline `<script>` tags in `index.html`, `resume.html`, `ai-engineer.html`, `ml-engineer.html`, `software-developer.html`, and `quantitative-finance.html` with `<script src="theme-init.js"></script>`.

---

## 5. Verification & Security Test Suite

An automated Node.js security validation test suite was built in `tests/security.test.js`.

### Test Execution Results
```
======================================================
       RUNNING SECURITY DEFENSE TEST SUITE             
======================================================

[Group 1: Deployment & Security Headers]
  ✔ vercel.json exists and is valid JSON
  ✔ Strict-Transport-Security (HSTS) is properly configured with preload
  ✔ X-Frame-Options is set to DENY (Clickjacking defense)
  ✔ X-Content-Type-Options is set to nosniff (MIME sniffing defense)
  ✔ Referrer-Policy is set to strict-origin-when-cross-origin
  ✔ Permissions-Policy restricts sensitive device APIs
  ✔ Cross-Origin-Opener-Policy & Cross-Origin-Resource-Policy are restricted

[Group 2: Content-Security-Policy (CSP) Rigor]
  ✔ Content-Security-Policy header is defined
  ✔ CSP forbids 'unsafe-inline' and 'unsafe-eval' in script-src
  ✔ CSP restricts object-src to 'none'
  ✔ CSP restricts frame-ancestors to 'none'
  ✔ CSP restricts base-uri to 'self'

[Group 3: HTML Markup & External Link Safety]
  ✔ All HTML files have zero unauthorized inline executable <script> tags
  ✔ All target="_blank" external links enforce rel="noopener noreferrer"

[Group 4: SVG Vector Asset Hygiene]
  ✔ All SVG files are free of scripts, event handlers, and data/javascript URIs

[Group 5: Secret Exposure & Repository Hygiene]
  ✔ .gitignore exists and ignores sensitive files and keys
  ✔ No API keys or private tokens committed in code or text assets

[Group 6: Client-Side DOM Defense Routines]
  ✔ DOM identifier validator permits valid alphanumeric/dash IDs
  ✔ DOM identifier validator strictly rejects injection and malformed selectors
  ✔ Safe image URL validator permits legitimate relative and HTTPS assets
  ✔ Safe image URL validator strictly rejects dangerous pseudo-protocols

======================================================
TEST RESULTS: 21 / 21 passed
======================================================
```

---

## 6. Residual Risks & Operational Recommendations

1. **Third-Party External Links**:
   - The site links out to external profiles and demos (GitHub, LinkedIn, Google AI Studio). While `rel="noopener noreferrer"` protects the portfolio from reverse tabnabbing and window tampering, external destinations should be monitored periodically to ensure external domain ownership has not lapsed.
2. **Future Dynamic Backend Integration**:
   - If interactive contact forms, serverless API routes, or user databases are introduced in the future, enforce server-side schema validation (e.g. Zod), CSRF tokenization, rate limiting, and parameterized database queries at the edge.
3. **Continuous Deployment Integrity**:
   - Integrate `node tests/security.test.js` into GitHub Actions CI/CD to prevent regressions during future portfolio updates.
