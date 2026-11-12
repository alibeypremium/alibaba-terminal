import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, newContext, openPage, openReaderFor, CORS } from './helpers.mjs';

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const MD = `Title: Zelda geliştirme süreci

URL Source: https://www.example-oyun.com/zelda

Markdown Content:
[Ana Sayfa](https://x.com/) [Oyun](https://x.com/oyun) [Haberler](https://x.com/h)

* [Giriş](https://x.com/g)
* [Kayıt](https://x.com/k)

# Zelda geliştirme süreci

![Image 1: zelda](https://img.example.com/zelda.jpg)

Reklam

Nintendo'nun efsanevi oyunu Ocarina of Time'ın geliştirme süreci, yıllar süren bir emeğin ürünü olarak hâlâ konuşuluyor ve oyuncuları şaşırtıyor.

## Geliştirme süreci

Oyunun ilk prototipleri 1995 yılında ortaya çıktı ve ekip, Nintendo 64 donanımının sınırlarını zorlayarak üç boyutlu bir Zelda deneyimi yaratmak için çalıştı.

* Prototip aşaması yaklaşık bir yıl sürdü ve birçok fikir çöpe atıldı.

Paylaş: [Facebook](https://f.com) [Twitter](https://t.com)

## İlgili Haberler

[Başka haber bir](https://x.com/1)
Bu satır ilgili haberlerden sonra gelen uzun bir paragraf olmamalı ve görünmemeli çünkü kesilmeli.
`;
const BOT = 'Title: Just a moment...\n\nMarkdown Content:\nJust a moment...\n\nThis website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.';
const HTML = `<html><head><title>Zelda</title></head><body><nav><p>Menü menü menü menü menü menü menü menü menü menü</p></nav><article><h1>Zelda HTML başlık</h1><p>${'Bu bir deneme paragrafıdır ve yeterince uzun olması gerekiyor. '.repeat(8)}</p><h2>Alt başlık</h2><p>${'İkinci paragraf de yeterince uzun bir metin içeriyor, test için. '.repeat(3)}</p></article></body></html>`;
const text = (body) => ({ contentType: 'text/plain; charset=utf-8', headers: CORS, body });
const htmlRes = (body) => ({ contentType: 'text/html; charset=utf-8', headers: CORS, body });

async function read(mode) {
  const ctx = await newContext(browser, { viewport: { width: 1400, height: 900 }, mocks: [
    [/r\.jina\.ai/, (r) => (mode === 'md' ? r.fulfill(text(MD)) : mode === 'bot' ? r.fulfill(text(BOT)) : r.abort())],
    [/allorigins|corsproxy|codetabs|thingproxy|cors\.lol|yacdn/, (r) => (mode === 'html' || mode === 'bot' ? r.fulfill(htmlRes(HTML)) : r.abort())],
  ] });
  const { page, errors } = await openPage(ctx, srv.url);
  await page.waitForSelector('.w');
  await openReaderFor(page, 'Zelda geliştirme süreci');
  await page.waitForFunction(() => { const c = document.querySelector('.rdr-c'); return c && !c.querySelector('.skel'); }, null, { timeout: 25000 });
  const out = await page.evaluate(() => { const o = document.querySelector('.rdr'); return o ? { txt: o.querySelector('.rdr-c').innerText, h3: [...o.querySelectorAll('h3')].map((x) => x.textContent), n: document.querySelectorAll('.rdr').length } : null; });
  return { ctx, page, out, errors };
}

test('Okuyucu (markdown): makale metni gelir, menü/reklam/ilgili haber çöpü gelmez; Esc kapatır', async () => {
  const { ctx, page, out } = await read('md');
  assert.ok(out, 'okuyucu açılmadı');
  assert.match(out.txt, /Ocarina of Time/);
  assert.match(out.txt, /Prototip aşaması/);
  assert.doesNotMatch(out.txt, /Giriş|Kayıt|Facebook|Başka haber|ilgili haberlerden sonra/);
  assert.doesNotMatch(out.txt, /^Reklam$/m);
  assert.deepEqual(out.h3, ['Geliştirme süreci']);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.querySelectorAll('.rdr').length), 0);
  await ctx.close();
});

test('Okuyucu (HTML yedek): jina yoksa vekilden gelen sayfadan metni çıkarır', async () => {
  const { ctx, out } = await read('html');
  assert.match(out.txt, /deneme paragrafıdır/);
  assert.doesNotMatch(out.txt, /Menü menü/);
  await ctx.close();
});

test('Okuyucu: bot koruma sayfası ("Just a moment") makale sanılmaz, diğer kaynak kazanır', async () => {
  const { ctx, out } = await read('bot');
  assert.doesNotMatch(out.txt, /Just a moment|security service/i);
  assert.match(out.txt, /deneme paragrafıdır/);
  await ctx.close();
});

test('Okuyucu: hiçbir kaynak yanıt vermezse anlaşılır hata ve "Siteye git" bağlantısı', async () => {
  const { ctx, out } = await read('fail');
  assert.match(out.txt, /alınamadı/);
  assert.match(out.txt, /Siteye git/);
  await ctx.close();
});
