// Radyo: yayın ortada donarsa oynatıcı kendiliğinden yeniden bağlanır (gerçek MP3 akışı ffmpeg ile üretilir; yoksa test atlanır).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { startServer, launch, newContext, openPage } from './helpers.mjs';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
let srv, browser, stall, conns = 0;
before(async () => {
  srv = await startServer(); browser = await launch();
  stall = http.createServer((q, r) => {
    const k = ++conns;
    r.writeHead(200, { 'content-type': 'audio/mpeg', 'access-control-allow-origin': '*' });
    const ff = spawn('ffmpeg', ['-loglevel', 'quiet', '-re', '-f', 'lavfi', '-i', 'sine=frequency=440', '-f', 'mp3', '-b:a', '64k', '-'], { stdio: ['ignore', 'pipe', 'ignore'] });
    const t0 = Date.now();
    ff.stdout.on('data', (d) => { if (k === 1 && Date.now() - t0 > 8000) return; r.write(d); });   // 1. bağlantı 8. sn'den sonra donar (veri kesilir, bağlantı açık kalır)
    q.on('close', () => ff.kill());
    r.on('close', () => ff.kill());
  });
  await new Promise((ok) => stall.listen(0, '127.0.0.1', ok));
});
after(async () => { await browser.close(); await srv.close(); stall.closeAllConnections?.(); stall.close(); });

test('Radyo ODTÜ: yayın donunca otomatik yeniden bağlanır', { skip: !hasFfmpeg && 'ffmpeg yok', timeout: 90000 }, async () => {
  const target = `http://127.0.0.1:${stall.address().port}/s`;
  const ctx = await newContext(browser, { viewport: { width: 1500, height: 900 }, mocks: [
    [/radyoodtu\.com\.tr/, (r) => r.fulfill({ status: 302, headers: { location: target, 'access-control-allow-origin': '*' } })],
  ] });
  const { page } = await openPage(ctx, srv.url);
  const W = page.locator('.w[data-id=radio]');
  await W.locator('.rd-it[data-k=odtu]').click();
  const st = () => W.locator('.rd-st').innerText();
  await page.waitForFunction(() => /CANLI/.test(document.querySelector('.w[data-id=radio] .rd-st')?.innerText || ''), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  assert.equal(conns, 1);
  // donma: 'Bağlanıyor…' görünür, sonra yeni bağlantıyla yeniden CANLI
  await page.waitForFunction(() => /Bağlanıyor/.test(document.querySelector('.w[data-id=radio] .rd-st')?.innerText || ''), null, { timeout: 20000 });
  await page.waitForFunction(() => /CANLI/.test(document.querySelector('.w[data-id=radio] .rd-st')?.innerText || ''), null, { timeout: 30000 });
  assert.ok(conns >= 2, 'yeniden bağlanılmadı');
  await ctx.close();
});
