// PlayStation Store (TR) verisi: 2 dosya üretir.
//   ps.json     : { t, deals:[...], soon:[...] }   → "İndirim" (çok satan indirimler) ve "Yakında" (ön sipariş / yakında çıkacak) sekmeleri
//   ps-all.json : { t, g:[[id, ad, güncel, eski, görsel, platform], ...] }  → arama ve istek listesi (tüm PS5 + PS4 oyunları)
// Kullanım: node .github/scripts/ps.mjs out
// Mağaza sayfaları tarayıcıda yüklenir; veri, mağazanın kendi GraphQL ucundan (kalıcı sorgu) alınır.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://store.playstation.com';
const IMG = 'https://image.api.playstation.com/';
const API = 'https://web.np.playstation.com/api/graphql/v1/op';
const HASH = '9845afc0dbaab4965f6563fffc703f588c8e76792000e8610843b8d3ee9c4c09';   // categoryGridRetrieve
const CAT = { deals: '3f772501-f6f8-49b7-abac-874a88ca4897', ps5: '4cbf39e2-5749-4970-ba81-93a489e4570c', ps4: '44d8bb20-653e-431e-8ad0-c0a365f68d2f' };
const KEEP = /^(Tam Sürüm Oyun|Premium Sürüm|Oyun Paketi)$/i;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DEAL_MIN_PCT = 20, DEAL_MIN_BASE = 250, DEAL_MAX = 60, SOON_MAX = 80;

const num = (s) => {            // "1.099,00 TL" -> 1099
  const t = String(s ?? '').replace(/[^\d.,]/g, '');
  if (!t) return NaN;
  return parseFloat(t.replace(/\./g, '').replace(',', '.'));
};
const imgPath = (o) => {
  const media = Array.isArray(o.media) ? o.media : [];
  const pick = (r) => media.find((m) => m && m.role === r && m.type === 'IMAGE' && /^https:/.test(m.url || ''));
  const im = pick('PORTRAIT_BANNER') || pick('MASTER') || pick('GAMEHUB_COVER_ART') || media.find((m) => m && m.type === 'IMAGE' && /^https:/.test(m.url || ''));
  return im ? im.url.replace(IMG, '').split('?')[0] : '';
};
const plat = (o) => {
  const p = new Set((Array.isArray(o.platforms) ? o.platforms : []).map((x) => String(x).toUpperCase()));
  return (p.has('PS5') ? '5' : '') + (p.has('PS4') ? '4' : '');
};
// Ürün → { id, n, now, base, im, pl }
export function toRow(o) {
  const id = String(o.id || '');
  if (!id || typeof o.name !== 'string') return null;
  const p = o.price || {};
  const base = num(p.basePrice), now = num(p.discountedPrice);
  const b = Number.isFinite(base) ? base : 0;
  const n = Number.isFinite(now) ? now : b;
  return { id, n: String(o.name).replace(/\s+/g, ' ').trim().slice(0, 100), now: Math.round(n), base: Math.round(b), im: imgPath(o), pl: plat(o), pre: !!(Array.isArray(o.skus) && o.skus.some((s) => s && s.type === 'PREORDER')) };
}
export const pct = (r) => (r.base > 0 && r.now < r.base ? Math.round((1 - r.now / r.base) * 100) : 0);

async function grid(cat, offset, size, sortName, asc, filterBy) {
  const vars = { id: cat, pageArgs: { size, offset }, sortBy: sortName ? { name: sortName, isAscending: !!asc } : null, filterBy: filterBy || [], facetOptions: [] };
  const url = API + '?operationName=categoryGridRetrieve&variables=' + encodeURIComponent(JSON.stringify(vars)) +
    '&extensions=' + encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: HASH } }));
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'application/json', 'content-type': 'application/json', 'x-psn-store-locale-override': 'tr-TR',
          origin: BASE, referer: BASE + '/', 'accept-language': 'tr-TR,tr;q=0.9' },
        signal: AbortSignal.timeout(25000),
      });
      const j = await r.json().catch(() => null);
      const g = j && j.data && j.data.categoryGridRetrieve;
      if (g) return g;
      console.log(r.status, 'grid', cat.slice(0, 8), offset, j && j.errors ? JSON.stringify(j.errors).slice(0, 160) : 'veri yok');
    } catch (e) { console.log('grid hata', e.message); }
    await new Promise((r) => setTimeout(r, 1500 * (k + 1)));
  }
  return null;
}
const okProduct = (o) => KEEP.test(String(o.localizedStoreDisplayClassification || ''));

async function pool(jobs, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) { const j = jobs[i++]; await fn(j); } }));
}

async function main() {
  const outDir = process.argv[2] || 'out';
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString();

  // 1) Çok satan indirimler (satış sırası korunur)
  const deals = [], seenD = new Set();
  for (let off = 0; off < 400 && deals.length < DEAL_MAX; off += 100) {
    const g = await grid(CAT.deals, off, 100, 'sales30', false);
    if (!g) break;
    for (const o of g.products || []) {
      if (!okProduct(o)) continue;
      const r = toRow(o);
      if (!r || pct(r) < DEAL_MIN_PCT || r.base < DEAL_MIN_BASE || seenD.has(r.n.toLowerCase())) continue;
      seenD.add(r.n.toLowerCase()); deals.push(r);
      if (deals.length >= DEAL_MAX) break;
    }
  }
  console.log('indirim:', deals.length);

  // 2) Yakında / ön sipariş (çıkış tarihine göre)
  const soon = [], seenS = new Set();
  for (const c of [CAT.ps5, CAT.ps4]) {
    for (let off = 0; off < 200; off += 100) {
      const g = await grid(c, off, 100, 'productReleaseDate', true, ['productReleaseDate:future_release_date']);
      if (!g) break;
      for (const o of g.products || []) {
        if (!okProduct(o)) continue;
        const r = toRow(o);
        if (!r || seenS.has(r.id) || seenS.has(r.n.toLowerCase())) continue;
        seenS.add(r.id); seenS.add(r.n.toLowerCase()); soon.push(r);
      }
      if (!g.pageInfo || (g.products || []).length < 100) break;
    }
  }
  soon.length = Math.min(soon.length, SOON_MAX);
  // Çıkış tarihi: kategori verisinde yok; ürün sayfasındaki __NEXT_DATA__ içinde "releaseDate" var (TR saatine göre gün)
  await pool(soon, 4, async (r) => {
    try {
      const x = await fetch(BASE + '/tr-tr/product/' + encodeURIComponent(r.id), { headers: { 'user-agent': UA, 'accept-language': 'tr-TR' }, signal: AbortSignal.timeout(20000) });
      const t = await x.text();
      const m = t.match(/"releaseDate":"(\d{4}-\d{2}-\d{2}T[\d:]+Z)"/);
      if (m) r.d = new Date(Date.parse(m[1]) + 3 * 3600e3).toISOString().slice(0, 10);
    } catch (e) { console.log('tarih hata', r.id, e.message); }
  });
  soon.sort((a, b) => (a.d ? 0 : 1) - (b.d ? 0 : 1) || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  console.log('tarihli:', soon.filter((r) => r.d).length);
  console.log('yakında:', soon.length);

  if (deals.length || soon.length) {
    fs.writeFileSync(path.join(outDir, 'ps.json'), JSON.stringify({ t: stamp, deals, soon }));
    console.log('yazıldı: ps.json');
  } else console.log('::warning::PS Store: indirim/yakında listesi boş; ps.json yazılmadı.');

  // 3) Tüm katalog (arama + istek listesi için)
  const all = new Map();
  for (const [label, c] of [['ps5', CAT.ps5], ['ps4', CAT.ps4]]) {
    const first = await grid(c, 0, 100, 'sales30', false);
    if (!first) continue;
    const total = (first.pageInfo && first.pageInfo.totalCount) || 0;
    const add = (g) => { for (const o of g.products || []) { if (!okProduct(o)) continue; const r = toRow(o); if (r && !all.has(r.id)) all.set(r.id, r); } };
    add(first);
    const offs = []; for (let off = 100; off < Math.min(total, 12000); off += 100) offs.push(off);
    const pages = new Map();
    await pool(offs, 3, async (off) => { const g = await grid(c, off, 100, 'sales30', false); if (g) pages.set(off, g); });
    offs.forEach((off) => { if (pages.has(off)) add(pages.get(off)); });
    console.log('katalog', label, 'toplam', total, '→ şimdiye kadar', all.size);
  }
  const rows = [...all.values()];
  if (rows.length >= 3000) {
    const g = rows.map((r) => [r.id, r.n, r.now, r.base, r.im, r.pl]);
    fs.writeFileSync(path.join(outDir, 'ps-all.json'), JSON.stringify({ t: stamp, g }));
    console.log('yazıldı: ps-all.json', rows.length, 'oyun');
  } else console.log('::warning::PS Store: katalog eksik (' + rows.length + '); ps-all.json güncellenmedi (eski dosya korunur).');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.log('::warning::' + e.message); });
