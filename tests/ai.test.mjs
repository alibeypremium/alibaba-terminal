import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, openReaderFor, CORS } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const MD = `Title: Zelda

Markdown Content:
# Zelda

Nintendo'nun efsanevi oyunu Ocarina of Time'ın geliştirme süreci, yıllar süren bir emeğin ürünü olarak hâlâ konuşuluyor ve oyuncuları şaşırtıyor. Oyunun ilk prototipleri 1995 yılında ortaya çıktı ve ekip büyük bir emek verdi.

Oyunun ilk prototipleri 1995 yılında ortaya çıktı ve ekip, Nintendo 64 donanımının sınırlarını zorlayarak üç boyutlu bir Zelda deneyimi yaratmak için çalıştı. Oyun 1998 sonunda raflara çıktı ve büyük övgü topladı.
`;
const ev = (t) => 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] }) + '\r\n\r\n';

async function setup(handler) {
  const calls = [];
  const ctx = await newContext(browser, { viewport: { width: 1400, height: 900 }, mocks: [
    [/r\.jina\.ai/, (r) => r.fulfill({ contentType: 'text/plain; charset=utf-8', headers: CORS, body: MD })],
    [/generativelanguage/, async (r) => {
      const q = r.request();
      if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
      const body = JSON.parse(q.postData());
      calls.push({ url: q.url(), key: q.headers()['x-goog-api-key'], th: body.generationConfig?.thinkingConfig, safety: (body.safetySettings || []).length });
      return handler(r, body, calls.length);
    }],
  ] });
  const { page, errors } = await openPage(ctx, srv.url, { ls: { 'pano.ai.auto': false } });
  await page.waitForSelector('.w');
  const openReader = async () => {
    await openReaderFor(page);
    await page.waitForSelector('.rdr-ai');
  };
  return { ctx, page, errors, calls, openReader };
}
const ok = (r) => r.fulfill({ status: 200, headers: CORS, contentType: 'text/event-stream', body: ev('- Birinci madde.\n- İkinci mad') + ev('de.\n- Üçüncü madde.') });
const lis = (page) => page.locator('.rdr-ai li').allInnerTexts();

test('AI Özet: anahtar yoksa form; geçersiz anahtar silinir; geçerliyle akıtmalı özet gelir', async () => {
  let mode = 'badkey';
  const { ctx, page, calls, openReader } = await setup((r) => (mode === 'badkey'
    ? r.fulfill({ status: 400, headers: CORS, contentType: 'application/json', body: JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.' } }) })
    : ok(r)));
  await openReader();
  await page.click('.rdr-aib');
  await page.waitForSelector('.rdr-aik');                       // anahtar formu
  await page.fill('.rdr-aik input', 'BAD'); await page.click('.rdr-aik button');
  await page.waitForFunction(() => /kabul edilmedi/.test(document.querySelector('.rdr-ai').innerText));
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['pano.key.gemini'])), '', 'geçersiz anahtar silinmeli');
  mode = 'ok';
  await page.fill('.rdr-aik input', 'GOOD'); await page.click('.rdr-aik button');
  await page.waitForSelector('.rdr-ai li');
  await page.waitForFunction(() => document.querySelectorAll('.rdr-ai li').length === 3);
  assert.deepEqual(await lis(page), ['Birinci madde.', 'İkinci madde.', 'Üçüncü madde.']);   // parçalı gelen cevap doğru birleşir
  assert.equal(calls.at(-1).key, 'GOOD');
  assert.equal(calls.at(-1).safety, 4, 'güvenlik ayarları gönderilmeli');
  await ctx.close();
});

test('AI Özet: düşünme ayarı reddedilirse sıradaki ayara düşer; sonuç önbelleklenir', async () => {
  const { ctx, page, calls, openReader } = await setup((r, body) => (body.generationConfig?.thinkingConfig?.thinkingLevel === 'minimal'
    ? r.fulfill({ status: 400, headers: CORS, contentType: 'application/json', body: '{"error":{"message":"Unknown name thinkingLevel in thinking_config"}}' })
    : ok(r)));
  await page.evaluate(() => { localStorage['pano.key.gemini'] = JSON.stringify('K'); });
  await openReader();
  await page.click('.rdr-aib');
  await page.waitForFunction(() => document.querySelectorAll('.rdr-ai li').length === 3);
  assert.deepEqual(calls.map((c) => JSON.stringify(c.th)), ['{"thinkingLevel":"minimal"}', '{"thinkingLevel":"low"}']);
  const n = calls.length;
  await page.keyboard.press('Escape');
  await openReader(); await page.click('.rdr-aib');
  await page.waitForFunction(() => /önbellekten/.test(document.querySelector('.rdr-ai').innerText));
  assert.equal(calls.length, n, 'önbellekten gelen özet yeni istek atmamalı');
  await ctx.close();
});

test('AI Özet: otomatik özet açıkken haber açılınca kendiliğinden başlar; anahtar silinebilir', async () => {
  const { ctx, page, calls, openReader } = await setup((r) => ok(r));
  await page.evaluate(() => { localStorage['pano.key.gemini'] = JSON.stringify('K'); localStorage['pano.ai.auto'] = 'true'; });
  await openReader();                                           // butona basılmıyor
  await page.waitForFunction(() => document.querySelectorAll('.rdr-ai li').length === 3);
  assert.equal(calls.length, 1);
  await page.click('[data-a=aikey]');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage['pano.key.gemini'])), '');
  await ctx.close();
});

test('AI Özet: kota/ağ hataları anlaşılır mesajla gösterilir', async () => {
  const { ctx, page, openReader } = await setup((r) => r.fulfill({ status: 429, headers: CORS, contentType: 'application/json', body: '{"error":{"message":"quota"}}' }));
  await page.evaluate(() => { localStorage['pano.key.gemini'] = JSON.stringify('K'); });
  await openReader(); await page.click('.rdr-aib');
  await page.waitForFunction(() => /limiti doldu/.test(document.querySelector('.rdr-ai').innerText));
  await ctx.close();
});
