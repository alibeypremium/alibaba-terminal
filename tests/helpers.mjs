// Ortak test yardımcıları: public/ klasörünü yerel sunucuda açar, tarayıcıyı başlatır, dış ağı keser (testler sahte verilerle çalışır).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

export const ROOT = path.resolve(import.meta.dirname, '..', 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

export async function startServer() {
  const srv = http.createServer((q, r) => {
    let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end('yok'); return; }
    r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${srv.address().port}/index.html`, close: () => new Promise((ok) => srv.close(ok)) };
}

export const launch = () => chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

export const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

/** Yeni bağlam: yerel sunucu dışındaki her istek kesilir; `mocks` ile belirli adresler sahte yanıtlanır. */
export async function newContext(browser, { viewport = { width: 1920, height: 909 }, mocks = [] } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  for (const [re, fn] of mocks) await ctx.route(re, fn);
  return ctx;
}

/** Sayfayı açar; konsol/sayfa hatalarını (ağ kesintisi gürültüsü hariç) `errors` dizisinde toplar. */
export async function openPage(ctx, url, { ls = {}, layout } = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|CORS|preflight/i.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(([ls, layout]) => {
    try {
      if (!sessionStorage.__init) {
        sessionStorage.__init = '1';
        for (const [k, v] of Object.entries(ls)) localStorage[k] = typeof v === 'string' ? v : JSON.stringify(v);
        if (layout) localStorage['pano.layout.v3'] = JSON.stringify(layout);
      }
    } catch {}
  }, [ls, layout]);
  await page.goto(url);
  return { page, errors };
}

export const json = (o) => ({ contentType: 'application/json', headers: CORS, body: JSON.stringify(o) });

/** Tek bir PS ürünü satırı (ps.json / ps-all.json biçimi). */
export const psRow = (i, { disc = true, pre = false, lo, d } = {}) => ({
  id: 'EP' + i, n: ['Sniper Ghost Warrior', 'Ad Infinitum', 'Sniper Elite', 'Hexe Sihirbaz', 'Işık Savaşı', 'FC 26', 'Gran Turismo'][i % 7] + ' ' + i,
  now: 100 + i * 10, base: disc ? 200 + i * 10 : 100 + i * 10, im: 'p' + i, pl: '5', pre, ...(lo ? { lo } : {}), ...(d ? { d } : {}),
});

/** Okuyucuyu açmak için sayfaya kendi (widget'ların yeniden çizmediği) haber bağlantısını koyar ve tıklar. */
export async function openReaderFor(page, title = 'Zelda haberi', href = 'https://www.example-oyun.com/zelda') {
  await page.evaluate(([title, href]) => {
    document.getElementById('tnw')?.remove();
    const d = document.createElement('div');
    d.className = 'nw'; d.id = 'tnw';
    d.style.cssText = 'position:fixed;left:20px;top:20px;width:430px;height:640px;z-index:5;overflow:hidden';
    d.innerHTML = '<a class="nw-i" data-rd="1" href="' + href + '" target="_blank"><b>' + title + '</b><span>Oyun · 1 sa</span></a>';
    document.body.append(d);
  }, [title, href]);
  await page.click('#tnw a.nw-i');
}
