/**
 * Automated Security Test Suite for Portfolio v2
 * Validates HTTP security headers, CSP strictness, HTML link safety,
 * SVG sanitization, secret hygiene, and DOM defense routines.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('       RUNNING SECURITY DEFENSE TEST SUITE             ');
console.log('======================================================\n');

// 1. DEPLOYMENT & HEADERS CONFIGURATION (vercel.json)
console.log('[Group 1: Deployment & Security Headers]');

const vercelConfigPath = path.join(ROOT_DIR, 'vercel.json');
test('vercel.json exists and is valid JSON', () => {
  assert(fs.existsSync(vercelConfigPath), 'vercel.json must exist');
  const raw = fs.readFileSync(vercelConfigPath, 'utf8');
  JSON.parse(raw);
});

const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
const globalHeaders = (vercelConfig.headers || []).find(h => h.source === '/(.*)')?.headers || [];
const headerMap = {};
globalHeaders.forEach(h => {
  headerMap[h.key.toLowerCase()] = h.value;
});

test('Strict-Transport-Security (HSTS) is properly configured with preload', () => {
  const hsts = headerMap['strict-transport-security'];
  assert(hsts, 'HSTS header missing');
  assert(hsts.includes('max-age='), 'HSTS must define max-age');
  assert(hsts.includes('includeSubDomains'), 'HSTS must include includeSubDomains');
  assert(hsts.includes('preload'), 'HSTS must include preload');
});

test('X-Frame-Options is set to DENY (Clickjacking defense)', () => {
  assert.strictEqual(headerMap['x-frame-options'], 'DENY');
});

test('X-Content-Type-Options is set to nosniff (MIME sniffing defense)', () => {
  assert.strictEqual(headerMap['x-content-type-options'], 'nosniff');
});

test('Referrer-Policy is set to strict-origin-when-cross-origin', () => {
  assert.strictEqual(headerMap['referrer-policy'], 'strict-origin-when-cross-origin');
});

test('Permissions-Policy restricts sensitive device APIs', () => {
  const policy = headerMap['permissions-policy'];
  assert(policy, 'Permissions-Policy missing');
  assert(policy.includes('camera=()'), 'Camera must be disabled');
  assert(policy.includes('microphone=()'), 'Microphone must be disabled');
  assert(policy.includes('geolocation=()'), 'Geolocation must be disabled');
});

test('Cross-Origin-Opener-Policy & Cross-Origin-Resource-Policy are restricted', () => {
  assert.strictEqual(headerMap['cross-origin-opener-policy'], 'same-origin');
  assert.strictEqual(headerMap['cross-origin-resource-policy'], 'same-origin');
});

// 2. CONTENT SECURITY POLICY (CSP) ANALYSIS
console.log('\n[Group 2: Content-Security-Policy (CSP) Rigor]');

const csp = headerMap['content-security-policy'];
test('Content-Security-Policy header is defined', () => {
  assert(csp, 'CSP header is missing');
});

test("CSP forbids 'unsafe-inline' and 'unsafe-eval' in script-src", () => {
  const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
  assert(scriptSrcMatch, 'script-src directive missing in CSP');
  const scriptDirectives = scriptSrcMatch[1];
  assert(!scriptDirectives.includes("'unsafe-inline'"), "script-src must NOT allow 'unsafe-inline'");
  assert(!scriptDirectives.includes("'unsafe-eval'"), "script-src must NOT allow 'unsafe-eval'");
  assert(scriptDirectives.includes("'self'"), "script-src must specify 'self'");
});

test("CSP restricts object-src to 'none'", () => {
  assert(csp.includes("object-src 'none'"), "object-src must be 'none'");
});

test("CSP restricts frame-ancestors to 'none'", () => {
  assert(csp.includes("frame-ancestors 'none'"), "frame-ancestors must be 'none'");
});

test("CSP restricts base-uri to 'self'", () => {
  assert(csp.includes("base-uri 'self'"), "base-uri must be 'self'");
});

// 3. HTML FILES SANITIZATION & EXTERNAL LINK HYGIENE
console.log('\n[Group 3: HTML Markup & External Link Safety]');

const htmlFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.html'));

test('All HTML files have zero unauthorized inline executable <script> tags', () => {
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
    const inlineScripts = content.match(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi) || [];
    inlineScripts.forEach(tag => {
      const hasSrc = /src=["'][^"']+["']/i.test(tag);
      assert(hasSrc, `Inline executable script detected in ${file}: ${tag.slice(0, 50)}...`);
    });
  });
});

test('All target="_blank" external links enforce rel="noopener noreferrer"', () => {
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
    const regex = /<a\s+[^>]*target=["'_]?blank["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const tag = match[0];
      assert(/rel=["'][^"']*noopener[^"']*["']/i.test(tag), `Missing noopener in ${file}: ${tag}`);
      assert(/rel=["'][^"']*noreferrer[^"']*["']/i.test(tag), `Missing noreferrer in ${file}: ${tag}`);
    }
  });
});

// 4. SVG ASSET HYGIENE
console.log('\n[Group 4: SVG Vector Asset Hygiene]');

function getSvgFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== '.git') results = results.concat(getSvgFiles(fullPath));
    } else if (file.endsWith('.svg')) {
      results.push(fullPath);
    }
  });
  return results;
}

const svgFiles = getSvgFiles(ROOT_DIR);
test('All SVG files are free of scripts, event handlers, and data/javascript URIs', () => {
  assert(svgFiles.length > 0, 'No SVGs found to test');
  svgFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    assert(!/<script/i.test(content), `Script tag found in SVG: ${path.basename(filePath)}`);
    assert(!/\bon[a-z]+\s*=/i.test(content), `Event handler found in SVG: ${path.basename(filePath)}`);
    assert(!/href=["']javascript:/i.test(content), `javascript: URI found in SVG: ${path.basename(filePath)}`);
  });
});

// 5. SECRET & CREDENTIAL EXPOSURE CHECKS
console.log('\n[Group 5: Secret Exposure & Repository Hygiene]');

test('.gitignore exists and ignores sensitive files and keys', () => {
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  assert(fs.existsSync(gitignorePath), '.gitignore must exist');
  const content = fs.readFileSync(gitignorePath, 'utf8');
  assert(content.includes('.env'), '.gitignore must ignore .env');
  assert(content.includes('*.pem') || content.includes('*.key'), '.gitignore must ignore certificates/keys');
});

test('No API keys or private tokens committed in code or text assets', () => {
  const scanExtensions = ['.html', '.js', '.css', '.txt', '.json'];
  function scanDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      if (file === '.git' || file === 'node_modules') return;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (scanExtensions.includes(path.extname(file))) {
        const text = fs.readFileSync(fullPath, 'utf8');
        const pattern = /(?:api[_-]?key|secret|private[_-]?key|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i;
        assert(!pattern.test(text), `Potential exposed credential in ${path.relative(ROOT_DIR, fullPath)}`);
      }
    });
  }
  scanDir(ROOT_DIR);
});

// 6. CLIENT-SIDE DOM DEFENSE ROUTINES
console.log('\n[Group 6: Client-Side DOM Defense Routines]');

const isValidDomId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_\-]+$/.test(id);
const isSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(?:javascript|vbscript):/i.test(trimmed)) return false;
  return /^(?:assets\/|\.\/|\/|https:\/\/|data:image\/)/i.test(trimmed);
};

test('DOM identifier validator permits valid alphanumeric/dash IDs', () => {
  assert.strictEqual(isValidDomId('projects'), true);
  assert.strictEqual(isValidDomId('experience-section'), true);
  assert.strictEqual(isValidDomId('item_123'), true);
});

test('DOM identifier validator strictly rejects injection and malformed selectors', () => {
  assert.strictEqual(isValidDomId('<script>alert(1)</script>'), false);
  assert.strictEqual(isValidDomId("a[href='xyz']"), false);
  assert.strictEqual(isValidDomId('#id'), false);
  assert.strictEqual(isValidDomId(':invalid'), false);
  assert.strictEqual(isValidDomId('id" onload='), false);
});

test('Safe image URL validator permits legitimate relative and HTTPS assets', () => {
  assert.strictEqual(isSafeImageUrl('assets/profile/ankit_profile.jpg'), true);
  assert.strictEqual(isSafeImageUrl('./assets/projects/campus_buddy.png'), true);
  assert.strictEqual(isSafeImageUrl('/assets/favicon.svg'), true);
  assert.strictEqual(isSafeImageUrl('https://example.com/photo.png'), true);
  assert.strictEqual(isSafeImageUrl('data:image/png;base64,iVBORw0KGgo='), true);
});

test('Safe image URL validator strictly rejects dangerous pseudo-protocols', () => {
  assert.strictEqual(isSafeImageUrl('javascript:alert(1)'), false);
  assert.strictEqual(isSafeImageUrl('JAVASCRIPT:document.location="http://evil.com"'), false);
  assert.strictEqual(isSafeImageUrl('vbscript:msgbox(1)'), false);
  assert.strictEqual(isSafeImageUrl('ftp://malicious.host/file.png'), false);
});

console.log('\n======================================================');
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} passed`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
