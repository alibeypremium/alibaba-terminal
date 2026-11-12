'use strict';
/* AliBaba Terminal · youtube.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- YouTube ---------- */
/* Video/liste kimlikleri href, style ve iframe src içine yazıldığı için biçimi doğrulanır. */
function parseYT(s){
  const p=parseYTraw(s);if(!p)return null;
  if(p.v&&!/^[\w-]{6,20}$/.test(p.v))return null;
  if(p.list&&!/^[\w-]{10,64}$/.test(p.list)){if(p.v)p.list=null;else return null}
  if(!p.v&&!p.list)return null;
  return p;
}
function parseYTraw(s){
  s=(s||'').trim();if(!s)return null;
  if(/^[\w-]{11}$/.test(s))return{v:s};
  let u;try{u=new URL(/^https?:/.test(s)?s:'https://'+s)}catch{return null}
  const h=u.hostname.replace(/^www\.|^m\./,'');
  const list=u.searchParams.get('list');
  if(h==='youtu.be'){const v=u.pathname.slice(1).split('/')[0];return v?{v,list}:null}
  if(/(^|\.)youtube(-nocookie)?\.com$/.test(h)){
    const v=u.searchParams.get('v');if(v)return{v,list};
    const m=u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/);if(m)return{v:m[1],list};
    if(list)return{list};
  }
  return null;
}
/* YouTube kanalları: @kullanıcı adıyla eklenir; canlı olanlar listenin başında görünür. Canlı durum için kullanıcının kendi (ücretsiz) YouTube Data API anahtarı gerekir,
   çünkü YouTube sayfaları tarayıcıdan anahtarsız okunamıyor. Anahtar yalnızca bu tarayıcıda saklanır (pano.key.youtube). */
const YT_MAX=30;
async function ytApi(path,params,key){
  const u=new URL('https://www.googleapis.com/youtube/v3/'+path);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));u.searchParams.set('key',key);
  const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);
  try{
    const r=await fetch(u,{signal:c.signal});const j=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(j.error&&j.error.errors&&j.error.errors[0]&&j.error.errors[0].reason||String(r.status));e.status=r.status;throw e}
    return j;
  }finally{clearTimeout(t)}
}
/* "@ntv", "ntv", "youtube.com/@ntv", "youtube.com/channel/UC…", "youtube.com/user/ad", "youtube.com/c/ad" → API sorgu parametresi; video/liste bağlantısı ya da başka bir şey ise null */
function ytChannelSpec(v){
  v=String(v||'').trim();if(!v||parseYT(v))return null;
  let m=v.match(/^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:(@[\w.%-]+)|channel\/(UC[\w-]{22})|user\/([\w.%-]+)|c\/([\w.%-]+))/i);
  if(m){if(m[1])return{forHandle:decodeURIComponent(m[1])};if(m[2])return{id:m[2]};if(m[3])return{forUsername:decodeURIComponent(m[3])};return{forHandle:'@'+decodeURIComponent(m[4])}}
  if(/^@[\p{L}\p{N}_.-]{2,30}$/u.test(v))return{forHandle:v};
  if(/^[\p{L}\p{N}_.-]{3,30}$/u.test(v))return{forHandle:'@'+v};
  return null;
}
function mountYT(w,root,tabs){
  const PH='YouTube bağlantısı yapıştır ya da @kanal ekle';
  root.innerHTML='<div class="yt tvp">'+hd('youtube','YouTube',tabs+sbBtn+'<button class="ibtn" type="button" id="ytt" title="Kanal listesini aç/kapat" aria-label="Kanal listesini aç/kapat" aria-pressed="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button><a class="ibtn" id="yto" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube\'da aç">'+I.ext+'</a>')+
    '<form class="yt-in" id="ytf"><input id="yti" type="text" inputmode="url" placeholder="'+PH+'" autocomplete="off" aria-label="YouTube bağlantısı ya da kanal adı"><button class="yt-go" type="submit">Oynat</button></form>'+
    '<div class="tvp-main"><div class="yt-view tvp-vid" id="ytv"></div><div class="tvp-side"><div class="tvp-list noscroll" id="ytl"></div></div></div></div>';
  sbWire(root);
  const tvp=$('.tvp',root),tgl=$('#ytt',root),view=$('#ytv',root),list=$('#ytl',root),inp=$('#yti',root);
  listWire(tvp,tgl);
  let chs=LS.get('pano.yt.ch',[]);
  chs=(Array.isArray(chs)?chs:[]).filter(c=>c&&/^UC[\w-]{22}$/.test(c.id)).slice(0,YT_MAX);
  const info={};let cur=null,busy=false,phT=0,loaded=false,playing=false,apiErr='',pending=null;
  const okImg=u=>/^https:\/\/yt3\.(ggpht|googleusercontent)\.com\//i.test(u||'');
  const fmtV=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1).replace('.',',')+' B':String(n);   /* B = bin */
  const empty=msg=>{playing=false;view.innerHTML='<div class="yt-empty"><svg viewBox="0 0 64 44"><rect width="64" height="44" rx="12" fill="#f00"/><path d="M26 12v20l18-10z" fill="#fff"/></svg><div>'+msg+'</div></div>'};
  const play=src=>{
    const p=parseYT(src);if(!p){empty('Geçerli bir YouTube bağlantısı bulunamadı.');return false}
    playing=true;
    const watch=p.v?'https://www.youtube.com/watch?v='+p.v+(p.list?'&list='+encodeURIComponent(p.list):''):'https://www.youtube.com/playlist?list='+encodeURIComponent(p.list);
    $('#yto',root).href=watch;LS.set('pano.yt',src);
    if(location.protocol!=='http:'&&location.protocol!=='https:'){
      /* Yerel dosyada (file://) tarayıcı Referer göndermez; YouTube bu yüzden 153 hatası verir. */
      view.innerHTML='<a class="yt-th" href="'+watch+'" target="_blank" rel="noopener noreferrer"'+(p.v?' style="background-image:url(https://i.ytimg.com/vi/'+p.v+'/hqdefault.jpg)"':'')+'><span class="yt-pl"><svg viewBox="0 0 64 44"><rect width="64" height="44" rx="12" fill="#f00"/><path d="M26 12v20l18-10z" fill="#fff"/></svg></span><em>Dosya bilgisayardan açıldığı için YouTube gömülü oynatmayı reddediyor. Tıkla, YouTube\'da açılsın. Panoyu bir web adresinden (localhost veya Netlify) açarsan burada oynar.</em></a>';
      return true;
    }
    const q='autoplay=1&playsinline=1&rel=0&origin='+encodeURIComponent(location.origin);
    const url=p.v?'https://www.youtube.com/embed/'+p.v+'?'+q+(p.list?'&list='+encodeURIComponent(p.list):''):'https://www.youtube.com/embed/videoseries?list='+encodeURIComponent(p.list)+'&'+q;
    view.innerHTML='<iframe title="YouTube oynatıcı" src="'+url+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    return true;
  };
  const flash=m=>{inp.placeholder=m;clearTimeout(phT);phT=setTimeout(()=>{inp.placeholder=PH},4500)};
  const errText=e=>{const r=e&&e.message;
    if(r==='quotaExceeded'||r==='dailyLimitExceeded'||r==='rateLimitExceeded')return'Günlük YouTube API kotası doldu. Yarın kendiliğinden yeniden denenecek.';
    if(r==='keyInvalid'||r==='badRequest')return'YouTube API anahtarı geçersiz görünüyor.';
    if(r==='accessNotConfigured'||r==='forbidden'||r==='ipRefererBlocked'||r==='API_KEY_HTTP_REFERRER_BLOCKED')return'Anahtar bu siteye ya da YouTube Data API v3\'e izin vermiyor.';
    return'YouTube\'a ulaşılamadı. Biraz sonra yeniden denenecek.'};
  const keyPanel=(msg)=>{
    const key=getKey('youtube');playing=false;
    view.innerHTML='<div class="kp"><b>YouTube API anahtarı'+(key?'':' gerekli')+'</b><p>'+(msg?esc(msg)+' ':'')+'Kanalların canlı yayınlarını bulmak için ücretsiz Google anahtarı. Google Cloud\'da proje aç, "YouTube Data API v3"ü etkinleştir, Kimlik bilgilerinden API anahtarı oluştur. Anahtarı bu siteyle ve yalnızca YouTube Data API ile sınırlaman önerilir.</p>'+
      '<a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer">Anahtar al ↗</a>'+
      '<form class="yt-in" id="ytk"><input type="text" autocomplete="off" spellcheck="false" placeholder="Anahtarı yapıştır" aria-label="YouTube API anahtarı"><button class="yt-go" type="submit">Kaydet</button></form>'+
      (key?'<button type="button" class="kp-b" data-a="rm">Kayıtlı anahtarı sil</button>':'')+'<button type="button" class="kp-b" data-a="close">Kapat</button>'+'</div>';
  };
  const idle=()=>{
    if(playing)return;
    const key=getKey('youtube'),n=chs.filter(c=>info[c.id]&&info[c.id].live).length;
    empty(!chs.length?'Bağlantı yapıştır ya da @kanal ekle.<br>Eklediğin kanalların canlı yayınları listede görünür.'
      :!key?'Canlı durum için YouTube API anahtarı gerekli. <button type="button" class="kp-b" data-a="key">Anahtar ekle</button>'
      :apiErr?esc(apiErr)+' <button type="button" class="kp-b" data-a="key">Anahtarı değiştir</button>'
      :!loaded?'Canlı yayınlar kontrol ediliyor…'
      :n?'<b>'+n+'</b> kanal şu an canlı. Listeden birine tıkla.':'Eklediğin kanalların hiçbiri şu an yayında değil.');
  };
  const order=()=>[...chs].sort((a,b)=>{const A=info[a.id]||{},B=info[b.id]||{};if(!!A.live!==!!B.live)return B.live?1:-1;if(A.live)return(B.viewers||0)-(A.viewers||0);return a.name.localeCompare(b.name,'tr')});
  function drawList(){
    if(!chs.length){list.innerHTML='<div class="foot" style="padding:8px">Henüz kanal yok. Yukarıdaki kutuya @kanal yaz.</div>';return}
    list.innerHTML=order().map(c=>{
      const i=info[c.id]||{},live=!!i.live;
      const av=okImg(c.pic)?'<img src="'+esc(c.pic)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="tvp-n">'+esc(c.name.slice(0,1).toUpperCase())+'</span>';
      return'<div class="kk-r"><button type="button" class="tvp-c kk-c'+(live?' live':'')+(c.id===cur?' on':'')+'" data-s="'+esc(c.id)+'" title="'+esc(live?(i.title||''):'Şu an yayında değil')+'">'+av+'<span class="kk-n">'+esc(c.name)+'</span>'+(live?'<span class="kk-v"><i class="kk-dot"></i>'+fmtV(i.viewers||0)+'</span>':'')+'</button>'+
        '<button type="button" class="kk-x" data-rm="'+esc(c.id)+'" aria-label="'+esc(c.name)+' kanalını listeden çıkar" title="Listeden çıkar">×</button></div>';
    }).join('');
  }
  /* Kanal başına son 15 yükleme (1 birim) + hepsi için tek videos sorgusu (1 birim): canlı olan, başlamış ve bitmemiş yayındır. */
  async function refresh(){
    const key=getKey('youtube');
    if(busy||!chs.length||!key||root.hidden)return;
    busy=true;let err=null;
    try{
      const ups=await Promise.all(chs.map(c=>ytApi('playlistItems',{part:'contentDetails',playlistId:'UU'+c.id.slice(2),maxResults:15},key)
        .then(j=>({c,ids:(j.items||[]).map(x=>x.contentDetails&&x.contentDetails.videoId).filter(Boolean)}))
        .catch(e=>{if(e.status!==404)err=err||e;return{c,ids:[],failed:e.status!==404}})));
      const all=[...new Set(ups.flatMap(u=>u.ids))],vids={};
      for(let k=0;k<all.length;k+=50){
        try{const j=await ytApi('videos',{part:'liveStreamingDetails,snippet',id:all.slice(k,k+50).join(',')},key);(j.items||[]).forEach(v=>{vids[v.id]=v})}
        catch(e){err=err||e;ups.forEach(u=>{if(u.ids.some(id=>all.slice(k,k+50).includes(id)))u.failed=true})}
      }
      ups.forEach(u=>{
        if(u.failed&&info[u.c.id])return;   /* geçici hata: eski bilgi kalsın */
        const lv=u.ids.map(id=>vids[id]).find(v=>v&&v.liveStreamingDetails&&v.liveStreamingDetails.actualStartTime&&!v.liveStreamingDetails.actualEndTime);
        info[u.c.id]=lv?{live:true,vid:lv.id,viewers:+lv.liveStreamingDetails.concurrentViewers||0,title:String(lv.snippet&&lv.snippet.title||'')}:{live:false};
      });
      apiErr=err?errText(err):'';
    }finally{busy=false;loaded=true}
    drawList();idle();
  }
  async function addCh(spec){
    const key=getKey('youtube');
    if(!key){pending=spec;keyPanel();return}
    if(chs.length>=YT_MAX){flash('En fazla '+YT_MAX+' kanal eklenebilir.');return}
    flash('Aranıyor…');
    try{
      const j=await ytApi('channels',{part:'snippet',...spec},key),it=j.items&&j.items[0];
      if(!it){flash('Kanal bulunamadı.');return}
      if(chs.some(c=>c.id===it.id)){flash('Bu kanal zaten listede.');return}
      const th=it.snippet&&it.snippet.thumbnails;
      chs.push({id:it.id,name:String(it.snippet.title||it.id).slice(0,60),pic:(th&&(th.default||th.medium)||{}).url||''});
      LS.set('pano.yt.ch',chs);drawList();flash('Eklendi: '+it.snippet.title);refresh();
    }catch(e){
      if(e.message==='keyInvalid'||e.message==='badRequest'){pending=spec;keyPanel(errText(e))}else flash(errText(e).slice(0,60))
    }
  }
  function playCh(id){
    const c=chs.find(x=>x.id===id);if(!c)return;const i=info[id]||{};cur=id;drawList();
    if(i.live&&i.vid){play('https://www.youtube.com/watch?v='+i.vid);inp.value='';return}
    empty('<b>'+esc(c.name)+'</b> şu an yayında değil.<br><a class="kk-open" href="https://www.youtube.com/channel/'+encodeURIComponent(id)+'" target="_blank" rel="noopener noreferrer">YouTube\'da aç</a>');
  }
  const submit=v=>{
    v=String(v||'').trim();if(!v)return;
    const spec=ytChannelSpec(v);
    if(spec){inp.value='';addCh(spec);return}
    cur=null;drawList();play(v);
  };
  const saved=LS.get('pano.yt','');
  if(saved){inp.value=saved;play(saved)}else idle();
  $('#ytf',root).addEventListener('submit',e=>{e.preventDefault();submit(inp.value)});
  inp.addEventListener('paste',()=>setTimeout(()=>{const v=inp.value;if(parseYT(v)){cur=null;drawList();play(v)}else if(/youtube\.com\/(@|channel\/|user\/|c\/)/i.test(v))submit(v)},30));
  list.addEventListener('click',e=>{
    const x=e.target.closest('[data-rm]');
    if(x){const id=x.dataset.rm;chs=chs.filter(c=>c.id!==id);delete info[id];LS.set('pano.yt.ch',chs);if(cur===id){cur=null;idle()}drawList();return}
    const b=e.target.closest('.kk-c');if(b)playCh(b.dataset.s);
  });
  view.addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');if(!b)return;
    const a=b.dataset.a;
    if(a==='key')keyPanel();
    else if(a==='rm'){LS.set('pano.key.youtube','');Object.keys(info).forEach(k=>delete info[k]);loaded=false;apiErr='';drawList();idle()}
    else if(a==='close'){pending=null;const sv=LS.get('pano.yt','');if(sv)play(sv);else idle()}
  });
  view.addEventListener('submit',e=>{
    const f=e.target.closest('#ytk');if(!f)return;e.preventDefault();
    const v=$('input',f).value.trim();if(!/^[\w-]{20,60}$/.test(v)){$('input',f).value='';$('input',f).placeholder='Anahtar geçersiz görünüyor';return}
    LS.set('pano.key.youtube',v);apiErr='';loaded=false;idle();
    const p=pending;pending=null;if(p)addCh(p);refresh();
  });
  drawList();refresh();every(w,refresh,5*60e3);
  return{off(){cur=null;view.innerHTML='';playing=false},on(){cur=null;drawList();const sv=LS.get('pano.yt','');if(sv)play(sv);else idle();refresh()}};
}

/* ---------- X (Twitter) gömülü zaman akışı ---------- */
/* Resmî widgets.js ile profil akışı. X, akışı yalnızca aynı tarayıcıda X'e giriş yapılmışsa gösterir (giriş yoksa "Nothing to see here"). */
