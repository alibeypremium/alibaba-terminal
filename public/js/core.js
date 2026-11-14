'use strict';
/* Betik hataları (Sistem Durumu widget'ı gösterir): yalnızca bu oturumdaki yakalanmamış hatalar */
const ERRS=[];
addEventListener('error',e=>{if(ERRS.length<50)ERRS.push({t:Date.now(),m:String(e.message||'hata').slice(0,140),s:e.filename?String(e.filename).split('/').pop().split('?')[0]+':'+(e.lineno||0):''})});
addEventListener('unhandledrejection',e=>{if(ERRS.length<50)ERRS.push({t:Date.now(),m:'Söz hatası: '+String((e.reason&&e.reason.message)||e.reason).slice(0,120),s:''})});
/* AliBaba Terminal · core.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
/* Dış kaynaktan gelen bağlantılar yalnızca http(s) ise kullanılır (javascript:, data: vb. engellenir). */
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const dayOfYear=()=>Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/864e5);
const fmt2=n=>n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
const bus=new EventTarget();
/* Widget ömrü: her kurulumda w._gen artar. Widget kaldırılınca (unmount) _gen değişir ve eski
   zamanlayıcılar/dinleyiciler kendiliğinden temizlenir; böylece gizli widget ağ isteği yapmaz. */
const every=(w,fn,ms)=>{const g=w._gen;const id=setInterval(()=>{if(w._gen!==g){clearInterval(id);return}if(document.hidden&&ms>=60e3)return;fn()},ms);return id};
const onBus=(w,ev,fn)=>{const g=w._gen;const h=e=>{if(w._gen!==g){bus.removeEventListener(ev,h);return}fn(e)};bus.addEventListener(ev,h)};
const SRC={};const SRC_NAMES={wx:'Hava',pr:'Namaz',fx:'Döviz',cr:'Kripto',gn:'Son Dakika haberleri',kn:'Teknoloji haberleri',tg:'Telegram',kr:'Dini Sorular'};
const hms=t=>new Date(t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
let STREAM_LIVE=false;   /* canlı fiyat akışı (WebSocket) bağlı ve taze mi */
const statusText=()=>{
  const keys=Object.keys(SRC_NAMES),ts=Object.values(SRC).filter(v=>v.ok).map(v=>v.t);
  return 'İnternet bağlantısı yanıt süresi'+(ts.length?'\nSon veri '+hms(Math.max(...ts)):'')+'\n'+keys.map(k=>SRC_NAMES[k]+': '+(SRC[k]?(SRC[k].ok?hms(SRC[k].t):'bağlanamadı'):'bekliyor')).join('\n');
};
function paintStatus(){const t=document.querySelector('#sbR .sb-tip>div');if(t){const x=statusText();if(t.textContent!==x)t.textContent=x}}
function status(k,ok){SRC[k]={ok,t:Date.now()};paintStatus()}
paintStatus();
let dark=true;
