import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

test('Kontrol paneli: 5 düğme, üstte 3 altta 2 (3 sütunlu ızgara)', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url);
  await page.waitForTimeout(1500);
  const ys = await page.evaluate(() => [...document.querySelectorAll('.w[data-id=controls] .ctl button')].map((b) => Math.round(b.getBoundingClientRect().y)));
  assert.equal(ys.length, 5);
  const rows = [...new Set(ys)];
  assert.equal(rows.length, 2);
  assert.equal(ys.filter((y) => y === rows[0]).length, 3);
  await ctx.close();
});

test('" tuşu tam ekranı değiştirir; yazı alanında çalışmaz', async () => {
  const ctx = await newContext(browser);
  const { page } = await openPage(ctx, srv.url);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve(); }; });
  await page.keyboard.press('"');
  assert.equal(await page.evaluate(() => window.__fs), 1);
  await page.evaluate(() => { const i = document.createElement('input'); i.id = 'tin'; document.body.append(i); i.focus(); });
  await page.keyboard.type('a"b');
  assert.equal(await page.evaluate(() => window.__fs), 1, 'yazı alanında tam ekran tetiklenmemeli');
  assert.equal(await page.inputValue('#tin'), 'a"b');
  await ctx.close();
});
