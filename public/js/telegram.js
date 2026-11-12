'use strict';
/* AliBaba Terminal · telegram.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Telegram kanalları (herkese açık t.me/s/ önizlemesi) ---------- */
/* Kategoriler sekme olur (TG_CATS sırasıyla). Yeni kanal: TG_CH'ye bir satır ekle ve cat'e kategori anahtarını yaz.
   Yeni kategori: TG_CATS'e bir satır ekle; kanalı olmayan kategori sekmesi görünmez. */
const TG_CATS=[['haber','Haber'],['alisveris','Alışveriş']];
/* Bu kategorilerde mesajın içindeki ilk dış bağlantı varsa tıklama doğrudan ona gider (yoksa Telegram gönderisine). */
const TG_DIRECT=['alisveris'];
const TG_CH=[
  {k:'bosuna',u:'bosuna_tiklamayin_haber',name:'Boşuna Tıklamayın',cat:'haber'},
  {k:'sdk',u:'sondakika_haberr0',name:'Son Dakika',cat:'haber'},
  {k:'ninja',u:'ninjanewstr',name:'Ninja News',cat:'haber'},
  {k:'firsat',u:'firsattayfa',name:'Fırsat Tayfa',cat:'alisveris'}
];
/* r.jina.ai: t.me sayfasını HTML olarak döndüren, CORS izni olan okuyucu. Genel proxy'ler çoğu ağda zaman aşımına uğradığı için ilk bu denenir. */
function tgWhy(e){
  const m=String(e&&e.message||e||'');
  if(e&&e.name==='AbortError')return'zaman aşımı';
  if(/^\d{3}$/.test(m))return'HTTP '+m;
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))return'ağ/CORS engeli';
  if(/All promises were rejected|AggregateError/i.test(m)||(e&&e.name==='AggregateError'))return'hepsi başarısız (zaman aşımı/engel)';
  if(m==='tg')return'sayfada mesaj yok (önizleme kapalı olabilir)';
  return m.slice(0,40);
}
async function jinaHtml(u){
  const c=new AbortController(),to=setTimeout(()=>c.abort(),12000);
  try{const r=await fetch('https://r.jina.ai/'+u,{signal:c.signal,headers:{'X-Return-Format':'html'}});if(!r.ok)throw new Error(r.status);return await r.text()}
  finally{clearTimeout(to)}
}
async function tgFetch(c){
  /* Yollar aynı anda yarışır, ilk geçerli yanıt kullanılır: kendi sunucu fonksiyonu (varsa), jina, genel proxy'ler. */
  const u='https://t.me/s/'+c.u,ok=x=>{if(!/data-post="[^"]+\/\d+"/.test(x))throw new Error('tg');return x};   /* gerçekten mesaj içeren sayfa değilse kabul etme */
  const lab=(name,p)=>p.catch(e=>{throw new Error(name+': '+tgWhy(e))});   /* hata sebebi ekranda görünsün */
  const routes=[lab('jina',jinaHtml(u).then(ok)),lab('proxy',viaProxy(u,ok))];
  let t;
  try{t=await Promise.any(routes)}
  catch(e){const err=new Error('tg');err.detail=(e.errors||[e]).map(x=>String(x&&x.message||x)).join(' · ');throw err}
  const d=new DOMParser().parseFromString(t,'text/html');
  const items=[...d.querySelectorAll('.tgme_widget_message[data-post]')].map(m=>{
    const post=m.getAttribute('data-post')||'';
    if(!/^\w+\/\d+$/.test(post))return null;
    const te=m.querySelector('.tgme_widget_message_text.js-message_text');
    let txt='';
    if(te){const cl=te.cloneNode(true);cl.querySelectorAll('br').forEach(b=>b.replaceWith(' '));txt=cl.textContent.replace(/\s+/g,' ').trim()}
    if(!txt)txt='Medya mesajı';
    /* Mesaj içindeki ilk dış bağlantı (t.me / telegram bağlantıları hariç): alışveriş kategorisinde doğrudan ürüne gider. */
    let ext='';
    if(te)for(const a of te.querySelectorAll('a[href]')){
      const h=safeUrl(a.getAttribute('href'));if(!h)continue;
      let host='';try{host=new URL(h).hostname}catch{continue}
      if(/(^|\.)(t\.me|telegram\.(me|org)|telegra\.ph)$/i.test(host))continue;
      ext=h;break;
    }
    /* Mesajın ilk görseli: fotoğraf, video kapağı ya da bağlantı önizlemesi. */
    let img='';
    for(const n of m.querySelectorAll('.tgme_widget_message_photo_wrap,.tgme_widget_message_video_thumb,.link_preview_image,.link_preview_right_image')){
      const mm=(n.getAttribute('style')||'').match(/url\(\s*['"]?([^'")]+)/);if(mm&&/^https:\/\//.test(mm[1])){img=mm[1];break}
    }
    const tm=m.querySelector('.tgme_widget_message_date time');
    return{title:txt.slice(0,400),link:'https://t.me/'+post,ext,img,cat:c.cat,date:tm?tm.getAttribute('datetime'):'',source:c.name,ch:c.k};
  }).filter(x=>x&&safeUrl(x.link));
  if(!items.length){const err=new Error('tg');err.detail=c.name+': 0 mesaj ayrıştırıldı';throw err}   /* boş sonuç başarı sayılmasın, eski veriyi ezmesin */
  return items;
}
/* Yeni çekim eski listeyle birleşir (bağlantıya göre tekilleştirilir, gönderi numarasına göre yeniden eskiye sıralanır).
   Servisin önbelleğinden gelen eski bir kopya, daha önce görülmüş yeni haberleri listeden düşüremez. */
function tgUnion(old,nw){
  const m=new Map();
  [...(old||[]),...nw].forEach(x=>{if(x&&x.link)m.set(x.link,x)});
  const id=x=>+(String(x.link).match(/\/(\d+)$/)||[0,0])[1];
  return[...m.values()].sort((a,b)=>id(b)-id(a)).slice(0,40);
}
/* GitHub Actions'ın 5 dakikada bir hazırladığı hazır akış (kanal listesi dahil). Ulaşılamazsa canlı çekime (jina/proxy) düşülür.
   İki adres aynı anda okunur, daha yeni olan kullanılır: raw.githubusercontent.com bazen 5-8 dk eski kopya verir, GitHub API ise git deposundan okuduğu için günceldir
   (API anahtarsız saatte 60 istek sınırlıdır; tarayıcı önbelleği ve ETag sayesinde bu kullanım sınırı aşmaz, sınır dolarsa raw adresi devam eder). */
const TG_FEED='https://raw.githubusercontent.com/alibeypremium/alibaba-terminal/veri/tg.json';
const TG_API='https://api.github.com/repos/alibeypremium/alibaba-terminal/contents/tg.json?ref=veri';
async function tgFeed(){
  const one=async(url,opt)=>{
    const c=new AbortController(),to=setTimeout(()=>c.abort(),8000);
    try{
      const r=await fetch(url,{signal:c.signal,...opt});
      if(!r.ok)throw new Error(r.status);
      const j=await r.json();
      if(!j||!Array.isArray(j.ch)||!j.t)throw new Error('feed');
      return j;
    }finally{clearTimeout(to)}
  };
  try{
    const got=(await Promise.allSettled([
      one(TG_API,{headers:{Accept:'application/vnd.github.raw+json'}}),
      one(TG_FEED+'?m='+Math.floor(Date.now()/60000),{cache:'no-store'})
    ])).filter(x=>x.status==='fulfilled').map(x=>x.value);
    if(!got.length)return null;
    const j=got.reduce((a,b)=>+b.t>+a.t?b:a);
    const map={};j.ch.forEach(x=>{if(x&&x.k&&Array.isArray(x.items))map[x.k]=x.items});
    return{t:+j.t,cfg:j.cfg,map};
  }catch{return null}
}
/* Geçici hatada (jina/proxy ara sıra boş ya da hatalı döner) bir kez daha dener. */
async function tgFetchRetry(c){try{return await tgFetch(c)}catch{await new Promise(r=>setTimeout(r,1500));return tgFetch(c)}}
function mountTelegram(w,root,tabs){
  let TABS;const mkTabs=()=>{TABS=[['all','Tümü'],...TG_CATS.filter(c=>TG_CH.some(h=>h.cat===c[0]))]};mkTabs();
  let tab=LS.get('pano.tg.tab',TABS[0][0]);if(!TABS.find(t=>t[0]===tab))tab=TABS[0][0];
  const data=LS.get('pano.tg.c',{})||{};const ts=LS.get('pano.tg.ts',{})||{},legacy=LS.get('pano.tg.t',0);let bad=[];   /* ts: kanal başına son başarılı çekim zamanı */
  const tabsHtml=()=>'<div class="dv-tabs ctabs" role="tablist">'+TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  root.innerHTML='<div class="nw">'+hd('telegram','Telegram',(tabs||'')+'<button class="ibtn" type="button" id="tgr" aria-label="Yenile">'+I.refresh+'</button>')+'<div class="tg-sub" id="tgt"></div><div class="nw-list noscroll" id="tgl"></div><div class="foot" id="tgf"></div></div>';
  const list=$('#tgl',root),foot=$('#tgf',root),btn=$('#tgr',root),tt=$('#tgt',root);
  let seq=0,lastAt=0,lastLive=0,busy=false,why='';   /* busy: bir çekim sürerken true */
  const skel=()=>{list.innerHTML='<div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>'};
  const view=()=>mergeSD(TG_CH.filter(c=>tab==='all'||c.cat===tab).map(c=>data[c.k]||[]));
  /* Alt satır: verinin en son ne zaman çekildiği, en yeni mesajın ne kadar önce atıldığı ve alınamayan kanal sayısı. */
  const paintFoot=()=>{
    const chs=TG_CH.filter(c=>tab==='all'||c.cat===tab);
    const last=Math.max(0,...chs.map(c=>ts[c.k]||(data[c.k]?legacy:0)));
    let t=last?'Son Akış '+hms(last)+(Date.now()-last>25*60e3?' (eski)':''):'Henüz çekilmedi';
    const nb=chs.filter(c=>bad.includes(c.k)).length;if(nb)t+=' · '+nb+' kanal alınamadı';
    foot.textContent=t;
  };
  const show=()=>{
    const it=view();
    if(!it.length)return false;
    list.innerHTML=it.map(x=>{const d=TG_DIRECT.includes(x.cat)&&safeUrl(x.ext);const im=safeUrl(x.img);return'<a class="nw-i"'+(im?' data-img="'+esc(im)+'"':'')+(d?'':x.ext?' data-rd="1" data-rd-url="'+esc(safeUrl(x.ext))+'"':' data-rd="msg"')+' href="'+esc(d?safeUrl(x.ext):safeUrl(x.link))+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x.title)+'</b><span>'+esc([x.source,ago(x.date)].filter(Boolean).join(' · ')+(d?' · ürüne git ↗':''))+'</span>'+'</a>'}).join('');
    paintFoot();
    return true;
  };
  const fail=()=>{list.innerHTML='<div class="nw-msg"><div>Bu sekmede şu an mesaj yok ya da alınamadı.<br><span style="font-size:11px;opacity:.7">Kanal herkese açık olmayabilir ya da servis yanıt vermedi.</span>'+'<br><span style="font-size:10.5px;opacity:.75;word-break:break-word">Ayrıntı: '+esc(why||'(hata kaydı yok)')+' · sürüm tg-0511g</span></div><button type="button" id="tgrt">Tekrar dene</button></div>';foot.textContent='';$('#tgrt',list).onclick=()=>load(true)};
  /* Seçili sekmede gösterilecek mesaj yoksa: çekim sürüyorsa iskelet, bittiyse mesaj + "Tekrar dene" (iskelet sonsuza kadar kalmasın). */
  const empty=()=>{if(busy)skel();else fail()};
  async function load(force){
    lastAt=Date.now();busy=true;const my=++seq;let ok=0;
    btn.firstElementChild.classList.add('spin');
    if(!show())skel();
    const feed=await tgFeed();
    if(my!==seq)return;
    /* Kanal/kategori listesi akıştan gelir (tek yerden yönetilir); değiştiyse sekmeler yeniden çizilir. */
    const cf=feed&&feed.cfg;
    if(cf&&Array.isArray(cf.ch)&&cf.ch.length&&Array.isArray(cf.cats)&&JSON.stringify([cf.cats,cf.ch])!==JSON.stringify([TG_CATS,TG_CH.map(({k,u,name,cat})=>({k,u,name,cat}))])){
      TG_CATS.splice(0,TG_CATS.length,...cf.cats);TG_CH.splice(0,TG_CH.length,...cf.ch);
      if(Array.isArray(cf.direct))TG_DIRECT.splice(0,TG_DIRECT.length,...cf.direct);
      mkTabs();if(!TABS.find(t=>t[0]===tab))tab=TABS[0][0];tt.innerHTML=tabsHtml();
      if(!show())skel();
    }
    /* Hazır akış (tg.json) her dakika kontrol edilir; ucuz bir dosyadır. Canlı çekim (jina/proxy) yalnızca elle yenilemede ya da akış alınamıyor/15 dk'dan eskiyse ve son denemeden 5 dk geçmişse yapılır. */
    const stale=!feed||Date.now()-feed.t>=15*60e3;
    const live=force===true||(stale&&Date.now()-lastLive>=5*60e3);
    if(!live&&!feed){busy=false;btn.firstElementChild.classList.remove('spin');return}   /* akış alınamadı, canlı çekim için erken: eldeki veriyle kal */
    if(live)lastLive=Date.now();
    const fresh=!live;
    const pull=async c=>{
      const f=feed&&feed.map[c.k];
      if(fresh){if(f&&f.length)return{items:f,t:feed.t};throw new Error('akışta yok')}
      try{return{items:await tgFetchRetry(c),t:Date.now()}}
      catch(e){if(f&&f.length)return{items:f,t:feed.t};throw e}
    };
    const res=await Promise.allSettled(TG_CH.map(c=>pull(c).then(r=>{
      if(my!==seq)return;ok++;data[c.k]=tgUnion(data[c.k],r.items);ts[c.k]=r.t;
      show();
    })));
    if(my!==seq)return;
    bad=TG_CH.filter((c,i)=>res[i].status==='rejected').map(c=>c.k);
    const rj=res.find(x=>x.status==='rejected');why=rj&&rj.reason&&rj.reason.detail||'';
    if(ok){LS.set('pano.tg.c',data);LS.set('pano.tg.ts',ts);status('tg',true)}
    else status('tg',false);
    busy=false;
    if(!show())fail();   /* hiç mesaj yoksa (ya da seçili sekmenin kanalları gelmediyse) boş ekran yerine mesaj göster */
    btn.firstElementChild.classList.remove('spin');
  }
  tt.innerHTML=tabsHtml();
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-t]');if(!b)return;
    tab=b.dataset.t;LS.set('pano.tg.tab',tab);tt.innerHTML=tabsHtml();
    if(!show())empty();
    list.scrollTop=0;   /* yeni sekme en üstteki haberden başlasın */
  });
  btn.addEventListener('click',()=>load(true));
  every(w,()=>{if(!root.hidden&&list.querySelector('.nw-i'))paintFoot()},30e3);   /* "x dk önce" ve "eski" bilgisi kendiliğinden güncellensin */
  load();every(w,()=>{if(!root.hidden)load()},60e3);   /* 1 dk: yalnızca hazır akış dosyası okunur (ucuz); GitHub 5 dk'da bir güncellediği için yeni veri en geç ~1 dk içinde görünür */onBus(w,'refresh',()=>{if(!root.hidden)load()});
  return{off(){},on(){if(Date.now()-lastAt>60e3)load()}};
}
