import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';
import { sysMocks } from './sys-mocks.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const LAYOUT = [{ id: 'prayer', w: 3, h: 1, hidden: false }, { id: 'sys', w: 1, h: 1, hidden: false }];
const W = '.w[data-id=sys]';
const tap = (page, sel) => page.dispatchEvent(sel, 'click');
const CORS_ = { 'access-control-allow-origin': '*' };
const run = (minAgo, conclusion = 'success', status = 'completed') => ({ workflow_runs: [{ status, conclusion, updated_at: new Date(Date.now() - minAgo * 60e3).toISOString() }] });

/* Kontroller bitene kadar bekler (hiçbir kontrol "henüz kontrol edilmedi" durumunda kalmamalı). */
async function open(over, { ls, three = true, mocks = [] } = {}) {
  const ctx = await newContext(browser, { mocks: [...sysMocks(over), ...mocks] });
  const { page, errors } = await openPage(ctx, srv.url, { layout: [{ id: 'sys', w: 1, h: 1, hidden: false }], ls });
  await page.waitForFunction((s) => document.querySelector(s + ' .sy-w')?.dataset.state !== 'run' && !/yenileniyor/.test(document.querySelector(s + ' .sy-sub').textContent), W, { timeout: 40000 });
  if (three) { await page.evaluate(() => { window.THREE = {}; bus.dispatchEvent(new Event('refresh')); }); }
  await settle(page);
  return { ctx, page, errors };
}
const settle = (page) => page.waitForFunction((s) => !/yenileniyor/.test(document.querySelector(s + ' .sy-sub').textContent) && !/henüz kontrol edilmedi/.test(document.querySelector(s).innerHTML), W, { timeout: 40000 });
const rowsOf = (page) => page.evaluate(() => [...document.querySelectorAll('.sy-ov .sy-r')].map((r) => ({ n: r.querySelector('b').textContent, s: r.dataset.s, v: r.querySelector('.sy-v span').textContent, fix: r.querySelector('.sy-fx')?.textContent || '' })));
const popup = async (page) => { await tap(page, W + ' .sy-card'); await page.waitForSelector('.sy-ov .sy-r'); return rowsOf(page); };

test('Sistem Durumu: varsayılan düzende kapalı; açılınca 1×1 boyutunda', async () => {
  const ctx = await newContext(browser, { mocks: sysMocks() });
  const p = await openPage(ctx, srv.url);
  await p.page.waitForTimeout(1200);
  assert.equal(await p.page.evaluate(() => { const e = document.querySelector('.w[data-id=sys]'); return !!e && e.getBoundingClientRect().width > 0; }), false);
  await ctx.close();
  const c2 = await newContext(browser, { mocks: sysMocks() });
  const q = await openPage(c2, srv.url, { layout: LAYOUT });
  await q.page.waitForSelector(W + ' .sy-card');
  const [a, b] = await q.page.evaluate(() => ['prayer', 'sys'].map((id) => { const r = document.querySelector(`.w[data-id=${id}]`).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  assert.ok(Math.abs(b[1] - a[1]) <= 2, 'yükseklik: 1 satır (namaz ile aynı)');
  assert.ok(b[0] < a[0] / 2, 'genişlik: 1 sütun');
  await c2.close();
});

test('Sistem Durumu: her şey sağlıklıyken "Tüm sistemler çalışıyor", sorun yok', async () => {
  const { ctx, page, errors } = await open({});
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'ok');
  assert.equal((await page.textContent(W + ' .sy-hl')).trim(), 'Çalışıyor');
  assert.match(await page.textContent(W + ' .sy-sub'), /^son kontrol \d\d:\d\d/);
  assert.match(await page.textContent(W + ' .sy-num'), /^\d+\/\d+ hizmet$/);
  assert.deepEqual(await page.$$eval(W + ' .sy-bars i', (a) => a.map((x) => x.dataset.s).filter((v) => v !== 'ok' && v !== 'off')), [], 'çubuklarda sorun yok');
  assert.ok((await page.locator(W + ' .sy-bars i').count()) >= 6);
  const rows = await popup(page);
  assert.ok(rows.length >= 30, 'çok sayıda kontrol: ' + rows.length);
  assert.ok(rows.every((r) => r.s === 'ok' || r.s === 'off'), JSON.stringify(rows.filter((r) => r.s !== 'ok' && r.s !== 'off')));
  const gr = await page.$$eval('.sy-ov .sy-g h4', (a) => a.map((h) => h.childNodes[1].textContent));
  assert.deepEqual(gr.slice(0, 6), ['Tarayıcı ve site', 'GitHub (altyapı)', 'Veri dosyaları', 'Haber ve içerik', 'Hava, namaz ve finans', 'Oyun ve medya']);
  assert.match(await page.textContent('.sy-f'), /Tüm kontroller yeşil/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Sistem Durumu: çalışmayan hizmet kartta adıyla görünür; ayrıntıda neden ve ne yapılacağı yazar', async () => {
  const { ctx, page } = await open({
    'gh-tg': (r) => r.fulfill(json(run(12, 'failure'))),
    rss: (r) => r.fulfill({ status: 500, headers: CORS_, body: 'x' }),
    erapi: null,
    'raw-ps': (r) => r.fulfill(json({ t: new Date(Date.now() - 20 * 36e5).toISOString(), deals: [{}] })),
  });
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'bad');
  assert.match(await page.textContent(W + ' .sy-hl'), /^Kesinti var$/);
  assert.equal((await page.textContent(W + ' .sy-sub')).trim(), 'Telegram veri çekimi +3', 'ilk sorun + kalan sayısı');
  const tip = await page.getAttribute(W + ' .sy-card', 'title');
  assert.equal(tip.split('\n').length, 4);
  assert.match(tip, /RSS çevirici \(rss2json\): HTTP 500/);
  assert.ok((await page.locator(W + ' .sy-bars i[data-s=bad]').count()) >= 3, 'çubuklarda kırmızı gruplar');
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

test('Sistem Durumu: vekil istekleri Cache-Control/Pragma taşımaz (gerçek vekiller ön kontrolde reddeder) ve 6/6 çalışır', async () => {
  const bad = [];
  const { ctx, page } = await open({ proxy: (r) => { const h = r.request().headers(); if (h['cache-control'] || h['pragma']) { bad.push(r.request().url()); return r.fulfill({ status: 403, headers: CORS_, body: 'preflight' }); } return r.fulfill({ status: 200, contentType: 'text/plain', headers: CORS_, body: 'x'.repeat(300) }); } });
  const rows = await popup(page);
  assert.deepEqual(bad, []);
  assert.match(rows.find((r) => r.n === 'CORS vekilleri').v, /^6\/6 çalışıyor/);
  assert.equal(rows.find((r) => r.n === 'CORS vekilleri').s, 'ok');
  await ctx.close();
});

test('Sistem Durumu: yalnızca uyarı varsa "dikkat istiyor"; vekillerden biri düşünce hangisi olduğu yazılır', async () => {
  const { ctx, page } = await open({ proxy: (r) => !/cors\.lol/.test(r.request().url()) ? r.abort() : r.fulfill({ status: 200, contentType: 'text/plain', headers: CORS_, body: 'x'.repeat(300) }) });
  assert.equal(await page.getAttribute(W + ' .sy-w', 'data-state'), 'warn');
  assert.equal((await page.textContent(W + ' .sy-hl')).trim(), 'Uyarı var');
  const rows = await popup(page), px = rows.find((r) => r.n === 'CORS vekilleri');
  assert.equal(px.s, 'warn');
  assert.match(px.v, /1\/6 çalışıyor · yok: .*corsproxy\.io/);
  await ctx.close();
});

test('Sistem Durumu: iş akışı durumu veri dalındaki dosyadan okunur (GitHub API çağrılmaz); dosya yoksa/bayatsa uyarı', async () => {
  const api = [];
  const a = await open({}, { mocks: [[/^https:\/\/api\.github\.com/, (r) => { api.push(r.request().url()); return r.abort(); }]] });
  let rows = await popup(a.page);
  assert.deepEqual(api, [], 'GitHub API kullanılmamalı');
  assert.equal(rows.find((r) => r.n === 'Site yayını (Pages)').s, 'ok');
  assert.match(rows.find((r) => r.n === 'Site yayını (Pages)').v, /başarılı · 30 dk önce/);
  await a.ctx.close();
  const b = await open({ durum: null });
  rows = await popup(b.page);
  assert.equal(rows.find((x) => x.n === 'Site yayını (Pages)').s, 'warn');
  assert.match(rows.find((x) => x.n === 'Site yayını (Pages)').v, /durum dosyas/);
  await b.ctx.close();
  const c = await open({ durumT: Date.now() - 5 * 36e5 });
  rows = await popup(c.page);
  assert.match(rows.find((x) => x.n === 'Otomatik testler').v, /5 sa önce güncellendi/);
  await c.ctx.close();
});

test('Sistem Durumu: çevrimdışıyken internet kırmızı, diğerleri denenmez', async () => {
  const { ctx, page } = await open({});
  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForFunction((s) => /Kesinti/.test(document.querySelector(s + ' .sy-hl').textContent), W);
  let rows = await popup(page);
  assert.equal(rows.find((r) => r.n === 'İnternet bağlantısı').s, 'bad');
  for (let i = 0; i < 40 && !/çevrimdışı/.test(rows.find((r) => r.n === 'Hava durumu (Open-Meteo)').v); i++) { await page.waitForTimeout(250); rows = await rowsOf(page); }   /* uçuştaki istekler bitince yeniden denenir */
  assert.match(rows.find((r) => r.n === 'Hava durumu (Open-Meteo)').v, /çevrimdışı/);
  await ctx.close();
});

test('Sistem Durumu: betik hatası yakalanır ve gösterilir', async () => {
  const { ctx, page } = await open({});
  await page.evaluate(() => { setTimeout(() => { throw new Error('deneme hatası'); }); });
  await page.waitForFunction(() => ERRS.length === 1);
  await page.evaluate(() => bus.dispatchEvent(new Event('refresh')));
  await page.waitForFunction((s) => /Kesinti/.test(document.querySelector(s + ' .sy-hl').textContent), W);
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
    await page.evaluate(() => bus.dispatchEvent(new Event('refresh')));
    await settle(page);
    const rows = await popup(page), r = rows.find((x) => x.n === 'Site sürümü');
    assert.equal(r.s, sev); assert.match(r.v, want);
    await ctx.close();
  }
});

test('Sistem Durumu: widget\'ların kendi canlı durumu (başarısız çekim) listelenir; sistem önbelleği yedeğe girmez', async () => {
  const ctx = await newContext(browser, { mocks: sysMocks() });
  const { page } = await openPage(ctx, srv.url, { layout: LAYOUT });
  await page.waitForFunction(() => typeof status === 'function');
  await page.evaluate(() => { status('wx', true); status('fx', false); });
  await page.waitForFunction((s) => /Kesinti/.test(document.querySelector(s + ' .sy-hl').textContent), W, { timeout: 30000 });
  const rows = await popup(page);
  assert.equal(rows.find((r) => r.n === 'Hava').s, 'ok');
  assert.equal(rows.find((r) => r.n === 'Döviz').s, 'bad');
  assert.match(rows.find((r) => r.n === 'Döviz').v, /son çekim başarısız/);
  assert.equal(await page.evaluate(() => Object.keys(bkCollect(true)).some((k) => /^pano\.sys\./.test(k))), false);
  await ctx.close();
});
