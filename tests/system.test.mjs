import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';
import { sysMocks } from './sys-mocks.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const LAYOUT = [{ id: 'prayer', w: 3, h: 1, hidden: false }, { id: 'sys', w: 3, h: 2, hidden: false }];
const W = '.w[data-id=sys]';
const tap = (page, sel) => page.dispatchEvent(sel, 'click');
const CORS_ = { 'access-control-allow-origin': '*' };
const run = (minAgo, conclusion = 'success', status = 'completed') => ({ workflow_runs: [{ status, conclusion, updated_at: new Date(Date.now() - minAgo * 60e3).toISOString() }] });

/* Kontroller bitene kadar bekler (hiçbir kontrol "henüz kontrol edilmedi" durumunda kalmamalı). */
async function open(over, { ls, three = true, mocks = [] } = {}) {
  const ctx = await newContext(browser, { mocks: [...sysMocks(over), ...mocks] });
  const { page, errors } = await openPage(ctx, srv.url, { layout: [{ id: 'sys', w: 3, h: 2, hidden: false }], ls });
  await page.waitForFunction((s) => document.querySelector(s + ' .sy-w')?.dataset.state !== 'run' && !/yenileniyor/.test(document.querySelector(s + ' .sy-sub').textContent), W, { timeout: 40000 });
  if (three) { await page.evaluate(() => { window.THREE = {}; }); await tap(page, W + ' [data-a=re]'); }
  await settle(page);
  return { ctx, page, errors };
}
const settle = (page) => page.waitForFunction((s) => !/yenileniyor/.test(document.querySelector(s + ' .sy-sub').textContent) && !/henüz kontrol edilmedi/.test(document.querySelector(s).innerHTML), W, { timeout: 40000 });
const rowsOf = (page) => page.evaluate(() => [...document.querySelectorAll('.sy-ov .sy-r')].map((r) => ({ n: r.querySelector('b').textContent, s: r.dataset.s, v: r.querySelector('.sy-v span').textContent, fix: r.querySelector('.sy-fx')?.textContent || '' })));
const popup = async (page) => { await tap(page, W + ' .sy-card'); await page.waitForSelector('.sy-ov .sy-r'); return rowsOf(page); };

test('Sistem Durumu: varsayılan düzende kapalı; açılınca 3×2 boyutunda', async () => {
  const ctx = await newContext(browser, { mocks: sysMocks() });
  const p = await openPage(ctx, srv.url);
  await p.page.waitForTimeout(1200);
  assert.equal(await p.page.evaluate(() => { const e = document.querySelector('.w[data-id=sys]'); return !!e && e.getBoundingClientRect().width > 0; }), false);
  await ctx.close();
  const c2 = await newContext(browser, { mocks: sysMocks() });
  const q = await openPage(c2, srv.url, { layout: LAYOUT });
  await q.page.waitForSelector(W + ' .sy-card');
  const [a, b] = await q.page.evaluate(() => ['prayer', 'sys'].map((id) => { const r = document.querySelector(`.w[data-id=${id}]`).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  assert.equal(b[0], a[0], 'genişlik: 3 sütun');
  assert.ok(b[1] > a[1] * 1.8, 'yükseklik: 2 satır');
  await c2.close();
});

test('Sistem Durumu: her şey sağlıklıyken "Her şey çalışıyor", %100 ve çalışmayan yok', async () => {
  const { ctx, page, errors } = await open({});
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'ok');
  assert.equal((await page.textContent(W + ' .sy-hl')).trim(), 'Her şey çalışıyor');
  assert.match(await page.textContent(W + ' .sy-rp'), /^100%$/);
  assert.match(await page.textContent(W + ' .sy-good'), /Çalışmayan bir şey yok/);
  assert.equal(await page.locator(W + ' .sy-p').count(), 0);
  const rows = await popup(page);
  assert.ok(rows.length >= 30, 'çok sayıda kontrol: ' + rows.length);
  assert.ok(rows.every((r) => r.s === 'ok' || r.s === 'off'), JSON.stringify(rows.filter((r) => r.s !== 'ok' && r.s !== 'off')));
  const gr = await page.$$eval('.sy-ov .sy-g h4', (a) => a.map((h) => h.childNodes[1].textContent));
  assert.deepEqual(gr.slice(0, 6), ['Tarayıcı ve site', 'GitHub (altyapı)', 'Veri dosyaları', 'Haber ve içerik', 'Hava, namaz ve finans', 'Oyun ve medya']);
  assert.match(await page.textContent('.sy-f'), /Tüm kontroller yeşil/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Sistem Durumu: çalışmayanlar kartta isimleriyle görünür; ayrıntıda neden ve ne yapılacağı yazar', async () => {
  const { ctx, page } = await open({
    'gh-tg': (r) => r.fulfill(json(run(12, 'failure'))),
    rss: (r) => r.fulfill({ status: 500, headers: CORS_, body: 'x' }),
    erapi: null,
    'raw-ps': (r) => r.fulfill(json({ t: new Date(Date.now() - 20 * 36e5).toISOString(), deals: [{}] })),
  });
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'bad');
  assert.match(await page.textContent(W + ' .sy-hl'), /^4 şey çalışmıyor$/);
  const card = await page.$$eval(W + ' .sy-p', (a) => a.map((x) => x.querySelector('b').textContent));
  assert.equal(card.length, 3, 'kartta en çok 3 sorun, kalanı "daha fazla"');
  assert.match(await page.textContent(W + ' .sy-more'), /\+1 tane daha/);
  const rows = await popup(page), by = (n) => rows.find((r) => r.n === n);
  assert.equal(by('Telegram veri çekimi').s, 'bad');
  assert.match(by('Telegram veri çekimi').v, /son çalışma başarısız \(failure\)/);
  assert.match(by('Telegram veri çekimi').fix, /Actions/);
  assert.equal(by('RSS çevirici (rss2json)').s, 'bad');
  assert.match(by('RSS çevirici (rss2json)').v, /HTTP 500/);
  assert.equal(by('Döviz (open.er-api.com)').s, 'bad');
  assert.match(by('Döviz (open.er-api.com)').v, /ulaşılamadı/);
  assert.equal(by('PlayStation verisi (ps.json)').s, 'bad');
  assert.match(by('PlayStation verisi (ps.json)').v, /20 sa önce güncellendi/);
  assert.equal(by('Hava durumu (Open-Meteo)').s, 'ok');
  await tap(page, '#syBad');
  await page.waitForFunction(() => [...document.querySelectorAll('.sy-ov .sy-r')].every((r) => r.dataset.s === 'bad' || r.dataset.s === 'warn'));
  assert.equal((await rowsOf(page)).length, 4);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.sy-ov'));
  await ctx.close();
});

test('Sistem Durumu: gecikmiş zamanlı çekim sarı, çok gecikmiş kırmızı; veri bayatlığı da aynı eşiklerle', async () => {
  const { ctx, page } = await open({
    'gh-tg': (r) => r.fulfill(json(run(100))),        // tg: >45 dk sarı
    'gh-ps': (r) => r.fulfill(json(run(16 * 60))),    // ps: >15 sa kırmızı
    'raw-tg': (r) => r.fulfill(json({ t: Date.now() - 50 * 60e3, ch: [{}] })),   // >20 dk sarı
  });
  const rows = await popup(page), by = (n) => rows.find((r) => r.n === n);
  assert.equal(by('Telegram veri çekimi').s, 'warn');
  assert.equal(by('PlayStation veri çekimi').s, 'bad');
  assert.match(by('PlayStation veri çekimi').v, /gecikmiş/);
  assert.equal(by('Telegram verisi (tg.json)').s, 'warn');
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'bad');
  await ctx.close();
});

test('Sistem Durumu: yalnızca uyarı varsa "dikkat istiyor"; vekillerden biri düşünce hangisi olduğu yazılır', async () => {
  const { ctx, page } = await open({ proxy: (r) => /corsproxy\.io/.test(r.request().url()) ? r.abort() : r.fulfill({ status: 200, contentType: 'text/plain', headers: CORS_, body: 'x'.repeat(300) }) });
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'warn');
  assert.equal((await page.textContent(W + ' .sy-hl')).trim(), '1 şey dikkat istiyor');
  const rows = await popup(page), px = rows.find((r) => r.n === 'CORS vekilleri');
  assert.equal(px.s, 'warn');
  assert.match(px.v, /5\/6 çalışıyor · yok: corsproxy\.io/);
  await ctx.close();
});

test('Sistem Durumu: GitHub API sınırına takılınca önbellekteki sonuç (önbellek) ile gösterilir, yoksa uyarı verir', async () => {
  const limit = (r) => r.fulfill({ status: 403, headers: CORS_, contentType: 'application/json', body: '{"message":"rate limit"}' });
  const cached = { t: Date.now() - 20 * 60e3, j: { runs: [{ s: 'completed', c: 'success', t: Date.now() - 50 * 60e3 }] } };
  const a = await open({ 'gh-pages': limit }, { ls: { 'pano.sys.gh.pages.yml': cached } });
  let rows = await popup(a.page);
  assert.match(rows.find((r) => r.n === 'Site yayını (Pages)').v, /başarılı · 50 dk önce \(önbellek\)/);
  assert.equal(rows.find((r) => r.n === 'Site yayını (Pages)').s, 'warn');
  await a.ctx.close();
  const b = await open({ 'gh-pages': limit });
  rows = await popup(b.page);
  const r = rows.find((x) => x.n === 'Site yayını (Pages)');
  assert.equal(r.s, 'warn');
  assert.match(r.v, /istek sınırına takıldı/);
  await b.ctx.close();
});

test('Sistem Durumu: çevrimdışıyken internet kırmızı, diğerleri denenmez', async () => {
  const { ctx, page } = await open({});
  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForFunction((s) => /çalışmıyor/.test(document.querySelector(s + ' .sy-hl').textContent), W);
  const rows = await popup(page);
  assert.equal(rows.find((r) => r.n === 'İnternet bağlantısı').s, 'bad');
  assert.match(rows.find((r) => r.n === 'Hava durumu (Open-Meteo)').v, /çevrimdışı/);
  await ctx.close();
});

test('Sistem Durumu: betik hatası yakalanır ve gösterilir', async () => {
  const { ctx, page } = await open({});
  await page.evaluate(() => { setTimeout(() => { throw new Error('deneme hatası'); }); });
  await page.waitForFunction(() => ERRS.length === 1);
  await tap(page, W + ' [data-a=re]');
  await page.waitForFunction((s) => /çalışmıyor/.test(document.querySelector(s + ' .sy-hl').textContent), W);
  const rows = await popup(page), r = rows.find((x) => x.n === 'Betik hataları (bu oturum)');
  assert.equal(r.s, 'bad');
  assert.match(r.v, /1 hata · son: Uncaught Error: deneme hatası/);
  await ctx.close();
});

test('Sistem Durumu: yeni sürüm yayındaysa uyarır, aynıysa güncel der', async () => {
  const html = (v) => ({ status: 200, contentType: 'text/html', body: `<script src="js/core.js?v=${v}"></script>` });
  for (const [served, want, sev] of [['bbbb2222cccc', /yeni sürüm yayında/, 'warn'], ['aaaa1111dddd', /güncel/, 'ok']]) {
    const { ctx, page } = await open({}, { three: true, mocks: [[/127\.0\.0\.1:\d+\/index\.html\?_=\d+/, (r) => r.fulfill(html(served))]] });
    await page.evaluate(() => { document.querySelector('script[src*="js/core.js"]').setAttribute('src', 'js/core.js?v=aaaa1111dddd'); });
    await tap(page, W + ' [data-a=re]');
    await settle(page);
    const rows = await popup(page), r = rows.find((x) => x.n === 'Site sürümü');
    assert.equal(r.s, sev); assert.match(r.v, want);
    await ctx.close();
  }
});

test('Sistem Durumu: widget\'ların kendi canlı durumu (başarısız çekim) listelenir; önbellekler yedeğe girmez', async () => {
  const ctx = await newContext(browser, { mocks: sysMocks() });
  const { page } = await openPage(ctx, srv.url, { layout: LAYOUT });
  await page.waitForFunction(() => typeof status === 'function');
  await page.evaluate(() => { status('wx', true); status('fx', false); });
  await page.waitForFunction((s) => !!document.querySelector(s + ' .sy-p'), W, { timeout: 30000 });
  const rows = await popup(page);
  assert.equal(rows.find((r) => r.n === 'Hava').s, 'ok');
  assert.equal(rows.find((r) => r.n === 'Döviz').s, 'bad');
  assert.match(rows.find((r) => r.n === 'Döviz').v, /son çekim başarısız/);
  assert.equal(await page.evaluate(() => Object.keys(bkCollect(true)).some((k) => /^pano\.sys\./.test(k))), false);
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some((k) => /^pano\.sys\.gh\./.test(k))), true);
  await ctx.close();
});
