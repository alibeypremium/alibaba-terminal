/* Sistem Durumu widget'ının tüm dış kontrollerini sahte yanıtlarla besler. */
import { json } from './helpers.mjs';

const ok = (body = ' ') => (r) => r.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: body || ' ' });
const iso = (minAgo) => new Date(Date.now() - minAgo * 60e3).toISOString();
const run = (minAgo, conclusion = 'success', status = 'completed') => ({ workflow_runs: [{ status, conclusion, updated_at: iso(minAgo), html_url: 'https://github.com/x/y/actions/runs/1' }] });

/** Varsayılan: her şey sağlıklı. `over` ile (anahtar → işlev | null) tek tek bozulabilir; null = ağ hatası. */
export function sysMocks(over = {}) {
  const base = {
    'gh-pages': (r) => r.fulfill(json(run(30))),
    'gh-test': (r) => r.fulfill(json(run(30))),
    'gh-tg': (r) => r.fulfill(json(run(7))),
    'gh-ps': (r) => r.fulfill(json(run(120))),
    'gh-kurul': (r) => r.fulfill(json(run(600))),
    'raw-tg': (r) => r.fulfill(json({ t: Date.now() - 3 * 60e3, ch: [{}, {}, {}] })),
    'raw-ps': (r) => r.fulfill(json({ t: iso(100), deals: [{}, {}] })),
    'raw-kurul': (r) => r.fulfill(json({ t: Date.now() - 5 * 36e5, n: 385, items: [] })),
    rss: (r) => r.fulfill(json({ status: 'ok', items: [{ title: 'x' }] })),
    proxy: ok('{"result":"success","padding":"' + 'x'.repeat(260) + '"}'),
    jina: ok('Example Domain. ' + 'y'.repeat(60)),
    meteo: (r) => r.fulfill(json({ current: { temperature_2m: 12.4 } })),
    aladhan: (r) => r.fulfill(json({ data: { timings: { Fajr: '05:41 (+03)' } } })),
    erapi: (r) => r.fulfill(json({ result: 'success', rates: { TRY: 41.5 } })),
    frank: (r) => r.fulfill(json({ rates: { TRY: 41.4 } })),
    gold: (r) => r.fulfill(json({ price: 3320.5 })),
    binance: (r) => r.fulfill(json({ price: '98000.10' })),
    cheap: (r) => r.fulfill(json([{ title: 'x' }])),
    crypto24: (r) => r.fulfill(json([{ symbol: 'BTCUSDT', lastPrice: '98000', priceChangePercent: '1.2' }, { symbol: 'ETHUSDT', lastPrice: '3300', priceChangePercent: '0.4' }])),
    reach: ok(''),
  };
  const m = { ...base, ...over };
  const h = (key, re) => [re, (r) => (m[key] === null ? r.abort() : m[key](r))];
  return [
    [/^https:\/\/raw\.githubusercontent\.com\/.*\/veri\/durum\.json/, async (r) => {
      if (m.durum === null) return r.abort();
      if (m.durum) return m.durum(r);
      const wf = {};
      for (const f of ['pages', 'test', 'tg', 'ps', 'kurul']) {
        const hnd = m['gh-' + f]; if (hnd === null) continue;
        let body; await hnd({ fulfill: (o) => { body = o.body; }, abort: () => {} });
        if (body) wf[f] = (JSON.parse(body).workflow_runs || []).map((x) => ({ s: x.status, c: x.conclusion, t: x.updated_at }));
      }
      return r.fulfill(json({ t: m.durumT ?? Date.now(), wf }));
    }],
    h('raw-tg', /^https:\/\/raw\.githubusercontent\.com\/.*\/veri\/tg\.json/), h('raw-ps', /^https:\/\/raw\.githubusercontent\.com\/.*\/veri-ps\/ps\.json/), h('raw-kurul', /^https:\/\/raw\.githubusercontent\.com\/.*\/veri-kurul\/kurul-ozet\.json/),
    h('rss', /^https:\/\/api\.rss2json\.com/), h('proxy', /allorigins\.win|corsproxy\.io|codetabs\.com|thingproxy\.freeboard\.io|cors\.lol|yacdn\.org/),
    h('jina', /^https:\/\/r\.jina\.ai\/https:\/\/example\.com/), h('meteo', /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=39\.93&longitude=32\.86&current=temperature_2m$/),
    h('aladhan', /^https:\/\/api\.aladhan\.com\/v1\/timings\?latitude=39\.93/), h('erapi', /^https:\/\/open\.er-api\.com\/v6\/latest\/USD$/), h('frank', /^https:\/\/api\.frankfurter\.dev\/v1\/latest\?base=USD&symbols=TRY$/),
    h('crypto24', /^https:\/\/(?:data-api\.binance\.vision|api\.binance\.com)\/api\/v3\/ticker\/24hr/),
    h('gold', /^https:\/\/api\.gold-api\.com\/price\/XAU$/), h('binance', /^https:\/\/data-api\.binance\.vision\/api\/v3\/ticker\/price\?symbol=BTCUSDT$/), h('cheap', /^https:\/\/www\.cheapshark\.com\/api\/1\.0\/deals\?storeID=1&onSale=1&pageSize=1$/),
    h('reach', /^https:\/\/(?:store\.steampowered\.com\/robots|store\.playstation\.com\/robots|www\.youtube\.com\/robots|www\.twitch\.tv\/robots|kick\.com\/robots|s3\.tradingview\.com\/tv\.js|stream3?\.radyoodtu\.com\.tr|fonts\.googleapis\.com\/css2\?family=Inter$)/),
  ];
}
