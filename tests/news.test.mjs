import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const stamp = (min) => new Date(Date.now() - min * 60e3).toISOString().slice(0, 19).replace('T', ' ');
const item = (title, link, min, cats = []) => ({ title, link, pubDate: stamp(min), categories: cats, content: '', description: '' });

/* rss2json sahte yanıtı: adresin sunucusuna göre içerik verir. */
const FEEDS = {
  'webtekno.com': [
    item('Yeni telefon tanıtıldı', 'https://a.test/telefon', 5, ['Teknoloji']),
    item('PlayStation 6 hakkında yeni iddia', 'https://a.test/ps6', 6, ['Oyun']),
    item('Tesla yeni modelini duyurdu', 'https://a.test/tesla', 7, ['Otomobil']),
  ],
  'donanimhaber.com': [item('İşlemci karşılaştırması yayında', 'https://b.test/islemci', 8)],
  'merlininkazani.com': [item('Bağımsız bir yapım çıktı', 'https://c.test/bagimsiz', 9)],
  'bloomberght.com': [item('Dolar güne yükselişle başladı', 'https://d.test/dolar', 3)],
  'aa.com.tr': [item('Enflasyon verisi açıklandı', 'https://d.test/enflasyon', 4)],
};
const mocks = () => [[/api\.rss2json\.com/, (r) => {
  const u = new URL(decodeURIComponent(new URL(r.request().url()).searchParams.get('rss_url')));
  const host = Object.keys(FEEDS).find((h) => u.hostname.endsWith(h));
  return r.fulfill(json(host ? { status: 'ok', items: FEEDS[host] } : { status: 'error', items: [] }));
}]];

const titles = (page) => page.$$eval('.w[data-id=tech] .nw-i b', (a) => a.map((x) => x.textContent));
const tabs = (page) => page.$$eval('.w[data-id=tech] .dv-tabs button', (a) => a.map((x) => x.textContent));

test('Haberler: dört sekme var, Teknoloji kategoriye göre süzülür', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page, errors } = await openPage(ctx, srv.url);
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=tech] .nw-i').length > 0);
  assert.deepEqual(await tabs(page), ['Teknoloji', 'Oyun', 'Otomobil', 'Ekonomi']);
  const t = await titles(page);
  assert.ok(t.includes('Yeni telefon tanıtıldı'));
  assert.ok(t.includes('İşlemci karşılaştırması yayında'));
  assert.ok(!t.includes('PlayStation 6 hakkında yeni iddia'), 'oyun haberi teknolojide olmamalı');
  assert.ok(!t.includes('Tesla yeni modelini duyurdu'), 'otomobil haberi teknolojide olmamalı');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Haberler: Oyun ve Otomobil sekmeleri haberi doğru dağıtır, seçim kalıcıdır', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=tech] .nw-i').length > 0);
  await page.click('.w[data-id=tech] [data-t=oyun]');
  await page.waitForFunction(() => [...document.querySelectorAll('.w[data-id=tech] .nw-i b')].some((b) => /PlayStation 6/.test(b.textContent)));
  let t = await titles(page);
  assert.ok(t.includes('Bağımsız bir yapım çıktı'), 'Merlin tüm haberleriyle görünmeli');
  assert.ok(!t.includes('Yeni telefon tanıtıldı'));
  await page.click('.w[data-id=tech] [data-t=oto]');
  await page.waitForFunction(() => [...document.querySelectorAll('.w[data-id=tech] .nw-i b')].some((b) => /Tesla/.test(b.textContent)));
  t = await titles(page);
  assert.ok(!t.includes('PlayStation 6 hakkında yeni iddia'));
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['pano.tech.tab'])), 'oto');
  assert.equal(await page.getAttribute('.w[data-id=tech] [data-t=oto]', 'aria-selected'), 'true');
  await ctx.close();
});

test('Haberler: Ekonomi sekmesi kaynakların tüm haberlerini, yeniden eskiye sıralı gösterir', async () => {
  const ctx = await newContext(browser, { mocks: mocks(), });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.tech.tab': '"eko"' } });
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=tech] .nw-i').length >= 2);
  const t = await titles(page);
  assert.deepEqual(t.slice(0, 2), ['Dolar güne yükselişle başladı', 'Enflasyon verisi açıklandı']);
  assert.match(await page.textContent('.w[data-id=tech] .nw-i span'), /Bloomberg HT/);
  await ctx.close();
});

test('Haberler: kaynaklar yoksa "alınamadı" ve Tekrar dene; sonra toparlanır', async () => {
  let ok = false;
  const ctx = await newContext(browser, { mocks: [[/api\.rss2json\.com/, (r) => {
    if (!ok) return r.fulfill(json({ status: 'error', items: [] }));
    return r.fulfill(json({ status: 'ok', items: FEEDS['webtekno.com'] }));
  }]] });
  const { page } = await openPage(ctx, srv.url);
  await page.waitForSelector('.w[data-id=tech] #nrt', { timeout: 40000 });
  assert.match(await page.textContent('.w[data-id=tech] .nw-msg'), /alınamadı/);
  ok = true;
  await page.click('.w[data-id=tech] #nrt');
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=tech] .nw-i').length > 0);
  await ctx.close();
});

test('Haberler: eski önbellekteki haber, yeni çekim eksik gelse de düşmez', async () => {
  const old = { t: Date.now() - 3600e3, items: [{ title: 'Önbellekteki eski haber', link: 'https://e.test/eski', source: 'Webtekno', date: new Date(Date.now() - 7200e3).toISOString() }] };
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.tech.c.tekno': old } });
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=tech] .nw-i').length >= 3);
  const t = await titles(page);
  assert.ok(t.includes('Önbellekteki eski haber'));
  assert.ok(t.includes('Yeni telefon tanıtıldı'));
  await ctx.close();
});
