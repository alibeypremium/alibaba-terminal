import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { startServer, launch, newContext, openPage } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const LS0 = {
  'pano.layout.v3': { v: 1 },
  'pano.ps.wish': ['EP1', 'EP2'],
  'pano.key.gemini': 'GIZLI-ANAHTAR',
  'pano.tech.c.tekno': { t: 1, items: [] },
  'pano.rd.c': { a: 1 },
};
const open = async (ctx) => {
  const r = await openPage(ctx, srv.url, { ls: LS0 });
  await r.page.waitForTimeout(800);
  await r.page.dispatchEvent('#bkBtn', 'click');
  await r.page.waitForSelector('.bk-ov .bk');
  return r;
};
const download = async (page, withKeys) => {
  if (withKeys) await page.check('#bkKeys');
  const [d] = await Promise.all([page.waitForEvent('download'), page.dispatchEvent('#bkDl', 'click')]);
  assert.match(d.suggestedFilename(), /^alibaba-terminal-yedek-\d{4}-\d{2}-\d{2}\.json$/);
  return JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
};
const upload = (page, text) => page.setInputFiles('#bkFile', { name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(text) });

test('Yedek: iletişim kutusu açılır; Esc ve Kapat ile kapanır', async () => {
  const ctx = await newContext(browser);
  const { page, errors } = await open(ctx);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.bk-ov'));
  await page.dispatchEvent('#bkBtn', 'click');
  await page.waitForSelector('.bk-ov');
  await page.dispatchEvent('#bkX', 'click');
  await page.waitForFunction(() => !document.querySelector('.bk-ov'));
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Yedek: dosyada istek listesi ve düzen var; API anahtarı ve önbellekler yok', async () => {
  const ctx = await newContext(browser);
  const { page } = await open(ctx);
  const f = await download(page, false);
  assert.equal(f.app, 'alibaba-terminal');
  assert.ok('pano.ps.wish' in f.data && 'pano.layout.v3' in f.data);
  assert.ok(!('pano.key.gemini' in f.data), 'anahtar kutu işaretsizken yedeğe girmemeli');
  assert.ok(!('pano.tech.c.tekno' in f.data) && !('pano.rd.c' in f.data), 'önbellekler yedeğe girmemeli');
  assert.deepEqual(JSON.parse(f.data['pano.ps.wish']), ['EP1', 'EP2']);
  await ctx.close();
});

test('Yedek: kutu işaretlenince API anahtarı da dosyaya yazılır', async () => {
  const ctx = await newContext(browser);
  const { page } = await open(ctx);
  const f = await download(page, true);
  assert.ok('pano.key.gemini' in f.data);
  await ctx.close();
});

test('Yedek: bozuk ya da yabancı dosya reddedilir, uygula düğmesi çıkmaz', async () => {
  const ctx = await newContext(browser);
  const { page } = await open(ctx);
  for (const [txt, re] of [['bu json degil', /geçerli bir yedek değil/], [JSON.stringify({ app: 'baska', data: {} }), /yedeği değil/], [JSON.stringify({ app: 'alibaba-terminal', data: { 'x.kotu': '1', 'pano.ok': 'json-degil', 'pano.tech.c.tekno': '1' } }), /ayar bulunamadı/]]) {
    await upload(page, txt);
    await page.waitForFunction((s) => document.querySelector('#bkMsg').textContent.length > 0 && new RegExp(s).test(document.querySelector('#bkMsg').textContent), re.source);
    assert.equal(await page.isHidden('#bkApply'), true);
  }
  await ctx.close();
});

test('Yedek: geçerli yedek uygulanır; yalnızca güvenli anahtarlar yazılır ve sayfa yenilenir', async () => {
  const ctx = await newContext(browser);
  const { page } = await open(ctx);
  const body = { app: 'alibaba-terminal', v: 1, data: { 'pano.ps.wish': '["EP9"]', 'pano.tema': '"koyu"', 'baska.anahtar': '1', 'pano.tech.c.oyun': '{"t":1}' } };
  await upload(page, JSON.stringify(body));
  await page.waitForSelector('#bkApply:not([hidden])');
  assert.match(await page.textContent('#bkMsg'), /2 ayar bulundu/);
  const nav = page.waitForNavigation({ timeout: 8000 });
  await page.dispatchEvent('#bkApply', 'click');
  await nav;
  const got = await page.evaluate(() => ({ wish: localStorage['pano.ps.wish'], tema: localStorage['pano.tema'], yabanci: localStorage['baska.anahtar'], onbellek: localStorage['pano.tech.c.oyun'] ?? null }));
  assert.equal(got.wish, '["EP9"]');
  assert.equal(got.tema, '"koyu"');
  assert.equal(got.yabanci, undefined);
  assert.notEqual(got.onbellek, '{"t":1}');
  await ctx.close();
});
