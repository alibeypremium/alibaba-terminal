'use strict';
/* AliBaba Terminal · computer.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Bilgisayar: retro monitörde Windows 98 simülatörü ---------- */
/* Simülatör (98.js.org) güç düğmesine basılınca yüklenir; başka sekmeye geçilince ya da düğmeyle kapatılınca boşaltılır. */
function mountPC(w,root,tabs){
  /* Kaynaklar: Windows 98 simülatörü (98.js.org), Windows XP (win32.run) ve piyasa terminali. Monitördeki tuşlarla seçilir. */
  const SRC={w98:{name:'Windows 98',url:'https://98.js.org/',dw:1024},xp:{name:'Windows XP',url:'https://win32.run/',dw:1280},eth:{name:'Borsa'}};
  let src=LS.get('pano.pc.src','w98');if(!SRC[src]||SRC[src].tab)src='w98';
  const curUrl=()=>SRC[src].url||'';
  root.innerHTML='<div class="pcw">'+hd('pc','Bilgisayar',tabs+'<button class="ibtn" type="button" id="pcfs" aria-label="Tam ekran" title="Tam ekran">'+I.full+'</button><a class="ibtn" id="pcx" href="'+(SRC[src].url||'#')+'" target="_blank" rel="noopener noreferrer" aria-label="Yeni sekmede aç" title="Yeni sekmede aç">'+I.ext+'</a>')+
   '<div class="pc-stage"><div class="pc-mon"><div class="pc-case"><span class="pc-vents"></span><div class="pc-lip"><div class="pc-bezel"><div class="pc-screen" id="pcs"></div></div></div>'+
   '<div class="pc-chin"><span class="pc-brand">AliBaba</span><span class="pc-model">Terminal</span><span class="pc-sp"></span><span class="pc-spk" aria-hidden="true"></span><span class="pc-keys"><button class="pc-k src" id="pck-s1" type="button" style="--lamp:#5cc8ff" title="Windows 98" aria-label="Windows 98"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.2c3-1.3 5.6-1.3 8.2-.2v6.3H3zM12.8 5.2c3 1.1 5.6 1 8.2-.2v6.3h-8.2zM3 12.8h8.2v6.2c-2.6-1.1-5.2-1.1-8.2.2zM12.8 12.8H21v6.4c-2.6 1.2-5.2 1.2-8.2.1z"/></svg></button><button class="pc-k src" id="pck-s7" type="button" style="--lamp:#52e0ff" title="Piyasa terminali" aria-label="Piyasa terminali"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v3M7 15v3M17 8v3M17 18v2"/><rect x="5" y="7" width="4" height="8" rx="1"/><rect x="15" y="11" width="4" height="7" rx="1"/></svg></button><button class="pc-k src" id="pck-s4" type="button" style="--lamp:#8ab4ff" title="Windows XP (win32.run)" aria-label="Windows XP (win32.run)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5c3-1.4 5.5-1.2 8-.2v6H3zM13 5.3c3 1.1 5.5.9 8-.3v6.2h-8zM3 12.8h8v6c-2.600-1.100-5.100-1.100-8 .3zM13 12.800h8v6.400c-2.800 1.200-5.300 1.200-8 .1z"/></svg></button><i class="pc-kd" aria-hidden="true"></i><button class="pc-k" id="pck-rs" type="button" style="--lamp:#ffb02e" title="Yeniden başlat" aria-label="Yeniden başlat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/></svg></button><button class="pc-k" id="pck-fs" type="button" style="--lamp:#4da3ff" title="Tam ekran" aria-label="Tam ekran"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button><button class="pc-k lit" id="pck-br" type="button" style="--lamp:#ffe066" title="Parlaklık" aria-label="Parlaklık"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg></button><button class="pc-k lit" id="pck-cr" type="button" style="--lamp:#52ff7a" title="CRT efekti" aria-label="CRT efekti"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="13" rx="3.5"/><path d="M8 10h8M8 13.5h8M9 21h6"/></svg></button></span><span class="pc-led" id="pcl"></span><button class="pc-pw" id="pcp" type="button" aria-pressed="false" aria-label="Güç düğmesi" title="Güç"></button></div></div>'+
   '<div class="pc-neck"></div><div class="pc-base"></div></div></div></div>';
  const scr=$('#pcs',root),led=$('#pcl',root),btn=$('#pcp',root),mon=$('.pc-mon',root);
  let on=false,frame=null,vp=null,rt=0;
  const idle=()=>{scr.innerHTML='<div class="pc-off">Güç düğmesine bas<br>'+SRC[src].name+' açılsın</div>'};
  /* ---------- Piyasa terminali (profesyonel finans terminali düzeni: siyah zemin, turuncu başlık, yoğun tablo) ---------- */
  let tTmr=0,tSel=0,tFx=null,tGold=null,tPax=null,tBist=null,tJpy=null,tAg=null;const tHist={};
  const gv=()=>tGold||(tPax&&tFx&&tFx.USD?tPax.p*tFx.USD.v/31.1035:null);   /* gram altın (TL) */
  const gc=()=>tPax&&tFx&&tFx.USD&&tFx.USD.chg!=null?((1+tPax.c/100)*(1+tFx.USD.chg/100)-1)*100:(tPax?tPax.c:null);
  const TAM=7.216*0.916;   /* Cumhuriyet tam altını: 7,216 g, 22 ayar ≈ 6,61 g saf altın; işçilik farkı dahil değil */
  const TP=[
    {g:'KRİPTO',k:'BTC/USD',dec:0,u:'SON 60 DAKİKA',f:()=>CRYPTO.BTCUSDT&&{v:CRYPTO.BTCUSDT.price,c:CRYPTO.BTCUSDT.chg}},
    {k:'ETH/USD',dec:2,u:'SON 60 DAKİKA',f:()=>CRYPTO.ETHUSDT&&{v:CRYPTO.ETHUSDT.price,c:CRYPTO.ETHUSDT.chg}},
    {g:'DÖVİZ',k:'USD/TRY',dec:4,u:'SON 24 GÜN',f:()=>tFx&&tFx.USD&&{v:tFx.USD.v,c:tFx.USD.chg}},
    {k:'EUR/TRY',dec:4,u:'SON 24 GÜN',f:()=>tFx&&tFx.EUR&&{v:tFx.EUR.v,c:tFx.EUR.chg}},
    {k:'JPY/TRY',dec:4,u:'SON 24 GÜN · 1 JPY',f:()=>tJpy&&{v:tJpy.v,c:tJpy.chg}},
    {g:'ENDEKS',k:'BIST 100',dec:2,u:'OTURUM',f:()=>tBist&&{v:tBist.v,c:tBist.c}},
    {g:'EMTİA',k:'GRAM ALTIN',dec:2,u:'SON 60 DAKİKA · TL',f:()=>gv()&&{v:gv(),c:gc()}},
    {k:'TAM ALTIN',dec:0,u:'SON 60 DAKİKA · TL · YAKLAŞIK',f:()=>gv()&&{v:gv()*TAM,c:gc()}},
    {k:'GRAM GÜMÜŞ',dec:2,u:'OTURUM · TL',f:()=>tAg&&{v:tAg,c:null}}
  ];
  const tFmt=(v,d)=>v==null||!isFinite(v)?'--':v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
  const tChg=c=>c==null||!isFinite(c)?'--':Math.abs(c)<.005?'0.00%':(c>=0?'+':'-')+Math.abs(c).toFixed(2)+'%';
  const tDir=c=>c==null||!isFinite(c)||Math.abs(c)<.005?'':c>0?'up':'dn';
  const tBase=()=>[['https://data-api.binance.vision'],['https://api.binance.com']].map(x=>x[0]);
  function termStop(){clearInterval(tTmr);tTmr=0}
  async function termBist(){
    try{
      const r=await fetch('https://scanner.tradingview.com/turkey/scan',{method:'POST',headers:{'content-type':'text/plain;charset=UTF-8'},body:JSON.stringify({symbols:{tickers:['BIST:XU100']},columns:['close','change']})});
      const j=await r.json(),d=j&&j.data&&j.data[0]&&j.data[0].d;if(d&&isFinite(d[0]))tBist={v:+d[0],c:+d[1]};
    }catch{}
  }
  async function termPax(){
    try{const j=await Promise.any(tBase().map(b=>getJSON(b+'/api/v3/ticker/24hr?symbol=PAXGUSDT',6000)));tPax={p:+j.lastPrice,c:+j.priceChangePercent}}catch{}
  }
  async function termAg(){
    const usd=tFx&&tFx.USD&&tFx.USD.v;if(!usd)return;
    try{const g=await getJSON('https://api.gold-api.com/price/XAG',7000);if(g&&g.price>0){tAg=usd*g.price/31.1035;return}}catch{}
    try{const e=await getJSON('https://open.er-api.com/v6/latest/USD',7000);if(e.rates&&e.rates.XAG)tAg=e.rates.TRY/e.rates.XAG/31.1035}catch{}
  }
  async function termJpy(first){
    try{
      const s0=new Date(Date.now()-35*864e5).toISOString().slice(0,10);
      const j=await getJSON('https://api.frankfurter.dev/v1/'+s0+'..?base=JPY&symbols=TRY');
      const days=Object.keys(j.rates).sort(),ser=days.map(d=>j.rates[d].TRY).slice(-24);
      const v=ser[ser.length-1],pv=ser[ser.length-2];tJpy={v,chg:pv?(v/pv-1)*100:null};
      if(first)tHist['JPY/TRY']={pts:ser,ok:1};
    }catch{
      try{const e=await getJSON('https://open.er-api.com/v6/latest/USD',7000);if(e.rates&&e.rates.JPY)tJpy={v:e.rates.TRY/e.rates.JPY,chg:null}}catch{}
    }
  }
  async function termLoad(first){
    try{const d=await getFX();tFx=d.rates;tGold=d.gold||tGold;
      const U=d.rates.USD&&d.rates.USD.ser,E=d.rates.EUR&&d.rates.EUR.ser;
      if(first&&U&&E){const n=Math.min(U.length,E.length),u=U.slice(-n),e=E.slice(-n);
        tHist['USD/TRY']={pts:u.slice(),ok:1};tHist['EUR/TRY']={pts:e.slice(),ok:1}}
    }catch{}
    await Promise.all([termPax(),termJpy(first),termAg()]);
    if(first){
      for(const [sym,k] of [['BTCUSDT','BTC/USD'],['ETHUSDT','ETH/USD'],['PAXGUSDT','GRAM ALTIN']]){
        try{const j=await Promise.any(tBase().map(b=>getJSON(b+'/api/v3/klines?symbol='+sym+'&interval=1m&limit=60',6000)));
          let pts=j.map(x=>+x[4]);
          if(k==='GRAM ALTIN'){const last=pts[pts.length-1],cur=gv();if(!(cur&&last))continue;const f=cur/last;pts=pts.map(x=>x*f);
            tHist['TAM ALTIN']={pts:pts.map(x=>x*TAM),ok:1,t:Date.now()}}
          tHist[k]={pts,ok:1,t:Date.now()}}catch{}
      }
    }
  }
  function termStart(){
    termStop();
    scr.innerHTML='<div class="pc-term"><div class="tm-h"><b>ALIBABA TERMINAL</b><em>PİYASALAR</em><span class="tm-clk"></span></div>'+
      '<div class="tm-b"><div class="tm-t"><div class="tm-r tm-hd"><span>SEMBOL</span><span>SON</span><span>% DEĞ</span></div>'+TP.map((p,i)=>(p.g?'<div class="tm-cat"><span>'+p.g+'</span><i></i></div>':'')+'<button type="button" class="tm-r" data-i="'+i+'"><span class="s">'+p.k+'</span><span class="v">--</span><span class="c">--</span></button>').join('')+'</div>'+
      '<div class="tm-c"><div class="tm-ch"><b class="tm-n"></b><span class="tm-l"></span><span class="tm-q"></span><u class="tm-live">CANLI</u></div><div class="tm-cw"><canvas></canvas><iframe class="tm-f" hidden title="BIST 100 grafiği" sandbox="allow-scripts allow-same-origin allow-popups" referrerpolicy="no-referrer"></iframe></div><div class="tm-s"></div></div></div>'+
      '<div class="tm-tape"><div class="tm-tr"></div></div></div>';
    const el=$('.pc-term',scr),rows=[...el.querySelectorAll('button.tm-r')],cv=$('canvas',el),clk=$('.tm-clk',el),tn=$('.tm-n',el),tl=$('.tm-l',el),tq=$('.tm-q',el),ts=$('.tm-s',el),tr=$('.tm-tr',el),tf=$('.tm-f',el);
    rows.forEach((r,i)=>r.addEventListener('click',()=>{tSel=i;paint();draw()}));
    let last=[],tfSet=false;
    function paint(){
      let tape='';
      TP.forEach((p,i)=>{
        const x=p.f()||null,r=rows[i],dir=x?tDir(x.c):'';
        r.classList.toggle('sel',i===tSel);
        $('.v',r).textContent=x?tFmt(x.v,p.dec):'--';
        const c=$('.c',r);c.textContent=x?tChg(x.c):'--';c.className='c '+dir;
        if(x&&last[i]!=null&&x.v!==last[i]){const v=$('.v',r);v.classList.remove('fl','fu','fd');void v.offsetWidth;v.classList.add('fl',x.v>last[i]?'fu':'fd')}
        last[i]=x?x.v:null;
        const h=tHist[p.k]||(tHist[p.k]={pts:[],ok:0});
        if(x&&isFinite(x.v)){
          if(!h.ok){if(!h.t||Date.now()-h.t>5000){h.pts.push(x.v);h.t=Date.now();if(h.pts.length>120)h.pts.shift()}}
          else if(h.pts.length){h.pts[h.pts.length-1]=x.v;if(h.t&&Date.now()-h.t>60e3){h.pts.push(x.v);h.pts.shift();h.t=Date.now()}}
        }
        tape+='<span>'+p.k+' <b>'+(x?tFmt(x.v,p.dec):'--')+'</b> <i class="'+dir+'">'+(x?tChg(x.c):'')+'</i></span>';
      });
      if(tr.getAttribute('data-k')!==tape){tr.setAttribute('data-k',tape);tr.innerHTML=tape+tape}
      const t=z=>new Date().toLocaleTimeString('en-GB',{timeZone:z,hour12:false});
      clk.innerHTML='İST '+t('Europe/Istanbul')+'<span class="nyc"> &nbsp;NYC '+t('America/New_York')+'</span>';
    }
    function draw(){
      const p=TP[tSel],x=p.f(),h=tHist[p.k],pts=h?h.pts:[];
      const bistFb=p.k==='BIST 100'&&!tBist;   /* BIST verisi alınamadıysa resmi TradingView grafiğini göster */
      if(bistFb&&!tfSet){tfSet=true;tf.srcdoc='<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}.tradingview-widget-container,.tradingview-widget-container__widget{height:100%;width:100%}</style></head><body><div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div><script src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>{"autosize":true,"symbol":"BIST:XU100","interval":"D","timezone":"Europe/Istanbul","theme":"dark","style":"1","locale":"tr","backgroundColor":"rgba(0,0,0,1)","gridColor":"rgba(255,157,26,0.08)","hide_side_toolbar":true,"allow_symbol_change":false,"save_image":false,"calendar":false,"support_host":"https://www.tradingview.com"}<\/script></div></body></html>'}
      tf.hidden=!bistFb;cv.style.visibility=bistFb?'hidden':'';
      tn.textContent=p.k;tl.textContent=x?tFmt(x.v,p.dec):'--';tl.className='tm-l '+(x?tDir(x.c):'');tq.textContent=x?tChg(x.c):'';tq.className='tm-q '+(x?tDir(x.c):'');
      const W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
      const dpr=Math.min(2,window.devicePixelRatio||1);
      if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}
      const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
      if(bistFb){ts.textContent='GÜNLÜK · TRADINGVIEW';return}
      g.strokeStyle='rgba(255,157,26,.13)';g.lineWidth=1;
      for(let i=1;i<4;i++){const y=Math.round(H*i/4)+.5;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
      for(let i=1;i<8;i++){const xx=Math.round(W*i/8)+.5;g.beginPath();g.moveTo(xx,0);g.lineTo(xx,H);g.stroke()}
      if(pts.length<2){g.fillStyle='#ff9d1a';g.font='11px "Lucida Console",monospace';g.textAlign='center';g.fillText('VERİ TOPLANIYOR…',W/2,H/2);ts.textContent=p.u;return}
      let mn=Math.min(...pts),mx=Math.max(...pts);if(mx===mn){mx+=1;mn-=1}
      const pad=(mx-mn)*.1;mn-=pad;mx+=pad;
      const X=i=>i*(W-1)/(pts.length-1),Y=v=>H-3-(v-mn)/(mx-mn)*(H-6);
      const lastv=pts[pts.length-1],up=lastv>=pts[0],col=up?'#18d46a':'#ff4a3d';
      const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,up?'rgba(24,212,106,.28)':'rgba(255,74,61,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');
      g.beginPath();pts.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));
      g.lineTo(W,H);g.lineTo(0,H);g.closePath();g.fillStyle=gr;g.fill();
      g.beginPath();pts.forEach((v,i)=>i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v)));
      g.strokeStyle=col;g.lineWidth=1.5;g.lineJoin='round';g.stroke();
      const avg0=pts.reduce((a,b)=>a+b,0)/pts.length;
      g.strokeStyle='rgba(255,157,26,.55)';g.lineWidth=1;g.setLineDash([4,3]);g.beginPath();g.moveTo(0,Y(avg0)+.5);g.lineTo(W,Y(avg0)+.5);g.stroke();g.setLineDash([]);
      const sw=Math.max(4,Math.round(pts.length/5));g.beginPath();let st=false;
      pts.forEach((v,i)=>{if(i<sw-1)return;let s=0;for(let k=i-sw+1;k<=i;k++)s+=pts[k];s/=sw;st?g.lineTo(X(i),Y(s)):(g.moveTo(X(i),Y(s)),st=true)});
      g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1;g.stroke();
      const tg=tFmt(lastv,p.dec);g.font='bold 10px "Lucida Console",monospace';const tw=g.measureText(tg).width+8,ty=Math.max(1,Math.min(H-13,Y(lastv)-6));
      g.fillStyle=col;g.fillRect(W-tw,ty,tw,12);g.fillStyle='#000';g.textAlign='left';g.fillText(tg,W-tw+4,ty+9);
      g.fillStyle='#ff9d1a';g.font='9px "Lucida Console",monospace';g.fillText('— ORT',4,10);g.fillStyle='rgba(255,255,255,.8)';g.fillText('— SMA',46,10);
      const o=pts[0],hi=Math.max(...pts),lo=Math.min(...pts),avg=pts.reduce((a,b)=>a+b,0)/pts.length,dc=(lastv/o-1)*100,rg=lo?(hi/lo-1)*100:0;
      ts.innerHTML='<div class="u">'+p.u+'</div><div class="g"><span><em>AÇ</em>'+tFmt(o,p.dec)+'</span><span><em>Y</em><b class="up">'+tFmt(hi,p.dec)+'</b></span><span><em>D</em><b class="dn">'+tFmt(lo,p.dec)+'</b></span><span><em>ORT</em>'+tFmt(avg,p.dec)+'</span><span><em>DÖN</em><b class="'+(dc>=0?'up':'dn')+'">'+tChg(dc)+'</b></span><span><em>ARALIK</em>'+rg.toFixed(2)+'%</span></div>';
    }
    paint();draw();
    termLoad(true).then(()=>{if(tTmr){paint();draw()}});termBist().then(()=>{if(tTmr){paint();draw()}});
    let n=0;tTmr=setInterval(()=>{paint();draw();n++;if(n%60===0)termLoad(false);if(n%20===0||(!tBist&&n%10===0))termBist()},1000);
  }
  function power(v){
    if(v===on)return;on=v;
    led.classList.toggle('on',v);$('.pc-mon',root).classList.toggle('on',v);btn.setAttribute('aria-pressed',v?'true':'false');
    if(frame){try{frame.src='about:blank'}catch{}frame=null}
    if(vp){vp.remove();vp=null}
    termStop();
    if(!v){idle();return}
    scr.classList.remove('pwr');void scr.offsetWidth;scr.classList.add('pwr');setTimeout(()=>scr.classList.remove('pwr'),800);
    if(src==='eth'){scr.innerHTML='';termStart();return}
    scr.innerHTML='<div class="pc-off boot">'+SRC[src].name+' başlatılıyor…'+(SRC[src].doc?'':'<br><span style="opacity:.6;font-size:10.5px">Açılmazsa sağ üstten yeni sekmede aç</span>')+'</div>';
    frame=document.createElement('iframe');
    frame.title=SRC[src].name;if(SRC[src].doc)frame.srcdoc=SRC[src].doc;else frame.src=curUrl();
    frame.allow='autoplay; fullscreen; gamepad; clipboard-read; clipboard-write';frame.allowFullscreen=true;
    frame.referrerPolicy='no-referrer';
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals');
    vp=document.createElement('div');vp.className='pc-vp';vp.appendChild(frame);scr.appendChild(vp);fit();
  }
  /* Simülatör büyük bir sanal çözünürlükte çalışır, ekrana sığacak kadar küçültülür: ikonlar ekranı kaplamaz. Tam ekranda gerçek boyut. */
  function fit(){
    if(!vp)return;
    const W=scr.clientWidth,H=scr.clientHeight;if(!W||!H)return;
    const fs=document.fullscreenElement===scr||document.webkitFullscreenElement===scr;
    if(SRC[src].vw){   /* oyun sayfaları 4:3 çalışır: ekranın ortasına 4:3 kutu oturt, kenarlar siyah kalır */
      const bw=Math.min(W,H*4/3),bh=bw*3/4,k=bw/720;
      vp.style.width='720px';vp.style.height='540px';vp.style.transform='scale('+k+')';
      vp.style.left=Math.round((W-bw)/2)+'px';vp.style.top=Math.round((H-bh)/2)+'px';return;
    }
    vp.style.left='0';vp.style.top='0';
    const vw=fs?W:SRC[src].dw?SRC[src].dw:SRC[src].doc?Math.round(Math.max(420,Math.min(900,W))):Math.round(Math.max(480,Math.min(1100,W*1.5))),k=W/vw;
    vp.style.width=vw+'px';vp.style.height=Math.round(H/k)+'px';vp.style.transform='scale('+k+')';
  }
  if(window.ResizeObserver)new ResizeObserver(fit).observe(scr);
  document.addEventListener('fullscreenchange',fit);document.addEventListener('webkitfullscreenchange',fit);
  btn.addEventListener('click',()=>power(!on));
  $('#pcfs',root).addEventListener('click',()=>{
    if(!on)power(true);
    const f=scr.requestFullscreen||scr.webkitRequestFullscreen;
    const fb=()=>{if(curUrl())window.open(curUrl(),'_blank','noopener')};
    if(f){Promise.resolve(f.call(scr)).catch(fb)}else fb();
  });
  /* Işıklı tuşlar: yeniden başlat (turuncu) · tam ekran (mavi) · parlaklık (sarı, 3 kademe) · CRT efekti (yeşil) */
  const kRs=$('#pck-rs',root),kFs=$('#pck-fs',root),kBr=$('#pck-br',root),kCr=$('#pck-cr',root);
  const BR=[1,1.3,.8],LO=[.7,1,.4];
  let br=(+LS.get('pano.pc.br',0))%3||0,crt=LS.get('pano.pc.crt',true)!==false;
  const paintKeys=()=>{
    scr.style.setProperty('--br',BR[br]);kBr.style.setProperty('--lo',LO[br]);kBr.title='Parlaklık: '+['normal','yüksek','düşük'][br];
    mon.classList.toggle('nocrt',!crt);kCr.classList.toggle('lit',crt);kCr.title='CRT efekti: '+(crt?'açık':'kapalı');
  };
  const isFs=()=>document.fullscreenElement===scr||document.webkitFullscreenElement===scr;
  const paintFs=()=>kFs.classList.toggle('lit',isFs());
  kBr.addEventListener('click',()=>{br=(br+1)%3;LS.set('pano.pc.br',br);paintKeys()});
  kCr.addEventListener('click',()=>{crt=!crt;LS.set('pano.pc.crt',crt);paintKeys()});
  kFs.addEventListener('click',()=>$('#pcfs',root).click());
  kRs.addEventListener('click',()=>{
    clearTimeout(rt);kRs.classList.add('lit');
    if(on){power(false);rt=setTimeout(()=>{power(true);setTimeout(()=>kRs.classList.remove('lit'),900)},450)}
    else{power(true);rt=setTimeout(()=>kRs.classList.remove('lit'),900)}
  });
  document.addEventListener('fullscreenchange',paintFs);document.addEventListener('webkitfullscreenchange',paintFs);
  const kS={w98:$('#pck-s1',root),eth:$('#pck-s7',root),xp:$('#pck-s4',root)},ext=$('#pcx',root);
  const paintSrc=()=>{Object.keys(kS).forEach(k=>{kS[k].classList.toggle('lit',k===src);kS[k].classList.toggle('sel',k===src)});ext.href=curUrl()||'#';ext.style.display=curUrl()?'':'none';mon.classList.toggle('blk',src==='eth');w.dataset.term=src==='eth'?'1':'0';if(!on)idle()};
  const pick=k=>{
    clearTimeout(rt);
    if(k===src){
      if(!on){power(true);return}
      return;
    }
    src=k;LS.set('pano.pc.src',k);
    if(on){power(false);power(true)}else power(true);
    paintSrc();
  };
  ['w98','eth','xp'].forEach(k=>kS[k].addEventListener('click',()=>pick(k)));
  paintKeys();paintFs();
  idle();paintSrc();
  return{off(){clearTimeout(rt);kRs.classList.remove('lit');power(false)},on(){},dispose(){clearTimeout(rt);termStop();power(false)}};
}
