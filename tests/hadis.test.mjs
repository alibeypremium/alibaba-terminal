import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { startServer, launch, newContext, openPage } from './helpers.mjs';
import { parse, eligible } from '../.github/scripts/hadis.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const D = new URL('../public/data/hadis/', import.meta.url);
const rd = (f) => JSON.parse(fs.readFileSync(new URL(f, D), 'utf8'));
const LAYOUT = [{ id: 'kurul', w: 3, h: 1, hidden: false }];
const W = '.w[data-id=kurul]';
const tap = (page, sel) => page.dispatchEvent(sel, 'click');
const openH = async (ctx, tz) => {
  const r = await openPage(ctx, srv.url, { layout: LAYOUT, ls: { 'pano.rehber.tab': '"h"' } });
  await r.page.waitForFunction((s) => (document.querySelector(s + ' .kr-cq')?.textContent || '').length > 40, W);
  return r;
};

test('Hadis verisi: site dosyaları kaynak metinle birebir aynı (her satır)', () => {
  const rows = parse(fs.readFileSync(new URL('../data/kutubu_sitte.txt', import.meta.url), 'utf8'));
  const ix = rd('idx.json');
  assert.equal(ix.n, rows.length);
  const txt = ix.ch.flatMap((_, n) => { const c = rd('t' + n + '.json'); return c.t.map((t, k) => [t, c.f[k]]); });
  assert.equal(txt.length, rows.length);
  rows.forEach((r, i) => { assert.equal(txt[i][0], r.t, 'metin ' + r.id); assert.equal(txt[i][1], r.ref, 'ref ' + r.id); assert.equal(ix.id[i], r.id); });
  const g = rd('gun.json');
  assert.ok(g.order.length > 3000 && new Set(g.order).size === g.order.length);
  assert.ok(g.order.every((i) => eligible(rows[i])), 'günün hadisi uygun satırlardan seçilir');
});

test('Rehber: başlık "Rehber", Sorular/Hadis sekmeleri; seçim hatırlanır', async () => {
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const { page } = await openH(ctx);
  assert.equal((await page.textContent(W + ' .hd .ttl')).trim(), 'Rehber');
  assert.deepEqual(await page.$$eval(W + ' .kr-tabs button', (b) => b.map((x) => x.textContent)), ['Sorular', 'Hadis']);
  assert.equal(await page.getAttribute(W + ' .kr-tabs button[data-t=h]', 'aria-selected'), 'true');
  await tap(page, W + ' .kr-tabs button[data-t=q]');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pano.rehber.tab'))), 'q');
  await ctx.close();
});

test('Hadis: kartta günün hadisi her saat diliminde aynı; tıklayınca büyük pencerede kalın metinle açılır', async () => {
  const txts = [];
  for (const tz of ['Europe/Istanbul', 'America/Los_Angeles']) {
    const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 }, timezoneId: tz });
    const { page } = await openH(ctx);
    txts.push(await page.textContent(W + ' .kr-cq'));
    if (tz === 'Europe/Istanbul') {
      await tap(page, W + ' .kr-card');
      await page.waitForSelector('.kr-ov .hd-t strong');
      assert.equal((await page.textContent('.hd-t strong')).trim(), txts[0].trim());
      assert.ok(+(await page.$eval('.hd-t strong', (e) => getComputedStyle(e).fontWeight)) >= 700);
      assert.ok((await page.textContent('.hd-ref')).length > 3);
      await page.keyboard.press('Escape');   // detay → liste
      assert.ok(await page.$('.kr-ov .hd-i'));
      await page.keyboard.press('Escape');
      assert.equal(await page.$('.kr-ov') === null, true);
    }
    await ctx.close();
  }
  assert.equal(txts[0], txts[1]);
});

test('Hadis penceresi: arama (metin, râvi, kaynak), süzgeçler, önceki/sonraki ve Esc', async () => {
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const { page } = await openH(ctx);
  await tap(page, W + ' .kr-card');
  await page.waitForSelector('.kr-ov .hd-t strong');
  await tap(page, '.kr-ov [data-a=prev]');
  await page.waitForFunction(() => !document.querySelector('.hd-t.kr-wait') && document.querySelector('.hd-t strong'));
  await page.keyboard.press('Escape');   // detay → liste
  await page.waitForSelector('.kr-ov .hd-i');
  const n0 = await page.$$eval('.kr-ov .hd-i', (x) => x.length);
  assert.equal(n0, 50);
  // arama: Türkçe karakter duyarsız
  await page.fill('.kr-s', 'ABDEST');
  await page.waitForFunction(() => /^\d+ hadis$/.test(document.querySelector('.hd-n').textContent) && !/^5972 /.test(document.querySelector('.hd-n').textContent));
  const nAbd = +(await page.textContent('.hd-n')).split(' ')[0];
  assert.ok(nAbd > 20 && nAbd < 5972);
  // kaynak süzgeci
  await page.selectOption('[data-f=s]', '1');   // Müslim
  const nMus = +(await page.textContent('.hd-n')).split(' ')[0];
  assert.ok(nMus > 0 && nMus < nAbd);
  await page.selectOption('[data-f=s]', '');
  // bölüm → konu
  await page.fill('.kr-s', '');
  await page.waitForFunction(() => /^5972 hadis$/.test(document.querySelector('.hd-n').textContent));
  assert.equal(await page.$eval('[data-f=k]', (e) => e.disabled), true);
  await page.selectOption('[data-f=b]', '0');
  assert.equal(await page.$eval('[data-f=k]', (e) => e.disabled), false);
  await page.selectOption('[data-f=k]', { index: 1 });
  const nK = +(await page.textContent('.hd-n')).split(' ')[0];
  assert.ok(nK >= 1 && nK < 100);
  // râvi
  await page.selectOption('[data-f=b]', '');
  await page.selectOption('[data-f=r]', { index: 1 });
  assert.ok(+(await page.textContent('.hd-n')).split(' ')[0] >= 1);
  await page.fill('.kr-s', 'zzzxqq');
  await page.waitForSelector('.kr-empty');
  await page.keyboard.press('Escape');
  assert.equal(await page.$('.kr-ov') === null, true);
  await ctx.close();
});

test('Hadis penceresi: detayda râvi/bölüm bağlantısı o süzgeci uygular', async () => {
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const { page } = await openH(ctx);
  await tap(page, W + ' .kr-card');
  await page.waitForSelector('.kr-ov .hd-t strong');
  const hasR = await page.$('.hd-lk[data-r]');
  if (hasR) { await tap(page, '.hd-lk[data-r]'); await page.waitForSelector('.hd-i'); assert.notEqual(await page.$eval('[data-f=r]', (e) => e.value), ''); }
  await ctx.close();
});
