# AliBaba Terminal

🇹🇷 [Türkçe](#türkçe) · 🇬🇧 [English](#english)

**Live / Canlı:** https://alibeypremium.github.io/alibaba-terminal/

---

## Türkçe

iOS "Bugün Görünümü" tarzında, tek sayfalık kişisel bir pano. Cam panelli widget'lar kare hücreli bir ızgarada durur; arkada Three.js ile hareketli 3D duvar kağıdı çalışır. Sürücü, derleme ya da sunucu gerekmez: tüm uygulama `public/index.html` dosyasındadır.

### Özellikler

- Hava durumu, namaz vakitleri, günün ayeti / hadisi / esması
- Döviz, altın ve kripto kurları, TradingView grafiği
- Son Dakika, teknoloji, oyun, otomobil ve ekonomi haberleri (RSS)
- Telegram kanalları (herkese açık `t.me/s/` önizlemesi)
- YouTube, TV izle (M3U), yerel video, radyo
- Yeni çıkacak oyunlar, vizyondaki filmler, notlar
- Retro monitörde Windows 98 simülatörü
- Açık / koyu tema, "Sade" mod (GPU yükünü azaltır), sürükle-bırak ve yeniden boyutlandırılabilir widget'lar

### Yapı

```
public/index.html            Uygulamanın tamamı (HTML + CSS + JS)
.github/workflows/pages.yml  public/ klasörünü GitHub Pages'e yayınlar
.github/workflows/tg.yml     10 dakikada bir Telegram verisini çeker
.github/scripts/tg.mjs       Telegram kanallarını okuyup tg.json üretir
wrangler.jsonc               Cloudflare için isteğe bağlı ayar
```

### Yayınlama

`main` dalına `public/` altında bir değişiklik gönderildiğinde `pages` iş akışı siteyi otomatik yayınlar. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçili olmalıdır.

### Telegram kanalları

Kanal veya kategori eklemek için `.github/scripts/tg.mjs` dosyasındaki `CATS` ve `CHANNELS` listelerini düzenleyin. Veri `veri` dalına `tg.json` olarak yazılır; bu yüzden site yeniden derlenmez. Ulaşılamazsa sayfa canlı çekime geçer.

### Yerelde çalıştırma

```bash
cd public
python3 -m http.server 8000
# http://localhost:8000
```

---

## English

A single-page personal dashboard styled after the iOS "Today View". Glass-panel widgets sit on a square-cell grid over an animated 3D wallpaper rendered with Three.js. No build step or server is needed: the whole app lives in `public/index.html`.

### Features

- Weather, prayer times, daily verse / hadith / divine name
- Currency, gold and crypto rates, TradingView chart
- Breaking, tech, gaming, auto and economy news (RSS)
- Telegram channels (public `t.me/s/` preview)
- YouTube, live TV (M3U), local video, radio
- Upcoming games, movies in theaters, notes
- Windows 98 simulator on a retro CRT monitor
- Light / dark theme, "Lite" mode (lowers GPU load), drag-and-drop and resizable widgets

### Structure

```
public/index.html            The entire app (HTML + CSS + JS)
.github/workflows/pages.yml  Deploys public/ to GitHub Pages
.github/workflows/tg.yml     Fetches Telegram data every 10 minutes
.github/scripts/tg.mjs       Reads Telegram channels and produces tg.json
wrangler.jsonc               Optional Cloudflare config
```

### Deployment

Pushing a change under `public/` to `main` triggers the `pages` workflow, which publishes the site automatically. In the repo settings, **Settings → Pages → Source** must be set to **GitHub Actions**.

### Telegram channels

To add a channel or category, edit the `CATS` and `CHANNELS` lists in `.github/scripts/tg.mjs`. The data is written to the `veri` branch as `tg.json`, so the site is not rebuilt. If it is unreachable, the page falls back to live fetching.

### Run locally

```bash
cd public
python3 -m http.server 8000
# http://localhost:8000
```
