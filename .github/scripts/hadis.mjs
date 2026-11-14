/* Kütüb-i Sitte verisi: data/kutubu_sitte.txt → public/data/hadis/ (idx.json, t0..tN.json, gun.json).
   Kaynak dosya satır başına bir hadis, 7 alan, "|" ile ayrılmış:
   bölüm | konu başlığı | kaynak (yapışık) | ravi | metin | referans | sıra no
   Metin ve referans OLDUĞU GİBİ saklanır (yalnızca baştaki/sondaki boşluk kırpılır). Çalıştırma: node .github/scripts/hadis.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCES = [   // bit sırası: maske = 1 << indeks
  ['buhari', 'Buhari'], ['müslim', 'Müslim'], ['tirmizi', 'Tirmizi'], ['ebu davud', 'Ebu Davud'],
  ['nesai', 'Nesai'], ['ibnu mace', 'İbnu Mace'], ['muvatta', 'Muvatta'], ['rezin', 'Rezin'],
];
/* Türkçe harfleri sadeleştirip küçültür: arama ve ravi eşleştirme için ("Ebu Hüreyre" = "ebu hureyre") */
export const fold = (s) => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[’'`´]/g, '').replace(/\s+/g, ' ').trim();

/* "buharimüslimebu davudİbnu mace" → bit maskesi; tanınmayan parça kalırsa null */
export function parseSources(s) {
  let rest = fold(s).replace(/ /g, '');   // boşluksuz karşılaştır
  const toks = SOURCES.map(([k], i) => [k.replace(/ /g, ''), i]).sort((a, b) => b[0].length - a[0].length);
  let mask = 0;
  while (rest) {
    const hit = toks.find(([k]) => rest.startsWith(fold(k).replace(/ /g, '')));
    if (!hit) return null;
    mask |= 1 << hit[1]; rest = rest.slice(fold(SOURCES[hit[1]][0]).replace(/ /g, '').length);
  }
  return mask;
}

export const ANOMALIES = [];
export function parse(txt) {
  const rows = [];
  for (const line of txt.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = line.split('|');
    if (f.length !== 7) throw new Error('7 alan bekleniyordu: ' + line.slice(0, 80));
    const [b, k, s, r, t, ref, id] = f.map((x) => x.trim());
    if (!/^\d+$/.test(id)) throw new Error('sıra no sayı değil: ' + id);
    let m = s ? parseSources(s) : 0;
    if (m === null) {   // kaynak alanına referans yazılmış bozuk satırlar (kaynakta 2 tane): adları metin içinde ara
      const hay = fold(s + ' ' + ref).replace(/ /g, '');
      m = SOURCES.reduce((a, [k], i) => a | (hay.includes(fold(k).replace(/ /g, '')) ? 1 << i : 0), 0);
      if (!m) throw new Error('kaynak çözülemedi: ' + s);
      ANOMALIES.push({ id: +id, kaynak: s });
    }
    rows.push({ id: +id, b, k, m, r, t, ref });
  }
  return rows;
}

/* Günün hadisi için uygun olanlar: kartta tek başına anlaşılır, kısa ve kaynağı belli olanlar. */
const CONT = /^(Bir diğer rivayette|Başka bir rivayette|Bir rivayette|Diğer bir rivayette|Bir başka|Başka bir|Yine|Aynı|Bu hadisi|Ayrıca|Bu rivayet|Rivayette)/i;
const TECH = /^(FERAİZ|HUDUD|KISAS|DİYET|KATL|İDDET|LİAN|KASAME|İLA |LUKATA|İHYA|MÜZARAA|AZAD|KAZA )/;   // teknik fıkıh bölümleri: kartta bağlamsız kalır
export const eligible = (r) => r.t.length >= 60 && r.t.length <= 450 && r.m > 0 && !CONT.test(r.t) && !TECH.test(r.b)
  && (r.t.match(/\(/g) || []).length === (r.t.match(/\)/g) || []).length;

/* Sabit tohumlu karıştırma: takvim her yerde aynı çıkar ve veri dosyası değişmedikçe değişmez */
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function order(rows, seed = 20260101) {
  const ids = rows.map((r, i) => i).filter((i) => eligible(rows[i]));
  const rnd = mulberry32(seed);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}

export function build(rows, chunkChars = 230000) {
  const uniq = (a) => { const m = new Map(); a.forEach((x) => { if (!m.has(x)) m.set(x, m.size); }); return m; };
  const bm = uniq(rows.map((r) => r.b));
  const km = new Map(); rows.forEach((r) => { const key = r.b + '\u0001' + r.k; if (!km.has(key)) km.set(key, km.size); });
  const rm = uniq(rows.map((r) => r.r).filter(Boolean));
  // ravi grupları: yazım farkı olanlar (Hüreyre/Hureyre) tek grupta
  const cnt = new Map(); rows.forEach((r) => { if (r.r) cnt.set(r.r, (cnt.get(r.r) || 0) + 1); });
  const gmap = new Map(), groups = [];
  [...rm.keys()].forEach((name) => {
    const key = fold(name);
    if (!gmap.has(key)) { gmap.set(key, groups.length); groups.push({ names: [], n: 0 }); }
    const g = groups[gmap.get(key)]; g.names.push(name); g.n += cnt.get(name);
  });
  const gname = groups.map((g) => g.names.sort((a, b) => cnt.get(b) - cnt.get(a))[0]);
  const idx = {
    v: 1, n: rows.length,
    src: SOURCES.map((s) => s[1]),
    b: [...bm.keys()],
    k: [...km.keys()].map((key) => { const [b, k] = key.split('\u0001'); return [bm.get(b), k]; }),
    rv: [...rm.keys()],                                   // ham ravi adları (olduğu gibi)
    rg: [...rm.keys()].map((name) => gmap.get(fold(name))),   // ham ad → grup
    gn: gname, gc: groups.map((g) => g.n),                // grup görünen adı ve hadis sayısı
    id: rows.map((r) => r.id),
    kb: rows.map((r) => km.get(r.b + '\u0001' + r.k)),
    m: rows.map((r) => r.m),
    ra: rows.map((r) => (r.r ? rm.get(r.r) : -1)),
    ch: [],                                                // her parçanın ilk satır indeksi
  };
  const chunks = []; let cur = null, size = 0;
  rows.forEach((r, i) => {
    if (!cur || size > chunkChars) { cur = { i0: i, t: [], f: [] }; chunks.push(cur); idx.ch.push(i); size = 0; }
    cur.t.push(r.t); cur.f.push(r.ref); size += r.t.length + r.ref.length;
  });
  const gun = { base: '2026-01-01', n: 0, order: order(rows) };
  gun.n = gun.order.length;
  return { idx, chunks, gun };
}

export function write(outDir, txt) {
  const { idx, chunks, gun } = build(parse(txt));
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/^(idx|gun|t\d+)\.json$/.test(f)) fs.rmSync(path.join(outDir, f));
  const w = (n, o) => fs.writeFileSync(path.join(outDir, n), JSON.stringify(o));
  w('idx.json', idx); w('gun.json', gun); chunks.forEach((c, i) => w('t' + i + '.json', c));
  return { rows: idx.n, chunks: chunks.length, gun: gun.n };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const out = write(path.join(root, 'public/data/hadis'), fs.readFileSync(path.join(root, 'data/kutubu_sitte.txt'), 'utf8'));
  console.log(out, 'bozuk kaynak alanı:', JSON.stringify(ANOMALIES));
}
