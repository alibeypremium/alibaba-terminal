'use strict';
/* AliBaba Terminal · radio.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Radyo: tek bir oynatıcı motoru (RADIO) + onu gösteren iki arayüz: Radyo widget'ı ve üst çubuktaki Radyo çipi ---------- */
/* Yalnızca bu kanallar. Yayın adresleri sabit (fix) ve sırayla denenir; dizin aramasına bağlı değil: dizindeki kayıtlar sık bozuluyordu. */
const RADIO_CH=[
  {k:'ht',name:'Habertürk',q:[],re:/^$/,c:'#d71920',fix:['https://haberturkradyo.radyotvonline.net/haberturkradyo'],logo:'https://yt3.ggpht.com/SqaSrx9HvlbnpXqfrsyqJOpL3uHHi3GQ3htT3gPdP3S8yebiy4iVPrZ4Ai1wQnNoHv7aUBLIeEE=s96-c-k-c0x00ffffff-no-rj'},
  /* NTV Radyo: dizindeki kayıtlar yalnızca http (https sayfada açılmaz), biri de .pls. Resmî https HLS yayını sabit verildi. */
  {k:'ntv',name:'NTV',q:[],re:/^$/,c:'#2f7fd1',logo:'https://yt3.ggpht.com/wwJNZ3QBI5ojqIlQvsInUIwIuSQH-lhQaqv_-WR7gYvEqa6WNEfpdiTls8z30QIxQMFbTBUQ0Q=s96-c-k-c0x00ffffff-no-rj',fix:['https://dygedge.radyotvonline.net/ntvradyo/playlist.m3u8']},
  {k:'odtu',name:'ODTÜ',q:[],re:/^$/,c:'#ff9d1a',fix:['https://stream3.radyoodtu.com.tr:8000/;','https://stream.radyoodtu.com.tr/;'],mono:'ODTÜ',logo:'https://tr.wikipedia.org/wiki/Special:FilePath/Orta_Do%C4%9Fu_Teknik_%C3%9Cniversitesi.png?width=96',fit:1}   /* ODTÜ'nün amblemi (Vikipedi): beyaz zeminli resim, yuvarlak etiketi dolduracak şekilde büyütülüp kırpılır; yüklenmezse baş harf rozeti */
];

const RADIO=(()=>{
  const CH=RADIO_CH,map={};
  CH.forEach(c=>{map[c.k]={id:'fix-'+c.k,name:c.name+' Radyo',url:c.fix[0],urls:c.fix.slice(),br:0}});
  const subs=new Set(),emit=()=>subs.forEach(f=>{try{f()}catch{}});
  let state='idle',vol=+LS.get('pano.radio.vol',.7);if(!(vol>=0&&vol<=1))vol=.7;
  const lastK=LS.get('pano.radio.last','');let cur=CH.find(c=>c.k===lastK)||null;
  const audio=new Audio();audio.preload='none';audio.volume=vol;
  let hls=null,gen=0,tryIdx=0,stT=0,retry=0,lastCT=-1,quiet=0,ign=0;
  const killHls=()=>{gen++;if(hls){try{hls.destroy()}catch{}hls=null}};
  const set=s=>{state=s;if('mediaSession' in navigator&&cur){try{navigator.mediaSession.metadata=new MediaMetadata({title:cur.name,artist:'AliBaba Radyo'})}catch{}}emit()};
  function play(c){
    cur=c;LS.set('pano.radio.last',c.k);
    const s=map[c.k];
    if(!s){set('na');audio.pause();return}
    tryIdx=0;retry=0;quiet=0;lastCT=-1;set('load');start(s);
  }
  /* Canlı yayında tarayıcı yalnızca ~2 sn tampon tutar; ağda küçük bir aksama yayını kalıcı olarak dondurabiliyor.
     Bu yüzden takılma (bekleme/durgunluk/ilerlemeyen saat) fark edilince aynı yayına otomatik yeniden bağlanılır. */
  const clearWd=()=>{clearTimeout(stT);stT=0};
  const armWd=ms=>{clearWd();stT=setTimeout(()=>{stT=0;if(state==='load'||state==='play')reconnect()},ms)};
  function reconnect(){
    const s=cur&&map[cur.k];if(!s)return;
    const list=s.urls&&s.urls.length?s.urls:[s.url];
    if(retry>=10){clearWd();set('err');return}
    retry++;if(retry>1&&retry%2===1)tryIdx=(tryIdx+1)%list.length;   /* her ikinci denemede sıradaki adrese geç */
    quiet=0;lastCT=-1;set('load');start(s);
  }
  function start(s){
    const list=s.urls&&s.urls.length?s.urls:[s.url];
    const u=list[tryIdx];
    killHls();audio.volume=vol;ign=Date.now();armWd(12000);
    /* HLS (.m3u8): hls.js destekleniyorsa o çalar (canPlayType Chrome'da "maybe" deyip yine de açmıyor);
       MSE olmayan iPhone Safari'de yerel HLS kullanılır. */
    if(/\.m3u8(\?|$)/i.test(u)){
      const my=gen;
      loadHls().then(H=>{
        if(my!==gen)return;   /* bu arada durduruldu ya da başka kanal seçildi */
        if(H&&H.isSupported()){
          hls=new H({maxBufferLength:20});hls.loadSource(u);hls.attachMedia(audio);
          hls.on(H.Events.MANIFEST_PARSED,()=>{audio.play().catch(()=>fail())});
          hls.on(H.Events.ERROR,(_,d)=>{if(d.fatal)fail()});
        }else{audio.src=u;audio.play().catch(()=>fail())}
      }).catch(()=>{if(my===gen)fail()});
      return;
    }
    audio.src=u;
    audio.play().catch(()=>fail());
  }
  function fail(){
    const s=cur&&map[cur.k];if(!s)return;
    const list=s.urls&&s.urls.length?s.urls:[s.url];
    if(state==='play'){reconnect();return}
    if(state==='load'&&tryIdx<list.length-1){tryIdx++;start(s);return}
    if(state==='load')reconnect()
  }
  audio.addEventListener('playing',()=>{clearWd();retry=0;quiet=0;set('play')});
  audio.addEventListener('waiting',()=>{if(state==='play'){set('load');armWd(4000)}});
  audio.addEventListener('stalled',()=>{if((state==='play'||state==='load')&&!stT)armWd(8000)});
  audio.addEventListener('error',()=>{if(cur&&map[cur.k])fail()});
  audio.addEventListener('pause',()=>{if(Date.now()-ign<1000)return;if(state==='play'||state==='load'){clearWd();set('idle')}});
  setInterval(()=>{   /* çalarken saat ilerlemiyorsa (10 sn) yayın donmuştur */
    if(state!=='play'||audio.paused)return;
    const t=audio.currentTime;if(t===lastCT){if(++quiet>=2)reconnect()}else{quiet=0;lastCT=t}
  },5000);
  const stop=()=>{clearWd();killHls();audio.pause();set('idle')};
  return{
    ch:CH,
    get cur(){return cur},get state(){return state},get vol(){return vol},
    br:()=>{const s=cur&&map[cur.k];return s?+s.br||0:0},
    ready:c=>!!map[c.k],
    play,stop,
    toggle(){if(!cur){play(CH[0]);return}if(state==='play'||state==='load')stop();else play(cur)},
    step(d){const i=cur?CH.findIndex(c=>c.k===cur.k):-1;play(CH[(i+d+CH.length)%CH.length])},
    setVol(v){vol=Math.max(0,Math.min(1,Math.round(v*100)/100));audio.volume=vol;LS.set('pano.radio.vol',vol);emit()},
    on(fn){subs.add(fn);return()=>subs.delete(fn)},
  };
})();

const RD_PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',RD_PAUSE='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const rdLg=(c,big)=>'<span class="rd-lg" style="--c:'+c.c+(c.fit?';background:#c8102e':'')+'">'+esc(big?(c.mono||c.name.slice(0,1)):c.name.slice(0,1))+(c.logo?'<img src="'+esc(c.logo)+'" alt="" referrerpolicy="no-referrer"'+(c.fit?' style="inset:auto;left:-5%;top:-3%;width:127%;height:106%;object-fit:fill"':'')+'>':'')+'</span>';   /* kanal rozeti: altta baş harf, üstte logo (yüklenmezse kaldırılır) */
const rdStatus=(cur,state,br)=>({idle:cur?'Durdu':'Hazır',load:'<span class="rd-spin" aria-hidden="true"></span>Bağlanıyor…',play:'<span class="rd-badge"><i></i>CANLI</span>'+(br?'<span class="rd-br">'+br+' kbps</span>':''),err:'Bu yayın açılmadı',na:'Yayın adresi bulunamadı'})[state];
const RD_EQ='<span class="rd-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';

/* ---------- Radyo widget'ı ---------- */
function mountRadio(w,root){
  const CH=RADIO.ch;
  root.innerHTML='<div class="rd"><div class="rd-now"><div class="rd-disc" aria-hidden="true"></div><div class="rd-inf"><b class="rd-nm">Bir kanal seç</b><span class="rd-sl">'+RD_EQ+'<span class="rd-st">Hazır</span></span></div>'+
    '<div class="rd-tr"><button class="rd-sk rd-pv" type="button" aria-label="Önceki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5v14L10 12z"/></svg></button><button class="rd-pl" type="button" aria-label="Çal / durdur"></button><button class="rd-sk rd-nx" type="button" aria-label="Sonraki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10-7z"/></svg></button></div></div>'+
    '<div class="rd-ctl"><div class="rd-list noscroll"></div>'+
    '<div class="rd-vol" title="Ses (fare tekerleği de çalışır)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/></svg><input type="range" min="0" max="100" aria-label="Ses"></div>'+'</div></div>';
  const $r=s=>$(s,root),disc=$r('.rd-disc'),nm=$r('.rd-nm'),stt=$r('.rd-st'),pl=$r('.rd-pl'),lst=$r('.rd-list'),rng=$r('.rd-vol input'),box=$r('.rd');
  let flashT=0,flashUntil=0;
  const dot=c=>'<i class="rd-dot" style="--c:'+c.c+'"></i>';   /* kanal düğmelerinde renkli nokta; logo yalnızca plakta */
  const lg=rdLg;
  root.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.remove()},true);
  lst.innerHTML=CH.map(c=>'<button type="button" class="rd-it" data-k="'+c.k+'" title="'+esc(c.name)+'">'+dot(c)+'<span class="rd-n">'+esc(c.name)+'</span></button>').join('');
  let lastK=null;
  function paint(){
    const cur=RADIO.cur,state=RADIO.state,br=RADIO.br();
    nm.textContent=cur?cur.name:'Bir kanal seç';
    if(Date.now()>=flashUntil){
      stt.innerHTML=rdStatus(cur,state,br);stt.className='rd-st '+(state==='err'||state==='na'?'err':'');
    }
    const k=cur?cur.k:'';if(k!==lastK){lastK=k;disc.innerHTML=cur?lg(cur,true):'<span class="rd-lg rd-lg0">♪</span>'}
    pl.innerHTML=state==='play'||state==='load'?RD_PAUSE:RD_PLAY;
    box.classList.toggle('live',state==='play');
    if(document.activeElement!==rng)rng.value=Math.round(RADIO.vol*100);
    root.querySelectorAll('.rd-it').forEach(b=>b.classList.toggle('on',!!cur&&b.dataset.k===cur.k));
    const on=lst.querySelector('.rd-it.on');if(on&&on.scrollIntoView&&k!==paint._k){paint._k=k;try{on.scrollIntoView({block:'nearest',inline:'nearest'})}catch{}}
  }
  const off=RADIO.on(paint);
  w._dispose=()=>{off();clearTimeout(flashT)};   /* widget kapansa da yayın üst çubuktaki oynatıcıdan sürer */
  pl.addEventListener('click',()=>RADIO.toggle());
  $r('.rd-pv').addEventListener('click',()=>RADIO.step(-1));$r('.rd-nx').addEventListener('click',()=>RADIO.step(1));
  rng.addEventListener('input',()=>RADIO.setVol(rng.value/100));
  lst.addEventListener('click',e=>{const b=e.target.closest('.rd-it');if(b)RADIO.play(CH.find(c=>c.k===b.dataset.k))});
  /* fare tekerleği sesi ayarlar (aşağı = kıs) */
  root.addEventListener('wheel',e=>{
    if(!e.target.closest('.rd'))return;
    e.preventDefault();RADIO.setVol(RADIO.vol-Math.sign(e.deltaY)*.05);
    flashUntil=Date.now()+1200;stt.className='rd-st';stt.textContent='Ses %'+Math.round(RADIO.vol*100);clearTimeout(flashT);flashT=setTimeout(()=>{flashUntil=0;paint()},1250);
  },{passive:false});
  paint();
}

/* ---------- Üst çubuktaki Radyo çipi (#sbRd) ve tıklayınca açılan küçük panel (#radioPop) ----------
   Çip topbar.js tarafından yazılır; burada yalnızca boyanır, olaylar belge düzeyinde dinlenir. Panel: kanallar, çal/durdur, ses. */
function radioChipPaint(){
  const el=document.getElementById('sbRd');if(!el)return;
  const cur=RADIO.cur,st=RADIO.state;
  el.dataset.state=st;
  const nm=el.querySelector('.sb-rdn');
  if(!(Date.now()<radioChipPaint.flash)){const t=cur?cur.name:'Radyo';if(nm.textContent!==t)nm.textContent=t}
  el.setAttribute('aria-label','Radyo: '+(cur?cur.name+', ':'')+({idle:'durdu',load:'bağlanıyor',play:'canlı',err:'yayın açılmadı',na:'yayın yok'})[st]+'. Paneli aç');
  el.title='Radyo'+(cur?': '+cur.name:'')+'\nFare tekerleği: ses (%'+Math.round(RADIO.vol*100)+')';
}
const rpEl=()=>document.getElementById('radioPop');
let rpOff=null;
function rpPaint(){
  const pop=rpEl();if(!pop||pop.hidden)return;
  const cur=RADIO.cur,st=RADIO.state,on=st==='play'||st==='load',q=s=>pop.querySelector(s);
  q('.rp-nm').textContent=cur?cur.name+' Radyo':'Bir kanal seç';
  q('.rp-st').innerHTML=rdStatus(cur,st,RADIO.br());q('.rp-st').className='rp-st'+(st==='err'||st==='na'?' err':'');
  const k=cur?cur.k:'';const d=q('.rp-disc');if(d._k!==k){d._k=k;d.innerHTML=cur?rdLg(cur,true):'<span class="rd-lg rd-lg0">♪</span>'}
  q('.rp-pl').innerHTML=on?RD_PAUSE:RD_PLAY;q('.rp-pl').setAttribute('aria-label',on?'Durdur':'Çal');
  pop.classList.toggle('live',st==='play');
  const r=q('.rp-vol input');if(document.activeElement!==r)r.value=Math.round(RADIO.vol*100);
  q('.rp-vp').textContent='%'+Math.round(RADIO.vol*100);
  pop.querySelectorAll('.rp-it').forEach(b=>{const x=!!cur&&b.dataset.k===cur.k;b.classList.toggle('on',x);b.setAttribute('aria-pressed',x?'true':'false')});
}
function rpClose(){
  const pop=rpEl();if(!pop||pop.hidden)return;
  pop.hidden=true;if(rpOff){rpOff();rpOff=null}
  const c=document.getElementById('sbRd');if(c)c.setAttribute('aria-expanded','false');
}
function rpOpen(){
  const pop=rpEl(),chip=document.getElementById('sbRd');if(!pop||!chip)return;
  const cp=document.getElementById('cityPop');if(cp)cp.hidden=true;
  if(!pop.firstChild)pop.innerHTML='<div class="rp-hd"><div class="rp-disc rd-disc" aria-hidden="true"></div><div class="rp-inf"><b class="rp-nm"></b><span class="rp-sl"><span class="rd-eq rp-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="rp-st"></span></span></div></div>'+
    '<div class="rp-tr"><button type="button" class="rp-sk" data-a="pv" aria-label="Önceki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5v14L10 12z"/></svg></button><button type="button" class="rp-pl" data-a="pl"></button><button type="button" class="rp-sk" data-a="nx" aria-label="Sonraki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10-7z"/></svg></button></div>'+
    '<div class="rp-vol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/></svg><input type="range" min="0" max="100" aria-label="Ses"><span class="rp-vp"></span></div>'+
    '<div class="rp-list">'+RADIO.ch.map(c=>'<button type="button" class="rp-it" data-k="'+c.k+'"><i class="rd-dot" style="--c:'+c.c+'"></i>'+esc(c.name)+'</button>').join('')+'</div>';
  pop.hidden=false;rpPaint();rpOff=RADIO.on(rpPaint);
  chip.setAttribute('aria-expanded','true');
  /* paneli çipin altına hizala, ekrandan taşırma */
  const sb=pop.offsetParent?pop.offsetParent.getBoundingClientRect():{left:0},c=chip.getBoundingClientRect(),w=pop.offsetWidth;
  const abs=Math.max(12,Math.min(c.left,innerWidth-12-w));
  pop.style.right='auto';pop.style.left=(abs-sb.left)+'px';
}
RADIO.on(radioChipPaint);
document.addEventListener('click',e=>{
  const t=e.target,pop=rpEl();
  if(t.closest&&t.closest('#sbRd')){e.stopPropagation();pop&&pop.hidden?rpOpen():rpClose();return}
  if(pop&&!pop.hidden){
    if(!(t.closest&&t.closest('#radioPop'))){rpClose();return}
    const a=t.closest('[data-a]'),it=t.closest('.rp-it');
    if(a){const k=a.dataset.a;if(k==='pl')RADIO.toggle();else RADIO.step(k==='nx'?1:-1)}
    else if(it)RADIO.play(RADIO.ch.find(c=>c.k===it.dataset.k));
  }
});
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('#radioPop .rp-vol input'))RADIO.setVol(e.target.value/100)});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const p=rpEl();if(p&&!p.hidden){rpClose();const c=document.getElementById('sbRd');c&&c.focus()}}
  else if((e.key==='Enter'||e.key===' ')&&e.target.id==='sbRd'){e.preventDefault();e.target.click()}
});
document.addEventListener('wheel',e=>{
  const c=e.target.closest&&(e.target.closest('#sbRd')||e.target.closest('#radioPop'));if(!c)return;
  e.preventDefault();RADIO.setVol(RADIO.vol-Math.sign(e.deltaY)*.05);
  if(c.id==='sbRd'){radioChipPaint.flash=Date.now()+1200;c.querySelector('.sb-rdn').textContent='Ses %'+Math.round(RADIO.vol*100);
    clearTimeout(radioChipPaint.t);radioChipPaint.t=setTimeout(()=>{radioChipPaint.flash=0;radioChipPaint()},1250)}
},{passive:false});
