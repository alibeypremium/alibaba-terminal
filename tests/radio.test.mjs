// Radyo: yayın ortada donarsa oynatıcı kendiliğinden yeniden bağlanır.
// Akış, ffmpeg ile bir kez üretilen MP3'ten gerçek zamanlı hızda sunulur (ffmpeg yoksa test atlanır).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { startServer, launch, newContext, openPage } from './helpers.mjs';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
let srv, browser, stall, conns = 0, mp3;
before(async () => {
  srv = await startServer(); browser = await launch();
  if (!hasFfmpeg) return;
  const f = path.join(os.tmpdir(), 'ali-radio-test.mp3');
  spawnSync('ffmpeg', ['-y', '-loglevel', 'quiet', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=90', '-b:a', '64k', f]);
  mp3 = fs.readFileSync(f);
  stall = http.createServer((q, r) => {
    if (q.method === 'HEAD') { r.writeHead(200, { 'content-type': 'audio/mpeg', 'access-control-allow-origin': '*' }); r.end(); return; }   // Sistem Durumu erişim yoklaması: bağlantı sayılmaz
    const k = ++conns;
    r.writeHead(200, { 'content-type': 'audio/mpeg', 'access-control-allow-origin': '*' });
    let pos = 0;
    const send = (n) => { if (pos < mp3.length) { r.write(mp3.subarray(pos, pos + n)); pos += n; } };
    send(48000);                                         // başlangıç dolgusu
    const t0 = Date.now();
    const iv = setInterval(() => { if (k === 1 && Date.now() - t0 > 8000) return; send(8000); }, 1000);   // 8 KB/sn ≈ 64 kbps; 1. bağlantı 8. sn'den sonra donar (bağlantı açık, veri yok)
    const stop = () => clearInterval(iv);
    q.on('close', stop); r.on('close', stop);
  });
  await new Promise((ok) => stall.listen(0, '127.0.0.1', ok));
});
after(async () => { await browser.close(); await srv.close(); if (stall) { stall.closeAllConnections?.(); stall.close(); } });

test('Radyo ODTÜ: yayın donunca otomatik yeniden bağlanır', { skip: !hasFfmpeg && 'ffmpeg yok', timeout: 90000 }, async () => {
  const target = `http://127.0.0.1:${stall.address().port}/s`;
  const ctx = await newContext(browser, { viewport: { width: 1500, height: 900 }, mocks: [
    [/radyoodtu\.com\.tr/, (r) => r.fulfill({ status: 302, headers: { location: target, 'access-control-allow-origin': '*' } })],
  ] });
  const { page } = await openPage(ctx, srv.url);
  const W = page.locator('.w[data-id=radio]');
  await W.locator('.rd-it[data-k=odtu]').dispatchEvent('click');   // 1×1 görünümde kanal listesi gizli: tıklamayı doğrudan gönder
  const has = (re) => page.waitForFunction((s) => new RegExp(s).test(document.querySelector('.w[data-id=radio] .rd-st')?.innerText || ''), re, { timeout: 40000 });
  await has('CANLI');
  assert.equal(conns, 1);
  await has('Bağlanıyor');                               // donma fark edilir
  await has('CANLI');                                    // yeni bağlantıyla toparlanır
  assert.ok(conns >= 2, 'yeniden bağlanılmadı (bağlantı sayısı ' + conns + ')');
  await ctx.close();
});
