'use strict';
/* AliBaba Terminal · covers.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Yeni çıkacak oyunlar / film ve etkinlikler ---------- */
const KEYS={
 rawg:{name:'RAWG',url:'https://rawg.io/apidocs',why:'Tarihli oyun listesi için ücretsiz anahtar (ayda 20.000 istek). Sitede hesap açıp "Get API Key" ile alırsın.'},
 tmdb:{name:'TMDB',url:'https://www.themoviedb.org/settings/api',why:'Vizyona girecek filmler için ücretsiz anahtar. Hesap açıp e-postanı doğrula, API sayfasından kişisel kullanım için başvur. Kısa "API Anahtarı" ya da uzun "Erişim Belirteci" olur.'},
};
const getKey=k=>{const v=LS.get('pano.key.'+k,'');return typeof v==='string'?v:''};
const isoD=d=>d.toISOString().slice(0,10);
const addDays=n=>new Date(Date.now()+n*864e5);
function fmtD(d){
  const x=new Date(d+'T12:00');if(isNaN(x))return'';
  const same=x.getFullYear()===new Date().getFullYear();
  return x.toLocaleDateString('tr-TR',same?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'2-digit'});
}
async function gamesRAWG(key){
  const j=await getJSON('https://api.rawg.io/api/games?key='+encodeURIComponent(key)+'&dates='+isoD(new Date())+','+isoD(addDays(365))+'&ordering=-added&page_size=30',12000);
  const items=(j.results||[]).filter(g=>g.background_image&&g.released&&g.released>=isoD(new Date())).sort((a,b)=>a.released<b.released?-1:a.released>b.released?1:0)
    .map(g=>({title:g.name,img:g.background_image.replace('/media/','/media/crop/600/400/'),date:g.released,sub:(g.platforms||[]).slice(0,3).map(p=>p.platform.name).join(' · '),url:'https://rawg.io/games/'+g.slug}));
  return{items,land:true,foot:'Veriler RAWG\'dan · önümüzdeki 12 ay, en çok beklenenler'};
}
/* Steam mağaza vitrini: tek istek, dört liste (yakında · yeni çıkanlar · çok satanlar · indirimler). 10 dk bellekte tutulur, sekmeler aynı isteği paylaşır. */
let _steamF=null;
function steamFeat(){
  if(_steamF&&Date.now()-_steamF.t<10*60e3)return _steamF.p;
  const u='https://store.steampowered.com/api/featuredcategories?cc=tr&l=turkish';
  /* Steam CORS izni vermez; dosyadan (file://) açıldığında istek "null" kaynaklı olur ve bazı vekiller reddeder.
     Bu yüzden doğrudan istek ve tüm vekiller aynı anda denenir; yalnızca geçerli Steam JSON'u dönen kazanır. */
  const asJSON=t=>{const j=JSON.parse(String(t).slice(String(t).indexOf('{'),String(t).lastIndexOf('}')+1));if(!j||typeof j!=='object'||!Object.values(j).some(v=>v&&Array.isArray(v.items)))throw new Error('steam');return j};
  const p=Promise.any([
    getText(u,9000),
    ...PROXIES.map(x=>getText(x(u),12000)),
    getText('https://r.jina.ai/'+u,15000)
  ].map(pr=>pr.then(asJSON))).then(j=>{
    /* Son başarılı vitrini tarayıcıda sakla: ağ/vekil çökerse eski liste gösterilir. */
    try{const keep={};for(const k of Object.keys(STEAM_SEC)){const it=(j[k]&&j[k].items)||[];keep[k]={items:it.slice(0,40).map(g=>({id:g.id,name:g.name,discounted:g.discounted,discount_percent:g.discount_percent,final_price:g.final_price,currency:g.currency,large_capsule_image:g.large_capsule_image,header_image:g.header_image,release_date:g.release_date}))}}
      LS.set('pano.steam.f',{t:Date.now(),j:keep})}catch(e){}
    return j;
  }).catch(e=>{
    console.warn('Steam listesi alınamadı',e&&e.errors);
    const c=LS.get('pano.steam.f',null);
    if(c&&c.j&&Date.now()-c.t<14*864e5)return Object.assign({},c.j,{_stale:c.t});
    const err=new Error('steam-ag');err.detail=((e&&e.errors)||[e]).map(x=>x&&x.message).filter(Boolean).slice(0,3).join(' · ');throw err;
  });
  _steamF={t:Date.now(),p};
  p.catch(()=>{if(_steamF&&_steamF.p===p)_steamF=null});
  return p;
}
const trPrice=(c,cur)=>{if(!(c>0))return'Ücretsiz';try{return(c/100).toLocaleString('tr-TR',{style:'currency',currency:cur||'TRY'})}catch(e){return''}};
const STEAM_SEC={
  coming_soon:{sub:()=>'Steam · Yakında',foot:'Steam "yakında" listesi · tarihli liste için RAWG anahtarı ekle'},
  new_releases:{sub:g=>'Steam · '+trPrice(g.final_price,g.currency),foot:'Steam · yeni çıkan oyunlar'},
  top_sellers:{sub:g=>'Steam · '+trPrice(g.final_price,g.currency),foot:'Steam · en çok satanlar'},
  specials:{sub:g=>'Steam · '+trPrice(g.final_price,g.currency),foot:'Steam · öne çıkan indirimler'}
};
async function gamesSteam(sec='coming_soon'){
  const j=await steamFeat(),S=STEAM_SEC[sec],list=(j[sec]&&j[sec].items)||[];
  const seen=new Set();
  const items=list.filter(g=>(g.large_capsule_image||g.header_image)&&!seen.has(g.id)&&seen.add(g.id)).map(g=>({title:g.name,img:'https://cdn.akamai.steamstatic.com/steam/apps/'+g.id+'/library_600x900.jpg',img2:g.large_capsule_image||g.header_image,
    date:sec==='coming_soon'&&typeof g.release_date==='number'&&g.release_date>0?isoD(new Date(g.release_date*1000)):'',
    badge:g.discounted&&g.discount_percent>0?'-%'+g.discount_percent:'',sub:S.sub(g),url:'https://store.steampowered.com/app/'+g.id}));
  if(!items.length)throw new Error('steam-bos');
  return{items,land:false,foot:S.foot,note:j._stale?'Çevrimdışı kopya ('+ago(new Date(j._stale).toISOString())+')':''};
}
/* İndirimler: CheapShark (anahtarsız, Steam puanı + Metacritic verir) ile Steam vitrinindeki indirim listesi aynı anda denenir; hangisi önce gelirse o gösterilir. */
/* PlayStation Store TR: GitHub Action (ps.yml, 6 saatte bir) iki dosya üretir: ps.json (indirim + yakında) ve ps-all.json (tüm PS5/PS4 kataloğu; arama + istek listesi). */
const PS_BASE='https://raw.githubusercontent.com/alibeypremium/alibaba-terminal/veri-ps/',PS_IMG='https://image.api.playstation.com/';
const psMemo={};
const psFile=(f,ttl)=>{const m=psMemo[f];if(m&&Date.now()-m.t<ttl)return m.p;
  const p=getText(PS_BASE+f+'?t='+Math.floor(Date.now()/6e5),f==='ps-all.json'?30000:12000).then(t=>JSON.parse(t));
  psMemo[f]={t:Date.now(),p};p.catch(()=>{if(psMemo[f]&&psMemo[f].p===p)delete psMemo[f]});return p};
const psTL=n=>Number(n).toLocaleString('tr-TR')+' TL';
const psPct=r=>r.base>0&&r.now<r.base?Math.round((1-r.now/r.base)*100):0;
const psImg=im=>im?PS_IMG+im+'?w=360':'';
const psAgo=t=>{const m=Math.max(0,Math.round((Date.now()-Date.parse(t))/6e4));return m<90?m+' dk önce':Math.round(m/60)+' sa önce'};
/* İndirim bitişleri tek satırda: aynı gün ise "31 Ara", değilse "17 Kas – 31 Ara" (gelecekteki en yakın ve en uzak bitiş; İstanbul saati). */
const psEndText=rows=>{const now=Date.now(),es=rows.map(r=>r&&+r.e).filter(e=>e>now);if(!es.length)return'';
  const f=e=>new Date(e).toLocaleDateString('tr-TR',{day:'numeric',month:'short',timeZone:'Europe/Istanbul'}),a=f(Math.min(...es)),b=f(Math.max(...es));
  return'İndirim bitişi: '+(a===b?a:a+' – '+b)};
/* Katalog satırı → kart. r: {id,n,now,base,im,pl,pre} */
const psAged=since=>!!since&&Date.now()-Date.parse(since)>=7*864e5;   /* geçmiş en az 7 gündür tutuluyorsa "en düşük" rozeti güvenilir sayılır */
const psItem=(r,aged)=>{const pc=psPct(r);return{low:!!aged&&pc>0&&(r.lo===1||(r.lo>1&&r.now<=r.lo)),id:r.id,title:r.n,img:psImg(r.im),url:'https://store.playstation.com/tr-tr/product/'+encodeURIComponent(r.id),
  date:r.d||'',badge:pc?'-%'+pc:(r.pre&&!r.d?'Ön sipariş':''),sub:!r.base?'Fiyat yok':pc?psTL(r.now)+' · eski '+psTL(r.base):psTL(r.now)+(r.pre?' · ön sipariş':''),pc}};
const psTr=t=>String(t).toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
async function psCatalog(){const j=await psFile('ps-all.json',6*3600e3);
  if(!j._m){j._m=new Map();(j.g||[]).forEach(a=>j._m.set(a[0],{id:a[0],n:a[1],now:a[2],base:a[3],im:a[4],pl:a[5],lo:a[6],k:psTr(a[1])}))}return j}
const psWish={get:()=>{const a=LS.get('pano.ps.wish',[]);return Array.isArray(a)?a.filter(x=>x&&x.id):[]},set:a=>LS.set('pano.ps.wish',a)};
async function gamesPS(tab){
  if(tab==='wish'){
    const w=psWish.get();let cat=null;try{cat=await psCatalog()}catch(e){}
    const items=w.map(x=>{const r=cat&&cat._m.get(x.id);return r?psItem(r,psAged(cat.since)):{id:x.id,title:x.n,img:x.i?psImg(x.i):'',url:'https://store.playstation.com/tr-tr/product/'+encodeURIComponent(x.id),badge:'',sub:'',pc:0}})
      .map((x,i)=>({x,i})).sort((a,b)=>(b.x.pc>0)-(a.x.pc>0)||b.x.pc-a.x.pc||a.i-b.i).map(o=>o.x);
    const n=items.filter(x=>x.pc>0).length;
    return{items,land:false,foot:items.length?('İstek listem · '+items.length+' oyun'+(n?' · '+n+' tanesi indirimde':'')):'İstek listem'};
  }
  const j=await psFile('ps.json',10*60e3);
  const rows=(tab==='soon'?j.soon:j.deals)||[];
  const aged=psAged(j.since),items=rows.filter(r=>r&&r.n&&r.id).map(r=>psItem(r,aged));
  if(!items.length)throw new Error('ps-bos');
  return{items,land:false,foot:'PS Store TR · '+(tab==='soon'?'yakında çıkacaklar':(psEndText(rows)||'çok satan indirimler'))+' · '+psAgo(j.t)};
}
async function psSearch(q){
  const cat=await psCatalog(),k=psTr(q),ws=k.split(' ').filter(Boolean);
  if(!ws.length)return{items:[],land:false,foot:''};
  const hits=[];for(const r of cat._m.values()){let ok=true;for(const x of ws)if(!r.k.includes(x)){ok=false;break}
    if(ok)hits.push({r,sc:(r.k.startsWith(k)?3:r.k.includes(' '+k)?2:1)*10+(psPct(r)>0?1:0)})}
  hits.sort((a,b)=>b.sc-a.sc||a.r.n.length-b.r.n.length);
  const aged=psAged(cat.since),items=hits.slice(0,60).map(h=>psItem(h.r,aged));
  return{items,land:false,foot:hits.length?('"'+q.trim()+'" · '+hits.length+' sonuç'+(hits.length>60?' (ilk 60)':'')+' · katalog '+psAgo(cat.t)):'"'+q.trim()+'" için sonuç yok',empty:'Sonuç bulunamadı.'};
}
async function gamesDeals(){
  const u='https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&sortBy=Deal%20Rating&steamRating=75&pageSize=40';
  const asJ=t=>{const j=JSON.parse(String(t).slice(String(t).indexOf('['),String(t).lastIndexOf(']')+1));if(!Array.isArray(j)||!j.length)throw new Error('cheapshark');return j};
  const cs=Promise.any([getText(u,9000),...PROXIES.map(p=>getText(p(u),12000))].map(pr=>pr.then(asJ))).then(j=>{
    const seen=new Set();
    const items=j.filter(d=>d.steamAppID&&d.title&&!seen.has(d.steamAppID)&&seen.add(d.steamAppID)).slice(0,36).map(d=>({
      title:d.title,img:'https://cdn.akamai.steamstatic.com/steam/apps/'+d.steamAppID+'/library_600x900.jpg',img2:'https://cdn.akamai.steamstatic.com/steam/apps/'+d.steamAppID+'/header.jpg',
      badge:'-%'+Math.round(+d.savings||0),
      sub:'$'+d.salePrice+(+d.metacriticScore>0?' · MC '+d.metacriticScore:'')+(+d.steamRatingPercent>0?' · %'+d.steamRatingPercent+' olumlu':''),
      url:'https://www.cheapshark.com/redirect?dealID='+encodeURIComponent(d.dealID)}));
    if(!items.length)throw new Error('cheapshark-bos');
    return{items,land:false,foot:'CheapShark · Steam indirimleri, fırsat puanına göre (fiyatlar USD)'};
  });
  /* CheapShark tercih edilir (puan + fırsat sırası); 3,5 sn içinde gelmezse ya da hata verirse Steam indirim listesi devreye girer. */
  return Promise.any([cs,new Promise(r=>setTimeout(r,3500)).then(()=>gamesSteam('specials'))]);
}
/* GOG "yakında" kataloğu: anahtarsız, dikey kapak verir. Steam ile aynı anda denenir, hangisi önce cevap verirse o gösterilir. */
async function gamesGOG(){
  const u='https://catalog.gog.com/v1/catalog?limit=48&order=asc:releaseDate&productType=in:game,pack&releaseStatus=in:upcoming&countryCode=TR&locale=tr-TR&currencyCode=TRY';
  const asJ=t=>{const j=JSON.parse(String(t).slice(String(t).indexOf('{'),String(t).lastIndexOf('}')+1));if(!j||!Array.isArray(j.products)||!j.products.length)throw new Error('gog');return j};
  const j=await Promise.any([getText(u,9000),...PROXIES.map(p=>getText(p(u),12000)),getText('https://r.jina.ai/'+u,15000)].map(pr=>pr.then(asJ)));
  const dt=x=>(String(x.releaseDate||'').replace(/\./g,'-').match(/^\d{4}-\d{2}-\d{2}/)||[''])[0];
  const items=j.products.filter(x=>x.title&&(x.coverVertical||x.coverHorizontal)).map(x=>({title:x.title,img:x.coverVertical||x.coverHorizontal,date:dt(x),sub:'GOG · Yakında',url:x.storeLink||('https://www.gog.com/game/'+x.slug)}))
    .sort((x,y)=>(x.date?0:1)-(y.date?0:1)||(x.date<y.date?-1:x.date>y.date?1:0));
  return{items,land:false,foot:'GOG "yakında" listesi · tarihli liste için RAWG anahtarı ekle'};
}
async function filmsTMDB(key){
  const long=key.length>60,hdr={headers:{Authorization:'Bearer '+key,accept:'application/json'}};
  const mk=p=>'https://api.themoviedb.org/3/discover/movie?language=tr-TR&region=TR&sort_by=popularity.desc&include_adult=false&with_release_type='+encodeURIComponent('2|3')+'&release_date.gte='+isoD(new Date())+'&release_date.lte='+isoD(addDays(150))+'&page='+p+(long?'':'&api_key='+encodeURIComponent(key));
  const pages=await Promise.all([1,2].map(p=>getJSON(mk(p),12000,long?hdr:undefined)));
  const seen=new Set();
  const items=pages.flatMap(j=>j.results||[]).filter(m=>m.poster_path&&m.release_date&&!seen.has(m.id)&&seen.add(m.id))
    .sort((a,b)=>a.release_date<b.release_date?-1:a.release_date>b.release_date?1:0).slice(0,36)
    .map(m=>({title:m.title,img:'https://image.tmdb.org/t/p/w342'+m.poster_path,date:m.release_date,sub:m.original_title&&m.original_title!==m.title?m.original_title:'',url:'https://www.themoviedb.org/movie/'+m.id}));
  return{items,land:false,foot:'Bu ürün TMDB API\'sini kullanır, TMDB tarafından onaylanmamıştır · önümüzdeki 5 ay'};
}
function mountCovers(w,root,cfg){
  let tab=cfg.tabs?LS.get('pano.cv.'+cfg.id,cfg.tabs[0][0]):'';
  if(cfg.tabs&&!cfg.tabs.find(t=>t[0]===tab))tab=cfg.tabs[0][0];
  let showKey=false,seq=0,sq='',srTimer=0;const cache={};
  let items=[],land=false,page=0,pages=1,lastWheel=0;
  const tabsHtml=()=>cfg.tabs?'<div class="dv-tabs" role="tablist">'+cfg.tabs.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>':'';
  root.innerHTML='<div class="nw cvw"><div class="hd">'+logo(cfg.id)+'<span class="ttl">'+cfg.title+'</span><span class="sp"></span><span id="cvt" style="display:contents">'+tabsHtml()+'</span>'+(cfg.search?'<button class="ibtn" type="button" data-a="sr" title="Ara" aria-label="Ara">'+I.search+'</button>':'')+'<button class="ibtn" type="button" data-a="key" title="API anahtarı" aria-label="API anahtarı">'+I.key+'</button><button class="ibtn" type="button" data-a="ref" aria-label="Yenile">'+I.refresh+'</button></div>'+(cfg.search?'<form class="yt-in cv-sf" id="cvs" hidden><input type="search" autocomplete="off" spellcheck="false" placeholder="Oyun ara…" aria-label="Oyun ara"><button class="yt-go" type="button" data-a="sx" aria-label="Aramayı kapat">✕</button></form>':'')+'<div class="cvb" id="cvb"></div><div class="foot cvf"><span class="cvf-t" id="cvf"></span><span class="pg" id="cvpg" hidden></span></div></div>';
  const body=$('#cvb',root),foot=$('#cvf',root),pgEl=$('#cvpg',root);
  body.addEventListener('error',e=>{
    if(e.target.tagName!=='IMG')return;
    const f=e.target.dataset.fb;
    if(f&&!e.target.dataset.tried){e.target.dataset.tried=1;e.target.src=f}   /* dikey afiş yoksa yatay kapsüle düş */
    else e.target.style.visibility='hidden';
  },true);
  let wishSet=new Set(cfg.wish?cfg.wish.get().map(x=>x.id):[]);
  const card=x=>'<a class="cv-c" href="'+esc(safeUrl(x.url)||'#')+'" target="_blank" rel="noopener noreferrer"><div class="cv-img">'+(safeUrl(x.img)?'<img src="'+esc(safeUrl(x.img))+'"'+(safeUrl(x.img2)?' data-fb="'+esc(safeUrl(x.img2))+'"':'')+' alt="" loading="lazy" referrerpolicy="no-referrer">':'')+(x.date?'<span class="cv-date">'+fmtD(x.date)+'</span>':x.badge?'<span class="cv-date">'+esc(x.badge)+'</span>':'')+(x.low?'<span class="cv-lo" title="Takip ettiğimiz en düşük fiyat">En düşük fiyat</span>':'')+(cfg.wish&&x.id?'<span class="cv-st'+(wishSet.has(x.id)?' on':'')+'" role="button" tabindex="0" data-a="st" data-id="'+esc(x.id)+'" title="İstek listesi" aria-label="İstek listesine ekle/çıkar">'+(wishSet.has(x.id)?'★':'☆')+'</span>':'')+'</div><div class="cv-t">'+esc(x.title)+'</div>'+(x.sub?'<div class="cv-s">'+esc(x.sub)+'</div>':'')+'</a>';
  const setFoot=t=>{foot.textContent=t||''};
  const clear=()=>{items=[];pages=1;pgEl.hidden=true};
  /* Kutuya tam sığan satır kadar kart göster; yarım görünen kart olmasın. Kalanlar sonraki sayfada. */
  function applyPage(){
    const cv=$('.cv',body);
    if(!cv||!items.length){pgEl.hidden=true;return}
    const cards=[...cv.children];
    cards.forEach(c=>{c.hidden=false});
    const cs=getComputedStyle(cv);
    if(cv.classList.contains('h')){
      const gx=parseFloat(cs.columnGap)||10,gy=parseFloat(cs.rowGap)||10;
      const W=cv.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0),H=cv.clientHeight-(parseFloat(cs.paddingTop)||0)-(parseFloat(cs.paddingBottom)||0);
      const cols=Math.max(2,Math.min(5,Math.floor((W+gx)/130)));
      const rows=Math.max(1,Math.floor((H+gy)/(138+gy))),rowH=Math.floor((H-gy*(rows-1))/rows);
      cv.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';cv.style.gridAutoRows=rowH+'px';
      const per=cols*rows;pages=Math.max(1,Math.ceil(cards.length/per));page=Math.min(page,pages-1);
      cards.forEach((c,i)=>{c.hidden=i<page*per||i>=(page+1)*per});
      pgEl.hidden=pages<=1;
      pgEl.innerHTML='<button type="button" class="pgb" data-a="pp" aria-label="Önceki sayfa">‹</button><span>'+(page+1)+'/'+pages+'</span><button type="button" class="pgb" data-a="pn" aria-label="Sonraki sayfa">›</button>';
      return;
    }
    if(cs.display==='flex'){pages=1;pgEl.hidden=true;return}          /* XS: tek sıra, yatay kaydırma */
    cv.style.gridTemplateColumns='';cv.style.justifyContent='';cv.style.removeProperty('--ph');cv.classList.remove('cmp','nt');
    let cols=Math.max(1,cs.gridTemplateColumns.split(' ').length);const gapY=parseFloat(cs.rowGap)||0,gapX=parseFloat(cs.columnGap)||0;
    const pad=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);
    const cardH=Math.max(...cards.map(c=>c.offsetHeight));
    let rows=Math.floor((cv.clientHeight-pad+gapY)/(cardH+gapY));
    if(rows<1){
      /* Tek satır bile sığmıyorsa: afişi küçült, isim + alt başlık görünür kalsın. */
      rows=1;
      const ratio=cv.classList.contains('land')?1.6:2/3,avail=cv.clientHeight-pad-1;
      const W=cv.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0);
      const set=ph=>{
        const pw=Math.floor(ph*ratio);cols=Math.max(1,Math.floor((W+gapX)/(pw+gapX)));
        cv.classList.add('cmp');cv.style.setProperty('--ph',ph+'px');
        cv.style.gridTemplateColumns='repeat('+cols+','+pw+'px)';cv.style.justifyContent='space-between';
      };
      let ph=Math.floor(avail-(cardH-cards[0].querySelector('.cv-img').offsetHeight));
      set(Math.max(40,ph));
      for(let k=0;k<30&&ph>40&&cards[0].offsetHeight>avail;k++){ph-=3;set(ph)}   /* gerçek yüksekliğe göre ince ayar */
      if(ph<64||cards[0].offsetHeight>avail){cv.classList.add('nt');set(Math.max(40,Math.floor(avail)))}   /* çok kısa: yalnızca afişler */
    }
    const per=cols*rows;
    pages=Math.max(1,Math.ceil(cards.length/per));page=Math.min(page,pages-1);
    cards.forEach((c,i)=>{c.hidden=i<page*per||i>=(page+1)*per});
    pgEl.hidden=pages<=1;
    pgEl.innerHTML='<button type="button" class="pgb" data-a="pp" aria-label="Önceki sayfa">‹</button><span>'+(page+1)+'/'+pages+'</span><button type="button" class="pgb" data-a="pn" aria-label="Sonraki sayfa">›</button>';
  }
  new ResizeObserver(()=>requestAnimationFrame(applyPage)).observe(body);
  /* Otomatik sayfa geçişi (yalnızca cfg.autoPage true dönen sekmede): her 60 sn'de bir sonraki sayfa, sondan sonra başa döner.
     Elle sayfa değiştirilince (ok, tekerlek, sekme) süre yeniden başlar. */
  let apTimer=0;const apGen=w._gen;
  const arm=()=>{clearTimeout(apTimer);if(!cfg.autoPage)return;apTimer=setTimeout(()=>{
    if(w._gen!==apGen)return;   /* widget kaldırıldı */
    if(cfg.autoPage(tab)&&!sq&&!showKey&&pages>1&&!document.hidden){page=(page+1)%pages;applyPage()}
    arm();
  },60e3)};
  body.addEventListener('wheel',e=>{
    if(pages<=1)return;
    const np=page+(e.deltaY>0?1:-1);if(np<0||np>=pages)return;
    e.preventDefault();
    if(performance.now()-lastWheel<280)return;
    lastWheel=performance.now();page=np;applyPage();arm();
  },{passive:false});
  const showResult=(r,reset)=>{
    items=r.items;land=!!r.land;if(reset)page=0;
    body.innerHTML='<div class="cv noscroll'+(land?' land':'')+(cfg.layout==='h'?' h':'')+'">'+items.map(card).join('')+'</div>';
    setFoot((r.note?r.note+' · ':'')+r.foot);applyPage();
  };
  const panel=(prov,key)=>{
    const K=KEYS[prov],opt=cfg.optional(tab);clear();
    body.innerHTML='<div class="kp"><b>'+K.name+' anahtarı'+(opt?' (isteğe bağlı)':' gerekli')+'</b><p>'+K.why+'</p><a href="'+K.url+'" target="_blank" rel="noopener noreferrer">Ücretsiz anahtar al ↗</a>'+
      '<form class="yt-in" data-k="'+prov+'"><input type="text" autocomplete="off" spellcheck="false" placeholder="Anahtarı yapıştır" aria-label="'+K.name+' anahtarı"><button class="yt-go" type="submit">Kaydet</button></form>'+
      (key?'<button type="button" class="kp-b" data-a="rm">Kayıtlı anahtarı sil</button>':'')+((key||opt)?'<button type="button" class="kp-b" data-a="close">Kapat</button>':'')+'</div>';
    setFoot('Anahtar yalnızca bu tarayıcıda saklanır.');
  };
  async function load(force){
    const my=++seq,prov=cfg.prov(tab),key=getKey(prov);
    if(!sq&&(showKey||(!key&&!cfg.optional(tab)))){panel(prov,key);return}
    const ck=tab+'|'+(key?1:0),c=cache[ck],nc=sq||(cfg.nocache&&cfg.nocache(tab));
    if(!force&&!nc&&c&&Date.now()-c.t<30*60e3){showResult(c.r,false);return}
    clear();body.innerHTML='<div class="cv noscroll'+(cfg.landDefault(tab)?' land':'')+(cfg.layout==='h'?' h':'')+'">'+Array(6).fill('<div class="cv-c"><div class="cv-img sk"></div></div>').join('')+'</div>';setFoot('');
    try{
      const r=sq?await cfg.find(sq):await cfg.src(tab,key);if(my!==seq)return;
      if(!nc)cache[ck]={t:Date.now(),r};
      if(!r.items.length){clear();body.innerHTML='<div class="nw-msg">'+esc(r.empty||(cfg.empty&&cfg.empty(tab))||'Şu an listelenecek bir şey bulunamadı.')+'</div>';setFoot(r.foot||'');return}
      showResult(r,true);
      if(cfg.status)status(cfg.status,true);
    }catch(e){
      if(my!==seq)return;clear();
      const bad=/^(401|403)$/.test(String(e&&e.message));
      body.innerHTML='<div class="nw-msg"><div>'+(bad?'API anahtarı kabul edilmedi.':'Liste şu an alınamadı.')+'</div>'+(()=>{const dt=e&&(e.detail||(e.errors||[]).map(x=>x&&(x.detail||x.message)).filter(Boolean).slice(0,3).join(' · '));return !bad&&dt?'<div style="font-size:11px;opacity:.6;margin:4px 0">'+esc(dt)+'</div>':''})()+'<button type="button" data-a="'+(bad?'key':'ref')+'">'+(bad?'Anahtarı değiştir':'Tekrar dene')+'</button>'+((!bad&&cfg.optional(tab)&&!key)?'<button type="button" data-a="key">Anahtar ekle</button>':'')+'</div>';
    }
  }
  function toggleWish(el){
    const id=el.dataset.id,it=items.find(x=>x.id===id);if(!it)return;
    let a=cfg.wish.get();
    if(wishSet.has(id)){a=a.filter(x=>x.id!==id);wishSet.delete(id)}
    else{a.unshift({id,n:it.title,i:(it.img||'').replace(PS_IMG,'').split('?')[0]});wishSet.add(id)}
    cfg.wish.set(a);
    if(tab==='wish'&&!sq){load(true);return}
    $$('[data-a=st][data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]',body).forEach(n=>{const on=wishSet.has(id);n.classList.toggle('on',on);n.textContent=on?'★':'☆'});
  }
  function closeSearch(quiet){const f=$('#cvs',root);if(!f)return;f.hidden=true;f.querySelector('input').value='';clearTimeout(srTimer);if(sq){sq='';page=0;if(!quiet)load()}}
  if(cfg.search){const inp=$('#cvs input',root);
    inp.addEventListener('input',()=>{clearTimeout(srTimer);srTimer=setTimeout(()=>{const v=inp.value.trim();
      if(v===sq)return;sq=v;page=0;if(sq)load();else load()},220)});
    inp.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeSearch()}});
    $('#cvs',root).addEventListener('submit',e=>e.preventDefault())}
  root.addEventListener('click',e=>{
    const st=e.target.closest('[data-a=st]');
    if(st){e.preventDefault();e.stopPropagation();toggleWish(st);return}
    const t=e.target.closest('[data-t]');
    if(t){if(sq)closeSearch(true);tab=t.dataset.t;LS.set('pano.cv.'+cfg.id,tab);showKey=false;page=0;$('#cvt',root).innerHTML=tabsHtml();load();arm();return}
    const a=e.target.closest('[data-a]');if(!a)return;
    const k=a.dataset.a;
    if(k==='sr'){const f=$('#cvs',root);if(f.hidden){f.hidden=false;f.querySelector('input').focus()}else closeSearch()}
    else if(k==='sx')closeSearch()
    else if(k==='key'){showKey=!showKey;load()}
    else if(k==='ref'){showKey=false;load(true)}
    else if(k==='close'){showKey=false;load()}
    else if(k==='rm'){LS.set('pano.key.'+cfg.prov(tab),'');showKey=true;load()}
    else if(k==='pp'){page=Math.max(0,page-1);applyPage();arm()}
    else if(k==='pn'){page=Math.min(pages-1,page+1);applyPage();arm()}
  });
  root.addEventListener('submit',e=>{
    const f=e.target.closest('form[data-k]');if(!f)return;e.preventDefault();
    const v=f.querySelector('input').value.trim();
    if(v){LS.set('pano.key.'+f.dataset.k,v);showKey=false;Object.keys(cache).forEach(k=>delete cache[k]);load(true)}
  });
  load();arm();every(w,()=>{if(!showKey&&!sq)load(true)},3*3600e3);onBus(w,'refresh',()=>{if(!showKey)load()});
}
const mountGames=(w,r)=>mountCovers(w,r,{id:'games',title:'Oyunlar',tabs:[['soon','Yakında'],['new','Yeni'],['top','Çok satan'],['sale','İndirim']],optional:()=>true,autoPage:()=>true,prov:()=>'rawg',landDefault:t=>t==='soon'&&!!getKey('rawg'),
  src:(t,k)=>t==='new'?gamesSteam('new_releases'):t==='top'?gamesSteam('top_sellers'):t==='sale'?gamesDeals():(k?gamesRAWG(k):Promise.any([gamesSteam(),gamesGOG()]))});
const mountPS=(w,r)=>mountCovers(w,r,{id:'ps',title:'PLAYSTATION',tabs:[['deals','İndirim'],['soon','Yakında'],['wish','İstek']],search:true,wish:psWish,nocache:t=>t==='wish',empty:t=>t==='wish'?'Listen boş. Kartlardaki ☆ ile oyun ekle.':'',
  optional:()=>true,autoPage:t=>t!=='wish',prov:()=>'ps',landDefault:()=>false,layout:'h',src:t=>gamesPS(t),find:q=>psSearch(q)});
const mountEvents=(w,r)=>mountCovers(w,r,{id:'events',title:'FİLMLER',tabs:null,optional:()=>false,autoPage:()=>true,prov:()=>'tmdb',landDefault:()=>false,layout:'h',src:(t,k)=>filmsTMDB(k)});
