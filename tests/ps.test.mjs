import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json, psRow } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const since = (days) => new Date(Date.now() - days * 864e5).toISOString();
const mocks = (sinceDays = 30) => [
  [/veri-ps\/ps\.json/, (r) => r.fulfill(json({
    t: new Date().toISOString(), since: since(sinceDays),
    deals: [...Array(12)].map((_, i) => psRow(i, { lo: i % 3 === 0 ? 1 : undefined })),
    soon: [...Array(6)].map((_, i) => psRow(i + 30, { disc: false, pre: true, d: '2026-11-1' + (i + 1) })),
  }))],
  [/veri-ps\/ps-all\.json/, (r) => r.fulfill(json({
    t: new Date().toISOString(), since: since(sinceDays),
    g: [...Array(80)].map((_, i) => { const x = psRow(i, { disc: i % 2 === 0 }); return [x.id, x.n, x.now, x.base, x.im, '5', x.now]; }),
  }))],
];
const psLayout = [{ id: 'ps', w: 3, h: 3, hidden: false }];
const open = async (sinceDays) => {
  const ctx = await newContext(browser, { mocks: mocks(sinceDays) });
  const { page, errors } = await openPage(ctx, srv.url, { layout: psLayout, ls: { 'pano.ps.size': 2 } });
  const W = page.locator('.w[data-id=ps]');
  await W.locator('.cv-c').first().waitFor();
  return { ctx, page, W, errors };
};
const visible = (W) => W.evaluate((w) => [...w.querySelectorAll('.cv-c')].filter((c) => !c.hidden && c.offsetParent).length);

test('İndirim sekmesi: kartlar, fiyat ve indirim rozeti', async () => {
  const { ctx, W, errors } = await open();
  assert.ok(await visible(W) >= 3);
  const first = await W.locator('.cv-c').first().innerText();
  assert.match(first, /-%\d+/);
  assert.match(first, /TL/);
  assert.match(await W.locator('.cv-c img').first().getAttribute('src'), /^https:\/\/image\.api\.playstation\.com\/p\d+\?w=360$/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('"En düşük fiyat" rozeti: kayıt 7 günden eskiyse çıkar, yeniyse çıkmaz', async () => {
  let t = await open(30);
  assert.ok(await t.W.locator('.cv-lo').count() > 0, 'eski kayıtla rozet beklenir');
  await t.ctx.close();
  t = await open(2);
  assert.equal(await t.W.locator('.cv-lo').count(), 0, 'kayıt yeniyken rozet olmamalı');
  await t.ctx.close();
});

test('Yakında sekmesi: çıkış tarihi rozeti', async () => {
  const { ctx, W } = await open();
  await W.locator('[data-t=soon]').click();
  await W.locator('.cv-date').first().waitFor();
  assert.match(await W.locator('.cv-date').first().innerText(), /\d/);
  await ctx.close();
});

test('İstek listesi: yıldızla ekle/çıkar, kalıcı, indirimdekiler başta', async () => {
  const { ctx, page, W } = await open();
  await W.locator('.cv-st').nth(0).click();
  await W.locator('.cv-st').nth(1).click();
  const wish = await page.evaluate(() => JSON.parse(localStorage['pano.ps.wish']));
  assert.equal(wish.length, 2);
  await W.locator('[data-t=wish]').click();
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=ps] .cv-c').length === 2);
  assert.match(await W.locator('#cvf').innerText(), /İstek listem · 2 oyun/);
  await W.locator('.cv-st').first().click();   // listeden çıkar
  await page.waitForFunction(() => document.querySelectorAll('.w[data-id=ps] .cv-c').length === 1);
  assert.equal((await page.evaluate(() => JSON.parse(localStorage['pano.ps.wish']))).length, 1);
  await ctx.close();
});

test('Arama: Türkçe karakter duyarsız, sonuç sayısı ve kapatma', async () => {
  const { ctx, page, W } = await open();
  await W.locator('[data-a=sr]').click();
  await W.locator('#cvs input').fill('isik');            // "Işık Savaşı" → ı/ş duyarsız
  await page.waitForFunction(() => /sonuç/.test(document.querySelector('.w[data-id=ps] #cvf').textContent));
  const names = await W.locator('.cv-t').allInnerTexts();
  assert.ok(names.length > 0 && names.every((n) => /Işık/.test(n)), names.join('|'));
  await W.locator('#cvs input').fill('zzzyok');
  await page.waitForFunction(() => /sonuç yok/i.test(document.querySelector('.w[data-id=ps] #cvf').textContent));
  await W.locator('[data-a=sx]').click();
  await W.locator('.cv-c').first().waitFor();
  assert.ok(await visible(W) >= 3);
  await ctx.close();
});
