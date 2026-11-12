// Yayından sonra canlı siteyi gerçek tarayıcıyla açar: sayfa hatası, eksik js/css dosyası ya da boş widget varsa başarısız olur.
// Kullanım: node tests/smoke-live.mjs https://alibeypremium.github.io/alibaba-terminal/
import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) { console.error('adres gerekli'); process.exit(2); }
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1920, height: 909 } });
const problems = [];
page.on('pageerror', (e) => problems.push('sayfa hatası: ' + e.message));
page.on('response', (r) => { const u = r.url(); if (u.startsWith(url) && r.status() >= 400) problems.push(r.status() + ' ' + u); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(7000);
const w = await page.evaluate(() => [...document.querySelectorAll('.w')].filter((x) => x.getBoundingClientRect().width > 0).map((x) => [x.dataset.id, x.innerText.trim().length]));
console.log('görünen widget:', w.length, w.map((x) => x.join(':')).join(' '));
if (w.length < 8) problems.push('çok az widget görünüyor: ' + w.length);
const empty = w.filter(([, n]) => n < 3).map(([id]) => id);
if (empty.length) problems.push('boş widget: ' + empty.join(','));
await b.close();
if (problems.length) { console.error('SORUN:\n' + problems.join('\n')); process.exit(1); }
console.log('canlı site sağlam');
