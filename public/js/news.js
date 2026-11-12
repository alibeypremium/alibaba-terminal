'use strict';
/* AliBaba Terminal · news.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
function mountNews(w,root,kind,tabs){
  const SRC='TRT Haber · NTV · Habertürk · CNN Türk · AA';
  root.innerHTML='<div class="nw">'+hd(kind,'<i class="nw-live"></i>Son Dakika',(tabs||'')+'<button class="ibtn" type="button" id="nr" aria-label="Yenile">'+I.refresh+'</button>')+'<div class="nw-list noscroll" id="nl"></div><div class="foot" id="nf">'+SRC+'</div></div>';
  const list=$('#nl',root),foot=$('#nf',root),btn=$('#nr',root);
  const skel=()=>{list.innerHTML='<div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>'};
  const show=items=>{
    list.innerHTML=items.filter(x=>safeUrl(x.link)).map(x=>'<a class="nw-i" data-rd="1"'+rdAttr(x)+' href="'+esc(safeUrl(x.link))+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x.title)+'</b><span>'+esc([x.source,ago(x.date)].filter(Boolean).join(' · '))+'</span></a>').join('');
    foot.textContent=SRC+' · '+(items.stale?'eski veri · '+hms(items.stale):new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}));
    rdWarm(list);
  };
  const fail=()=>{list.innerHTML='<div class="nw-msg"><div>Haberler şu an alınamadı.</div><button type="button" id="nrt">Tekrar dene</button></div>';$('#nrt',list).onclick=()=>load(true)};
  /* Kalıcı havuz: haberler başlığa göre tekilleşir, her haberin ilk görülen saati korunur.
     Böylece hangi kaynağın ne zaman geldiği ya da bir sitenin yayın saatini yenilemesi sıralamayı değiştirmez;
     en yeni haber hep üstte kalır, hiçbir yenileme listeyi geriye götürmez. */
  const KEY='pano.news.c.sd',MAXAGE=12*3600e3;
  const nk=x=>x.title.toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşıöç]/g,'').slice(0,70);
  const pool=new Map();
  const absorb=list=>{
    const now=Date.now();
    list.forEach(x=>{
      if(!x||!x.title)return;
      let t=x._t||Date.parse(x.date);if(!(t>0))t=now;t=Math.min(t,now);   /* ileri tarihli haber üste yapışmasın */
      const k=nk(x),e=pool.get(k);
      if(e){if(t<e._t)e._t=t}else pool.set(k,{title:x.title,link:x.link,source:x.source,_t:t});
    });
  };
  const view=()=>{
    const lim=Date.now()-MAXAGE;
    for(const [k,x] of pool)if(x._t<lim)pool.delete(k);
    const arr=[...pool.values()].sort((a,b)=>b._t-a._t).map(x=>({...x,date:new Date(x._t).toISOString()}));
    return mergeSD([arr]);
  };
  const cached=LS.get(KEY,null);
  let cachedAt=0;
  if(cached&&Array.isArray(cached.it)){absorb(cached.it);cachedAt=cached.t||0}
  let seq=0,shown=false,lastAt=0;
  async function load(force){
    lastAt=Date.now();const my=++seq;shown=false;let fresh=false;
    btn.firstElementChild.classList.add('spin');
    if(force===true)SD_KEYS.forEach(k=>delete feedCache[k]);
    if(pool.size){const it=view();if(it.length){it.stale=cachedAt;show(it);shown=true}}else skel();
    try{
      await sdItems(part=>{if(my!==seq)return;absorb(part);fresh=true;const it=view();if(it.length){show(it);shown=true}});
      if(my!==seq)return;
      const it=view();cachedAt=Date.now();
      LS.set(KEY,{t:cachedAt,it:it.map(x=>({title:x.title,link:x.link,source:x.source,_t:x._t}))});
      show(it);status('gn',true);
    }catch{
      if(my!==seq)return;
      if(!shown)fail();
      status('gn',false);
    }
    btn.firstElementChild.classList.remove('spin');
  }
  btn.addEventListener('click',()=>load(true));
  load();every(w,()=>{if(!root.hidden)load()},150e3);onBus(w,'refresh',()=>{if(!root.hidden)load()});
  return{off(){},on(){if(Date.now()-lastAt>60e3)load()}};
}

/* ---------- Teknoloji · Oyun · Otomobil haberleri ---------- */
/* Kaynaklar RSS ile okunur. Tarayıcı başka sitenin RSS'ini CORS yüzünden doğrudan okuyamaz; bu yüzden önce
   rss2json (CORS izinli, JSON döner), olmazsa herkese açık CORS vekilleri denenir. */
const TECH_FEEDS={
  webtekno:{name:'Webtekno',url:'https://www.webtekno.com/rss.xml'},
  webrazzi:{name:'Webrazzi',url:'https://webrazzi.com/feed/'},
  donanim:{name:'DonanımHaber',url:'https://www.donanimhaber.com/rss/tum/'},
  technopat:{name:'Technopat',url:'https://www.technopat.net/feed/'},
  tamindir:{name:'Tamindir',url:'https://www.tamindir.com/feed/'},
  cnnoto:{name:'CNN Türk',url:'https://www.cnnturk.com/feed/rss/otomobil/news'},
  htoto:{name:'Habertürk',url:'https://www.haberturk.com/rss/kategori/otomobil.xml'},
  merlin:{name:'Merlin\'in Kazanı',url:'https://www.merlininkazani.com/feed/'},
  motor1:{name:'Motor1',url:'https://tr.motor1.com/rss/articles/all/'},
  /* Son dakika kaynakları: urls sırayla denenir, ilk dolu olan kullanılır */
  sd_trt:{name:'TRT Haber',urls:['https://www.trthaber.com/sondakika.rss','https://www.trthaber.com/sondakika_articles.rss']},
  sd_ntv:{name:'NTV',urls:['https://www.ntv.com.tr/son-dakika.rss','https://www.ntv.com.tr/gundem.rss']},
  sd_ht:{name:'Habertürk',urls:['https://www.haberturk.com/rss/manset.xml','https://www.haberturk.com/rss']},
  sd_cnn:{name:'CNN Türk',urls:['https://www.cnnturk.com/feed/rss/all/news']},
  sd_aa:{name:'AA',urls:['https://www.aa.com.tr/tr/rss/default?cat=guncel']}
};
const SD_KEYS=['sd_trt','sd_ntv','sd_ht','sd_cnn','sd_aa'];
/* Ekonomi sekmesi */
TECH_FEEDS.eko_bht={name:'Bloomberg HT',urls:['https://www.bloomberght.com/rss']};
TECH_FEEDS.eko_aa={name:'AA',urls:['https://www.aa.com.tr/tr/rss/default?cat=ekonomi']};
TECH_FEEDS.eko_cnn={name:'CNN Türk',urls:['https://www.cnnturk.com/feed/rss/ekonomi/news']};
TECH_FEEDS.eko_ntv={name:'NTV',urls:['https://www.ntv.com.tr/ekonomi.rss']};
TECH_FEEDS.eko_ht={name:'Habertürk',urls:['https://www.haberturk.com/rss/ekonomi.xml']};
const ECO_KEYS=['eko_bht','eko_aa','eko_cnn','eko_ntv','eko_ht'];
/* [sekme, ad, okunacak beslemeler, yalnızca bu sekmeye ait (tüm haberleri gösterilen) beslemeler] */
const TECH_TABS=[
  ['tekno','Teknoloji',['webtekno','webrazzi','donanim','technopat','tamindir'],[]],
  ['oyun','Oyun',['merlin','donanim','webtekno'],['merlin']],
  ['oto','Otomobil',['motor1','cnnoto','htoto','donanim','webtekno'],['motor1','cnnoto','htoto']],
  ['eko','Ekonomi',ECO_KEYS,ECO_KEYS]
];
/* Karma beslemelerdeki (DonanımHaber, Webtekno) haberler kategori ve başlığa göre sekmelere dağıtılır. */
const RE_OYUN=/oyun|playstation|\bps[345]\b|xbox|nintendo|\bsteam\b|game pass|\bgta\b|fortnite|epic games|valorant|e-?spor|gamescom/i;
const RE_OTO=/otomobil|otomotiv|elektrikli ara[çc]|\btogg\b|\bsuv\b|sedan|hibrit|tesla|ferrari|porsche|lamborghini|formula 1|\bf1\b/i;
function techKind(x){
  const t=(x.cats||[]).join(' ')+' '+x.title;
  if(RE_OYUN.test(t))return'oyun';
  if(RE_OTO.test(t))return'oto';
  return'tekno';
}
const feedCache={};
const decHTML=s=>{const t=document.createElement('textarea');t.innerHTML=String(s||'');return t.value.replace(/\s+/g,' ').trim()};
function getFeed(key,ttl=10*60e3,proxyFirst=false){
  const f=TECH_FEEDS[key],c=feedCache[key];
  if(c&&Date.now()-c.t<ttl)return c.p;
  const iso=s=>{const m=String(s||'').match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);return m?m[1]+'T'+m[2]+'Z':s};   /* rss2json saati UTC verir */
  const viaR2J=async url=>{
    const j=await getJSON('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(url),11000);
    if(j.status!=='ok'||!Array.isArray(j.items)||!j.items.length)throw new Error('rss2json');
    return j.items.map(i=>({title:decHTML(i.title),link:i.link,date:iso(i.pubDate),cats:(i.categories||[]).map(decHTML),sum:rssSum(i.content||i.description),img:i.thumbnail||(i.enclosure&&/image/i.test(i.enclosure.type||'image')&&i.enclosure.link)||((String(i.content||i.description||'').match(/<img[^>]+src=["']([^"']+)/i)||[])[1])||''}));
  };
  const viaPx=async url=>{const it=await viaProxy(url,t=>{const a=parseRSS(t);if(!a.length)throw new Error('boş');return a});return it.map(i=>({title:decHTML(i.title),link:i.link,date:i.date,cats:[],sum:i.sum,img:i.img}))};
  const one=async url=>{
    /* Son dakikada rss2json önbelleği eski kalabildiği için önce vekiller denenir */
    if(proxyFirst)return Promise.any([viaPx(url),viaR2J(url)]);   /* hızlı mod: ikisi aynı anda, ilk dolu cevap kazanır */
    try{return await viaR2J(url)}catch{return await viaPx(url)}
  };
  const p=(async()=>{
    let items,err;
    const urls=f.urls||[f.url];
    if(proxyFirst){try{items=await Promise.any(urls.map(one))}catch(e){err=e}}   /* adresler de paralel */
    else for(const url of urls){try{items=await one(url);if(items&&items.length)break}catch(e){err=e}}
    if(!items||!items.length)throw err||new Error('besleme yok');
    return items.filter(x=>x.title&&safeUrl(x.link)).map(x=>({...x,source:f.name}));
  })();
  feedCache[key]={t:Date.now(),p};p.catch(()=>{delete feedCache[key]});return p;
}
function mergeSD(lists){
  const keys=[],out=[];
  lists.flat().sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).forEach(x=>{
    const key=x.title.toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşıöç]/g,'');
    if(keys.some(k=>k===key||(Math.min(k.length,key.length)>=25&&(k.startsWith(key)||key.startsWith(k)))))return;
    keys.push(key);out.push(x);
  });
  return out.slice(0,40);
}
/* Kaynaklar geldikçe onPart çağrılır: ilk gelen hemen görünür, en yavaşı beklenmez. */
async function sdItems(onPart,keys=SD_KEYS){
  const got={};
  const res=await Promise.allSettled(keys.map(k=>getFeed(k,90e3,true).then(it=>{got[k]=it.slice(0,15);if(onPart)onPart(mergeSD(Object.values(got)))})));
  if(!Object.keys(got).length)throw new Error('besleme yok');
  return mergeSD(Object.values(got));
}
async function techItems(tab){
  const T=TECH_TABS.find(t=>t[0]===tab);
  const res=await Promise.allSettled(T[2].map(async k=>({k,items:await getFeed(k,10*60e3,k.startsWith('eko_'))})));
  const ok=res.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(!ok.length)throw new Error('besleme yok');
  /* Aynı haber farklı sitelerde biraz farklı başlıkla çıkabilir: biri diğerinin başlangıcıysa tekrar sayılır. */
  const keys=[],out=[];
  ok.flatMap(({k,items})=>items.filter(x=>T[3].includes(k)||techKind(x)===tab))
    .sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0))
    .forEach(x=>{
      const key=x.title.toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşıöç]/g,'');
      if(keys.some(k=>k===key||(Math.min(k.length,key.length)>=25&&(k.startsWith(key)||key.startsWith(k)))))return;
      keys.push(key);out.push(x);
    });
  if(!out.length)throw new Error('boş');
  return out.slice(0,40);
}
function mountTechNews(w,root){
  let tab=LS.get('pano.tech.tab','tekno');if(!TECH_TABS.find(t=>t[0]===tab))tab='tekno';
  const tabsHtml=()=>'<div class="dv-tabs" role="tablist">'+TECH_TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  root.innerHTML='<div class="nw">'+hd('tech','Haberler','<span id="tt" style="display:contents"></span><button class="ibtn" type="button" id="nr" aria-label="Yenile">'+I.refresh+'</button>')+'<div class="nw-list noscroll" id="nl"></div><div class="foot" id="nf"></div></div>';
  const list=$('#nl',root),foot=$('#nf',root),btn=$('#nr',root),tt=$('#tt',root);
  const skel=()=>{list.innerHTML='<div class="skel"></div><div class="skel" style="width:80%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>'};
  const srcNames=()=>TECH_TABS.find(t=>t[0]===tab)[2].map(k=>TECH_FEEDS[k].name).join(', ');
  const show=items=>{
    list.innerHTML=items.map(x=>'<a class="nw-i" data-rd="1"'+rdAttr(x)+' href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer"><b>'+esc(x.title)+'</b><span>'+esc([x.source,ago(x.date)].filter(Boolean).join(' · '))+'</span></a>').join('');
    foot.textContent=items.stale?'eski veri · '+hms(items.stale):srcNames()+' · '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    rdWarm(list);
  };
  const fail=()=>{list.innerHTML='<div class="nw-msg"><div>Haberler şu an alınamadı.</div><button type="button" id="nrt">Tekrar dene</button></div>';foot.textContent='';$('#nrt',list).onclick=()=>load(true)};
  /* Sekme başına kalıcı havuz: yeni çekim eski listeyle birleşir (başlığa göre tekilleşir). Gecikmeli/önbellekli bir kaynak
     ya da eksik gelen bir yenileme, daha önce görülen haberi listeden düşüremez; sekme değişince liste boşalıp dolmaz. */
  const nk=x=>x.title.toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşıöç]/g,'').slice(0,70);
  const pools={},at={};   /* at: sekmenin son başarılı çekim zamanı */
  const absorb=(m,list)=>{
    const now=Date.now();
    (list||[]).forEach(x=>{
      if(!x||!x.title||!safeUrl(x.link))return;
      let t=Date.parse(x.date);if(!(t>0))t=now;t=Math.min(t,now);
      const k=nk(x),e=m.get(k);
      if(e){if(t<e._t)e._t=t}else m.set(k,{title:x.title,link:x.link,source:x.source,_t:t});
    });
  };
  const poolOf=t=>{
    if(pools[t])return pools[t];
    const m=pools[t]=new Map(),c=LS.get('pano.tech.c.'+t,null);
    if(c&&Array.isArray(c.items)){absorb(m,c.items);at[t]=0;m._c=c.t||0}
    return m;
  };
  const view=t=>{
    const m=poolOf(t);
    const arr=[...m.values()].sort((a,b)=>b._t-a._t).map(x=>({...x,date:new Date(x._t).toISOString()}));
    const it=mergeSD([arr]);
    const keep=new Set(arr.slice(0,80).map(x=>nk(x)));for(const k of [...m.keys()])if(!keep.has(k))m.delete(k);   /* havuz büyümesin */
    return it;
  };
  let busyN=0;
  async function load(force){
    const t0=tab,m=poolOf(t0);busyN++;
    btn.firstElementChild.classList.add('spin');
    if(force===true)TECH_TABS.find(t=>t[0]===t0)[2].forEach(k=>delete feedCache[k]);
    if(m.size){const it=view(t0);if(!at[t0])it.stale=m._c;show(it)}else skel();   /* eldeki liste hemen görünür, iskelet yalnızca hiç veri yoksa */
    try{
      const items=await techItems(t0);
      absorb(m,items);at[t0]=Date.now();
      const it=view(t0);
      LS.set('pano.tech.c.'+t0,{t:at[t0],items:it.map(x=>({title:x.title,link:x.link,source:x.source,date:x.date}))});
      if(tab===t0)show(it);
      status('kn',true);
    }catch{
      if(tab===t0){if(m.size){const it=view(t0);it.stale=at[t0]||m._c;show(it)}else fail()}
      status('kn',false);
    }finally{
      if(--busyN<=0)btn.firstElementChild.classList.remove('spin');
    }
  }
  tt.innerHTML=tabsHtml();
  /* Her 60 saniyede teknoloji → oyun → otomobil → teknoloji. Elle seçimde süre yeniden başlar. */
  let timer=0;const gen=w._gen;
  const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{
    if(w._gen!==gen)return;   /* widget kaldırıldı */
    tab=TECH_TABS[(TECH_TABS.findIndex(t=>t[0]===tab)+1)%TECH_TABS.length][0];
    LS.set('pano.tech.tab',tab);tt.innerHTML=tabsHtml();list.scrollTop=0;load();list.scrollTop=0;arm();
  },60e3)};
  root.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(!b)return;tab=b.dataset.t;LS.set('pano.tech.tab',tab);tt.innerHTML=tabsHtml();list.scrollTop=0;load();list.scrollTop=0;arm()});   /* yeni sekme en üstten başlasın */
  btn.addEventListener('click',()=>load(true));
  arm();
  load();every(w,()=>load(),15*60e3);onBus(w,'refresh',()=>load());
}

/* ---------- Kayan haber şeridi: Teknoloji + Oyun + Otomobil + Ekonomi karışık ---------- */
/* Haber widget'ıyla aynı beslemeleri (feedCache) kullanır; ek ağ isteği yapmaz. Her kategoriden sırayla birer haber alınır. */
function startNewsTicker(){
  const el=$('#tk');if(!el)return;
  const TAG={tekno:['TEKNO','#0a84ff'],oyun:['OYUN','#8b5cf6'],oto:['OTO','#f97316'],eko:['EKO','#16a34a']};
  const item=x=>'<a class="tk-i" data-rd="1"'+rdAttr(x)+' href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer"><span class="tk-tag" style="background:'+TAG[x.kind][1]+'">'+TAG[x.kind][0]+'</span><span>'+esc(x.title)+'</span><span class="tk-src">'+esc(x.source||'')+'</span></a>';
  const paint=items=>{
    if(!items||!items.length){el.hidden=true;syncTkSoon();return}
    const g=items.map(item).join('');
    el.innerHTML='<div class="tk-track"><div class="tk-grp">'+g+'</div><div class="tk-grp" aria-hidden="true">'+g.replace(/<a /g,'<a tabindex="-1" ')+'</div></div>';
    el.hidden=false;syncTkSoon();
    /* Hız sabit (~30 px/sn): süre, tek grubun genişliğinden hesaplanır. */
    requestAnimationFrame(()=>{const gw=$('.tk-grp',el);if(gw)el.style.setProperty('--dur',Math.max(60,gw.getBoundingClientRect().width/30).toFixed(0)+'s')});
  };
  /* Tıklanan haber odakta kalıp şeridi durdurmasın: tıklamadan sonra odağı bırak. */
  el.addEventListener('click',e=>{const a=e.target.closest('a');if(a)setTimeout(()=>a.blur(),0)});
  const cached=LS.get('pano.news.strip',null);
  if(cached&&Array.isArray(cached.items))paint(cached.items);
  let busy=false;
  const load=async force=>{
    if(busy)return;busy=true;
    try{
      const ST=TECH_TABS;   /* Teknoloji · Oyun · Otomobil · Ekonomi */
      if(force===true)ST.forEach(t=>t[2].forEach(k=>delete feedCache[k]));
      const res=await Promise.allSettled(ST.map(async t=>({k:t[0],items:await techItems(t[0])})));
      const ok=res.filter(r=>r.status==='fulfilled').map(r=>r.value);
      if(!ok.length)return;   /* eski şerit kalsın */
      const seen=new Set(),out=[];
      for(let i=0;i<10;i++)ok.forEach(({k,items})=>{const x=items[i];if(x&&!seen.has(x.link)){seen.add(x.link);out.push({title:x.title,link:x.link,source:x.source,kind:k,sum:x.sum,img:x.img})}});
      /* Sıra tamamen karışık: kategori ve tarih sırası gözetilmez (Fisher-Yates). */
      for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
      if(out.length){LS.set('pano.news.strip',{t:Date.now(),items:out});paint(out)}
    }catch{}finally{busy=false}
  };
  load();setInterval(load,15*60e3);bus.addEventListener('refresh',()=>load());
}
