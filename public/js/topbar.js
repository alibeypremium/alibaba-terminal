'use strict';
/* AliBaba Terminal · topbar.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Üst çubuk: kurlar, kripto, gecikme, hava ---------- */
const TK={};const TK_ORDER=['USD','|','ETH'];   /* üst çubukta yalnızca bu çipler gösterilir */
const CRYPTO={};   /* üst çubuğun WebSocket/REST verisi; TradingView sekmeleri buradan okur */
const ico=svg=>'<span class="sb-ic">'+svg+'</span>';
let tkTimer=0;
function persistTk(){
  if(tkTimer)return;
  tkTimer=setTimeout(()=>{tkTimer=0;const o={};['USD','EUR','BTC','ETH','wx','ms'].forEach(k=>{if(TK[k])o[k]=TK[k]});LS.set('pano.tk',o)},4000);
}
const BOLT='<svg class="sb-bolt%C%" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 4.5 13.6h6.1L9.6 22l9.9-12.2h-6.3z" fill="currentColor"/></svg>';
let lastRight='',lastChips='';
function setTk(k,o){TK[k]=o;if(k==='ms'||k==='wx')paintRight();else paintChips();persistTk()}
function paintTicker(){paintChips();paintRight()}
function paintChips(){
  const chip=o=>'<span class="sb-chip">'+o.icon+'<b>'+o.label+'</b><span class="sb-v">'+o.val+'</span>'+(o.chg==null||!isFinite(o.chg)?'':'<i class="'+(o.chg>=0?'up':'dn')+'">'+(o.chg>=0?'▲':'▼')+Math.abs(o.chg).toFixed(2)+'%</i>')+'</span>';
  const fxOn=TK.USD,crOn=TK.ETH;
  const have=TK_ORDER.filter(k=>k==='|'?(fxOn&&crOn):TK[k]);
  const html=have.length?have.map(k=>k==='|'?'<span class="sb-sep"></span>':chip(TK[k])).join(''):'<span class="sb-wait">Kurlar ve fiyatlar yükleniyor…</span>';
  if(html===lastChips)return;lastChips=html;
  $('#sbChips').innerHTML=html;
  syncTkSoon();
}
/* Ay evresi: ortalama sinodik ay (29,53 gün) ile hesaplanır, ağ gerekmez. */
function moonInfo(d=new Date()){
  const SYN=29.530588853,age=(((d-Date.UTC(2000,0,6,18,14))/864e5)%SYN+SYN)%SYN,ph=age/SYN,k=Math.cos(2*Math.PI*ph);
  const name=age<1.85?'Yeni Ay':age<5.54?'Büyüyen Hilal':age<9.22?'İlk Dördün':age<12.91?'Büyüyen Ay':age<16.61?'Dolunay':age<20.3?'Küçülen Ay':age<23.99?'Son Dördün':age<27.68?'Küçülen Hilal':'Yeni Ay';
  const wax=ph<.5,rx=+(6*Math.abs(k)).toFixed(2),s1=wax?1:0,s2=wax?(k>0?0:1):(k>0?1:0);
  const svg='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="rgba(140,150,170,.35)"/><path d="M8 2A6 6 0 0 '+s1+' 8 14A'+rx+' 6 0 0 '+s2+' 8 2z" fill="#f4ecc2"/></svg>';
  return{name,pct:Math.round((1-k)/2*100),svg};
}
/* Hava çipinin açılır panelindeki 7 günlük tahmin: veri üst çubuğun hava isteğiyle gelir, son değer önbellekten hemen gösterilir. */
let WXFC=LS.get('pano.tk.d',null);
function paintFc(){
  const el=document.getElementById('popFc');if(!el)return;
  const f=WXFC&&WXFC.p===place.name?WXFC.days:null;
  if(!f||!f.length){const h='<span class="pf-wait">Tahmin yükleniyor…</span>';if(el._h!==h){el._h=h;el.innerHTML=h}return}
  const lo=Math.min(...f.map(x=>x.lo)),hi=Math.max(...f.map(x=>x.hi)),span=Math.max(1,hi-lo);
  const h='<span class="pop-k">7 günlük tahmin</span>'+f.map((x,i)=>{
    const nm=i?new Date(x.t+'T12:00').toLocaleDateString('tr-TR',{weekday:'short'}):'Bugün',desc=(WX[x.c]||['—'])[0];
    return'<div class="pf-r'+(i===0?' now':'')+'" title="'+esc(desc)+'"><b>'+esc(nm)+'</b><span class="pf-ic">'+wxIcon(x.c,1)+'</span><span class="pf-pp">'+(x.pp>=10?'💧'+Math.round(x.pp)+'%':'')+'</span><span class="pf-bar"><i style="left:'+((x.lo-lo)/span*100)+'%;right:'+(100-(x.hi-lo)/span*100)+'%"></i></span><span class="pf-t"><b>'+Math.round(x.hi)+'°</b> '+Math.round(x.lo)+'°</span></div>';
  }).join('');
  if(el._h!==h){el._h=h;el.innerHTML=h}
}
function paintRight(){
  const nm=esc(place.name.split(',')[0]);
  let r='<button type="button" class="sb-chip sb-btn" id="sbWx" aria-haspopup="dialog" aria-label="Konum: '+nm+'. Değiştirmek için tıkla">'+
    (TK.wx?'<span class="sb-ic wx">'+TK.wx.svg+'</span>':'<span class="sb-pin">'+I.pin+'</span>')+'<b>'+nm+'</b>'+(TK.wx?'<span class="sb-v">'+TK.wx.t+'°</span>':'')+(()=>{const m=moonInfo();return'<span class="sb-moon" title="Ay evresi: '+m.name+' · %'+m.pct+' aydınlık">'+m.svg+'</span>'})()+
    '<svg class="sb-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  /* Hava çipi ve ms çipi ayrı, kalıcı öğelerdir: ms çipi yeniden oluşturulmaz, açılan kutu ekranda kalır. */
  const box=$('#sbR');
  let wxBox=$('#sbWxBox',box),ms=$('#sbMs',box);
  if(!wxBox){box.innerHTML='<span class="sb-chip sb-rd" id="sbRd" data-state="idle" role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false"><span class="rd-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="sb-rdn">Radyo</span></span><span id="sbWxBox" style="display:contents"></span><span class="sb-chip sb-ms" id="sbMs" role="button" tabindex="0" data-state="run" aria-describedby="sbTip" aria-label="Sistem durumu ve yanıt süresi. Ayrıntıları aç">'+BOLT.replace('%C%','')+'<b></b><span class="sb-v">ms</span><span class="sb-tip" id="sbTip" role="tooltip"><div></div></span></span>';wxBox=$('#sbWxBox',box);ms=$('#sbMs',box)}
  if(r!==lastRight){lastRight=r;wxBox.innerHTML=r}
  const m=TK.ms?TK.ms.ms:undefined,ok=typeof m==='number',c=!ok?(m===null?' err':''):m<200?'':m<500?' warn':' err';
  const bv=$('b',ms),vt=ok?String(m):'—';if(bv.textContent!==vt)bv.textContent=vt;
  ms.classList.toggle('off',!STREAM_LIVE);
  if(typeof sysPaint==='function')sysPaint();
  if(typeof radioChipPaint==='function')radioChipPaint();
  paintStatus();
}
function startTicker(){
  /* Önceki oturumdan kalan değerleri hemen göster, sonra canlı veriyle güncelle. */
  const cached=LS.get('pano.tk',null);
  if(cached)Object.keys(cached).forEach(k=>{if(TK_ORDER.includes(k)||k==='wx'||k==='ms')TK[k]=cached[k]});
  const fx=async force=>{try{const d=await getFX(force===true);['USD','EUR'].forEach(c=>{const r=d.rates[c];if(r)setTk(c,{label:c,icon:ico(FLAG[c]),val:'₺'+fmt2(r.v),chg:r.chg})})}catch{}};
  const px=v=>'$'+v.toLocaleString('en-US',{maximumFractionDigits:v<100?2:0});
  const apply=(sym,price,chg)=>{const k=sym.slice(0,3);if(COIN[k]&&isFinite(price)){CRYPTO[sym]={price,chg};setTk(k,{label:k,icon:ico(COIN[k]),val:px(price),chg})}};
  const qs=encodeURIComponent(JSON.stringify(['BTCUSDT','ETHUSDT']));
  /* Kaynakları aynı anda dene, ilk cevap vereni kullan. */
  const cr=async()=>{
    const srcs=[
      ...['https://data-api.binance.vision','https://api.binance.com'].map(b=>getJSON(b+'/api/v3/ticker/24hr?symbols='+qs,5000).then(j=>()=>j.forEach(t=>apply(t.symbol,+t.lastPrice,+t.priceChangePercent)))),
      getJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',6000).then(g=>()=>{apply('BTCUSDT',g.bitcoin.usd,g.bitcoin.usd_24h_change);apply('ETHUSDT',g.ethereum.usd,g.ethereum.usd_24h_change)})
    ];
    try{const f=await Promise.any(srcs);f();status('cr',true)}catch{status('cr',false)}
  };
  /* Canlı akış: fiyatlar saniyede bir kendiliğinden güncellenir. */
  let ws=null,lastMsg=0;
  const wsLive=()=>!!ws&&ws.readyState===1&&Date.now()-lastMsg<20e3;
  const down=()=>{if(!ws)return;ws=null;if(STREAM_LIVE){STREAM_LIVE=false;paintRight()}setTimeout(openWS,6000)};
  const openWS=()=>{
    if(ws||!window.WebSocket)return;
    try{ws=new WebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker')}catch{ws=null;return}
    lastMsg=Date.now();
    ws.onmessage=e=>{try{const d=JSON.parse(e.data).data;if(d&&d.s){lastMsg=Date.now();apply(d.s,+d.c,(+d.c/+d.o-1)*100);status('cr',true);if(!STREAM_LIVE){STREAM_LIVE=true;paintRight()}}}catch{}};
    ws.onclose=down;ws.onerror=down;
  };
  const reWS=()=>{if(ws){try{ws.onclose=null;ws.onerror=null;ws.close()}catch{}ws=null}openWS()};
  const wx=async()=>{try{const j=await getJSON('https://api.open-meteo.com/v1/forecast?latitude='+place.lat+'&longitude='+place.lon+'&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7');if(j.daily&&j.daily.time){const d=j.daily;WXFC={p:place.name,days:d.time.slice(0,7).map((t,i)=>({t,c:d.weather_code[i],hi:d.temperature_2m_max[i],lo:d.temperature_2m_min[i],pp:d.precipitation_probability_max&&d.precipitation_probability_max[i]}))};LS.set('pano.tk.d',WXFC);paintFc()}setTk('wx',{svg:wxIcon(j.current.weather_code,j.current.is_day),place:place.name.split(',')[0],t:Math.round(j.current.temperature_2m)})}catch{}};
  /* Gecikme: küçük bir ping isteği, anında sonuç verir. İlk ölçüm bağlantı kurulumunu da içerir, ikincisi gerçek değeri gösterir. */
  const ping=async()=>{
    /* Tek bir sunucuya bağlı kalmasın (Binance bazı ağlarda engelli): küçük, hızlı yanıt veren birkaç adresten
       ilk cevap vereni ölçülür. no-cors: içeriği okumuyoruz, yalnızca yanıt süresini ölçüyoruz. */
    const one=u=>{const t0=performance.now();const c=new AbortController(),to=setTimeout(()=>c.abort(),4000);
      return fetch(u,{mode:'no-cors',cache:'no-store',signal:c.signal}).then(()=>Math.max(1,Math.round(performance.now()-t0))).finally(()=>clearTimeout(to))};
    try{setTk('ms',{ms:await Promise.any(['https://www.gstatic.com/generate_204','https://1.1.1.1/cdn-cgi/trace','https://data-api.binance.vision/api/v3/ping'].map(one))})}
    catch{setTk('ms',{ms:null})}
  };
  paintTicker();ping();cr();openWS();fx();wx();setTimeout(ping,1200);
  setInterval(()=>{const l=wsLive();if(l!==STREAM_LIVE){STREAM_LIVE=l;paintRight()}},5e3);
  /* WebSocket canlıyken kripto için ayrıca yoklama yapılmaz; yalnızca akış koptuğunda REST'e düşer. */
  const vis=f=>()=>{if(!document.hidden)f()};   /* gizli sekmede ağ isteği yok; dönünce refreshAll zaten yeniler */
  setInterval(vis(ping),60e3);setInterval(vis(fx),5*60e3);setInterval(vis(()=>{if(!wsLive())cr()}),30e3);setInterval(vis(wx),10*60e3);bus.addEventListener('place',wx);
  bus.addEventListener('refresh',()=>{fx(true);wx();ping();if(!wsLive()){reWS();cr()}});
}
