// Hava ve Radyo widget'ları 1×1 (dar kare) boyutta: her şey kutunun içinde, okunur ve çalışır olmalı.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });
const tap = (page, sel) => page.dispatchEvent(sel, 'click');

const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 10, 12 + i)).toISOString().slice(0, 10));
const hours = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => d + 'T' + String(h).padStart(2, '0') + ':00'));
const forecast = {
  current: { time: days[0] + 'T12:00', temperature_2m: 17.4, apparent_temperature: 15.2, relative_humidity_2m: 61, weather_code: 2, wind_speed_10m: 11, is_day: 1 },
  hourly: { time: hours, temperature_2m: hours.map(() => 12), weather_code: hours.map(() => 3), is_day: hours.map(() => 1) },
  daily: { time: days, weather_code: days.map(() => 61), temperature_2m_max: days.map((_, i) => 20 + i), temperature_2m_min: days.map((_, i) => 8 + i), precipitation_probability_max: days.map(() => 40) },
};
const LAYOUT = [{ id: 'weather', w: 1, h: 1, hidden: false }, { id: 'radio', w: 1, h: 1, hidden: false }];
const open = async () => {
  const ctx = await newContext(browser, { mocks: [[/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill(json(forecast))]] });
  const { page } = await openPage(ctx, srv.url, { layout: LAYOUT, ls: { 'pano.rw.size': 1 } });
  return { ctx, page };
};
/* seçiciyle bulunan görünür öğelerin tümü widget kutusunun içinde mi? */
const inside = (page, W, sels) => page.evaluate(([W, sels]) => {
  const b = document.querySelector(W).getBoundingClientRect(), bad = [];
  for (const s of sels) for (const e of document.querySelectorAll(W + ' ' + s)) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) { bad.push(s + ' görünmüyor'); continue; }
    if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) bad.push(s + ' taşıyor ' + [r.left - b.left, r.top - b.top, r.right - b.left, r.bottom - b.top].map(Math.round));
  }
  return bad;
}, [W, sels]);

test('Hava 1×1: şehir, sıcaklık, durum ve en yüksek/en düşük kutunun içinde; ayrıntılar gizli; tıklayınca 7 günlük panel açılır', async () => {
  const { ctx, page } = await open();
  const W = '.w[data-id=weather]';
  await page.waitForSelector(W + ' .wx-temp');
  const b = await page.$eval(W, (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  assert.ok(b[0] < 200 && b[1] < 200, 'kutu 1×1: ' + b);
  assert.deepEqual(await inside(page, W, ['.wx-place', '.wx-icon svg', '.wx-temp', '.wx-cond', '.wx-mini']), []);
  assert.equal((await page.textContent(W + ' .wx-temp')).trim(), '17°');
  assert.match(await page.textContent(W + ' .wx-place'), /Ankara/);
  assert.equal((await page.textContent(W + ' .wx-cond')).trim(), 'Parçalı bulutlu');
  assert.equal((await page.textContent(W + ' .wx-mini')).trim(), '20° / 8°');
  for (const s of ['.wx-hilo', '.wx-hours', '.wx-days']) assert.equal(await page.$eval(W + ' ' + s, (e) => getComputedStyle(e).display), 'none', s + ' gizli olmalı');
  // yerleşim: şehir en üstte, sıcaklık ortada, durum en altta
  const y = await page.evaluate((W) => { const t = (s) => document.querySelector(W + ' ' + s).getBoundingClientRect().top; return [t('.wx-place'), t('.wx-temp'), t('.wx-cond')]; }, W);
  assert.ok(y[0] < y[1] && y[1] < y[2], 'sıra: şehir < sıcaklık < durum ' + y);
  await tap(page, W + ' .wx-main');
  await page.waitForSelector(W + ' .wov .wov-d');
  assert.equal(await page.locator(W + ' .wov .wov-d').count(), 7);
  await ctx.close();
});

test('Radyo 1×1: kanal, durum ve denetimler kutunun içinde; liste/ses çubuğu gizli; ileri-geri kanal değiştirir; tekerlek sesi ayarlar', async () => {
  const { ctx, page } = await open();
  const W = '.w[data-id=radio]';
  await page.waitForSelector(W + ' .rd-pl');
  const b = await page.$eval(W, (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  assert.ok(b[0] < 200 && b[1] < 200, 'kutu 1×1: ' + b);
  assert.deepEqual(await inside(page, W, ['.rd-disc', '.rd-nm', '.rd-st', '.rd-pv', '.rd-pl', '.rd-nx']), []);
  for (const s of ['.rd-ctl']) assert.equal(await page.$eval(W + ' ' + s, (e) => getComputedStyle(e).display), 'none');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Bir kanal seç');
  await tap(page, W + ' .rd-nx');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Habertürk');
  await tap(page, W + ' .rd-nx');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'NTV');
  await tap(page, W + ' .rd-pv');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Habertürk');
  assert.deepEqual(await inside(page, W, ['.rd-disc', '.rd-nm', '.rd-st', '.rd-pv', '.rd-pl', '.rd-nx']), [], 'kanal değişince de sığar');
  // ses: fare tekerleği (aşağı = kıs)
  const r = await page.$eval(W, (e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.move(r[0], r[1]);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction((s) => /Ses %65/.test(document.querySelector(s + ' .rd-st').textContent), W);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pano.radio.vol'))), 0.65);
  await page.waitForFunction((s) => !/Ses %/.test(document.querySelector(s + ' .rd-st').textContent), W, { timeout: 4000 });
  await ctx.close();
});

test('Hava ve Radyo: büyütülünce eski ayrıntılı görünüm geri gelir', async () => {
  const ctx = await newContext(browser, { mocks: [[/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill(json(forecast))]] });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1 }, layout: [{ id: 'weather', w: 3, h: 3, hidden: false }, { id: 'radio', w: 3, h: 1, hidden: false }] });
  await page.waitForSelector('.w[data-id=weather] .wx-temp');
  assert.equal(await page.$eval('.w[data-id=weather] .wx-hours', (e) => getComputedStyle(e).display), 'flex');
  assert.equal(await page.$eval('.w[data-id=weather] .wx-mini', (e) => getComputedStyle(e).display), 'none');
  assert.notEqual(await page.$eval('.w[data-id=radio] .rd-ctl', (e) => getComputedStyle(e).display), 'none');
  assert.equal(await page.locator('.w[data-id=radio] .rd-it').first().isVisible(), true);
  await ctx.close();
});

test('Eski düzende Radyo (3×1) ve Hava (2×1) tek seferlik 1×1 olur; sonra elle büyütülen korunur', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url, { layout: [{ id: 'weather', w: 2, h: 1, hidden: false }, { id: 'radio', w: 3, h: 1, hidden: false }] });
  const l = () => page.evaluate(() => JSON.parse(localStorage.getItem('pano.layout.v3')).filter((x) => x.id === 'weather' || x.id === 'radio').map((x) => x.id + ':' + x.w + 'x' + x.h).sort());
  assert.deepEqual(await l(), ['radio:1x1', 'weather:1x1']);
  await page.evaluate(() => { const a = JSON.parse(localStorage.getItem('pano.layout.v3')); a.find((x) => x.id === 'radio').w = 3; localStorage.setItem('pano.layout.v3', JSON.stringify(a)); });
  await page.reload();
  await page.waitForSelector('.w[data-id=radio]');
  assert.deepEqual(await l(), ['radio:3x1', 'weather:1x1']);
  await ctx.close();
});
