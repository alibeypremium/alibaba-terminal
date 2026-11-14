'use strict';
/* AliBaba Terminal · app.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
const REG={   /* sıra = varsayılan yerleşim (ızgara soldan sağa, yukarıdan aşağıya doldurulur) */
 gnews:{title:'Son Dakika · Telegram',def:[3,3],mount:mountHaber},
 youtube:{title:'YouTube · Kick · Twitch · TV · Video · Bilgisayar',def:[6,4],mount:mountMedia},
 tech:{title:'Teknoloji · Oyun · Otomobil · Ekonomi',def:[3,3],mount:mountTechNews},
 prayer:{title:'Namaz Vakitleri',def:[3,1],mount:mountPrayer},
 fx:{title:'Döviz Kurları',def:[3,1],mount:mountFX},
 daily:{title:'Ayet · Hadis · Esma',def:[3,1],mount:mountDaily},
 events:{title:'FİLMLER',def:[3,2],mount:mountEvents},
 games:{title:'Oyunlar',def:[3,2],mount:mountGames},
 ps:{title:'PLAYSTATION',def:[3,2],mount:mountPS},
 weather:{title:'Hava Durumu',def:[2,1],mount:mountWeather},
 controls:{title:'Kontrol',def:[1,1],mount:mountControls},
 radio:{title:'Radyo',def:[3,1],mount:mountRadio},
 tv:{title:'TradingView',def:[2,1],mount:mountTV},
 notes:{title:'Notlarım',def:[3,1],hide:true,mount:mountNotes},
 kurul:{title:'Dini Sorular',def:[3,1],hide:true,mount:mountKurul},
 sys:{title:'Sistem Durumu',def:[3,2],hide:true,mount:mountSystem}
};
const PRESETS={XS:[2,1],S:[2,2],M:[3,2],L:[4,3],XL:[6,4]};
const grid=$('#grid');
const defaultLayout=()=>Object.keys(REG).map(id=>({id,w:REG[id].def[0],h:REG[id].def[1],hidden:!!REG[id].hide||id==='games'}));   /* varsayılan düzen: 12 sütun; Oyunlar widget'ı varsayılan olarak kapalı, PlayStation 3×2 */
let layout=LS.get('pano.layout.v3',null);
const freshLayout=!Array.isArray(layout);
if(freshLayout){layout=defaultLayout();LS.set('pano.controls.size',1);LS.set('pano.ps.size',2)}   /* yeni kurulumda tek seferlik boyut göçleri atlanır */
layout=layout.map(l=>l&&l.id==='kantan'?{...l,id:'tech'}:l);   /* eski Kantan widget'ının yerini ve boyutunu koru */
layout=layout.filter(l=>REG[l.id]);
try{Object.keys(localStorage).filter(k=>k.startsWith('pano.fb.')||k.startsWith('pano.x.')).forEach(k=>localStorage.removeItem(k))}catch{}   /* kaldırılan Futbol ve X widget'larının eski kayıtları */
Object.keys(REG).forEach(id=>{if(!layout.find(l=>l.id===id))layout.push({id,w:REG[id].def[0],h:REG[id].def[1],hidden:id!=='controls'&&id!=='radio'&&id!=='ps'})});
layout.forEach(l=>{if(l.id==='controls')l.hidden=false});
if(LS.get('pano.controls.size',0)!==1){const c=layout.find(l=>l.id==='controls');if(c){c.w=1;c.h=1}LS.set('pano.controls.size',1);LS.set('pano.layout.v3',layout)}   /* tek seferlik: Kontrol 1x1 olsun */   /* Düzenle düğmesi bu widget'ta: hiçbir zaman gizlenmez */
if(LS.get('pano.ps.size',0)!==2){const c=layout.find(l=>l.id==='ps');if(c){c.w=3;c.h=3}LS.set('pano.ps.size',2);LS.set('pano.layout.v3',layout)}   /* tek seferlik: PlayStation widget'ı 4×2 olsun */
const saveLayout=()=>LS.set('pano.layout.v3',layout);
const items={};
let cols=12,gap=14,cellW=150,cellH=150;

/* Kontrol widget'ı 1 sütun olabilir; diğerleri en az 2. */
/* Tablet (6 sütun): grafik, hava ve oyun widget'ları en az 3 sütun × 2 satır olsun */
const TAB_MIN={ps:[3,3],radio:[3,2],tv:[3,2],weather:[3,2],games:[3,2]};
function effW(w,id){if(cols===4)return 4;const m=cols===6&&TAB_MIN[id]?TAB_MIN[id][0]:0;return Math.min(cols,Math.max(id==='controls'?1:2,w,m))}
/* Mobilde (4 sütun) hücreler küçük kalır; grafik, hava, namaz saatleri ve notlar için asgari yükseklik */
const MOB_MIN={ps:4,radio:4,tv:4,weather:3,prayer:3,kurul:3,sys:5,fx:3,notes:3,controls:2};
function effH(h,id){return cols===4?Math.max(h+1,MOB_MIN[id]||0):cols===6&&TAB_MIN[id]?Math.max(h,TAB_MIN[id][1]):h}
function applySize(el,l){el.style.gridColumn='span '+effW(l.w,l.id);el.style.gridRow='span '+effH(l.h,l.id);paintSizes(el,l)}
function paintSizes(el,l){$$('.w-sizes button',el).forEach(b=>{const p=PRESETS[b.dataset.s];b.classList.toggle('on',p[0]===l.w&&p[1]===l.h)})}
function metrics(){
  const W=grid.clientWidth;cols=W>=1000?12:W>=700?6:4;gap=W<520?10:14;
  const fit=cols===12;document.body.classList.toggle('fit',fit);
  const cw=(W-gap*(cols-1))/cols;let ch=cw;
  if(fit){
    const top=grid.getBoundingClientRect().top+scrollY;
    ch=Math.max(92,Math.min(260,(innerHeight-top-14-gap*5)/6));
    grid.style.setProperty('--cellh',ch+'px');
    const over=document.documentElement.scrollHeight-innerHeight;
    if(over>0&&over<=30)ch=Math.max(84,ch-Math.ceil(over/6));   /* yalnızca küçük taşmayı gider; ekran gerçekten kısaysa düzen (7) ile aynı kalır */
  }
  cellW=cw;cellH=ch;
  grid.style.setProperty('--cols',cols);grid.style.setProperty('--gap',gap+'px');grid.style.setProperty('--cell',cw+'px');grid.style.setProperty('--cellh',ch+'px');
  Object.values(items).forEach(el=>applySize(el,layout.find(l=>l.id===el.dataset.id)));
  syncTk();
}
/* Kayan şerit YouTube widget'ının tam üstüne hizalanır; soldaki kur/kripto çipleri kalan genişliğe sığacak kadar küçültülür.
   offsetLeft/offsetWidth kullanılır: fare eğimi (3B dönüş) ölçümü bozmaz. */
let tkRaf=0;
function syncTk(){
  const sb=$('#sb'),tk=$('#tk'),ch=$('#sbChips'),yt=items.youtube;
  if(!sb||!tk||!ch)return;
  const on=cols===12&&!!yt&&!yt.hidden&&!tk.hidden&&yt.offsetWidth>0;
  sb.classList.toggle('al',on);
  if(!on){tk.style.left='';tk.style.width='';ch.style.zoom='';return}
  const left=yt.offsetLeft-sb.offsetLeft-sb.clientLeft;
  tk.style.left=left+'px';tk.style.width=yt.offsetWidth+'px';
  ch.style.zoom='1';
  const padL=parseFloat(getComputedStyle(sb).paddingLeft)||14;
  const avail=left-padL-10,nat=ch.scrollWidth;
  ch.style.zoom=nat>0&&avail>0?Math.max(.6,Math.min(1.3,avail/nat)).toFixed(3):'1';
}
const syncTkSoon=()=>{if(tkRaf)return;tkRaf=requestAnimationFrame(()=>{tkRaf=0;syncTk()})};
function build(l,idx){
  const r=REG[l.id];
  const el=document.createElement('section');
  el.className='w';el.dataset.id=l.id;el.style.setProperty('--d',(-(idx*.07)%.3).toFixed(2)+'s');
  el.innerHTML='<div class="w-body"><div class="w-in"></div></div><button class="w-minus" type="button" aria-label="'+r.title+' widget\'ını kaldır">−</button><div class="w-sizes">'+Object.keys(PRESETS).map(k=>'<button type="button" data-s="'+k+'">'+k+'</button>').join('')+'</div><div class="w-resize" aria-hidden="true"></div><div class="w-grip" aria-hidden="true"></div><div class="w-shield"></div>';
  items[l.id]=el;
  return el;
}
function ensureMounted(el){
  if(el._m)return;el._m=1;el._gen=(el._gen||0)+1;
  REG[el.dataset.id].mount(el,$('.w-in',el));
}
/* Widget'ı tamamen kapat: medyayı durdur, zamanlayıcı/dinleyicileri geçersiz kıl, içeriği at.
   Yeniden eklenince ensureMounted sıfırdan kurar. */
function unmount(el){
  if(!el._m)return;
  el._m=0;el._gen=(el._gen||0)+1;
  if(el._dispose){try{el._dispose()}catch{}el._dispose=null}
  const old=$('.w-in',el);
  if(old){
    $$('iframe',old).forEach(f=>{try{f.src='about:blank'}catch{}});
    $$('video,audio',old).forEach(v=>{try{v.pause();v.removeAttribute('src');v.load()}catch{}});
    const fresh=document.createElement('div');fresh.className='w-in';
    old.replaceWith(fresh);   /* eski düğümle birlikte eski dinleyiciler de gider */
  }
}
function render(){
  grid.innerHTML='';
  layout.forEach((l,i)=>{const el=items[l.id]||build(l,i);el.hidden=!!l.hidden;grid.appendChild(el);if(l.hidden)unmount(el);else ensureMounted(el)});
  metrics();paintTray();
}

/* 3B eğim + ışık (fare ile) */
let tiltRaf=0,tiltEv=null;
grid.addEventListener('pointermove',e=>{
  if(document.body.classList.contains('editing')||e.pointerType!=='mouse'||document.documentElement.dataset.lite==='1')return;   /* Sade modda eğim yok */
  const el=e.target.closest('.w');if(!el)return;
  if(el.dataset.id==='youtube'){tiltEv=null;const s=el.style;s.setProperty('--rx','0deg');s.setProperty('--ry','0deg');s.setProperty('--glare',0);return}   /* YouTube · Kick · Twitch · TV · Video · Bilgisayar widget'ı hiçbir sekmede fareyle eğilmesin */
  tiltEv={el,cx:e.clientX,cy:e.clientY};
  if(tiltRaf)return;
  tiltRaf=requestAnimationFrame(()=>{
    tiltRaf=0;const t=tiltEv;if(!t||!t.el.isConnected)return;
    const r=t.el.getBoundingClientRect(),x=(t.cx-r.left)/r.width,y=(t.cy-r.top)/r.height;
    const st=t.el.style;
    st.setProperty('--ry',((x-.5)*7).toFixed(2)+'deg');st.setProperty('--rx',((.5-y)*7).toFixed(2)+'deg');
    st.setProperty('--mx',(x*100)+'%');st.setProperty('--my',(y*100)+'%');st.setProperty('--glare',1);
  });
});
grid.addEventListener('pointerout',e=>{const el=e.target.closest&&e.target.closest('.w');if(el&&!el.contains(e.relatedTarget)){tiltEv=null;el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');el.style.setProperty('--glare',0)}});

/* Düzenleme modu */
const body=document.body;
function edit(on){
  body.classList.toggle('editing',on);
  const eb=$('#editBtn');if(eb){eb.innerHTML=on?I.check:I.pencil;eb.title=on?'Bitti':'Düzenle';eb.classList.toggle('on',on)}
  if(on)$('#cityPop').hidden=true;
}
document.addEventListener('click',e=>{if(e.target.closest('#editBtn'))edit(!body.classList.contains('editing'))});
$('#doneBtn').addEventListener('click',()=>edit(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){edit(false);$('#cityPop').hidden=true}});
$('#resetBtn').addEventListener('click',()=>{layout=defaultLayout();saveLayout();render()});
function paintTray(){
  const hid=layout.filter(l=>l.hidden);
  $('#trayList').innerHTML=hid.length?hid.map(l=>'<button type="button" data-add="'+l.id+'">+ '+REG[l.id].title+'</button>').join(''):'<span class="lbl">(hepsi ekranda)</span>';
}
$('#tray').addEventListener('click',e=>{
  const b=e.target.closest('[data-add]');if(!b)return;
  const i=layout.findIndex(l=>l.id===b.dataset.add);const [l]=layout.splice(i,1);l.hidden=false;layout.push(l);saveLayout();render();
});
grid.addEventListener('click',e=>{
  if(!body.classList.contains('editing'))return;
  const el=e.target.closest('.w');if(!el)return;
  const l=layout.find(x=>x.id===el.dataset.id);
  if(e.target.closest('.w-minus')){l.hidden=true;el.hidden=true;unmount(el);saveLayout();paintTray();syncTkSoon();return}
  const sb=e.target.closest('.w-sizes button');
  if(sb){const p=PRESETS[sb.dataset.s];l.w=p[0];l.h=p[1];saveLayout();applySize(el,l);syncTkSoon()}
});
/* uzun basınca düzenleme */
let lp=null;
grid.addEventListener('pointerdown',e=>{
  if(body.classList.contains('editing'))return;
  if(e.button||e.target.closest('input,textarea,button,a,iframe,.yt-view'))return;   /* sağ/orta tık düzenlemeyi açmaz */
  const x=e.clientX,y=e.clientY;
  lp=setTimeout(()=>edit(true),650);
  const cancel=ev=>{if(ev.type==='pointerup'||ev.type==='pointercancel'||Math.hypot(ev.clientX-x,ev.clientY-y)>10){clearTimeout(lp);window.removeEventListener('pointermove',cancel);window.removeEventListener('pointerup',cancel);window.removeEventListener('pointercancel',cancel)}};
  window.addEventListener('pointermove',cancel);window.addEventListener('pointerup',cancel);window.addEventListener('pointercancel',cancel);
});
/* Sürükle-bırak sıralama */
function flip(fn,skip){
  const els=[...grid.children].filter(c=>c!==skip&&!c.hidden);
  const before=new Map(els.map(c=>[c,c.getBoundingClientRect()]));
  fn();
  els.forEach(c=>{const a=before.get(c),b=c.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
    if(dx||dy)c.animate({translate:[dx+'px '+dy+'px','0px 0px']},{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'})});
}
/* Not: widget DOM'da yer değiştirince tarayıcı işaretçi yakalamasını bırakır.
   Bu yüzden hareket ve bırakma olayları pencereden dinlenir. */
grid.addEventListener('pointerdown',e=>{
  if(!body.classList.contains('editing'))return;
  const grip=e.target.closest('.w-grip'),sh=e.target.closest('.w-shield');
  if(!grip&&!sh)return;
  if(sh&&!grip&&e.pointerType==='touch')return;   /* dokunmatikte sayfa kaydırılabilsin; sürükleme tutamaçtan */
  if(e.button!==undefined&&e.button!==0)return;
  e.preventDefault();
  const el=(grip||sh).closest('.w'),pid=e.pointerId;
  const r0=el.getBoundingClientRect(),gx=e.clientX-r0.left,gy=e.clientY-r0.top;
  let swapped=null,cool=0,lx=e.clientX,ly=e.clientY;
  el.classList.add('dragging');body.classList.add('is-dragging');
  const place=()=>{
    el.style.translate='0px 0px';const b=el.getBoundingClientRect();
    el.style.translate=(lx-gx-b.left)+'px '+(ly-gy-b.top)+'px';
    return b;
  };
  const mv=ev=>{
    if(ev.pointerId!==pid)return;
    lx=ev.clientX;ly=ev.clientY;
    if(ly<80)scrollBy(0,-18);else if(ly>innerHeight-80)scrollBy(0,18);
    const b=place();
    if(lx>b.left&&lx<b.right&&ly>b.top&&ly<b.bottom){swapped=null;return}
    if(performance.now()<cool)return;
    const over=[...grid.children].find(c=>{if(c===el||c.hidden)return false;const r=c.getBoundingClientRect();return lx>r.left&&lx<r.right&&ly>r.top&&ly<r.bottom});
    if(!over||over===swapped)return;
    swapped=over;
    const after=!!(el.compareDocumentPosition(over)&Node.DOCUMENT_POSITION_FOLLOWING);
    flip(()=>grid.insertBefore(el,after?over.nextSibling:over),el);
    place();cool=performance.now()+220;
  };
  const up=ev=>{
    if(ev&&ev.pointerId!==pid)return;
    removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    const from=el.style.translate||'0px 0px';
    el.classList.remove('dragging');body.classList.remove('is-dragging');
    el.animate({translate:[from,'0px 0px']},{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});el.style.translate='';
    layout=[...grid.children].map(c=>layout.find(l=>l.id===c.dataset.id)).filter(Boolean);saveLayout();syncTkSoon();
  };
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
});
/* Yeniden boyutlandırma */
grid.addEventListener('pointerdown',e=>{
  const h=e.target.closest('.w-resize');if(!h||!body.classList.contains('editing'))return;
  e.preventDefault();e.stopPropagation();
  const el=h.parentElement,l=layout.find(x=>x.id===el.dataset.id),pid=e.pointerId;
  const step=cellW+gap,stepY=cellH+gap;
  const sx=e.clientX,sy=e.clientY,w0=effW(l.w,l.id),h0=effH(l.h,l.id);
  body.classList.add('is-dragging');
  const mv=ev=>{
    if(ev.pointerId!==pid)return;
    const nw=Math.max(l.id==='controls'?1:2,Math.min(cols,w0+Math.round((ev.clientX-sx)/step)));
    const nh=Math.max(1,Math.min(10,h0+Math.round((ev.clientY-sy)/stepY)));
    if(cols!==4)l.w=nw;
    l.h=cols===4?Math.max(1,nh-1):nh;applySize(el,l);
  };
  const up=ev=>{
    if(ev&&ev.pointerId!==pid)return;
    removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    body.classList.remove('is-dragging');saveLayout();syncTkSoon();
  };
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
});
let mRaf=0;
const metricsSoon=()=>{if(mRaf)return;mRaf=requestAnimationFrame(()=>{mRaf=0;metrics()})};
new ResizeObserver(metricsSoon).observe(grid);
addEventListener('resize',metricsSoon);addEventListener('load',metricsSoon);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(metricsSoon);
['.top','#sb','#tk'].forEach(q=>{const n=document.querySelector(q);if(n)new ResizeObserver(metricsSoon).observe(n)});
