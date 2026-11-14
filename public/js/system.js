'use strict';
/* AliBaba Terminal · system.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Sistem Durumu: sitenin bağlı olduğu her şeyin (API, sunucu, veri dosyası, Actions, tarayıcı) sağlık panosu ----------
   Kontroller gerçek istekle yapılır; sonuç: ok (yeşil) · warn (sarı, dikkat) · bad (kırmızı, çalışmıyor) · off (henüz bilinmiyor).
   Kart, çalışmayan hizmeti doğrudan gösterir; tıklayınca tüm kontroller ayrıntısıyla açılır. */
const SY_RAW='https://raw.githubusercontent.com/alibeypremium/alibaba-terminal/';
const SY_GH='https://api.github.com/repos/alibeypremium/alibaba-terminal/actions/workflows/';
const SY_LBL={ok:'Çalışıyor',warn:'Dikkat',bad:'Çalışmıyor',off:'Bekliyor'};
const syDur=ms=>{const m=Math.max(0,Math.round(ms/6e4));return m<90?m+' dk':m<2880?Math.round(m/60)+' sa':Math.round(m/1440)+' gün'};
const syTime=t=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
async function syFetch(url,{ms=9000,mode,cache,method,abortAfterHeaders}={}){
  const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms),t0=performance.now();
  try{
    /* cache:'no-store' tarayıcıya Cache-Control başlığı ekletir; bu, CORS vekillerinde ön kontrol (preflight) başarısızlığına yol açar — yalnızca aynı kaynakta kullan */
    const r=await fetch(url,{signal:c.signal,mode,cache,method,credentials:'omit'});
    const took=Math.round(performance.now()-t0);
    if(abortAfterHeaders)c.abort();   /* yalnızca yanıtın geldiğini gör, gövdeyi indirme */
    return{r,took};
  }finally{clearTimeout(tm)}
}
const syErr=e=>e&&e.name==='AbortError'?'zaman aşımı':(e&&e.message&&!/Failed to fetch|NetworkError|Load failed/i.test(e.message)?String(e.message).slice(0,60):'ulaşılamadı');
const syHttp=r=>r.status===429?'istek sınırı (429)':'HTTP '+r.status;
/* JSON döndüren API: test(j) → {s,d} */
const syJson=(url,test,opt)=>async()=>{
  const{r,took}=await syFetch(url,opt);
  if(!r.ok)return{s:r.status===429?'warn':'bad',d:syHttp(r)};
  const j=await r.json(),v=test(j);
  return{s:v.s||'ok',d:v.d||'',ms:took};
};
/* Yalnızca erişim: yanıt geliyorsa sunucu ayakta (opak yanıt, durum kodu okunamaz) */
const syReach=url=>async()=>{const{took}=await syFetch(url,{mode:'no-cors',abortAfterHeaders:true,ms:9000});return{s:'ok',d:'erişilebilir',ms:took}};
const syFresh=(t,okMs,warnMs,extra)=>{const age=Date.now()-t;if(!Number.isFinite(age))return{s:'bad',d:'zaman bilgisi yok'};
  return{s:age<=okMs?'ok':age<=warnMs?'warn':'bad',d:(extra?extra+' · ':'')+syDur(age)+' önce güncellendi'}};

/* GitHub Actions: API'nin IP başına 60 istek/saat sınırı yüzünden doğrudan çağrılmaz; tg iş akışı (5 dk) kimlik doğrulamalı olarak
   tüm iş akışlarının son çalışmalarını veri dalına durum.json diye yazar, burada o dosya okunur. */
const syGhMemo={};
function syGh(file){
  const m=syGhMemo.p;if(m&&Date.now()-m.t<4*6e4)return m.p;
  const p=(async()=>{
    const{r}=await syFetch(SY_RAW+'veri/durum.json?m='+Math.floor(Date.now()/6e4),{ms:10000});
    if(!r.ok)throw new Error('durum dosyası okunamadı (HTTP '+r.status+')');
    const j=await r.json();if(!j||!j.wf)throw new Error('durum dosyası bozuk');return j;
  })();
  syGhMemo.p={t:Date.now(),p};p.catch(()=>{if(syGhMemo.p&&syGhMemo.p.p===p)delete syGhMemo.p});return p;
}
const syWf=(file,okMs,warnMs)=>async()=>{
  let j;try{j=await syGh(file)}catch(e){return{s:'warn',d:/^durum/.test(e.message)?e.message:'durum dosyasına ulaşılamadı ('+syErr(e)+')'}}
  const age0=Date.now()-j.t;if(!(age0<3*36e5))return{s:'warn',d:'durum dosyası '+syDur(age0)+' önce güncellendi (tg çekimi durmuş olabilir)'};
  const runs=((j.wf||{})[file.replace(/\.yml$/,'')]||[]).map(x=>({s:x.s,c:x.c,t:Date.parse(x.t)}));
  if(!runs.length)return{s:'warn',d:'çalışma kaydı yok'};
  const running=runs[0].s!=='completed',done=runs.filter(r=>r.s==='completed'&&r.c!=='cancelled'&&r.c!=='skipped')[0];
  if(!done)return{s:running?'ok':'warn',d:running?'çalışıyor…':'tamamlanmış çalışma yok'};
  const age=Date.now()-done.t,tag='',ok=done.c==='success';
  if(!ok)return{s:'bad',d:'son çalışma başarısız ('+(done.c||'?')+') · '+syDur(age)+' önce'+tag};
  if(okMs&&age>warnMs)return{s:'bad',d:'başarılı ama '+syDur(age)+' önce çalıştı, gecikmiş'+tag};
  if(okMs&&age>okMs)return{s:'warn',d:'başarılı · '+syDur(age)+' önce, biraz gecikmiş'+tag};
  return{s:'ok',d:(running?'yeniden çalışıyor · ':'')+'başarılı · '+syDur(age)+' önce'+tag};
};
const sySize=()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=(k.length+(localStorage.getItem(k)||'').length)*2}}catch{}return n};

/* Kontrol listesi. id · g: grup · n: ad · af: etkilediği yer · fix: sorun olursa ipucu · every: ms · run() → {s,d,ms} */
const SY_DEFS=[
  {id:'net',g:'Tarayıcı ve site',n:'İnternet bağlantısı',af:'her şey',every:60e3,run:async()=>navigator.onLine?{s:'ok',d:'çevrimiçi'}:{s:'bad',d:'çevrimdışı görünüyor'}},
  {id:'ver',g:'Tarayıcı ve site',n:'Site sürümü',af:'tüm site',fix:'Ctrl+Shift+R ile yenile.',every:10*6e4,run:async()=>{
    const mine=((document.querySelector('script[src*="js/core.js"]')||{}).src||'').match(/[?&]v=([\w]+)/),m=mine&&mine[1];
    if(!m||m==='__V__')return{s:'ok',d:'yerel sürüm'};
    const{r}=await syFetch(location.pathname+'?_='+Date.now(),{cache:'no-store'});
    if(!r.ok)return{s:'warn',d:syHttp(r)};
    const t=await r.text(),n=(t.match(/js\/core\.js\?v=([\w]+)/)||[])[1];
    return!n||n===m?{s:'ok',d:'güncel ('+m.slice(0,7)+')'}:{s:'warn',d:'yeni sürüm yayında (sen: '+m.slice(0,7)+' · yeni: '+n.slice(0,7)+')'};
  }},
  {id:'js',g:'Tarayıcı ve site',n:'Betik hataları (bu oturum)',af:'tüm site',fix:'Sayfayı yenile; sürerse bildir.',every:30e3,run:async()=>{
    const e=ERRS.length;if(!e)return{s:'ok',d:'hata yok'};
    const l=ERRS[e-1];return{s:'bad',d:e+' hata · son: '+l.m+(l.s?' ('+l.s+')':'')};
  }},
  {id:'ls',g:'Tarayıcı ve site',n:'Tarayıcı depolaması',af:'ayarlar, yedek, önbellek',fix:'Yedek al; gerekirse eski önbellekleri sil.',every:5*6e4,run:async()=>{
    const b=sySize(),p=Math.round(b/5e6*100);return{s:p>=90?'bad':p>=70?'warn':'ok',d:'%'+p+' dolu · '+(b/1e6).toFixed(1)+' MB / ~5 MB'};
  }},
  {id:'three',g:'Tarayıcı ve site',n:'Arka plan (three.js)',af:'3B arka plan',every:60e3,run:async()=>typeof THREE!=='undefined'?{s:'ok',d:'yüklü'}:{s:'warn',d:'yüklenemedi (CDN), arka plan çizilmez'}},

  {id:'wf-pages',g:'GitHub (altyapı)',n:'Site yayını (Pages)',af:'siteyi yayınlar',fix:'GitHub → Actions → pages çalışmasındaki hataya bak.',every:10*6e4,run:syWf('pages.yml')},
  {id:'wf-test',g:'GitHub (altyapı)',n:'Otomatik testler',af:'kalite güvencesi',fix:'GitHub → Actions → test çalışmasına bak.',every:10*6e4,run:syWf('test.yml')},
  {id:'wf-tg',g:'GitHub (altyapı)',n:'Telegram veri çekimi',af:'Telegram sekmesi',fix:'Actions → tg çalışmasına bak.',every:10*6e4,run:syWf('tg.yml',45*6e4,3*36e5)},
  {id:'wf-ps',g:'GitHub (altyapı)',n:'PlayStation veri çekimi',af:'PlayStation widget\'ı',fix:'Actions → ps çalışmasına bak.',every:10*6e4,run:syWf('ps.yml',9*36e5,15*36e5)},
  {id:'wf-kurul',g:'GitHub (altyapı)',n:'Dini Sorular veri çekimi',af:'Dini Sorular widget\'ı',fix:'Actions → kurul çalışmasına bak.',every:10*6e4,run:syWf('kurul.yml',28*36e5,50*36e5)},

  {id:'d-tg',g:'Veri dosyaları',n:'Telegram verisi (tg.json)',af:'Telegram sekmesi',fix:'Telegram çekimi durmuş olabilir.',every:10*6e4,run:syJson(SY_RAW+'veri/tg.json?m='+Math.floor(Date.now()/6e4),j=>({...syFresh(j.t,20*6e4,90*6e4,(j.ch||[]).length+' kanal')}))},
  {id:'d-ps',g:'Veri dosyaları',n:'PlayStation verisi (ps.json)',af:'PlayStation widget\'ı',fix:'PlayStation çekimi durmuş olabilir.',every:30*6e4,run:syJson(SY_RAW+'veri-ps/ps.json?m='+Math.floor(Date.now()/6e5),j=>({...syFresh(Date.parse(j.t),9*36e5,15*36e5,(j.deals||[]).length+' indirim')}))},
  {id:'d-kurul',g:'Veri dosyaları',n:'Dini Sorular verisi',af:'Dini Sorular widget\'ı',fix:'Kurul çekimi durmuş olabilir.',every:60*6e4,run:syJson(SY_RAW+'veri-kurul/kurul-ozet.json?h='+Math.floor(Date.now()/36e5),j=>({...syFresh(j.t,28*36e5,50*36e5,(j.n||0)+' karar')}))},

  {id:'rss',g:'Haber ve içerik',n:'RSS çevirici (rss2json)',af:'Haberler, Son Dakika',fix:'Haberler yedek yollara düşer; yavaşlayabilir.',every:5*6e4,run:syJson('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent('https://www.aa.com.tr/tr/rss/default?cat=guncel'),j=>j.status==='ok'&&(j.items||[]).length?{d:(j.items||[]).length+' haber geldi'}:{s:'bad',d:'yanıt boş ('+(j.status||'?')+')'})},
  {id:'px',g:'Haber ve içerik',n:'CORS vekilleri',af:'Haberler, okuyucu, Steam',fix:'Haberler önce rss2json ile gelir; vekiller yedek yoldur. Hiçbiri kalmazsa yedek yol gerekir.',every:10*6e4,run:async()=>{
    const target='https://open.er-api.com/v6/latest/USD',host=u=>{try{return new URL(u).hostname}catch{return '?'}};
    const rs=await Promise.all(PROXIES.map(async p=>{const u=p(target);try{const{r,took}=await syFetch(u,{ms:11000});const t=await r.text();return{h:host(u),ok:r.ok&&t.length>=200,ms:took}}catch(e){return{h:host(u),ok:false}}}));
    const up=rs.filter(x=>x.ok),dn=rs.filter(x=>!x.ok);
    return{s:!up.length?'bad':up.length<2?'warn':'ok',d:up.length+'/'+rs.length+' çalışıyor'+(dn.length?' · yok: '+dn.map(x=>x.h).join(', '):''),ms:up.length?Math.min(...up.map(x=>x.ms)):undefined};
  }},
  {id:'jina',g:'Haber ve içerik',n:'r.jina.ai (Telegram yedeği)',af:'Telegram yedek yolu',every:15*6e4,run:async()=>{
    const{r,took}=await syFetch('https://r.jina.ai/https://example.com/',{ms:12000});
    if(!r.ok)return{s:r.status===429?'warn':'bad',d:syHttp(r)};
    const t=await r.text();return t.length>40?{s:'ok',d:'yanıt veriyor',ms:took}:{s:'warn',d:'yanıt boş'};
  }},

  {id:'wx',g:'Hava, namaz ve finans',n:'Hava durumu (Open-Meteo)',af:'Hava widget\'ı',every:10*6e4,run:syJson('https://api.open-meteo.com/v1/forecast?latitude=39.93&longitude=32.86&current=temperature_2m',j=>j.current&&Number.isFinite(j.current.temperature_2m)?{d:Math.round(j.current.temperature_2m)+'° (Ankara)'}:{s:'bad',d:'veri yok'})},
  {id:'ezan',g:'Hava, namaz ve finans',n:'Namaz vakitleri (Aladhan)',af:'Namaz widget\'ı',every:15*6e4,run:syJson('https://api.aladhan.com/v1/timings?latitude=39.93&longitude=32.86&method=13',j=>j.data&&j.data.timings&&j.data.timings.Fajr?{d:'İmsak '+String(j.data.timings.Fajr).slice(0,5)}:{s:'bad',d:'veri yok'})},
  {id:'fx1',g:'Hava, namaz ve finans',n:'Döviz (open.er-api.com)',af:'Döviz widget\'ı',every:10*6e4,run:syJson('https://open.er-api.com/v6/latest/USD',j=>j.result==='success'&&j.rates&&j.rates.TRY?{d:'USD/TRY '+Number(j.rates.TRY).toFixed(2)}:{s:'bad',d:'veri yok'})},
  {id:'fx2',g:'Hava, namaz ve finans',n:'Döviz yedeği (Frankfurter)',af:'Döviz widget\'ı',every:15*6e4,run:syJson('https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY',j=>j.rates&&j.rates.TRY?{d:'USD/TRY '+Number(j.rates.TRY).toFixed(2)}:{s:'bad',d:'veri yok'})},
  {id:'gold',g:'Hava, namaz ve finans',n:'Altın (gold-api)',af:'Döviz widget\'ı',every:10*6e4,run:syJson('https://api.gold-api.com/price/XAU',j=>Number.isFinite(+j.price)?{d:'XAU '+Math.round(+j.price)+' $'}:{s:'bad',d:'veri yok'})},
  {id:'bin',g:'Hava, namaz ve finans',n:'Kripto (Binance)',af:'Döviz widget\'ı',every:10*6e4,run:syJson('https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT',j=>Number.isFinite(+j.price)?{d:'BTC '+Math.round(+j.price)+' $'}:{s:'bad',d:'veri yok'})},

  {id:'cs',g:'Oyun ve medya',n:'Steam indirimleri (CheapShark)',af:'Oyunlar widget\'ı',every:15*6e4,run:syJson('https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&pageSize=1',j=>Array.isArray(j)&&j.length?{d:'veri geliyor'}:{s:'bad',d:'yanıt boş'})},
  {id:'steam',g:'Oyun ve medya',n:'Steam mağazası',af:'Oyunlar widget\'ı',every:15*6e4,run:syReach('https://store.steampowered.com/robots.txt')},
  {id:'psst',g:'Oyun ve medya',n:'PlayStation Store',af:'PlayStation bağlantıları',every:30*6e4,run:syReach('https://store.playstation.com/robots.txt')},
  {id:'yt',g:'Oyun ve medya',n:'YouTube',af:'YouTube sekmeleri',every:15*6e4,run:syReach('https://www.youtube.com/robots.txt')},
  {id:'tw',g:'Oyun ve medya',n:'Twitch',af:'Twitch sekmesi',every:30*6e4,run:syReach('https://www.twitch.tv/robots.txt')},
  {id:'kick',g:'Oyun ve medya',n:'Kick',af:'Kick sekmesi',every:30*6e4,run:syReach('https://kick.com/robots.txt')},
  {id:'tv',g:'Oyun ve medya',n:'TradingView',af:'Grafik / canlı yayın kartları',every:30*6e4,run:syReach('https://s3.tradingview.com/tv.js')},
  {id:'odtu',g:'Oyun ve medya',n:'Radyo ODTÜ yayını',af:'Radyo widget\'ı',fix:'Radyo yedek kanala düşer.',every:10*6e4,run:async()=>{
    for(const u of ['https://stream3.radyoodtu.com.tr:8000/;','https://stream.radyoodtu.com.tr/;']){try{const{r,took}=await syFetch(u,{mode:'no-cors',method:'HEAD',abortAfterHeaders:true,ms:8000});return{s:'ok',d:'yayın geliyor',ms:took}}catch{}}
    return{s:'bad',d:'iki yayın adresi de yanıt vermiyor'};
  }},
  {id:'cdn',g:'Oyun ve medya',n:'Google Fonts',af:'yazı tipleri',every:30*6e4,run:syReach('https://fonts.googleapis.com/css2?family=Inter')},
];

/* Widget'ların kendi canlı durumu (status() ile bildirdikleri): gerçek kullanımdaki son sonuç */
function syLive(){
  return Object.keys(SRC_NAMES).map(k=>{const v=SRC[k];return{id:'live-'+k,g:'Widget verileri (canlı)',n:SRC_NAMES[k],af:'o widget',
    s:!v?'off':v.ok?'ok':'bad',d:!v?'henüz veri istenmedi':v.ok?'son başarılı çekim '+syTime(v.t):'son çekim başarısız ('+syTime(v.t)+')',fix:'Kaynağın kendi satırına bak.'}});
}

function sySummary(rows){
  const c={ok:0,warn:0,bad:0,off:0};rows.forEach(r=>c[r.s]++);
  const known=c.ok+c.warn+c.bad,pct=known?Math.round(c.ok/known*100):0;
  const state=!known?'run':c.bad?'bad':c.warn?'warn':'ok';
  return{c,known,pct,state};
}

function sysOpen(getRows,recheck){
  if($('.sy-ov'))return;
  const prev=document.activeElement;let onlyBad=false;
  const ov=document.createElement('div');ov.className='sy-ov';
  ov.innerHTML='<div class="sy" role="dialog" aria-modal="true" aria-labelledby="syT"><div class="sy-h"><span class="sy-t" id="syT">Sistem Durumu</span><label class="sy-flt"><input type="checkbox" id="syBad"> Yalnızca sorunlar</label><button type="button" class="sy-x" aria-label="Kapat" data-a="x">✕</button></div><div class="sy-b noscroll"></div><div class="sy-f"><span id="syFt"></span><button type="button" class="sy-re" data-a="re">Şimdi kontrol et</button></div></div>';
  document.body.appendChild(ov);
  const body=$('.sy-b',ov);
  const close=()=>{clearInterval(tick);document.removeEventListener('keydown',onKey,true);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch{}};
  const onKey=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};
  document.addEventListener('keydown',onKey,true);
  const paint=()=>{
    const rows=getRows(),sm=sySummary(rows),groups=[...new Set(rows.map(r=>r.g))];
    $('#syFt',ov).textContent=sm.c.bad||sm.c.warn?(sm.c.bad+' çalışmıyor · '+sm.c.warn+' dikkat · '+sm.c.ok+' çalışıyor'):(sm.known?'Tüm kontroller yeşil · '+sm.c.ok+' kontrol':'Kontrol ediliyor…');
    body.innerHTML=groups.map(g=>{
      const rs=rows.filter(r=>r.g===g),sh=onlyBad?rs.filter(r=>r.s==='bad'||r.s==='warn'):rs;if(!sh.length)return'';
      const gs=sySummary(rs);
      return'<section class="sy-g"><h4><span class="sy-gd" data-s="'+gs.state+'"></span>'+esc(g)+'<em>'+gs.c.ok+'/'+gs.known+'</em></h4>'+sh.map(r=>'<div class="sy-r" data-s="'+r.s+'"><span class="sy-d" data-s="'+r.s+'"></span><div class="sy-n"><b>'+esc(r.n)+'</b><small>'+esc(r.af?'Etkilediği: '+r.af:'')+'</small>'+((r.s==='bad'||r.s==='warn')&&r.fix?'<small class="sy-fx">'+esc(r.fix)+'</small>':'')+'</div><div class="sy-v"><span>'+esc(r.d||SY_LBL[r.s])+'</span>'+(r.ms!=null?'<small>'+r.ms+' ms</small>':'')+'</div></div>').join('')+'</section>';
    }).join('')||'<div class="sy-ok">Sorun yok: tüm kontroller başarılı ✓</div>';
  };
  const tick=setInterval(paint,5000);
  ov.addEventListener('click',e=>{
    if(e.target===ov){close();return}
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.a==='x')close();else if(b.dataset.a==='re'){recheck();paint()}
  });
  $('#syBad',ov).addEventListener('change',e=>{onlyBad=e.target.checked;paint()});
  paint();$('.sy-x',ov).focus({preventScroll:true});
  return{paint};
}

/* Üst çubukta (ms çipinin solunda) duran kalıcı Sistem çipi. Çip topbar.js tarafından yazılır (#sbSys); burada yalnızca boyanır ve tıklaması
   belge düzeyinde dinlenir — çip yeniden oluşturulsa da bağlantı kopmaz. Kontroller sayfa açıkken kendiliğinden çalışır. */
const SYS={res:new Map(),running:new Set(),last:0,modal:null};
function sysRows(){
  const base=SY_DEFS.map(d=>{const r=SYS.res.get(d.id);return{id:d.id,g:d.g,n:d.n,af:d.af,fix:d.fix,s:r?r.s:'off',d:r?r.d:'henüz kontrol edilmedi',ms:r&&r.ms}});
  return base.concat(syLive());
}
function sysPaint(){
  const rs=sysRows(),sm=sySummary(rs),probs=rs.filter(r=>r.s==='bad').concat(rs.filter(r=>r.s==='warn')),el=$('#sbSys');
  if(el){
    const word=sm.state==='run'?'Kontrol ediliyor':sm.state==='ok'?'Çalışıyor':sm.c.bad?'Kesinti var':'Uyarı var';
    el.dataset.state=sm.state;el.dataset.busy=SYS.running.size?'1':'';
    const t=sm.known?sm.c.ok+'/'+sm.known:'…';if($('b',el).textContent!==t)$('b',el).textContent=t;
    el.title='Sistem: '+word+(sm.known?' · '+sm.c.ok+'/'+sm.known+' hizmet':'')+(probs.length?'\n'+probs.map(r=>'• '+r.n+': '+r.d).join('\n'):'')+'\nAyrıntı için tıkla';
    el.setAttribute('aria-label','Sistem durumu: '+word+'. Ayrıntıları aç');
  }
  if(SYS.modal&&$('.sy-ov'))SYS.modal.paint();
}
async function sysRunOne(d){
  if(SYS.running.has(d.id))return;SYS.running.add(d.id);
  try{
    if(!navigator.onLine&&d.id!=='net'){SYS.res.set(d.id,{s:'off',d:'çevrimdışı, denenmedi',t:Date.now()});return}
    const r=await d.run();SYS.res.set(d.id,{...r,t:Date.now()});
  }catch(e){SYS.res.set(d.id,{s:'bad',d:syErr(e),t:Date.now()})}
  finally{SYS.running.delete(d.id);SYS.last=Date.now();sysPaint()}
}
async function sysPass(force){
  const due=SY_DEFS.filter(d=>force||!SYS.res.has(d.id)||Date.now()-SYS.res.get(d.id).t>=d.every-2000);
  const q=[...due];const worker=async()=>{while(q.length){await sysRunOne(q.shift())}};
  sysPaint();await Promise.all([worker(),worker(),worker(),worker(),worker()]);sysPaint();
}
const sysRecheck=()=>{sysPass(true)};
function sysOpenUi(){if(document.body.classList.contains('editing')||$('.sy-ov'))return;SYS.modal=sysOpen(sysRows,sysRecheck)}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#sbSys'))sysOpenUi()});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.id==='sbSys'){e.preventDefault();sysOpenUi()}});
bus.addEventListener('refresh',()=>sysPass(true));
addEventListener('online',()=>sysPass(true));addEventListener('offline',()=>sysPass(true));
setTimeout(()=>sysPass(false),600);
setInterval(()=>{if(!document.hidden)sysPass(false)},60e3);
setInterval(sysPaint,30e3);
