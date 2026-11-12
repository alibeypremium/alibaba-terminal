import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { ROOT, startServer, launch, newContext, openPage } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

test('satır içi JavaScript sözdizimi geçerli', () => {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.ok(scripts.length > 0);
  for (const s of scripts) if (s.trim()) new vm.Script(s);   // hata varsa fırlatır
});

test('favicon ve ana ekran simgeleri yerinde', () => {
  assert.match(html, /<link[^>]+rel="icon"[^>]+href="data:image\//);
  assert.match(html, /<link[^>]+rel="apple-touch-icon"[^>]+href="data:image\//);
});

test('açılışta hata yok; varsayılan düzen 1920×909\'da beklenen yerde', async () => {
  const ctx = await newContext(browser);
  const { page, errors } = await openPage(ctx, srv.url);
  await page.waitForTimeout(2500);
  const rects = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.w')].map((w) => {
    const r = w.getBoundingClientRect();
    return [w.dataset.id, [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]];
  })));
  // [x, y, genişlik, yükseklik]
  const want = {
    gnews: [16, 121, 462, 380], youtube: [492, 121, 937, 511], tech: [1443, 121, 462, 380],
    prayer: [16, 515, 462, 117], fx: [1443, 515, 462, 117], daily: [16, 646, 462, 117],
    events: [492, 646, 462, 249], ps: [967, 646, 462, 249], weather: [1443, 646, 303, 117],
    controls: [1760, 646, 145, 117], radio: [16, 778, 462, 117], tv: [1443, 778, 303, 117],
  };
  for (const [id, w] of Object.entries(want)) {
    assert.ok(rects[id], id + ' widget\'ı yok');
    rects[id].forEach((v, i) => assert.ok(Math.abs(v - w[i]) <= 3, `${id}[${i}] = ${v}, beklenen ${w[i]}`));
  }
  for (const id of ['games', 'notes']) assert.equal(rects[id]?.[2] ?? 0, 0, id + ' varsayılan olarak kapalı olmalı');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('görünür her widget içerik üretiyor (boş kalmıyor)', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url);
  await page.waitForTimeout(2500);
  const empty = await page.evaluate(() => [...document.querySelectorAll('.w')].filter((w) => w.getBoundingClientRect().width > 0 && w.innerText.trim().length < 3 && !w.querySelector('iframe,canvas,svg,img')).map((w) => w.dataset.id));
  assert.deepEqual(empty, []);
  await ctx.close();
});
