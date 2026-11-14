import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';
import { sysMocks } from './sys-mocks.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const W = '#sbMs';
const tap = (page, sel) => page.dispatchEvent(sel, 'click');
const CORS_ = { 'access-control-allow-origin': '*' };
const run = (minAgo, conclusion = 'success', status = 'completed') => ({ workflow_runs: [{ status, conclusion, updated_at: new Date(Date.now() - minAgo * 60e3).toISOString() }] });

/* Kontroller bitene kadar bekler (hiçbir kontrol "henüz kontrol edilmedi" durumunda kalmamalı). */
async function open(over, { ls, three = true, mocks = [] } = {}) {
  const ctx = await newContext(browser, { mocks: [...sysMocks(over), ...mocks] });
  const { page, errors } = await openPage(ctx, srv.url, { layout: [{ id: 'controls', w: 1, h: 1, hidden: false }], ls });
  await idle(page);
  if (three) { await page.evaluate(() => { window.THREE = {}; bus.dispatchEvent(new Event('refresh')); }); }
  await settle(page);
  return { ctx, page, errors };
}
const idle = (page) => page.waitForFunction(() => { const e = document.querySelector('#sbMs'); return e && e.dataset.state !== 'run' && !e.dataset.busy; }, null, { timeout: 40000 });
const settle = (page) => page.waitForFunction(() => { const e = document.querySelector('#sbMs'); return !e.dataset.busy && SY_DEFS.every((d) => SYS.res.has(d.id)); }, null, { timeout: 40000 });
const state = (page) => page.getAttribute(W, 'data-state');
const tip = (page) => page.textContent('#sbMs .sb-tip>div');
const rowsOf = (page) => page.evaluate(() => [...document.querySelectorAll('.sy-ov .sy-r')].map((r) => ({ n: r.querySelector('b').textContent, s: r.dataset.s, v: r.querySelector('.sy-v span').textContent, fix: r.querySelector('.sy-fx')?.textContent || '' })));
const popup = async (page) => { await tap(page, W); await page.waitForSelector('.sy-ov .sy-r'); return rowsOf(page); };

test('Sistem Durumu: ms çipiyle birleşik; şimşek duruma göre renklenir, çip tıklanınca pencere açılır, sayı yazmaz', async () => {
  const { ctx, page } = await open({});
  assert.equal(await page.locator('#sbSys').count(), 0, 'ayrı çip yok');
  assert.equal(await page.locator('.w[data-id=sys]').count(), 0);
  assert.doesNotMatch(await page.textContent(W), /\d+\/\d+/);
  const col = () => page.$eval('#sbMs .sb-bolt', (e) => getComputedStyle(e).color);
  assert.equal(await state(page), 'ok');
  await page.waitForTimeout(450);   // renk geçişi (0,3 sn)
  assert.equal(await col(), 'rgb(48, 209, 88)');
  await tap(page, W);
  await page.waitForSelector('.sy-ov');
  await page.keyboard.press('Escape');
  await ctx.close();
});

test('Sistem Durumu: her şey sağlıklıyken "Tüm sistemler çalışıyor", sorun yok', async () => {
  const { ctx, page, errors } = await open({});
  assert.equal(await state(page), 'ok');
  assert.match(await tip(page), /^Sistem: Çalışıyor\nAyrıntı için tıkla\n/);
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
  assert.equal(await state(page), 'bad');
  const tp = await tip(page);
  assert.match(tp, /^Sistem: Kesinti var/);
  assert.equal(tp.split('\n').filter((l) => l.startsWith('• ')).length, 4);
  assert.match(tp, /• Telegram veri çekimi/);
  assert.match(tp, /• RSS çevirici \(rss2json\)/);
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
  assert.equal(await state(page), 'bad');
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
  assert.equal(await state(page), 'warn');
  assert.match(await tip(page), /^Sistem: Uyarı var/);
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
  await page.waitForFunction(() => document.querySelector('#sbMs').dataset.state === 'bad', null, { timeout: 30000 });
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
  await page.waitForFunction(() => document.querySelector('#sbMs').dataset.state === 'bad', null, { timeout: 30000 });
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
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction(() => typeof status === 'function' && !!document.querySelector('#sbMs'));
  await page.waitForFunction(() => SRC.fx && SRC.wx, null, { timeout: 30000 });   // widget'ların kendi ilk çekimi bitsin (sonradan üstüne yazmasın)
  await page.evaluate(() => { status('wx', true); status('fx', false); sysPaint(); });
  await page.waitForFunction(() => document.querySelector('#sbMs').dataset.state === 'bad', null, { timeout: 30000 });
  const rows = await popup(page);
  assert.equal(rows.find((r) => r.n === 'Hava').s, 'ok');
  assert.equal(rows.find((r) => r.n === 'Döviz').s, 'bad');
  assert.match(rows.find((r) => r.n === 'Döviz').v, /son çekim başarısız/);
  assert.equal(await page.evaluate(() => Object.keys(bkCollect(true)).some((k) => /^pano\.sys\./.test(k))), false);
  await ctx.close();
});
