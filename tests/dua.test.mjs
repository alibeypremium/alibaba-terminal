import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { startServer, launch, newContext, openPage } from './helpers.mjs';
import { parse, SKIP } from '../.github/scripts/dua.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const W = '.w[data-id=daily]';
const load = () => { const c = {}; vm.runInNewContext(fs.readFileSync(new URL('../public/js/dua.js', import.meta.url), 'utf8').replace("'use strict';", '').replace('const DUA', 'DUA'), c); return c.DUA; };

test('Dua verisi: kaynak dosyadan üretilmiş, numara/not yok, 136 kayıt', () => {
  const dua = load(), src = parse(fs.readFileSync(new URL('../data/kuran_dualari.txt', import.meta.url), 'utf8'));
  assert.equal(JSON.stringify(dua), JSON.stringify(src));
  assert.equal(dua.length, 138 - SKIP.size);
  for (const [why, text, ref] of dua) {
    assert.ok(why.length > 15 && text.length > 8 && /^[^\d].*, \d+(-\d+)?$/.test(ref), why);
    assert.ok(!/^\d+\s*-/.test(why) && !/dua değil|\[|\]/.test(why + text), why);
  }
});

test('Ayet · Dua · Esma: Hadis sekmesi yok; Dua sekmesi neden + dua + sure gösterir ve kendi rengindedir', async () => {
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const { page } = await openPage(ctx, srv.url, { layout: [{ id: 'daily', w: 3, h: 1, hidden: false }], ls: { 'pano.daily.tab': '"dua"' } });
  await page.waitForSelector(W + ' .dv-why');
  assert.deepEqual(await page.$$eval(W + ' .dv-tabs button', (b) => b.map((x) => x.textContent)), ['Ayet', 'Dua', 'Esma']);
  assert.equal((await page.textContent(W + ' .ttl')).trim(), 'Günün Duası');
  const why = await page.textContent(W + ' .dv-why');
  assert.ok(load().some((d) => d[0] === why));
  assert.match(await page.textContent(W + ' .dv-ref'), /, \d/);
  const bg = (t) => page.evaluate(([s, t]) => { document.querySelector(s).dataset.tab = t; return getComputedStyle(document.querySelector(s)).getPropertyValue('--acc').trim(); }, [W, t]);
  assert.notEqual(await bg('dua'), await bg('ayet'));
  assert.notEqual(await bg('dua'), await bg('esma'));
  await ctx.close();
});

test('Dua sekmesinde sonraki/önceki düğmesi duayı değiştirir', async () => {
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
  const { page } = await openPage(ctx, srv.url, { layout: [{ id: 'daily', w: 3, h: 1, hidden: false }], ls: { 'pano.daily.tab': '"dua"' } });
  await page.waitForSelector(W + ' .dv-why');
  const a = await page.textContent(W + ' .dv-q');
  await page.dispatchEvent(W + ' [data-d="1"]', 'click');
  assert.notEqual(await page.textContent(W + ' .dv-q'), a);
  await ctx.close();
});
