// data/kuran_dualari.txt → public/js/dua.js  (Ayet · Dua · Esma widget'ının Dua sekmesi)
// Her kayıt: [neden yapılır, dua metni, "Sure, ayet"]. Numaralar ve açıklama notları atılır; dua metni değiştirilmez.
import fs from 'node:fs';
export const SKIP = new Set([137, 138]);   // 137: 129 ile aynı metin · 138: dua değil, cehennemin tarifi
export function parse(txt) {
  const L = txt.replace(/\r/g, '').split('\n').map((s) => s.trim()).filter(Boolean).slice(1);
  const out = [];
  for (let i = 0; i < L.length; i += 2) {
    const h = L[i].match(/^(\d+)-\s*(.+)$/), d = L[i + 1] && L[i + 1].match(/^-\s*(.+)$/);
    if (!h || !d) throw new Error('biçim hatası satır ' + (i + 2) + ': ' + L[i].slice(0, 50));
    const n = +h[1];
    let why = h[2].replace(/\s*\((?:[^)]*(?:dua değil|hamd beyanı|tevekkül beyanı|ayet elçinin)[^)]*)\)\s*:?\s*$/, '').replace(/\s*:\s*$/, '').trim();
    why = why.replace(/ikrar eder$/, 'ikrar etmek için');
    let body = d[1].replace(/\s*\[[^\]]*\]\s*$/, '').trim();
    const m = body.match(/^(.*?)\s*\(([^()]+?),\s*([\d-]+)\)\s*$/);
    if (!m) throw new Error('kaynak yok: ' + n);
    const text = m[1].replace(/^["“]/, '').replace(/["”]$/, '').trim();
    const ref = m[2].replace(/\s+Suresi$/, '') + ', ' + m[3];
    if (!SKIP.has(n)) out.push([why, text, ref]);
  }
  return out;
}
export function write(src = 'data/kuran_dualari.txt', dst = 'public/js/dua.js') {
  const a = parse(fs.readFileSync(src, 'utf8'));
  fs.writeFileSync(dst, "'use strict';\n/* Üretildi: node .github/scripts/dua.mjs (kaynak: data/kuran_dualari.txt). Elle değiştirme. */\n/* Kur'an'da geçen dua ve yakarışlar: [neden, dua, sure ve ayet] */\nconst DUA=" + JSON.stringify(a, null, 0).replace(/\],\[/g, '],\n[') + ';\n');
  return a.length;
}
if (import.meta.url === 'file://' + process.argv[1]) console.log(write());
