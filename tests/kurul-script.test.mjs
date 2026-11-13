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
