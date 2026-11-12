import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, json } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

/* Sayfada sürekli animasyon olduğundan Playwright'ın "stabil" beklemesi takılır; tıklama doğrudan olay olarak gönderilir. */
const tap = (page, sel) => page.dispatchEvent(sel, 'click');

const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 10, 12 + i)).toISOString().slice(0, 10));
const hours = days.flatMap((d) => Array.from({ length: 24 }, (_, h) => d + 'T' + String(h).padStart(2, '0') + ':00'));
const forecast = {
  current: { time: days[0] + 'T12:00', temperature_2m: 17.4, apparent_temperature: 15.2, relative_humidity_2m: 61, weather_code: 3, wind_speed_10m: 11, is_day: 1 },
  hourly: { time: hours, temperature_2m: hours.map((_, i) => 10 + (i % 24) / 3), weather_code: hours.map(() => 3), is_day: hours.map((t) => +(+t.slice(11, 13) >= 7 && +t.slice(11, 13) < 18)) },
  daily: { time: days, weather_code: days.map(() => 61), temperature_2m_max: days.map((_, i) => 20 + i), temperature_2m_min: days.map((_, i) => 8 + i), precipitation_probability_max: days.map(() => 40) },
};
const timings = { Fajr: '05:41', Sunrise: '07:05', Dhuhr: '12:30', Asr: '15:12', Maghrib: '17:48', Isha: '19:10' };
const aladhan = { data: { timings, meta: { timezone: 'Europe/Istanbul' }, date: { hijri: { day: '10', month: { number: 5 }, year: '1448' } } } };
const mocks = () => [
  [/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill(json(forecast))],
  [/api\.aladhan\.com/, (r) => r.fulfill(json(aladhan))],
];

test('Hava: kart sıcaklığı ve şehri gösterir; tıklayınca 7 günlük panel açılır, tıklayınca/Esc ile kapanır', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page, errors } = await openPage(ctx, srv.url);
  const W = '.w[data-id=weather]';
  await page.waitForSelector(W + ' .wx-temp');
  assert.equal((await page.textContent(W + ' .wx-temp')).trim(), '17°');
  assert.match(await page.textContent(W + ' .wx-place'), /Ankara/);
  assert.equal(await page.locator(W + ' .wov').count(), 0);
  await tap(page, W + ' .wx-hilo');
  await page.waitForSelector(W + ' .wov .wov-d');
  assert.equal(await page.locator(W + ' .wov .wov-d').count(), 7);
  assert.match(await page.textContent(W + ' .wov .ttl'), /7 günlük hava/);
  await tap(page, W + ' .wov');
  await page.waitForFunction((s) => !document.querySelector(s + ' .wov'), W);
  await tap(page, W + ' .wx-hilo');
  await page.waitForSelector(W + ' .wov');
  await page.keyboard.press('Escape');
  await page.waitForFunction((s) => !document.querySelector(s + ' .wov'), W);
  assert.equal(await page.evaluate(() => document.querySelector('.w[data-id=weather]').classList.contains('wov-on')), false);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Hava: ağ yokken önbellekteki son veri gösterilir, hiç veri yoksa hata mesajı çıkar', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.wx': { p: 'Ankara', j: forecast } } });
  await page.waitForSelector('.w[data-id=weather] .wx-temp');
  assert.equal((await page.textContent('.w[data-id=weather] .wx-temp')).trim(), '17°');
  await ctx.close();
  const ctx2 = await newContext(browser);
  const p2 = await openPage(ctx2, srv.url);
  await p2.page.waitForFunction(() => /alınamadı/.test(document.querySelector('.w[data-id=weather]')?.textContent || ''));
  await ctx2.close();
});

test('Namaz: altı vakit ve hicri tarih görünür; panel açılıp kapanır', async () => {
  const ctx = await newContext(browser, { mocks: mocks() });
  const { page, errors } = await openPage(ctx, srv.url);
  const P = '.w[data-id=prayer]';
  await page.waitForFunction((s) => /\d/.test(document.querySelector(s + ' #hj')?.textContent || ''), P);
  assert.match(await page.textContent(P + ' #hj'), /1448/);
  assert.match(await page.textContent(P + ' #pcity'), /Ankara/);
  await tap(page, P + ' #pcity');
  await page.waitForSelector(P + ' .wov');
  const txt = await page.textContent(P + ' .wov');
  for (const t of Object.values(timings)) assert.ok(txt.includes(t), t + ' panelde olmalı');
  for (const [, n] of [['', 'İmsak'], ['', 'Öğle'], ['', 'Yatsı']]) assert.ok(txt.includes(n), n);
  await page.keyboard.press('Escape');
  await page.waitForFunction((s) => !document.querySelector(s + ' .wov'), P);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Namaz: vakitler alınamazsa mesaj gösterilir', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url);
  await page.waitForFunction(() => /alınamadı/.test(document.querySelector('.w[data-id=prayer] #pnm')?.textContent || ''));
  await ctx.close();
});
