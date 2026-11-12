'use strict';
/* AliBaba Terminal · reader.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Haberler ---------- */
/* ---------- Okuma modu: haber başlığına tıklayınca metin, reklamsız ve sade, widget içinde açılır ---------- */
/* Metin r.jina.ai (markdown) ya da genel proxy + basit HTML ayıklayıcıyla alınır; hangisi önce geçerli yanıt verirse o kullanılır. */
const RD_CACHE=new Map();
const rdHost=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch{return''}};
const RD_STOP=/^(ilgili (haber|içerik|yazı|video)|ilginizi çekebilir|çok okunan|çok izlenen|çok paylaşılan|en çok (okunan|izlenen|paylaşılan)|diğer haberler|benzer|yorumlar|yorum yap|yorum|etiketler|bunlar da ilginizi|önerilen|sizin için|haberi paylaş|abone ol|bülten|tüm hakları|©|copyright|gizlilik|kvkk|reklam verin|künye|bizi takip edin|sosyal medya)/i;
const RD_JUNK=/^(reklam$|reklam\b|advertisement|sponsorlu|paylaş|whatsapp|facebook|twitter|e-?posta|kopyala|google news|mozilla\/|günlük gelişmeleri|haberde hata|bize bildirin|30 saniyede|özeti (gizle|göster)|okunma|\d+ (sn|dk|sa|saat|gün) önce|fotoğraf\b|foto[ğg]raf\s*[:·/]|foto\s*[:·/]|kaynak\s*:|editör|okuma süresi|güncelleme\s*:|lütfen daha sonra|videonuz yüklenirken|yazdır|küçült|büyült|yazı boyutu|devamını oku|haberin devamı|haberi dinle|reklamı geç|reklamlar|galeri\b|sevdim|güldüm|heyecan\d|yazar:|haber merkezi$|sıradaki haber|final url|a 1x1 image|kategorisinde en çok|kaydet$|podcast formatında|dinle\s*-+:)/i;
const RD_META=/okuma süresi|mozilla\/5\.0|çerez|cookie|^\d{1,2} [a-zçğıöşü]+ 20\d\d\b|\bdk okuma\b|©|tüm hakları|sevdim|güldüm|sponsor|brought to you by|insights|kontrol et$|devam ediyor!?$|erişimi var mı|okur tepkisi|e-?posta ile|arkadaşınıza|ne uyandırdı|bu içerik sende/i;
const RD_FOOT=/©|™|®|tüm hakları|all rights reserved|warnermedia|holding a\.ş/i;
const RD_ANY_STOP=/(en çok|çok) (okunan|izlenen|paylaşılan|yorumlanan)|ilginizi çekebilir|benzer (haber|içerik)|önerilen (haber|içerik)|diğer haberler|ilgili haberler|bunları da (oku|izle)|sıradaki haber/;
const RD_COOKIE=/tanımlama bilgi|çerez|cookie|ziyaret ettiğinizde|tercihlerinizi|aydınlatma metni|gizlilik politikası|kişisel verilerinizi/i;
const RD_DATE=/\b20\d\d\b.*\b\d{1,2}[:.]\d{2}\b/;
const RD_BOT=/just a moment|verif(y|ies) (that )?you are not a bot|checking your browser|attention required|enable javascript and cookies|security service to protect|güvenlik doğrulaması|bir dakika lütfen/i;
const rdBot=a=>!!a&&(RD_BOT.test(a.title||'')||(a.blocks||[]).slice(0,3).some(b=>b.k!=='img'&&RD_BOT.test(b.v)));
function rdPick(items,title){
  const t40=title.slice(0,40).toLocaleLowerCase('tr');
  const glue=x=>{const n=(x.plain.match(/[a-zçğıöşü][A-ZÇĞİÖŞÜ]/g)||[]).length;return n>=3&&n/x.plain.length>.02};   /* boşluksuz yapışık menü yazısı */
  const bad=x=>x.menu||x.plain.startsWith('|')||RD_JUNK.test(x.low)||(x.plain.length<900&&glue(x))||(x.plain.length<400&&RD_FOOT.test(x.plain))||(x.plain.length<1200&&RD_COOKIE.test(x.low))||(x.plain.length<160&&RD_META.test(x.low))||(x.plain.length<100&&RD_DATE.test(x.plain))||(t40.length>20&&x.low.startsWith(t40));
  const stop=x=>x.plain.length<90&&(RD_STOP.test(x.low)||RD_ANY_STOP.test(x.low));
  const prose=x=>x.k==='p'&&!bad(x)&&x.plain.length>=80;
  const idx=[];items.forEach((x,i)=>{if(prose(x))idx.push(i)});
  let s=0,e=items.length-1;
  if(idx.length){
    const groups=[];let g=[idx[0]];
    for(let j=1;j<idx.length;j++){if(idx[j]-idx[j-1]<=8)g.push(idx[j]);else{groups.push(g);g=[idx[j]]}}
    groups.push(g);
    const best=groups.map(g=>[g.reduce((n,i)=>n+items[i].plain.length,0),g]).sort((a,b)=>b[0]-a[0])[0][1];
    s=best[0];e=best[best.length-1];
    for(let j=s-1;j>=0&&s-j<=4;j--){const x=items[j];if(x.menu||x.k==='img'||bad(x)||stop(x))break;if(x.k==='h'||x.plain.length>=25)s=j}
    for(let j=e+1;j<items.length&&j<=e+6;j++){const x=items[j];if(stop(x))break;if(x.menu||x.k==='img'||bad(x)||x.k==='h'||x.lr>.2)continue;if(x.plain.length>=(x.k==='li'?6:25))e=j}
  }
  const blocks=[],seen=new Set();let text=0,imgs=0;
  for(let j=Math.max(0,s-30);j<=e;j++){
    const x=items[j];
    if(x.k==='img'){if(imgs<3&&!bad(x))blocks.push({k:'img',v:x.v}),imgs++;continue}
    if(j<s)continue;
    if(stop(x)&&text>150)break;
    if(bad(x))continue;
    if(x.k==='h'){if(x.plain!==title&&x.plain.length<120)blocks.push({k:'h',v:x.plain});continue}
    if(x.plain.length>=(x.k==='li'?6:25)&&!seen.has(x.plain)){seen.add(x.plain);blocks.push({k:x.k,v:x.plain});text+=x.plain.length}
  }
  while(blocks.length&&blocks[blocks.length-1].k==='h')blocks.pop();
  while(blocks.length&&blocks[0].k==='h')blocks.shift();
  return{blocks,text};
}
function rdFromMd(md){
  const L=String(md).replace(/\r/g,'').split('\n');let title='',started=false;const items=[];
  if(/^Warning:.*returned error [45]\d\d/m.test(md)||/^\s*\{\s*"data"\s*:\s*null/.test(md)||/"code"\s*:\s*4\d\d/.test(String(md).slice(0,300)))return{title:'',blocks:[],text:0};   /* hata gövdesi (ör. hız sınırı) */
  for(const l of L){
    if(!started){
      const m=l.match(/^Title:\s*(.+)/);if(m){title=m[1].trim();continue}
      if(/^(URL Source|Published Time|Warning|Markdown Content):/.test(l)){if(/^Markdown Content:/.test(l))started=true;continue}
    }
    const t=l.trim();if(!t)continue;
    const im=t.match(/^!\[[^\]]*\]\((https?:[^)\s]+)[^)]*\)$/);
    if(im){if(!/logo|icon|avatar|sprite|pixel|1x1|\.svg|\.gif|banner/i.test(im[1]))items.push({k:'img',v:im[1],plain:'',low:''});continue}
    const isH=/^#{1,4}\s/.test(t),isLi=/^([*+-]|\d+\.)\s/.test(t);
    const t2=t.replace(/!\[[^\]]*\]\([^)]*\)/g,'');
    const lt=[...t2.matchAll(/\[([^\]]*)\]\([^)]*\)/g)].reduce((n,x)=>n+x[1].trim().length,0);
    const plain=t.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\*\*|__|`/g,'').trim().replace(/^#{1,6}\s*/,'').replace(/^\s*(?:[*+-]|\d+\.)\s+/,'').replace(/^\s*>\s?/,'').trim();
    if(!plain)continue;
    items.push({k:isH?'h':isLi?'li':'p',plain,low:plain.toLocaleLowerCase('tr'),menu:lt/plain.length>.5,lr:lt/plain.length});
  }
  const r=rdPick(items,title);return{title,blocks:r.blocks,text:r.text};
}
function rdFromHtml(html){
  const d=new DOMParser().parseFromString(html,'text/html');
  const title=(d.querySelector('meta[property="og:title"]')?.content||d.querySelector('h1')?.textContent||d.title||'').trim();
  const lead=d.querySelector('meta[property="og:image"]')?.content||'';
  d.querySelectorAll('script,style,noscript,nav,header nav,aside,footer,form,[role="navigation"],[class*="menu" i],[class*="navbar" i],[id*="menu" i],[class*="breadcrumb" i],iframe,svg,button,[class*="reklam" i],[class*="advert" i],[id*="reklam" i],[class*="banner" i],[class*="related" i],[class*="comment" i],[class*="cookie" i],[class*="consent" i]').forEach(n=>n.remove());
  const score=el=>[...el.querySelectorAll('p')].reduce((n,p)=>{const L=p.textContent.trim().length;return n+(L>40?L:0)},0);
  const box=[...d.querySelectorAll('article,[itemprop=articleBody],main,.content,.article,body')].map(el=>[score(el),el]).sort((a,b)=>b[0]-a[0])[0]?.[1];
  const items=[];let last='';
  if(box)for(const el of box.querySelectorAll('p,h2,h3,li')){
    const plain=el.textContent.replace(/\s+/g,' ').trim();if(!plain||plain===last)continue;last=plain;
    const lk=[...el.querySelectorAll('a')].reduce((n,x)=>n+x.textContent.trim().length,0);
    const n=el.tagName;items.push({k:n==='LI'?'li':n==='P'?'p':'h',plain,low:plain.toLocaleLowerCase('tr'),menu:lk/plain.length>.5,lr:lk/plain.length});
  }
  const r=rdPick(items,title);
  if(/^https?:/i.test(lead))r.blocks.unshift({k:'img',v:lead});
  return{title,blocks:r.blocks,text:r.text};
}
const RD_OG=new Map();
function rdOg(url){   /* makale görseli yoksa sayfanın og:image'i (ham HTML'den) */
  if(RD_OG.has(url))return RD_OG.get(url);
  const p=Promise.race([viaProxy(url),new Promise((_,j)=>setTimeout(j,9000))]).then(t=>{
    const m=String(t).match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i);
    const c=m&&m[0].match(/content=["']([^"']+)/i);const u=c&&safeUrl(c[1].replace(/&amp;/g,'&'));
    return u&&!/logo|icon|sprite|1x1|\.svg/i.test(u)?u:''}).catch(()=>'');
  RD_OG.set(url,p);return p;
}
const RD_INF=new Map(),RD_KEY='pano.rd.c',RD_TTL=12*3600e3;
function rdStore(url,art){
  try{const c=LS.get(RD_KEY,{});c[url]={t:Date.now(),a:art};
    const ks=Object.keys(c).sort((x,y)=>c[y].t-c[x].t);ks.slice(10).forEach(k=>delete c[k]);
    ks.forEach(k=>{if(Date.now()-c[k].t>RD_TTL)delete c[k]});LS.set(RD_KEY,c)}catch{}
}
function rdCached(url){
  if(RD_CACHE.has(url))return RD_CACHE.get(url);
  const e=LS.get(RD_KEY,{})[url];
  if(e&&Date.now()-e.t<RD_TTL&&!rdBot(e.a)){RD_CACHE.set(url,e.a);return e.a}
  return null;
}
function rdFetch(url){
  const hit=rdCached(url);if(hit)return Promise.resolve(hit);
  if(RD_INF.has(url))return RD_INF.get(url);
  const ok=a=>{if(!a||rdBot(a)||(a.text<120&&a.blocks.length<4))throw new Error('kısa');return a};
  const jina=async()=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),16000);
    try{const go=()=>fetch('https://r.jina.ai/'+url,{signal:c.signal,headers:{'X-Return-Format':'markdown'}});
      let r=await go();if(r.status===429){await new Promise(x=>setTimeout(x,1600));r=await go()}   /* r.jina.ai IP başına hız sınırı: bir kez daha dene */
      if(!r.ok)throw new Error(r.status);return rdFromMd(await r.text())}finally{clearTimeout(t)}};
  const raw=async()=>rdFromHtml(await viaProxy(url));
  const p=Promise.any([jina().then(ok),raw().then(ok)]).then(art=>{
    RD_CACHE.set(url,art);if(RD_CACHE.size>30)RD_CACHE.delete(RD_CACHE.keys().next().value);rdStore(url,art);return art;
  }).finally(()=>RD_INF.delete(url));
  RD_INF.set(url,p);return p;
}
/* Ön yükleme: üstüne gelinen/dokunulan haberin metni önceden çekilir; listedeki ilk haberler boşta sırayla ısıtılır (Sade modda ve veri tasarrufunda yapılmaz). */
const rdWarmOK=()=>document.documentElement.dataset.lite!=='1'&&!navigator.connection?.saveData&&!document.hidden;
let rdHov=0;
document.addEventListener('mouseover',e=>{
  const a=e.target.closest&&e.target.closest('a.nw-i[data-rd="1"],a.tk-i[data-rd="1"]');if(!a)return;
  clearTimeout(rdHov);rdHov=setTimeout(()=>{const u=rdUrl(a);if(u&&!rdCached(u))rdFetch(u).catch(()=>{})},60);
},{passive:true});
document.addEventListener('touchstart',e=>{
  const a=e.target.closest&&e.target.closest('a.nw-i[data-rd="1"],a.tk-i[data-rd="1"]');if(!a)return;
  const u=rdUrl(a);if(u&&!rdCached(u))rdFetch(u).catch(()=>{});
},{passive:true});
const rdTimers=new WeakMap(),rdQ=[];let rdQrun=false;
/* Tüm listelerin ısıtma istekleri tek sıradan, aralıklı gider (r.jina.ai ücretsiz katmanı IP başına dakikada ~20 istek sınırlar). */
async function rdQRun(){
  if(rdQrun)return;rdQrun=true;
  while(rdQ.length){
    if(!rdWarmOK()){rdQ.length=0;break}
    const u=rdQ.shift();if(rdCached(u))continue;
    try{await rdFetch(u)}catch{}
    await new Promise(r=>setTimeout(r,3000));
  }
  rdQrun=false;
}
function rdWarm(list){
  clearTimeout(rdTimers.get(list));
  rdTimers.set(list,setTimeout(()=>{
    if(!rdWarmOK()||!list.isConnected||list.offsetParent===null)return;
    for(const a of [...list.querySelectorAll('a.nw-i[data-rd="1"]')].slice(0,3)){const u=rdUrl(a);if(u&&!rdCached(u)&&!rdQ.includes(u))rdQ.push(u)}
    rdQRun();
  },4000));
}
const rdUrl=a=>safeUrl(a.dataset.rdUrl||a.getAttribute('href'));
