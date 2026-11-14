'use strict';
/* AliBaba Terminal · radio.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Radyo (yayın adresleri Radio Browser dizininden çözülür; <audio> ile çalar) ---------- */
function mountRadio(w,root){
  const MIRRORS=['https://de1.api.radio-browser.info','https://nl1.api.radio-browser.info','https://at1.api.radio-browser.info'];
  const secure=location.protocol==='https:';
  /* Yalnızca bu kanallar. Yayın adresleri sabit (fix) ve sırayla denenir; dizin aramasına bağlı değil: dizindeki kayıtlar sık bozuluyordu. */
  const CH=[
    {k:'ht',name:'Habertürk',q:[],re:/^$/,c:'#d71920',fix:['https://haberturkradyo.radyotvonline.net/haberturkradyo'],logo:'https://yt3.ggpht.com/SqaSrx9HvlbnpXqfrsyqJOpL3uHHi3GQ3htT3gPdP3S8yebiy4iVPrZ4Ai1wQnNoHv7aUBLIeEE=s96-c-k-c0x00ffffff-no-rj'},
    /* NTV Radyo: dizindeki kayıtlar yalnızca http (https sayfada açılmaz), biri de .pls. Resmî https HLS yayını sabit verildi. */
    {k:'ntv',name:'NTV',q:[],re:/^$/,c:'#2f7fd1',logo:'https://yt3.ggpht.com/wwJNZ3QBI5ojqIlQvsInUIwIuSQH-lhQaqv_-WR7gYvEqa6WNEfpdiTls8z30QIxQMFbTBUQ0Q=s96-c-k-c0x00ffffff-no-rj',fix:['https://dygedge.radyotvonline.net/ntvradyo/playlist.m3u8']},
    {k:'odtu',name:'ODTÜ',q:[],re:/^$/,c:'#ff9d1a',fix:['https://stream3.radyoodtu.com.tr:8000/;','https://stream.radyoodtu.com.tr/;'],mono:'ODTÜ',logo:'https://tr.wikipedia.org/wiki/Special:FilePath/Orta_Do%C4%9Fu_Teknik_%C3%9Cniversitesi.png?width=96',fit:1}   /* ODTÜ'nün amblemi (Vikipedi): beyaz zeminli resim, yuvarlak etiketi dolduracak şekilde büyütülüp kırpılır; yüklenmezse baş harf rozeti */
  ];
  const norm=s=>({id:s.stationuuid,name:(s.name||'').trim().replace(/\s+/g,' '),url:s.url_resolved||s.url,alt:s.url,fav:s.favicon||'',br:s.bitrate||0,clk:s.clickcount||0});
  const up=u=>secure?String(u).replace(/^http:/i,'https:'):u;
  const good=s=>s.url&&s.name&&!/\.m3u8?(\?|$)/i.test(s.url);
  const search=async q=>{const p='/json/stations/search?name='+encodeURIComponent(q)+'&countrycode=TR&hidebroken=true&order=clickcount&reverse=true&limit=60';const j=await Promise.any(MIRRORS.map(m=>getJSON(m+p,8000)));return j.filter(s=>s.hls!==1).map(norm).filter(good)};
  let map={},cur=null,state='idle',vol=+LS.get('pano.radio.vol',.7);if(!(vol>=0&&vol<=1))vol=.7;
  const fixed=c=>({id:'fix-'+c.k,name:c.name+' Radyo',url:c.fix[0],urls:c.fix.slice(),fav:'',br:0});
  CH.forEach(c=>{if(c.fix)map[c.k]=fixed(c)});   /* sabit yayınlar önbellekteki eski kayıtların üstüne yazılır */
  const lastK=LS.get('pano.radio.last','');cur=CH.find(c=>c.k===lastK)||null;
  const audio=new Audio();audio.preload='none';audio.volume=vol;
  root.innerHTML='<div class="rd"><div class="rd-now"><div class="rd-disc" aria-hidden="true"></div><div class="rd-inf"><b class="rd-nm">Bir kanal seç</b><span class="rd-sl"><span class="rd-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="rd-st">Hazır</span></span></div>'+
    '<div class="rd-tr"><button class="rd-sk rd-pv" type="button" aria-label="Önceki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h2v14H7zM20 5v14L10 12z"/></svg></button><button class="rd-pl" type="button" aria-label="Çal / durdur"></button><button class="rd-sk rd-nx" type="button" aria-label="Sonraki kanal"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 5h2v14h-2zM4 5v14l10-7z"/></svg></button></div></div>'+
    '<div class="rd-ctl"><div class="rd-list noscroll"></div>'+
    '<div class="rd-vol"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/></svg><input type="range" min="0" max="100" aria-label="Ses"></div>'+'</div></div>';
  let hls=null,gen=0;
  const killHls=()=>{gen++;if(hls){try{hls.destroy()}catch{}hls=null}};
  w._dispose=()=>{killHls();clearTimeout(stT);clearTimeout(volT);try{audio.pause();audio.removeAttribute('src');audio.load()}catch{}};
  const $r=s=>$(s,root),disc=$r('.rd-disc'),nm=$r('.rd-nm'),stt=$r('.rd-st'),pl=$r('.rd-pl'),lst=$r('.rd-list'),rng=$r('.rd-vol input'),box=$r('.rd');
  rng.value=Math.round(vol*100);
  const IC={play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'};
  /* Kanal rozeti: altta baş harf, üstte logo (logo yüklenmezse kaldırılır, baş harf kalır) */
  const dot=c=>'<i class="rd-dot" style="--c:'+c.c+'"></i>';   /* kanal düğmelerinde renkli nokta; logo yalnızca plakta */
  const lg=(c,big)=>'<span class="rd-lg" style="--c:'+c.c+(c.fit?';background:#c8102e':'')+'">'+esc(big?(c.mono||c.name.slice(0,1)):c.name.slice(0,1))+(c.logo?'<img src="'+esc(c.logo)+'" alt="" referrerpolicy="no-referrer"'+(c.fit?' style="inset:auto;left:-5%;top:-3%;width:127%;height:106%;object-fit:fill"':'')+'>':'')+'</span>';
  root.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.remove()},true);
  function paintList(){
    lst.innerHTML=CH.map(c=>'<button type="button" class="rd-it'+(cur&&cur.k===c.k?' on':'')+(map[c.k]?'':' na')+'" data-k="'+c.k+'" title="'+esc(c.name)+'">'+dot(c)+'<span class="rd-n">'+esc(c.name)+'</span></button>').join('')+'';
  }
  function paintNow(){
    nm.textContent=cur?cur.name:'Bir kanal seç';
    const br=cur&&map[cur.k]&&+map[cur.k].br;
    const T={idle:cur?'Durdu':'Hazır',load:'<span class="rd-spin" aria-hidden="true"></span>Bağlanıyor…',play:'<span class="rd-badge"><i></i>CANLI</span>'+(br?'<span class="rd-br">'+br+' kbps</span>':''),err:'Bu yayın açılmadı',na:'Yayın adresi bulunamadı'};
    stt.innerHTML=T[state];stt.className='rd-st '+(state==='err'||state==='na'?'err':'');
    disc.innerHTML=cur?lg(cur,true):'<span class="rd-lg rd-lg0">♪</span>';
    pl.innerHTML=state==='play'||state==='load'?IC.pause:IC.play;
    box.classList.toggle('live',state==='play');
    root.querySelectorAll('.rd-it').forEach(b=>b.classList.toggle('on',!!cur&&b.dataset.k===cur.k));
    const on=lst.querySelector('.rd-it.on');if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest',inline:'nearest'})}catch{}
    if('mediaSession' in navigator&&cur){try{navigator.mediaSession.metadata=new MediaMetadata({title:cur.name,artist:'AliBaba Radyo'})}catch{}}
  }
  function play(c){
    cur=c;LS.set('pano.radio.last',c.k);
    const s=map[c.k];
    if(!s){state='na';audio.pause();paintNow();return}
    state='load';paintNow();
    tryIdx=0;retry=0;quiet=0;lastCT=-1;start(s);
  }
  let tryIdx=0,stT=0,retry=0,lastCT=-1,quiet=0,ign=0;
  /* Canlı yayında tarayıcı yalnızca ~2 sn tampon tutar; ağda küçük bir aksama yayını kalıcı olarak dondurabiliyor.
     Bu yüzden takılma (bekleme/durgunluk/ilerlemeyen saat) fark edilince aynı yayına otomatik yeniden bağlanılır. */
  const clearWd=()=>{clearTimeout(stT);stT=0};
  const armWd=ms=>{clearWd();stT=setTimeout(()=>{stT=0;if(state==='load'||state==='play')reconnect()},ms)};
  function reconnect(){
    const s=cur&&map[cur.k];if(!s)return;
    const list=s.urls&&s.urls.length?s.urls:[s.url];
    if(retry>=10){clearWd();state='err';paintNow();return}
    retry++;if(retry>1&&retry%2===1)tryIdx=(tryIdx+1)%list.length;   /* her ikinci denemede sıradaki adrese geç */
    state='load';quiet=0;lastCT=-1;paintNow();start(s);
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
  audio.addEventListener('playing',()=>{clearWd();retry=0;quiet=0;state='play';paintNow()});
  audio.addEventListener('waiting',()=>{if(state==='play'){state='load';paintNow();armWd(4000)}});
  audio.addEventListener('stalled',()=>{if((state==='play'||state==='load')&&!stT)armWd(8000)});
  audio.addEventListener('error',()=>{if(cur&&map[cur.k])fail()});
  audio.addEventListener('pause',()=>{if(Date.now()-ign<1000)return;if(state==='play'||state==='load'){clearWd();state='idle';paintNow()}});
  every(w,()=>{   /* çalarken saat ilerlemiyorsa (10 sn) yayın donmuştur */
    if(state!=='play'||audio.paused)return;
    const t=audio.currentTime;if(t===lastCT){if(++quiet>=2)reconnect()}else{quiet=0;lastCT=t}
  },5000);
  pl.addEventListener('click',()=>{
    if(!cur){play(CH[0]);return}
    if(state==='play'||state==='load'){clearWd();killHls();audio.pause();state='idle';paintNow()}else play(cur);
  });
  const step=d=>{const i=cur?CH.findIndex(c=>c.k===cur.k):-1;play(CH[(i+d+CH.length)%CH.length])};
  $r('.rd-pv').addEventListener('click',()=>step(-1));$r('.rd-nx').addEventListener('click',()=>step(1));
  rng.addEventListener('input',()=>{vol=rng.value/100;audio.volume=vol;LS.set('pano.radio.vol',vol)});
  /* 1×1 görünümde ses çubuğu gizlidir: fare tekerleği sesi ayarlar */
  let volT=0;
  root.addEventListener('wheel',e=>{
    if(getComputedStyle($r('.rd-ctl')).display!=='none'||!e.target.closest('.rd'))return;
    e.preventDefault();vol=Math.max(0,Math.min(1,Math.round((vol-Math.sign(e.deltaY)*.05)*100)/100));audio.volume=vol;rng.value=Math.round(vol*100);LS.set('pano.radio.vol',vol);
    stt.className='rd-st';stt.textContent='Ses %'+Math.round(vol*100);clearTimeout(volT);volT=setTimeout(paintNow,1200);
  },{passive:false});
  lst.addEventListener('click',e=>{const b=e.target.closest('.rd-it');if(b)play(CH.find(c=>c.k===b.dataset.k))});
  async function resolve(){
    const qs=[...new Set(CH.flatMap(c=>c.q))],pool={};
    await Promise.allSettled(qs.map(async q=>{try{pool[q]=await search(q)}catch{pool[q]=[]}}));
    const m={};
    CH.forEach(c=>{
      if(c.fix){m[c.k]=fixed(c);return}
      const cand=[];c.q.forEach(q=>(pool[q]||[]).forEach(s=>{if(!cand.find(x=>x.id===s.id))cand.push(s)}));
      const hits=cand.filter(s=>c.re.test(s.name)&&!(c.not&&c.not.test(s.name))).sort((a,b)=>b.clk-a.clk).slice(0,4);
      if(hits.length){
        const urls=[];hits.forEach(h=>[h.url,h.alt].forEach(u=>{if(!u)return;const x=up(u);if(!urls.includes(x))urls.push(x)}));
        const hit=hits[0];m[c.k]={id:hit.id,name:hit.name,url:urls[0],urls,fav:hit.fav,br:hit.br};
      }
    });
    if(Object.keys(m).length){map=m;LS.set('pano.radio.ch3',{t:Date.now(),m});paintList();paintNow()}
  }
  paintList();paintNow();
  if(CH.some(c=>!map[c.k]))resolve();
}
