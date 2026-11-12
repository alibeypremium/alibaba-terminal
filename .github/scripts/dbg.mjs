import { chromium } from 'playwright';
const urls = ['https://stream3.radyoodtu.com.tr:8000/;', 'https://stream.radyoodtu.com.tr/;', 'https://stream3.radyoodtu.com.tr:8000/', 'https://stream3.radyoodtu.com.tr:8000/;stream.aac'];
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
for (const u of urls) {
  const p = await b.newPage();
  await p.goto('https://alibeypremium.github.io/alibaba-terminal/robots.txt').catch(() => {});
  const r = await p.evaluate(async (u) => {
    const a = new Audio(); a.preload = 'none'; const ev = []; const t0 = performance.now();
    for (const n of ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'suspend', 'error', 'pause', 'ended', 'emptied'])
      a.addEventListener(n, () => ev.push(Math.round(performance.now() - t0) + ':' + n));
    a.src = u; let err = ''; try { await a.play(); } catch (e) { err = String(e); }
    const samples = [];
    for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 4000)); samples.push(a.currentTime.toFixed(1) + '/' + (a.buffered.length ? a.buffered.end(a.buffered.length - 1).toFixed(1) : '-') + '/rs' + a.readyState); }
    const e = a.error ? a.error.code + ' ' + a.error.message : '';
    a.pause(); return { err, e, ev: ev.slice(0, 40), samples };
  }, u);
  console.log('==', u, JSON.stringify(r)); await p.close();
}
await b.close();
