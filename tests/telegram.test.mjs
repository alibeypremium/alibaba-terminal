import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const iso = (min) => new Date(Date.now() - min * 60e3).toISOString();
const post = (ch, n, title, cat, o = {}) => ({ title, link: `https://t.me/${ch}/${n}`, ext: '', img: '', cat, date: iso({ 101: 20, 100: 40, 205: 5, 301: 10 }[n] ?? 30), source: ch, ch, ...o });
const feed = (extra = {}) => ({
  t: Date.now(),
  ch: [
    { k: 'bosuna', items: [post('bosuna_tiklamayin_haber', 101, 'Köprü trafiğe açıldı', 'haber'), post('bosuna_tiklamayin_haber', 100, 'Kur güne sakin başladı', 'haber')] },
    { k: 'sdk', items: [post('sondakika_haberr0', 205, 'Yeni düzenleme Resmi Gazete\'de', 'haber')] },
    { k: 'firsat', items: [post('firsattayfa', 301, 'Kulaklıkta büyük indirim', 'alisveris', { ext: 'https://shop.example.com/urun1' })] },
  ],
  ...extra,
});
const mocks = (f, hits) => [[/raw\.githubusercontent\.com|api\.github\.com/, (r) => { hits && hits.push(r.request().url()); return f ? r.fulfill(json(f)) : r.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: 'x' }); }]];
const G = '.w[data-id=gnews]';
const titles = (page) => page.$$eval(G + ' [data-p=tg] .nw-i b', (a) => a.map((x) => x.textContent));

test('Telegram: hazır akıştan mesajlar gelir, Tümü ve kategori sekmeleri süzer', async () => {
  const ctx = await newContext(browser, { mocks: mocks(feed()) });
  const { page, errors } = await openPage(ctx, srv.url);
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length >= 4, G);
  const all = await titles(page);
  assert.equal(all.length, 4);
  assert.ok(all.includes('Köprü trafiğe açıldı') && all.includes('Kulaklıkta büyük indirim'));
  const tabs = await page.$$eval(G + ' [data-p=tg] [data-t]', (a) => a.map((x) => x.textContent));
  assert.deepEqual(tabs, ['Tümü', 'Haber', 'Alışveriş']);
  await page.dispatchEvent(G + ' [data-p=tg] [data-t=alisveris]', 'click');
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length === 1, G);
  assert.deepEqual(await titles(page), ['Kulaklıkta büyük indirim']);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['pano.tg.tab'])), 'alisveris');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Telegram: alışveriş mesajı doğrudan ürün bağlantısına, haber okuyucuya gider; akış her iki adresten okunur', async () => {
  const hits = [];
  const ctx = await newContext(browser, { mocks: mocks(feed(), hits) });
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length >= 4, G);
  const hrefs = await page.$$eval(G + ' [data-p=tg] .nw-i', (a) => Object.fromEntries(a.map((x) => [x.querySelector('b').textContent, x.getAttribute('href')])));
  assert.equal(hrefs['Kulaklıkta büyük indirim'], 'https://shop.example.com/urun1');
  assert.equal(hrefs['Köprü trafiğe açıldı'], 'https://t.me/bosuna_tiklamayin_haber/101');
  assert.ok(hits.some((u) => /api\.github\.com/.test(u)) && hits.some((u) => /raw\.githubusercontent\.com/.test(u)));
  await ctx.close();
});

test('Telegram: en yeni mesaj üstte (tarihe göre) sıralanır', async () => {
  const ctx = await newContext(browser, { mocks: mocks(feed()) });
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length >= 4, G);
  await page.dispatchEvent(G + ' [data-p=tg] [data-t=haber]', 'click');
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length === 3, G);
  assert.deepEqual(await titles(page), ["Yeni düzenleme Resmi Gazete'de", 'Köprü trafiğe açıldı', 'Kur güne sakin başladı']);
  await ctx.close();
});

test('Telegram: akış alınamazsa önbellekteki mesajlar gösterilir', async () => {
  const cache = { bosuna: [post('bosuna_tiklamayin_haber', 90, 'Önbellekten gelen haber', 'haber')] };
  const ctx = await newContext(browser, { mocks: mocks(null) });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.tg.c': cache, 'pano.tg.ts': { bosuna: Date.now() - 3600e3 } } });
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length >= 1, G);
  assert.deepEqual(await titles(page), ['Önbellekten gelen haber']);
  await ctx.close();
});

test('Haberler: Son Dakika sekmesine geçilir ve geri dönülür', async () => {
  const ctx = await newContext(browser, { mocks: mocks(feed()) });
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction((g) => document.querySelectorAll(g + ' [data-p=tg] .nw-i').length >= 4, G);
  assert.equal(await page.getAttribute(G + ' [data-p=tg] [data-m=tg]', 'aria-selected'), 'true');
  await page.dispatchEvent(G + ' [data-p=tg] [data-m=sd]', 'click');
  await page.waitForFunction((g) => !document.querySelector(g + ' [data-p=sd]').hidden && document.querySelector(g + ' [data-p=tg]').hidden, G);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['pano.haber.tab'])), 'sd');
  await page.dispatchEvent(G + ' [data-p=sd] [data-m=tg]', 'click');
  await page.waitForFunction((g) => document.querySelector(g + ' [data-p=sd]').hidden, G);
  await ctx.close();
});
