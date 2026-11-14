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
  assert.deepEqual(await inside(page, W, ['.rd-nm', '.rd-st', '.rd-eq', '.rd-pv', '.rd-pl', '.rd-nx', '.rd-vol', '.rd-vol input']), [], 'plak, ad, ekolayzır, düğmeler ve ses çubuğu görünür');
  assert.equal(await page.$eval(W + ' .rd-list', (e) => getComputedStyle(e).display), 'none', 'kanal listesi gizli');
  // CANLI rozeti ve ekolayzır çalarken de sığar (durum satırına rozet yerleştirilip ölçülür)
  await page.evaluate((W) => { const r = document.querySelector(W + ' .rd'); r.classList.add('live'); document.querySelector(W + ' .rd-st').innerHTML = '<span class="rd-badge"><i></i>CANLI</span><span class="rd-br">64 kbps</span>'; }, W);
  assert.deepEqual(await inside(page, W, ['.rd-badge', '.rd-eq']), []);
  assert.equal(await page.$eval(W + ' .rd-badge', (e) => e.textContent), 'CANLI');
  assert.equal(await page.$eval(W + ' .rd-eq i', (e) => getComputedStyle(e).animationName), 'rdeq', 'çalarken ekolayzır oynar');
  await page.evaluate((W) => document.querySelector(W + ' .rd').classList.remove('live'), W);
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Bir kanal seç');
  await tap(page, W + ' .rd-nx');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Habertürk');
  await tap(page, W + ' .rd-nx');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'NTV');
  await tap(page, W + ' .rd-pv');
  assert.equal((await page.textContent(W + ' .rd-nm')).trim(), 'Habertürk');
  assert.deepEqual(await inside(page, W, ['.rd-nm', '.rd-st', '.rd-pv', '.rd-pl', '.rd-nx']), [], 'kanal değişince de sığar');
  // ses çubuğu
  await page.$eval(W + ' .rd-vol input', (e) => { e.value = 30; e.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pano.radio.vol'))), 0.3);
  await page.$eval(W + ' .rd-vol input', (e) => { e.value = 70; e.dispatchEvent(new Event('input', { bubbles: true })); });
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

const FAKE = "HTMLMediaElement.prototype.play = function () { this._p = 1; setTimeout(() => { if (this._p) this.dispatchEvent(new Event('playing')); }, 20); return Promise.resolve(); }; HTMLMediaElement.prototype.pause = function () { this._p = 0; };";   // ağsız sahte oynatma
const WXM = [[/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill(json(forecast))]];

test('Üst çubuk Radyo çipi: hava çipinin soluna, play düğmesi yok; tıklayınca panel açılır (kanallar, çal/durdur, ses); widget ile eşzamanlı', async () => {
  const ctx = await newContext(browser, { mocks: WXM });
  await ctx.addInitScript(FAKE);
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1 }, layout: LAYOUT });
  await page.waitForSelector('#sbRd');
  const pos = await page.evaluate(() => { const a = document.querySelector('#sbRd'), w = document.querySelector('#sbWx').getBoundingClientRect(), r = a.getBoundingClientRect(); return { next: a.nextElementSibling.id, right: r.right, wxLeft: w.left, dy: Math.abs(r.top + r.height / 2 - (w.top + w.height / 2)) }; });
  assert.equal(pos.next, 'sbWxBox');
  assert.ok(pos.right <= pos.wxLeft + 0.5 && pos.wxLeft - pos.right < 14, 'hava çipinin hemen solunda');
  assert.ok(pos.dy < 3, 'aynı hizada');
  assert.equal(await page.locator('#sbRd button').count(), 0, 'çipte düğme yok (tek parça)');
  assert.equal((await page.textContent('#sbRd .sb-rdn')).trim(), 'Radyo');
  assert.equal(await page.locator('#radioPop').isVisible(), false);
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  const box = await page.$eval('#radioPop', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top, innerWidth]; });
  assert.ok(box[0] >= 11 && box[1] <= box[3] - 11, 'panel ekran içinde ' + box);
  assert.equal(await page.getAttribute('#sbRd', 'aria-expanded'), 'true');
  assert.deepEqual(await page.$$eval('#radioPop .rp-it', (a) => a.map((x) => x.textContent.trim())), ['Habertürk', 'NTV', 'ODTÜ']);
  assert.equal(await page.locator('#radioPop .rp-pl').count(), 1);
  assert.equal(await page.locator('#radioPop .rp-vol input').count(), 1);
  assert.equal(await page.locator('#radioPop .rp-eq i').count(), 5);
  await tap(page, '#radioPop .rp-it[data-k=ht]');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'play');
  assert.equal((await page.textContent('#sbRd .sb-rdn')).trim(), 'Habertürk');
  assert.equal((await page.textContent('.w[data-id=radio] .rd-nm')).trim(), 'Habertürk');
  assert.match(await page.textContent('#radioPop .rp-st'), /CANLI/);
  assert.equal(await page.$eval('#radioPop .rp-eq i', (e) => getComputedStyle(e).animationName), 'rdeq', 'panel ekolayzırı oynar');
  assert.equal(await page.$eval('#sbRd .rd-eq i', (e) => getComputedStyle(e).animationName), 'rdeq', 'çip ekolayzırı oynar');
  await tap(page, '#radioPop [data-a=nx]');
  assert.equal((await page.textContent('#radioPop .rp-nm')).trim(), 'NTV Radyo');
  await tap(page, '#radioPop [data-a=pv]');
  assert.equal((await page.textContent('#radioPop .rp-nm')).trim(), 'Habertürk Radyo');
  await tap(page, '#radioPop .rp-pl');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'idle');
  assert.match(await page.textContent('#radioPop .rp-st'), /Durdu/);
  await tap(page, '#radioPop .rp-pl');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'play');
  await page.$eval('#radioPop .rp-vol input', (e) => { e.value = 35; e.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('pano.radio.vol'))), 0.35);
  assert.equal(await page.$eval('.w[data-id=radio] .rd-vol input', (e) => e.value), '35');
  assert.equal((await page.textContent('#radioPop .rp-vp')).trim(), '%35');
  await tap(page, '#radioPop .rp-hd');
  assert.equal(await page.locator('#radioPop').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#radioPop').hidden);
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  await tap(page, 'body');
  await page.waitForFunction(() => document.querySelector('#radioPop').hidden);
  const r = await page.$eval('#sbRd', (e) => { const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
  await page.mouse.move(r[0], r[1]);
  await page.mouse.wheel(0, 100);
  await page.waitForFunction(() => /Ses %30/.test(document.querySelector('#sbRd .sb-rdn').textContent));
  await ctx.close();
});

test('Sade modda da çalan radyonun ekolayzırı oynar (üst çubuk çipi ve panel); diğer animasyonlar durur', async () => {
  const ctx = await newContext(browser, { mocks: WXM });
  await ctx.addInitScript(FAKE);
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1, 'pano.lite': true }, layout: LAYOUT });
  await page.waitForSelector('#sbRd');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.lite), '1', 'sade mod açık');
  const an = (sel) => page.$eval(sel, (e) => getComputedStyle(e).animationName);
  assert.equal(await an('#sbRd .rd-eq i'), 'none', 'çalmıyorken durur');
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  await tap(page, '#radioPop .rp-it[data-k=ht]');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'play');
  assert.equal(await an('#sbRd .rd-eq i'), 'rdeq');
  assert.equal(await an('#sbRd .rd-eq i:nth-child(3)'), 'rdeq');
  assert.equal(await an('#radioPop .rp-eq i'), 'rdeq');
  assert.equal(await page.$eval('#sbRd .rd-eq i:nth-child(3)', (e) => getComputedStyle(e).animationDuration), '0.95s');
  assert.equal(await an('.w[data-id=radio] .rd-eq i'), 'none', 'sade modda widget animasyonu durur (yalnızca üst çubuk oynar)');
  await tap(page, '#radioPop .rp-pl');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'idle');
  assert.equal(await an('#sbRd .rd-eq i'), 'none', 'durunca ekolayzır durur');
  await ctx.close();
});

test('Radyo ve Hava panelleri birbirini kapatır', async () => {
  const ctx = await newContext(browser, { mocks: WXM });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1 }, layout: LAYOUT });
  await page.waitForSelector('#sbRd');
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  await tap(page, '#sbWx');
  await page.waitForSelector('#cityPop:not([hidden])');
  assert.equal(await page.$eval('#radioPop', (e) => e.hidden), true);
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  assert.equal(await page.$eval('#cityPop', (e) => e.hidden), true);
  await ctx.close();
});

test('Hava çipinin penceresi: konum + 7 günlük tahmin (üst çubuğun kendi hava isteğinden)', async () => {
  const ctx = await newContext(browser, { mocks: WXM });
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1 }, layout: [{ id: 'controls', w: 1, h: 1, hidden: false }] });
  await page.waitForSelector('#sbWx');
  await page.waitForFunction(() => document.querySelector('#sbWx .sb-v'));   // hava isteği tamamlandı
  await tap(page, '#sbWx');
  await page.waitForSelector('#cityPop:not([hidden]) .pf-r');
  assert.equal(await page.locator('#popFc .pf-r').count(), 7);
  const rows = await page.$$eval('#popFc .pf-r', (a) => a.map((r) => [r.querySelector('b').textContent.trim(), r.querySelector('.pf-t').textContent.replace(/\s+/g, ' ').trim(), r.querySelector('.pf-pp').textContent.trim(), !!r.querySelector('.pf-ic svg')]));
  assert.deepEqual(rows[0], ['Bugün', '20° 8°', '💧40%', true]);
  assert.deepEqual(rows[6].slice(1), ['26° 14°', '💧40%', true]);
  assert.equal(new Set(rows.map((r) => r[0])).size, 7, 'günler farklı');
  assert.match(await page.textContent('#popName'), /Ankara/);
  assert.equal(await page.locator('#cityIn').isVisible(), true, 'konum değiştirme alanı duruyor');
  const b = await page.$eval('#cityPop', (e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.bottom, innerWidth, innerHeight]; });
  assert.ok(b[0] >= 0 && b[1] <= b[3] && b[2] <= b[4], 'pencere ekranda ' + b);
  assert.equal(await page.evaluate(() => Object.keys(bkCollect(true)).some((k) => k === 'pano.tk.d')), false, 'önbellek yedeğe girmez');
  await ctx.close();
});

test('Hava çipinin penceresi: ağ yokken son kayıt (önbellek) gösterilir', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1, 'pano.tk.d': { p: 'Ankara', days: Array.from({ length: 7 }, (_, i) => ({ t: days[i], c: 3, hi: 10 + i, lo: 2 + i, pp: 0 })) } }, layout: [{ id: 'controls', w: 1, h: 1, hidden: false }] });
  await page.waitForSelector('#sbWx');
  await tap(page, '#sbWx');
  await page.waitForSelector('#cityPop:not([hidden]) .pf-r');
  assert.equal(await page.locator('#popFc .pf-r').count(), 7);
  assert.equal((await page.textContent('#popFc .pf-r .pf-t')).replace(/\s+/g, ' ').trim(), '10° 2°');
  await ctx.close();
});

test('Radyo widget kapalıyken de üst çubuk çipi ve paneli çalışır (motor widget\'tan bağımsız)', async () => {
  const ctx = await newContext(browser);
  await ctx.addInitScript(FAKE);
  const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1 }, layout: [{ id: 'controls', w: 1, h: 1, hidden: false }, { id: 'radio', w: 1, h: 1, hidden: true }] });
  await page.waitForSelector('#sbRd');
  assert.equal(await page.locator('.w[data-id=radio]').evaluate((e) => e.getBoundingClientRect().width).catch(() => 0), 0, 'widget ekranda yok');
  await tap(page, '#sbRd');
  await page.waitForSelector('#radioPop:not([hidden])');
  await tap(page, '#radioPop .rp-it[data-k=ht]');
  await page.waitForFunction(() => document.querySelector('#sbRd').dataset.state === 'play');
  assert.equal((await page.textContent('#sbRd .sb-rdn')).trim(), 'Habertürk');
  await ctx.close();
});

/* Dar ekranlarda (hücre 90–125 px) da her şey kutunun içinde kalmalı */
for (const vp of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1536, height: 864 }, { width: 1920, height: 1080 }]) {
  test(`Hava ve Radyo 1×1 ${vp.width}×${vp.height} ekranda taşmaz (çalarken de)`, async () => {
    const ctx = await newContext(browser, { viewport: vp, mocks: [[/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill(json(forecast))]] });
    const { page } = await openPage(ctx, srv.url, { ls: { 'pano.rw.size': 1, 'pano.radio.last': '"odtu"' }, layout: LAYOUT });
    await page.waitForSelector('.w[data-id=weather] .wx-mini');
    const wx = '.w[data-id=weather]', rd = '.w[data-id=radio]';
    const size = await page.$eval(rd, (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    const bad1 = await inside(page, wx, ['.wx-place', '.wx-icon svg', '.wx-temp', '.wx-cond', '.wx-mini']);
    await page.evaluate((rd) => { document.querySelector(rd + ' .rd').classList.add('live'); document.querySelector(rd + ' .rd-st').innerHTML = '<span class="rd-badge"><i></i>CANLI</span><span class="rd-br">64 kbps</span>'; }, rd);
    const bad2 = await inside(page, rd, [...(size[0] > 135 ? ['.rd-disc'] : []), '.rd-nm', '.rd-st', '.rd-badge', '.rd-eq', '.rd-pv', '.rd-pl', '.rd-nx', '.rd-vol', '.rd-vol input']);
    assert.deepEqual([bad1, bad2, size], [[], [], size], `${vp.width}×${vp.height} kutu ${size}`);
    await ctx.close();
  });
}
