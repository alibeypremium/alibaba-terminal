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

test('index.html\'deki tüm betik/stil dosyaları var, hepsi yükleniyor ve JavaScript sözdizimi geçerli', () => {
  const js = [...html.matchAll(/<script src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)].map((m) => m[1]);
  const css = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"?]+)(?:\?[^"]*)?">/g)].map((m) => m[1]);
  assert.ok(js.length >= 20 && css.length >= 4, 'beklenen dosyalar index.html\'de yok');
  for (const f of [...js, ...css]) assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' yok');
  // diskteki her js/css dosyası sayfada yüklenmeli (unutulan dosya kalmasın)
  for (const [dir, list] of [['js', js], ['css', css]]) for (const f of fs.readdirSync(path.join(ROOT, dir))) assert.ok(list.includes(dir + '/' + f), dir + '/' + f + ' index.html\'de yüklenmiyor');
  for (const f of js) new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f });   // hata varsa fırlatır
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
    events: [492, 646, 462, 249], ps: [967, 646, 462, 249], weather: [1443, 646, 145, 117],
    controls: [1601, 646, 145, 117], radio: [1760, 646, 145, 117], tv: [16, 778, 303, 117],
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
