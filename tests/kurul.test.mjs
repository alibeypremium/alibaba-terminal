import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const mk = (i, o = {}) => ({
  u: `soru-${i}/0193c42d-0000-7000-8000-00000000000${i}`, n: String(10 + i), d: `2026-0${1 + (i % 6)}-1${i}`,
  c: i % 2 ? 'NAMAZ' : 'ZEKAT ve SADAKA', s: 'Alt alan ' + i, q: `Birinci soru metni ${i}: abdest nasıl alınır?`,
  a: [`Birinci paragraf ${i}.`, `İkinci paragraf ${i}. Gizli kelime${i}x burada.`], k: ['abdest', 'taharet' + i], m: '2026-08-01', ...o,
});
const ITEMS = [1, 2, 3, 4].map((i) => mk(i));
ITEMS[1] = mk(2, { q: 'Zekât nisabı ne kadardır?', k: ['nisab'] });
const ozet = { t: Date.now(), n: ITEMS.length, items: ITEMS.map(({ a, m, ...r }) => r) };
const full = { t: Date.now(), n: ITEMS.length, items: ITEMS };
const mocks = (o = ozet, f = full, hits) => [[/raw\.githubusercontent\.com\/.*veri-kurul\//, (r) => {
  const u = r.request().url(); hits && hits.push(u);
  const j = /kurul-ozet\.json/.test(u) ? o : f;
  return j ? r.fulfill(json(j)) : r.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*' }, body: 'x' });
}]];
const LAYOUT = [{ id: 'prayer', w: 3, h: 1, hidden: false }, { id: 'kurul', w: 3, h: 1, hidden: false }];
const W = '.w[data-id=kurul]';
const open = async (ctx) => {
  const r = await openPage(ctx, srv.url, { layout: LAYOUT });
  await r.page.waitForFunction((s) => /soru/i.test(document.querySelector(s + ' .kr-cq')?.textContent || ''), W);
  return r;
};
const tap = (page, sel) => page.dispatchEvent(sel, 'click');

test('Dini Sorular: varsayılan boyut Namaz Vakitleri ile aynı (3×1) ve varsayılan düzende kapalı', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await open(ctx);
  const sz = await page.evaluate(() => ['prayer', 'kurul'].map((id) => { const r = document.querySelector(`.w[data-id=${id}]`).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  assert.deepEqual(sz[1], sz[0]);
  assert.ok(sz[1][0] > 300 && sz[1][1] > 80);
  await ctx.close();
  const ctx2 = await newContext(browser, { mocks: mocks() });
  const p2 = await openPage(ctx2, srv.url);
  await p2.page.waitForTimeout(1200);
  assert.equal(await p2.page.evaluate(() => !!document.querySelector('.w[data-id=kurul]') && document.querySelector('.w[data-id=kurul]').getBoundingClientRect().width > 0), false);
  await ctx2.close();
});

test('Dini Sorular: kartta günün sorusu ve kategori görünür; önceki/sonraki soruyu değiştirir', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page, errors } = await open(ctx);
  const t0 = await page.textContent(W + ' .kr-cq');
  assert.ok(ITEMS.some((x) => x.q === t0.trim()));
  assert.match(await page.textContent(W + ' .kr-cat'), /^(Namaz|Zekat ve Sadaka)$/);
  await tap(page, W + ' [data-d="1"]');
  await page.waitForFunction(([s, t]) => document.querySelector(s + ' .kr-cq').textContent.trim() !== t.trim(), [W, t0]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Dini Sorular: karta tıklayınca soru-cevap açılır, kaynak ve resmî bağlantı gösterilir; Esc önce listeye sonra kapatır', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await open(ctx);
  const t0 = (await page.textContent(W + ' .kr-cq')).trim();
  await tap(page, W + ' .kr-card');
  await page.waitForSelector('.kr-ov .kr-q');
  assert.equal((await page.textContent('.kr-ov .kr-q')).trim(), t0);
  await page.waitForFunction(() => /İkinci paragraf/.test(document.querySelector('.kr-a')?.textContent || ''));
  const x = ITEMS.find((i) => i.q === t0);
  assert.equal(await page.getAttribute('.kr-src', 'href'), 'https://kurul.diyanet.gov.tr/tr/kurul/karar/' + x.u);
  assert.equal(await page.getAttribute('.kr-src', 'rel'), 'noopener noreferrer');
  assert.match(await page.textContent('.kr-f'), /Kaynak: Diyanet Din İşleri Yüksek Kurulu/);
  assert.match(await page.textContent('.kr-meta'), new RegExp('Kurul Karar No: ' + x.n));
  assert.equal((await page.textContent('.kr-a p')).trim(), x.a[0], 'cevap metni olduğu gibi gösterilmeli');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.kr-ov .kr-i');
  assert.equal(await page.locator('.kr-ov .kr-q').count(), 0);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.kr-ov'));
  await ctx.close();
});

test('Dini Sorular: liste, kategori süzgeci ve arama (soru, anahtar kelime, cevap metni)', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await open(ctx);
  await tap(page, W + ' .kr-card');
  await tap(page, '.kr-back');   // kart önce o günün sorusunu açar; listeye dön
  await page.waitForSelector('.kr-ov .kr-i');
  const n = () => page.locator('.kr-ov .kr-i').count();
  assert.equal(await n(), 4);
  assert.match(await page.textContent('.kr-cnt'), /4 karar/);
  const cats = await page.$$eval('.kr-cats button', (a) => a.map((b) => b.textContent));
  assert.deepEqual(cats, ['Tümü', 'Namaz', 'Zekat ve Sadaka']);
  await tap(page, '.kr-cats [data-c="NAMAZ"]');
  await page.waitForFunction(() => document.querySelectorAll('.kr-ov .kr-i').length === 2);
  await tap(page, '.kr-cats [data-c=""]');
  await page.fill('.kr-s', 'nisab');
  await page.waitForFunction(() => document.querySelectorAll('.kr-ov .kr-i').length === 1);
  assert.match(await page.textContent('.kr-i b'), /Zekât nisabı/);
  await page.fill('.kr-s', 'gizli kelime3x');   // yalnızca cevap metninde geçer
  await page.waitForFunction(() => document.querySelectorAll('.kr-ov .kr-i').length === 1 && /soru metni 3/.test(document.querySelector('.kr-i b').textContent));
  await page.fill('.kr-s', 'olmayan sözcük');
  await page.waitForSelector('.kr-empty');
  await ctx.close();
});

test('Dini Sorular: soruda geçen eşleşmeler cevapta geçenlerden önce sıralanır', async () => {
  const items = [mk(1, { q: 'Alakasız soru başlığı', k: ['x'], d: '2026-06-01' }), mk(2, { q: 'Abdest nasıl alınır, soru?', k: ['y'], d: '2026-01-01' })];
  items[0].a = ['Metinde abdest geçiyor.']; items[1].a = ['Başka metin.'];
  const o = { t: Date.now(), items: items.map(({ a, m, ...r }) => r) }, f = { t: Date.now(), items };
  const ctx = await newContext(browser, { mocks: mocks(o, f) });
  const { page } = await open(ctx);
  await tap(page, W + ' .kr-card');
  await tap(page, '.kr-back');
  await page.fill('.kr-s', 'abdest');
  await page.waitForFunction(() => /^Abdest/.test(document.querySelector('.kr-ov .kr-i b')?.textContent || '') && document.querySelectorAll('.kr-ov .kr-i').length === 2);
  assert.deepEqual(await page.$$eval('.kr-ov .kr-i b', (a) => a.map((b) => b.textContent)), ['Abdest nasıl alınır, soru?', 'Alakasız soru başlığı']);
  await ctx.close();
});

test('Dini Sorular: anahtar kelimeye tıklayınca o kelimeyle aranır', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await open(ctx);
  await tap(page, W + ' .kr-card');
  await page.waitForSelector('.kr-k button');
  await tap(page, '.kr-k button >> nth=1');
  await page.waitForFunction(() => document.querySelectorAll('.kr-ov .kr-i').length === 1 && document.querySelector('.kr-s').value.startsWith('taharet'));
  await ctx.close();
});

test('Dini Sorular: veri metni HTML olarak yorumlanmaz', async () => {
  const bad = { ...mk(1), q: 'Soru <img src=x onerror="window.__xss=1"> nedir?', a: ['<b>kalın</b> <script>window.__xss=2</script>'] };
  const o = { t: Date.now(), items: [(({ a, m, ...r }) => r)(bad)] }, f = { t: Date.now(), items: [bad] };
  const ctx = await newContext(browser, { mocks: mocks(o, f) });
  const { page } = await open(ctx);
  await tap(page, W + ' .kr-card');
  await page.waitForFunction(() => /kalın/.test(document.querySelector('.kr-a')?.textContent || ''));
  assert.match(await page.textContent('.kr-a'), /<b>kalın<\/b>/);
  assert.equal(await page.evaluate(() => window.__xss), undefined);
  assert.equal(await page.locator('.kr-ov img').count() + await page.locator(W + ' img').count(), 0);
  await ctx.close();
});

test('Dini Sorular: tam metin alınamazsa cevap yerine resmî sayfa yönlendirmesi çıkar; özet verisiz "alınamadı" ve önbellek', async () => {
  const ctx = await newContext(browser, { mocks: mocks(ozet, null) });
  const { page } = await open(ctx);
  await tap(page, W + ' .kr-card');
  await page.waitForFunction(() => /alınamadı/.test(document.querySelector('.kr-a')?.textContent || ''), null, { timeout: 20000 });
  assert.ok(await page.getAttribute('.kr-src', 'href'));
  await ctx.close();
  const ctx2 = await newContext(browser, { mocks: mocks(null, null) });
  const p2 = await openPage(ctx2, srv.url, { layout: LAYOUT });
  await p2.page.waitForSelector(W + ' .kr-rt', { timeout: 30000 });
  assert.match(await p2.page.textContent(W + ' .kr-cq'), /alınamadı/);
  await ctx2.close();
  const ctx3 = await newContext(browser, { mocks: mocks(null, null) });
  const p3 = await openPage(ctx3, srv.url, { layout: LAYOUT, ls: { 'pano.kurul.c': { t: 1, items: ozet.items } } });
  await p3.page.waitForFunction((s) => /soru/i.test(document.querySelector(s + ' .kr-cq')?.textContent || ''), W);
  await ctx3.close();
});

test('Dini Sorular: önbellek yedeğe girmez', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await open(ctx);
  assert.equal(await page.evaluate(() => /pano\.kurul\.c/.test(Object.keys(bkCollect(true)).join(' '))), false);
  assert.equal(await page.evaluate(() => !!localStorage.getItem('pano.kurul.c')), true);
  await ctx.close();
});
