'use strict';
/* AliBaba Terminal · kurul.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Dini Sorular: Diyanet Din İşleri Yüksek Kurulu kararları (soru-cevap) ----------
   Veri: GitHub Actions günde bir kez resmî siteden çeker (.github/scripts/kurul.mjs), veri-kurul dalına yazar.
   Metin olduğu gibi gösterilir: özetlenmez, yapay zekâya gönderilmez, değiştirilmez. Her görünümde kaynak ve resmî sayfa bağlantısı vardır. */
const KR_RAW='https://raw.githubusercontent.com/alibeypremium/alibaba-terminal/veri-kurul/';
const KR_SITE='https://kurul.diyanet.gov.tr/tr/kurul/kararlar';
const KR_ITEM='https://kurul.diyanet.gov.tr/tr/kurul/karar/';
const krUrl=u=>/^[\w.%-]+\/[0-9a-f-]{8,}$/i.test(u||'')?KR_ITEM+u:KR_SITE;
const krTr=s=>String(s||'').toLocaleLowerCase('tr');
/* "TİCARÎ HAYAT" → "Ticarî Hayat" */
const krCase=s=>krTr(s).replace(/(^|\s)(\S+)/g,(m,a,b)=>a+(/^(ve|ile|veya|ya|da)$/.test(b)?b:b.charAt(0).toLocaleUpperCase('tr')+b.slice(1)));
const krDate=d=>{const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):''};
const krKey=it=>String(it.u).split('/').pop();   /* kimlik (UUIDv7: zamana göre sıralı), günün sorusunun sırası kararlı kalsın */
const krBuc=()=>Math.floor(Date.now()/36e5);   /* veri saatte bir yenilenir, adres önbelleği bu kadar eskiyebilir */
async function krLoad(file){
  const j=await getJSON(KR_RAW+file+'?h='+krBuc(),12000);
  if(!j||!Array.isArray(j.items)||!j.items.length)throw new Error('kurul');
  return j;
}
function krOpen(w,ozet){
  if($('.kr-ov'))return;
  const prev=document.activeElement;
  let full=null,fullBusy=false,view='list',cur=null,cat='',q='',shown=50;
  const cats=[...new Set(ozet.items.map(x=>x.c).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
  const ov=document.createElement('div');ov.className='kr-ov';
  ov.innerHTML='<div class="kr" role="dialog" aria-modal="true" aria-labelledby="krT">'+
    '<div class="kr-h"><span class="kr-t" id="krT">Din İşleri Yüksek Kurulu Kararları</span><button type="button" class="kr-x" aria-label="Kapat" data-a="x">✕</button></div>'+
    '<div class="kr-tools"><input type="search" class="kr-s" placeholder="Soru, cevap veya kelime ara" aria-label="Ara" autocomplete="off"><div class="kr-cats noscroll" role="tablist"></div></div>'+
    '<div class="kr-b noscroll" tabindex="-1"></div>'+
    '<div class="kr-f">Kaynak: Diyanet Din İşleri Yüksek Kurulu · <a href="'+KR_SITE+'" target="_blank" rel="noopener noreferrer">kurul.diyanet.gov.tr</a></div></div>';
  document.body.appendChild(ov);
  const body=$('.kr-b',ov),inp=$('.kr-s',ov),catBox=$('.kr-cats',ov);
  const close=()=>{document.removeEventListener('keydown',onKey,true);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch{}};
  const onKey=e=>{if(e.key==='Escape'){e.stopPropagation();if(view==='detail')back();else close()}};
  document.addEventListener('keydown',onKey,true);
  /* Arama metni: soru, anahtar kelimeler, kategori; tam metin gelince cevap da. */
  const hay=x=>krTr([x.q,(x.k||[]).join(' '),x.c,x.s,x.a?x.a.join(' '):''].join(' '));
  const hayCache=new Map();
  const hayOf=x=>{const f=full&&full.get(x.u);const k=x.u+(f?'+':'');let h=hayCache.get(k);if(!h){h=hay(f?{...x,a:f.a}:x);hayCache.set(k,h)}return h};
  const filtered=()=>{
    const terms=krTr(q).split(/\s+/).filter(Boolean);
    const r=ozet.items.filter(x=>(!cat||x.c===cat)&&terms.every(t=>hayOf(x).includes(t)));
    if(terms.length){const inQ=x=>terms.every(t=>krTr(x.q).includes(t))?0:1;return r.map((x,i)=>[x,i]).sort((a,b)=>inQ(a[0])-inQ(b[0])||a[1]-b[1]).map(a=>a[0])}   /* sorusunda geçenler önce */
    return r;
  };
  const paintCats=()=>{
    catBox.innerHTML=['',...cats].map(c=>'<button type="button" role="tab" class="'+(c===cat?'on':'')+'" aria-selected="'+(c===cat)+'" data-c="'+esc(c)+'">'+esc(c?krCase(c):'Tümü')+'</button>').join('');
  };
  const paintList=()=>{
    view='list';cur=null;
    const r=filtered(),n=r.length;
    body.innerHTML=(n?r.slice(0,shown).map(x=>'<button type="button" class="kr-i" data-u="'+esc(x.u)+'"><b>'+esc(x.q)+'</b><span>'+esc([krCase(x.c),krDate(x.d),x.n?'Karar '+x.n:''].filter(Boolean).join(' · '))+'</span></button>').join('')+(n>shown?'<button type="button" class="kr-more" data-a="more">Daha fazla göster ('+(n-shown)+')</button>':''):'<div class="kr-empty">Eşleşen karar bulunamadı.</div>')+
      '<div class="kr-cnt">'+n+' karar'+(q&&!full?' · cevap metninde arama için tam metin yükleniyor…':'')+'</div>';
  };
  const para=a=>a.map(p=>'<p>'+esc(p)+'</p>').join('');
  const paintDetail=u=>{
    view='detail';
    const x=ozet.items.find(i=>i.u===u);if(!x)return paintList();
    cur=x;
    const f=full&&full.get(u);
    body.innerHTML='<button type="button" class="kr-back" data-a="back">‹ Listeye dön</button>'+
      '<div class="kr-meta">'+esc([x.n?'Kurul Karar No: '+x.n:'',krDate(x.d)].filter(Boolean).join(' · '))+'</div>'+
      '<div class="kr-cat">'+esc([krCase(x.c),krCase(x.s)].filter(Boolean).join(' › '))+'</div>'+
      '<h3 class="kr-sh">Soru</h3><p class="kr-q">'+esc(x.q)+'</p>'+
      '<h3 class="kr-sh">Cevap</h3><div class="kr-a">'+(f?para(f.a):'<p class="kr-wait">Cevap yükleniyor…</p>')+'</div>'+
      ((x.k&&x.k.length)?'<div class="kr-k">'+x.k.map(k=>'<button type="button" data-k="'+esc(k)+'"># '+esc(k)+'</button>').join('')+'</div>':'')+
      '<a class="kr-src" href="'+esc(krUrl(u))+'" target="_blank" rel="noopener noreferrer">Resmî sayfada aç ↗</a>';
    body.scrollTop=0;
    if(!f)ensureFull().then(m=>{if(view==='detail'&&cur&&cur.u===u){if(m&&m.get(u))paintDetail(u);else{const a=$('.kr-a',body);if(a)a.innerHTML='<p class="kr-wait">Cevap şu an alınamadı. Resmî sayfadan okuyabilirsin.</p>'}}});
  };
  const back=()=>{paintList();body.scrollTop=0};
  /* Tam metin (cevaplar) ilk ihtiyaçta yüklenir; yalnızca bellekte tutulur. */
  const ensureFull=async()=>{
    if(full)return full;
    if(fullBusy)return fullWait;
    fullBusy=true;
    fullWait=(async()=>{try{const j=await krLoad('kurul.json');full=new Map(j.items.map(x=>[x.u,x]))}catch{full=null}fullBusy=false;if(full&&view==='list'&&q)paintList();return full})();
    return fullWait;
  };
  let fullWait=null;
  ov.addEventListener('click',e=>{
    if(e.target===ov){close();return}
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.a==='x')close();
    else if(t.dataset.a==='back')back();
    else if(t.dataset.a==='more'){shown+=50;paintList()}
    else if(t.dataset.u)paintDetail(t.dataset.u);
    else if(t.dataset.k!=null){q=t.dataset.k;inp.value=q;cat='';shown=50;paintCats();paintList();ensureFull();body.scrollTop=0}
    else if(t.dataset.c!=null){cat=t.dataset.c;shown=50;paintCats();paintList();body.scrollTop=0}
  });
  let tm=0;
  inp.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{q=inp.value.trim();shown=50;if(q)ensureFull();paintList();body.scrollTop=0},150)});
  paintCats();paintList();inp.focus({preventScroll:true});
  return{open:u=>paintDetail(u)};
}
function mountKurul(w,root){
  let data=null,bad=false;
  root.innerHTML='<div class="kr-w">'+hd('kurul','Dini Sorular','')+
    '<div class="kr-card" role="button" tabindex="0" aria-label="Soruyu ve cevabı aç"><div class="kr-cq noscroll"></div><div class="kr-cf"></div></div></div>';
  const cq=$('.kr-cq',root),card=$('.kr-card',root);
  /* Günün sorusu: herkes için aynı. Takvim veride hazırdır (gun: tarih → karar); yoksa tarihten türetilen sabit bir sıra kullanılır. Tarih İstanbul saatine göredir. */
  const istDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul'}).format(Date.now());
  const hash=str=>{let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  const pick=()=>{
    const d=istDay(),u=data.gun&&data.gun[d],hit=u&&data.items.find(x=>x.u===u);
    if(hit)return hit;
    const s=[...data.items].sort((a,b)=>krKey(a)<krKey(b)?-1:1);
    return s[hash(d)%s.length];
  };
  /* Metin kutuya sığana kadar yazı boyutunu küçült. */
  const fit=()=>{
    if(!cq.firstElementChild)return;
    let lo=11,hi=24,best=11;
    while(hi-lo>.4){const m=(lo+hi)/2;cq.style.fontSize=m+'px';if(cq.scrollHeight<=cq.clientHeight+1){best=m;lo=m}else hi=m}
    cq.style.fontSize=best+'px';
  };
  const draw=()=>{
    if(!data){
      cq.innerHTML='<span>'+(bad?'Sorular şu an alınamadı. <button type="button" class="kr-rt">Tekrar dene</button>':'Yükleniyor…')+'</span>';return;
    }
    const x=pick();
    cq.innerHTML='<span>“'+esc(x.q)+'”</span>';
    card.dataset.u=x.u;fit();
  };
  async function load(){
    try{
      const j=await krLoad('kurul-ozet.json');
      data=j;bad=false;LS.set('pano.kurul.c',{t:j.t,gun:j.gun,items:j.items});status('kr',true);
    }catch{
      if(!data){const c=LS.get('pano.kurul.c',null);if(c&&Array.isArray(c.items)&&c.items.length)data={t:c.t,gun:c.gun,items:c.items}}
      bad=!data;status('kr',false);
    }
    draw();
  }
  const c0=LS.get('pano.kurul.c',null);if(c0&&Array.isArray(c0.items)&&c0.items.length)data={t:c0.t,gun:c0.gun,items:c0.items};
  draw();load();
  const open=()=>{if(data&&!document.body.classList.contains('editing')){const k=krOpen(w,data);if(k&&card.dataset.u)k.open(card.dataset.u)}};
  root.addEventListener('click',e=>{
    if(e.target.closest('.kr-rt')){load();return}
    if(e.target.closest('.kr-card'))open();
  });
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  new ResizeObserver(()=>requestAnimationFrame(fit)).observe(root);
  let shownDay=istDay();
  every(w,()=>{const d=istDay();if(d!==shownDay){shownDay=d;draw()}},600e3);   /* gün (İstanbul) değişince yeni soru */
  every(w,load,6*3600e3);onBus(w,'refresh',load);
}
