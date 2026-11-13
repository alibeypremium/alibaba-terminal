import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseDetail, parseSitemap } from '../.github/scripts/kurul.mjs';

const fx = fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'kurul-karar.html'), 'utf8');

test('Kurul betiği: karar sayfasını soru, cevap, anahtar kelime ve künye olarak ayrıştırır', () => {
  const r = parseDetail(fx, 'faizli-kredi/01a01564-5ed6');
  assert.equal(r.q, 'Faizli kredi kullanarak mal/hizmet almak isteyen kişiye satış yapmak caiz midir?');
  assert.deepEqual(r.a, ['Müslümanların; mal ve hizmet ihtiyaçlarını meşru yollarla karşılaması gerekir. (el-Bakara 2/275)', 'Faizli işleme yardımcı olmak caiz değildir.', '• Birinci madde', '• İkinci madde']);
  assert.deepEqual(r.k, ['faiz', 'kredi']);
  assert.equal(r.n, '29');
  assert.equal(r.d, '2026-06-24');
  assert.equal(r.c, 'TİCARÎ HAYAT');
  assert.equal(r.s, 'Bankacılık İşlemleri (Para, Faiz ve Enflasyon)');
});

test('Kurul betiği: soru ya da cevap yoksa null döner (bozuk sayfa veriyi ezmesin)', () => {
  assert.equal(parseDetail('<html><body><h2>Başka</h2></body></html>', 'x'), null);
  assert.equal(parseDetail(fx.replace('>Cevap<', '>Yanıt<'), 'x'), null);
});

test('Kurul betiği: sitemap yalnızca karar adreslerini ve lastmod değerini alır', () => {
  const xml = `<urlset><url><loc>https://kurul.diyanet.gov.tr/tr</loc></url>
  <url><loc>https://kurul.diyanet.gov.tr/tr/kurul/karar/a-b/019f-1</loc><lastmod>2026-08-21</lastmod></url>
  <url><loc>https://kurul.diyanet.gov.tr/tr/kurul/karar/c-d/019f-2</loc></url></urlset>`;
  assert.deepEqual(parseSitemap(xml), [{ u: 'a-b/019f-1', m: '2026-08-21' }, { u: 'c-d/019f-2', m: '' }]);
});

import { planGun, addDays } from '../.github/scripts/kurul.mjs';
const mkItems = (n) => Array.from({ length: n }, (_, i) => ({ u: `s-${i}/0193c42d-${String(i).padStart(4, '0')}` }));

test('Günün sorusu takvimi: 120 gün ileriye yazılır, bir tur bitmeden tekrar etmez', () => {
  const items = mkItems(50), t = '2026-11-13';
  const { gun } = planGun(null, items, t, 40);
  const ds = Object.keys(gun).sort();
  assert.equal(ds[0], t); assert.equal(ds.length, 41);
  assert.equal(new Set(Object.values(gun)).size, 41, 'ilk turda tekrar olmamalı');
});

test('Günün sorusu takvimi: yeniden çalışınca var olan günler değişmez; yeni karar yalnızca sonraki günlere girer; eski günler 7 gün sonra silinir', () => {
  const t = '2026-11-13';
  const a = planGun(null, mkItems(30), t, 20);
  const b = planGun(a, [...mkItems(30), { u: 'yeni/0193c42d-9999' }], t, 20);
  assert.deepEqual(b.gun, a.gun);
  const c = planGun(b, [...mkItems(30), { u: 'yeni/0193c42d-9999' }], addDays(t, 10), 20);
  for (let i = 10; i <= 20; i++) assert.equal(c.gun[addDays(t, i)], b.gun[addDays(t, i)]);
  assert.ok(!(t in c.gun) && !(addDays(t, 2) in c.gun), '7 günden eski girdiler atılmalı');
  assert.ok(Object.keys(c.gun).includes(addDays(t, 30)));
});

test('Günün sorusu takvimi: tüm kararlar bir kez çıkınca yeni tur başlar', () => {
  const items = mkItems(5), { gun } = planGun(null, items, '2026-11-13', 11);
  const first = Object.keys(gun).sort().slice(0, 5).map((d) => gun[d]);
  assert.equal(new Set(first).size, 5);
  assert.ok(items.some((x) => x.u === gun[addDays('2026-11-13', 5)]));
});
