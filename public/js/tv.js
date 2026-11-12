'use strict';
/* AliBaba Terminal · tv.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- TradingView ---------- */
function mountTV(w,root){
  const SYMS=[{k:'BTC',s:'BINANCE:BTCUSDT',p:'BTCUSDT'},{k:'ETH',s:'BINANCE:ETHUSDT',p:'ETHUSDT'}];
  let cur=LS.get('pano.tv',0);if(!SYMS[cur])cur=0;
  root.innerHTML='<div class="tv">'+hd('tv','TradingView')+'<div class="tv-tabs" id="tvt"></div><div class="tv-box" id="tvb"></div></div>';
  const tabs=$('#tvt',root),box=$('#tvb',root);const px={};
  const paintTabs=()=>{tabs.innerHTML=SYMS.map((x,i)=>{const q=px[x.p];return'<button type="button" class="tv-tab'+(i===cur?' on':'')+'" data-i="'+i+'"><b>'+x.k+'/USDT</b><span>'+(q?'$'+q.price.toLocaleString('en-US',{maximumFractionDigits:q.price<10?4:2})+' <i class="'+(q.chg>=0?'up':'dn')+'" style="font-style:normal">'+(q.chg>=0?'+':'')+q.chg.toFixed(2)+'%</i>':'canlı')+'</span></button>'}).join('')};
  const mount=()=>{
    box.innerHTML='';
    const c=document.createElement('div');c.className='tradingview-widget-container';c.style.cssText='height:100%;width:100%';
    const inner=document.createElement('div');inner.className='tradingview-widget-container__widget';inner.style.cssText='height:100%;width:100%';
    const s=document.createElement('script');s.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';s.async=true;
    s.innerHTML=JSON.stringify({autosize:true,symbol:SYMS[cur].s,interval:'60',timezone:'Europe/Istanbul',theme:'dark',style:'1',locale:'tr',backgroundColor:'rgba(19,23,34,1)',gridColor:'rgba(255,255,255,0.05)',hide_side_toolbar:true,allow_symbol_change:true,save_image:false,calendar:false,support_host:'https://www.tradingview.com'});
    c.append(inner,s);box.append(c);
  };
  tabs.addEventListener('click',e=>{const b=e.target.closest('.tv-tab');if(!b)return;cur=+b.dataset.i;LS.set('pano.tv',cur);paintTabs();mount()});
  /* Fiyatlar üst çubuğun tek veri akışından okunur; ayrı ağ isteği yok. */
  const quotes=()=>{let any=false;SYMS.forEach(x=>{const q=CRYPTO[x.p];if(q){px[x.p]=q;any=true}});if(any)paintTabs()};
  paintTabs();mount();quotes();every(w,quotes,5000);
}

/* ---------- TV İzle (M3U) ---------- */
function parseM3U(t){
  const out=[];let meta=null;
  for(const raw of t.split(/\r?\n/)){
    const l=raw.trim();if(!l)continue;
    if(l.startsWith('#EXTINF')){
      const a=k=>{const m=l.match(new RegExp(k+'="([^"]*)"','i'));return m?m[1]:''};
      const q=l.lastIndexOf('"'),c=l.indexOf(',',q<0?0:q);
      const name=(c>=0?l.slice(c+1).trim():'')||a('tvg-name')||'Kanal';
      meta={name,logo:a('tvg-logo'),group:a('group-title')};
    }else if(l[0]!=='#'){
      out.push({name:(meta&&meta.name)||l.split('/').pop().split('?')[0]||'Kanal',logo:meta?meta.logo:'',group:meta?meta.group:'',url:l});meta=null;
    }
  }
  return out;
}
/* hls.js tembel yükleme (SRI ile). Yalnızca HLS (.m3u8) kanalı ilk kez açılırken indirilir. */
let hlsP=null;
function loadHls(){
  if(window.Hls)return Promise.resolve(window.Hls);
  if(hlsP)return hlsP;
  hlsP=new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
    s.integrity='sha384-w6Gb3fXHb5e1LUYa/hYA5Q41bEDglN5ZPCG7Jvnoo8/X90oGnlPqBlBJCe38mEMm';
    s.crossOrigin='anonymous';
    s.onload=()=>res(window.Hls);
    s.onerror=()=>{hlsP=null;rej(new Error('hls'))};
    document.head.appendChild(s);
  });
  return hlsP;
}
/* M3U adresi kullanıcı adı/şifre/anahtar içeriyorsa üçüncü taraf proxy'ye gönderilmez. */
const sensitiveUrl=u=>{try{const x=new URL(u);if(x.username||x.password)return true;for(const k of x.searchParams.keys())if(/user|pass|pwd|token|key|auth|secret|sig|session/i.test(k))return true}catch{}return false};
/* Hazır kanallar (ilki varsayılan). Habertürk'ün kendi yayını (ciner.daioncdn.net) başka sitelerden okunmaya izin vermediği (CORS) için
   Kanalların resmî YouTube canlı yayınları gömülür. Biri açılmazsa youtube.com/@KANAL/live adresindeki güncel video kimliği buraya yazılır. */
const TV_BUILTIN=[
  {name:'Habertürk TV',group:'Haber',embed:'CJHVSYHpVvc',logo:'https://yt3.ggpht.com/SqaSrx9HvlbnpXqfrsyqJOpL3uHHi3GQ3htT3gPdP3S8yebiy4iVPrZ4Ai1wQnNoHv7aUBLIeEE=s64-c-k-c0x00ffffff-no-rj'},
  {name:'NTV',group:'Haber',embed:'pqq5c6k70kk',logo:'https://yt3.ggpht.com/wwJNZ3QBI5ojqIlQvsInUIwIuSQH-lhQaqv_-WR7gYvEqa6WNEfpdiTls8z30QIxQMFbTBUQ0Q=s64-c-k-c0x00ffffff-no-rj'},
  {name:'CNN Türk',group:'Haber',embed:'DEgxEiAYQ64',logo:'https://yt3.ggpht.com/H6Fh64z_Vb9AYevqCPwgeyRAyd4mye6fqU2HN5Jj1RWtrtK5lbU3B2Nkxc_nJfpN_WpI5_flfBk=s64-c-k-c0x00ffffff-no-rj'},
  {name:'Bloomberg HT',group:'Haber',embed:'j7B_zsL11Pw',logo:'https://yt3.ggpht.com/ytc/AIdro_kYr_pJ26fMpoQPKgJEACBiddx9WO4CV4akUE8yBzhrHMg=s64-c-k-c0x00ffffff-no-rj'},
  {name:'Diyanet TV',group:'Dini',embed:'8KOE6__ogN8',logo:'https://yt3.ggpht.com/ytc/AIdro_kg1PXkb5IvOoU7c2haUmoWIPg20lNNFb-jk8qkh4PQ3_4=s64-c-k-c0x00ffffff-no-rj'},
  {name:'Mekke Canlı',group:'Dini',embed:'eC4LfEVxvKg',logo:'https://yt3.ggpht.com/ytc/AIdro_mesiGG76gww2WnpFVUFbMz-s2d4IjJJVhDqJuCVscqKLY=s64-c-k-c0x00ffffff-no-rj'},
  {name:'Medine Canlı',group:'Dini',embed:'Rs7St51oDDc',logo:'https://yt3.ggpht.com/ytc/AIdro_mQEOSPf6okcuPezKOKSfhc6kKQxF1q57i2SsTOazhCg2s=s64-c-k-c0x00ffffff-no-rj'}
].map(c=>({logo:'',...c}));   /* logolar: kanalların YouTube profil resimleri */
function mountIPTV(w,root,tabs){
  root.innerHTML='<div class="tvp">'+hd('iptv','TV',tabs+sbBtn+'<button class="ibtn" type="button" id="m3t" title="Kanal listesini aç/kapat" aria-label="Kanal listesini aç/kapat" aria-pressed="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button><label class="ibtn" for="m3f" title="M3U dosyası seç" style="cursor:pointer">'+I.file+'</label><input id="m3f" type="file" accept=".m3u,.m3u8,.txt" hidden>')+
   '<form class="yt-in" id="m3form"><input id="m3u" type="text" inputmode="url" placeholder=".m3u bağlantısını yapıştır" aria-label="M3U bağlantısı" autocomplete="off"><button class="yt-go" type="submit">Yükle</button></form>'+
   '<div class="tvp-main"><div class="tvp-vid" id="tvv"></div><div class="tvp-side"><input id="m3s" class="tvp-s" type="search" placeholder="Kanal ara" aria-label="Kanal ara"><div class="tvp-list noscroll" id="m3l"></div></div></div></div>';
  sbWire(root);
  const tvp=$('.tvp',root),tgl=$('#m3t',root);
  listWire(tvp,tgl);
  const vid=$('#tvv',root),list=$('#m3l',root),inp=$('#m3u',root),sea=$('#m3s',root);
  let chans=[...TV_BUILTIN],cur=-1,hls=null,video=null;
  const chKey=c=>c.url||('yt:'+c.embed);
  const note=m=>{stop();vid.innerHTML='<div class="yt-empty"><svg viewBox="0 0 64 56" style="width:56px;height:auto"><rect x="4" y="12" width="56" height="40" rx="8" fill="#34d1bf"/><rect x="10" y="18" width="44" height="28" rx="4" fill="#0b3b3f"/><path d="M26 25v14l12-7z" fill="#fff"/><path d="M22 4l10 8 10-8" stroke="#34d1bf" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div>'+m+'</div></div>'};
  function stop(){if(hls){try{hls.destroy()}catch{}hls=null}if(video){try{video.pause();video.removeAttribute('src');video.load()}catch{}video=null}}
  const drawList=()=>{
    const q=sea.value.trim().toLocaleLowerCase('tr');const idx=[];
    chans.forEach((c,i)=>{if(!q||c.name.toLocaleLowerCase('tr').includes(q)||(c.group||'').toLocaleLowerCase('tr').includes(q))idx.push(i)});
    let lastG=null;
    list.innerHTML=idx.slice(0,500).map(i=>{const c=chans[i];
      const gh=(c.group&&c.group!==lastG)?'<div class="tvp-g">'+esc(c.group)+'</div>':'';lastG=c.group||'';
      return gh+'<button type="button" class="tvp-c'+(i===cur?' on':'')+'" data-i="'+i+'">'+(/^https?:/.test(c.logo||'')?'<img src="'+esc(c.logo)+'" alt="" loading="lazy" referrerpolicy="no-referrer"'+(c.embed?' style="border-radius:50%"':'')+'>':'<span class="tvp-n">'+esc(c.name.slice(0,1).toUpperCase())+'</span>')+'<span>'+esc(c.name)+'</span></button>'}).join('')||'<div class="foot" style="padding:8px">Sonuç yok</div>';
  };
  list.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.style.visibility='hidden'},true);
  function play(i){
    const c=chans[i];if(!c)return;cur=i;LS.set('pano.iptv.last',chKey(c));stop();
    if(c.embed){   /* YouTube canlı yayını: video yerine gömülü oynatıcı */
      vid.innerHTML=/^https?:$/.test(location.protocol)
        ?'<iframe title="'+esc(c.name)+'" src="https://www.youtube.com/embed/'+encodeURIComponent(c.embed)+'?autoplay=1&playsinline=1&rel=0&origin='+encodeURIComponent(location.origin)+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
        :'<a class="yt-th" href="https://www.youtube.com/watch?v='+encodeURIComponent(c.embed)+'" target="_blank" rel="noopener noreferrer"><em>Dosya bilgisayardan açıldığı için YouTube gömülü oynatmayı reddediyor. Tıkla, YouTube\'da açılsın. Panoyu bir web adresinden açarsan burada oynar.</em></a>';
      $$('.tvp-c',list).forEach(b=>b.classList.toggle('on',+b.dataset.i===i));
      return;
    }
    vid.innerHTML='<video controls autoplay playsinline></video><div class="tvp-name"></div>';
    video=$('video',vid);$('.tvp-name',vid).textContent=c.name;
    const fail=()=>{if(!$('.tvp-err',vid)){const d=document.createElement('div');d.className='tvp-err';d.textContent='Kanal açılamadı. Kaynak bu sayfadan oynatmaya izin vermiyor ya da yayın kapalı olabilir. Başka bir kanal dene.';vid.appendChild(d)}};
    const isHls=/m3u8/i.test(c.url);
    if(isHls&&!video.canPlayType('application/vnd.apple.mpegurl')){
      /* hls.js yalnızca ilk HLS kanalı açılırken yüklenir. */
      const mine=video;
      loadHls().then(H=>{
        if(video!==mine)return;   /* bu arada başka kanal seçildi / widget kapandı */
        if(H&&H.isSupported()){
          hls=new H({maxBufferLength:20,capLevelToPlayerSize:true});hls.loadSource(c.url);   /* widget küçükse daha düşük çözünürlük seçilir: eski bilgisayarda çözme yükü azalır */
          hls.attachMedia(mine);
          hls.on(H.Events.MANIFEST_PARSED,()=>video&&video.play().catch(()=>{}));
          hls.on(H.Events.ERROR,(_,d)=>{if(d.fatal)fail()});
        }else{mine.src=c.url;mine.play().catch(()=>{});mine.addEventListener('error',fail,{once:true})}
      }).catch(fail);
    }else{video.src=c.url;video.play().catch(()=>{});video.addEventListener('error',fail,{once:true})}
    $$('.tvp-c',list).forEach(b=>b.classList.toggle('on',+b.dataset.i===i));
  }
  function loadText(t,u,auto){
    let ch;
    if(/#EXT-X-(STREAM-INF|TARGETDURATION|MEDIA-SEQUENCE)/.test(t)&&u)ch=[{name:'Canlı yayın',url:u,logo:'',group:''}];
    else ch=parseM3U(t);
    if(!ch.length){note('Bu bağlantıda kanal bulunamadı.');return}
    chans=[...TV_BUILTIN,...ch];cur=-1;sea.value='';drawList();
    const last=LS.get('pano.iptv.last','');const li=chans.findIndex(c=>chKey(c)===last);
    if(auto)play(li>=0?li:TV_BUILTIN.length);else note('<b>'+ch.length+'</b> kanal yüklendi. Listeden bir kanal seç.');   /* ilk sıra varsayılan kanal; yeni listede ilk kanaldan başlar */
  }
  async function loadUrl(u,auto){
    u=u.trim();if(!u)return;note('Kanallar yükleniyor…');
    let t=null;
    const priv=sensitiveUrl(u);
    try{t=await getText(u,20000)}catch{if(!priv){try{t=await viaProxy(u)}catch{}}}
    if(t==null){
      if(/m3u8/i.test(u)){chans=[...TV_BUILTIN,{name:'Canlı yayın',url:u,logo:'',group:''}];drawList();play(TV_BUILTIN.length)}
      else note(priv?'Liste doğrudan alınamadı (site CORS izni vermiyor olabilir). Bağlantı kullanıcı adı/anahtar içerdiği için üçüncü taraf proxy kullanılmadı. Listeyi indirip sağ üstteki düğmeyle dosya olarak seç.':'Liste alınamadı. Bağlantıyı kontrol et ya da M3U dosyasını sağ üstteki düğmeyle seç.');
      return;
    }
    LS.set('pano.iptv.url',u);loadText(t,u,auto);
  }
  list.addEventListener('click',e=>{const b=e.target.closest('.tvp-c');if(b)play(+b.dataset.i)});
  sea.addEventListener('input',drawList);
  $('#m3form',root).addEventListener('submit',e=>{e.preventDefault();loadUrl(inp.value,true)});
  inp.addEventListener('paste',()=>setTimeout(()=>{if(/^https?:/i.test(inp.value.trim()))loadUrl(inp.value,true)},30));
  $('#m3f',root).addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{loadText(await f.text(),'',true)}catch{note('Dosya okunamadı.')}});
  const saved=LS.get('pano.iptv.url','');
  drawList();
  /* Kayıtlı M3U yoksa varsayılan kanal (Habertürk TV) açılır; varsa liste yüklenir, kanalı sen seçersin. */
  if(saved){inp.value=saved;loadUrl(saved,false)}else play(0);
  return{off(){stop();vid.innerHTML=''},on(){if(!LS.get('pano.iptv.url',''))play(cur>=0?cur:0);else if(chans.length>TV_BUILTIN.length)note('<b>'+(chans.length-TV_BUILTIN.length)+'</b> kanal hazır. Listeden bir kanal seç.');else note('.m3u bağlantısı yapıştır veya dosya seç.<br>Kanallar burada listelenir.')},dispose:stop};   /* kapanınca hls.js bağlantısı da kapansın */
}
