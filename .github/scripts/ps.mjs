// PlayStation Store (TR) indirimlerini çeker, ps.json üretir.
// Kullanım: node .github/scripts/ps.mjs out/ps.json
// Mağaza sayfaları Next.js ile üretilir; ürünler sayfadaki __NEXT_DATA__ (Apollo önbelleği) içinde gelir.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://store.playstation.com';
const KNOWN = ['3f772501-f6f8-49b7-abac-874a88ca4897'];   // "İndirimler" kategorisi (bulunamazsa sayfadan keşfedilir)
const PAGES_PER_CAT = 3;
const MAX_ITEMS = 48;
const MIN_BASE_TRY = 250;   // çok ucuz (çöp) oyunlar listeye girmesin
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const num = (s) => {            // "₺1.099,00" -> 1099
  const t = String(s ?? '').replace(/[^\d.,]/g, '');
  if (!t) return NaN;
  return parseFloat(t.replace(/\./g, '').replace(',', '.'));
};

export function nextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// Ağaçta "name" + "price{basePrice,discountedPrice}" taşıyan her nesneyi ürün sayar.
export function products(root) {
  const out = [], seen = new Set();
  const walk = (o, d) => {
    if (!o || typeof o !== 'object' || d > 14 || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) { o.forEach((x) => walk(x, d + 1)); return; }
    const p = o.price;
    if (typeof o.name === 'string' && p && typeof p === 'object' && (p.basePrice || p.discountedPrice)) out.push(o);
    for (const k in o) walk(o[k], d + 1);
  };
  walk(root, 0);
  return out;
}

export function toItem(o) {
  const p = o.price || {};
  const base = num(p.basePrice), now = num(p.discountedPrice);
  if (!(base > 0) || !(now >= 0) || now >= base || p.isFree) return null;
  if (base < MIN_BASE_TRY) return null;
  let pct = parseInt(String(p.discountText || '').replace(/\D/g, ''), 10);
  if (!(pct > 0)) pct = Math.round((1 - now / base) * 100);
  if (!(pct > 0)) return null;
  const media = Array.isArray(o.media) ? o.media : [];
  const pick = (r) => media.find((m) => m && m.role === r && m.type === 'IMAGE' && /^https:/.test(m.url || ''));
  const im = pick('PORTRAIT_BANNER') || pick('MASTER') || pick('GAMEHUB_COVER_ART') || media.find((m) => m && m.type === 'IMAGE' && /^https:/.test(m.url || ''));
  const id = String(o.id || o.productId || '');
  if (!id) return null;
  const kind = /^[A-Z]{2}\d{4}-/.test(id) ? 'product' : (o.__typename === 'Concept' ? 'concept' : 'product');
  const plats = (Array.isArray(o.platforms) ? o.platforms : []).filter((x) => /^PS[345]$/i.test(String(x))).map((x) => String(x).toUpperCase());
  const fmt = (n) => '₺' + Math.round(n).toLocaleString('tr-TR');
  return {
    id, name: String(o.name).slice(0, 120), pct, now, base,
    img: im ? im.url.split('?')[0] + '?w=360' : '',
    plat: [...new Set(plats)].join('/'),
    end: p.endTime ? String(p.endTime) : '',
    price: fmt(now), was: fmt(base),
    url: `${BASE}/tr-tr/${kind}/${id}`,
  };
}

// Mağaza sayfası içeriği tarayıcıda yüklenir; ürünler mağazanın kendi GraphQL ucundan (kalıcı sorgu) gelir.
const API = 'https://web.np.playstation.com/api/graphql/v1/op';
const HASH = '9845afc0dbaab4965f6563fffc703f588c8e76792000e8610843b8d3ee9c4c09';   // categoryGridRetrieve
const KEEP = /^(Tam Sürüm Oyun|Premium Sürüm|Oyun Paketi)$/i;   // eklenti, kostüm, seviye vb. girmesin

async function grid(cat, offset, size = 100) {
  const vars = { id: cat, pageArgs: { size, offset }, sortBy: { name: 'sales30', isAscending: false }, filterBy: [], facetOptions: [] };
  const url = API + '?operationName=categoryGridRetrieve&variables=' + encodeURIComponent(JSON.stringify(vars)) +
    '&extensions=' + encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: HASH } }));
  const r = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json', 'content-type': 'application/json', 'x-psn-store-locale-override': 'tr-TR',
      origin: BASE, referer: BASE + '/', 'accept-language': 'tr-TR,tr;q=0.9' },
    signal: AbortSignal.timeout(25000),
  });
  const j = await r.json().catch(() => null);
  const g = j && j.data && j.data.categoryGridRetrieve;
  console.log(r.status, 'grid', cat, 'offset', offset, '→', g ? (g.products || []).length : 'veri yok', j && j.errors ? JSON.stringify(j.errors).slice(0, 200) : '');
  return g;
}

async function main() {
  const outFile = process.argv[2] || 'out/ps.json';
  const byId = new Map();
  for (const cat of KNOWN) {
    for (let off = 0; off < 300; off += 100) {
      let g;
      try { g = await grid(cat, off); } catch (e) { console.log('hata:', e.message); break; }
      if (!g) break;
      for (const o of g.products || []) {
        if (!KEEP.test(String(o.localizedStoreDisplayClassification || ''))) continue;
        const it = toItem(o);
        if (it && it.pct >= 20 && !byId.has(it.id)) byId.set(it.id, it);
      }
      if (g.pageInfo && g.pageInfo.isLast) break;
    }
  }
  const seenName = new Set();
  const list = [...byId.values()]
    .sort((a, b) => b.pct - a.pct || b.base - a.base)
    .filter((x) => !seenName.has(x.name.toLowerCase()) && seenName.add(x.name.toLowerCase()))
    .slice(0, MAX_ITEMS);
  if (!list.length) {
    console.log('::warning::PS Store: indirimli ürün bulunamadı (engellenmiş ya da sorgu değişmiş olabilir); ps.json yazılmadı.');
    return;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ t: new Date().toISOString(), items: list }));
  console.log('yazıldı:', outFile, list.length, 'ürün');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.log('::warning::' + e.message); });
