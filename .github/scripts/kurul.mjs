// Diyanet Din İşleri Yüksek Kurulu kararlarını (soru-cevap) çeker: kurul.json (tam metin) ve kurul-ozet.json (soru + kategori) üretir.
// Kaynak: https://kurul.diyanet.gov.tr/tr/kurul/kararlar  (kararların listesi sitenin kendi sitemap-static.xml dosyasındadır; her karar sayfası sunucudan hazır HTML gelir).
// Metin hiç değiştirilmez, özetlenmez. Yalnızca yeni ya da güncellenen kararlar indirilir; sunucuya nazik davranılır (az eşzamanlı istek, bekleme, tanıtıcı User-Agent).
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://kurul.diyanet.gov.tr';
const SITEMAP = BASE + '/sitemap-static.xml';
const UA = 'AliBabaTerminal/1.0 (kisisel pano; +https://github.com/alibeypremium/alibaba-terminal)';
const norm = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

/** Sitemap içindeki karar adresleri: [{u:'slug/guid', m:'2026-08-21'}] */
export function parseSitemap(xml) {
  const out = [];
  for (const m of xml.matchAll(/<url>\s*<loc>\s*([^<\s]*\/kurul\/karar\/([^<\s]+))\s*<\/loc>([\s\S]*?)<\/url>/g)) {
    const lm = (m[3].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/) || [])[1] || '';
    out.push({ u: decodeURIComponent(m[2]).replace(/\/+$/, ''), m: lm });
  }
  return out;
}

/** Bir karar sayfasını ayrıştırır. Sınıf adlarına değil "Soru / Cevap / Anahtar Kelimeler" başlıklarına dayanır. */
export function parseDetail(html, u) {
  const $ = cheerio.load(html);
  const head = (t) => $('h2').filter((_, e) => norm($(e).text()) === t).first();
  /* Başlığın bulunduğu bölüm: içinde istenen öğeyi (içerik ya da düğmeler) barındıran en yakın üst öğe. */
  const blockOf = (h, sel = '.content-body') => { let e = h.parent(); for (let i = 0; i < 5 && e.length; i++, e = e.parent()) if (e.find(sel).length) return e; return h.parent(); };
  const hs = head('Soru'), hc = head('Cevap'), hk = head('Anahtar Kelimeler');
  if (!hs.length || !hc.length) return null;
  const q = norm(blockOf(hs).find('.content-body').first().text());
  const body = blockOf(hc).find('.content-body').first();
  const a = [];
  body.children().each((_, el) => {
    const $e = $(el), tag = (el.tagName || '').toLowerCase();
    if (tag === 'ul' || tag === 'ol') $e.find('li').each((_, li) => { const t = norm($(li).text()); if (t) a.push('• ' + t); });
    else { const t = norm($e.text()); if (t) a.push(t); }
  });
  if (!a.length) { const t = norm(body.text()); if (t) a.push(t); }
  const k = hk.length ? blockOf(hk, 'button').find('button').map((_, b) => norm($(b).text()).replace(/^#\s*/, '')).get().filter(Boolean) : [];
  const all = norm($('body').text());
  const no = (all.match(/Kurul Karar No:\s*(\d+)/) || [])[1] || '';
  const dm = all.match(/Tarih:\s*(\d{2})\.(\d{2})\.(\d{4})/);
  const d = dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : '';
  let c = '', s = '';
  const am = all.match(/Ana Alan:\s*(.+?)\s*(?:Alt Alan:\s*(.+?)\s*)?(?:Navigasyon|Hızlı İşlemler|$)/);
  if (am) { c = norm(am[1]); s = norm(am[2] || ''); }
  if (!q || !a.length) return null;
  return { u, n: no, d, c, s, q, a, k };
}

async function get(url, tries = 3) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xml' }, signal: AbortSignal.timeout(25000) });
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return await r.text();
    } catch (e) { err = e; await new Promise((ok) => setTimeout(ok, 1500 * (i + 1))); }
  }
  throw err;
}

async function main(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const prevFile = path.join(outDir, 'kurul.json');
  const prev = new Map();
  try { for (const x of JSON.parse(fs.readFileSync(prevFile, 'utf8')).items) prev.set(x.u, x); } catch {}
  const list = parseSitemap(await get(SITEMAP));
  console.log('sitemap:', list.length, 'karar; eski kayıt:', prev.size);
  if (list.length < 100) throw new Error('sitemap beklenenden kısa, vazgeçildi');
  const full = process.env.FULL === '1';
  const todo = list.filter((x) => full || !prev.has(x.u) || prev.get(x.u).m !== x.m);
  console.log('indirilecek:', todo.length);
  const got = new Map(), bad = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const x = todo[next++];
      try {
        const it = parseDetail(await get(BASE + '/tr/kurul/karar/' + x.u), x.u);
        if (!it) throw new Error('ayrıştırılamadı');
        got.set(x.u, { ...it, m: x.m });
      } catch (e) { bad.push(x.u + ' (' + e.message + ')'); }
      await new Promise((ok) => setTimeout(ok, 300));
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (bad.length) console.log('alınamayan:', bad.length, bad.slice(0, 5));
  if (todo.length && bad.length > Math.max(5, todo.length * 0.05)) throw new Error('çok fazla hata, eski veri korunuyor');
  const items = [];
  for (const x of list) {
    const it = got.get(x.u) || prev.get(x.u);
    if (it) items.push(it);
  }
  if (items.length < list.length * 0.9) throw new Error('kayıt sayısı düşük, eski veri korunuyor');
  items.sort((a, b) => (b.d || '').localeCompare(a.d || '') || (+b.n || 0) - (+a.n || 0));
  const t = Date.now();
  fs.writeFileSync(prevFile, JSON.stringify({ t, n: items.length, items }));
  fs.writeFileSync(path.join(outDir, 'kurul-ozet.json'), JSON.stringify({ t, n: items.length, items: items.map(({ u, n, d, c, s, q, k }) => ({ u, n, d, c, s, q, k })) }));
  console.log('yazıldı:', items.length, 'karar');
}

if (import.meta.url === 'file://' + process.argv[1]) {
  main(process.argv[2] || 'out').catch((e) => { console.error('HATA:', e.message); process.exit(1); });
}
