// Telegram kanallarını çeker, tg.json üretir. Kanal / kategori eklemek için aşağıdaki listeyi düzenle.
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

const CATS = [['haber', 'Haber'], ['kripto', 'Kripto'], ['alisveris', 'Alışveriş']];
const DIRECT = ['alisveris'];   // bu kategorilerde tıklama mesajdaki ilk dış bağlantıya gider
const CHANNELS = [
  { k: 'bosuna', u: 'bosuna_tiklamayin_haber', name: 'Boşuna Tıklamayın', cat: 'haber' },
  { k: 'sdk',    u: 'sondakika_haberr0',       name: 'Son Dakika',        cat: 'haber' },
  { k: 'ninja',  u: 'ninjanewstr',             name: 'Ninja News',        cat: 'kripto' },
  { k: 'firsat', u: 'firsattayfa',             name: 'Fırsat Tayfa',      cat: 'alisveris' },
];

export function parse(html, c) {
  const $ = cheerio.load(html);
  const out = [];
  $('.tgme_widget_message[data-post]').each((_, el) => {
    const m = $(el), post = m.attr('data-post') || '';
    if (!/^\w+\/\d+$/.test(post)) return;
    const te = m.find('.tgme_widget_message_text.js-message_text').first();
    let title = '', ext = '';
    if (te.length) {
      te.find('br').replaceWith(' ');
      title = te.text().replace(/\s+/g, ' ').trim();
      te.find('a[href]').each((_, a) => {
        if (ext) return;
        const h = $(a).attr('href') || '';
        let u; try { u = new URL(h); } catch { return; }
        if (!/^https?:$/.test(u.protocol)) return;
        if (/(^|\.)(t\.me|telegram\.(me|org)|telegra\.ph)$/i.test(u.hostname)) return;
        ext = u.href;
      });
    }
    out.push({
      title: (title || 'Medya mesajı').slice(0, 400),
      link: 'https://t.me/' + post,
      ext,
      cat: c.cat,
      date: m.find('.tgme_widget_message_date time').attr('datetime') || '',
      source: c.name,
      ch: c.k,
    });
  });
  return out.slice(-40).reverse();   // en yeni başta
}

async function get(c) {
  const fx = process.env.TG_FIXTURE;
  if (fx) return fs.readFileSync(path.join(fx, c.u + '.html'), 'utf8');
  const r = await fetch('https://t.me/s/' + c.u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; tg-feed)' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

if (process.argv[1] && process.argv[1].endsWith('tg.mjs')) {
  const outFile = process.argv[2] || 'tg.json';
  const ch = [];
  for (const c of CHANNELS) {
    try {
      let items = [];
      for (let i = 0; i < 2 && !items.length; i++) items = parse(await get(c), c);
      if (items.length) ch.push({ k: c.k, items }); else console.error(c.u + ': 0 mesaj');
    } catch (e) { console.error(c.u + ': ' + e.message); }
  }
  if (!ch.length) { console.error('hiçbir kanal alınamadı'); process.exit(1); }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ t: Date.now(), cfg: { cats: CATS, direct: DIRECT, ch: CHANNELS.map(({ k, u, name, cat }) => ({ k, u, name, cat })) }, ch }));
  console.log('tamam:', ch.map(x => x.k + '=' + x.items.length).join(' '));
}
