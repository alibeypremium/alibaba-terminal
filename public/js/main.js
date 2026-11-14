'use strict';
/* AliBaba Terminal · main.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Üst bölüm ---------- */
/* Uykudan / arka plandan dönüş, bağlantı geri gelmesi: tüm widget'lara "refresh" gönder.
   Gece 04:00'te sayfayı bir kez yenile (iframe ve bellek birikmesini temizler). */
let lastTick=Date.now(),hiddenAt=0,lastRefresh=0;
const refreshAll=()=>{if(Date.now()-lastRefresh<5e3)return;lastRefresh=Date.now();bus.dispatchEvent(new Event('refresh'))};
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>60e3)refreshAll()});
addEventListener('online',refreshAll);
function nightReload(n){
  if(n.getHours()!==4||n.getMinutes()!==0||performance.now()<3600e3)return;
  const a=document.activeElement;
  if(document.body.classList.contains('editing')||(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)))return;
  if([...document.querySelectorAll('video')].some(v=>!v.paused&&!v.ended))return;
  location.reload();
}
function tick(){
  const n=new Date(),h=n.getHours();
  if(n-lastTick>30e3)refreshAll();   /* sistem uykudan döndü */
  lastTick=+n;nightReload(n);
  $('#clock').textContent=n.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  const dl=n.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if(dl!==tick.d){tick.d=dl;$('#dateLine').textContent=dl}
}
/* "Terminal" yazısı "AliBaba" ile aynı genişlikte olsun: yazı boyutunu ona göre ayarla. */
(function(){
  const n=$('.brand-n'),t=$('.brand-t');if(!n||!t)return;
  const fit=()=>{
    t.style.fontSize='40px';
    const tw=t.getBoundingClientRect().width-.14*40,nw=n.getBoundingClientRect().width;
    if(tw>0&&nw>0)t.style.fontSize=Math.max(10,Math.min(60,40*nw/tw)).toFixed(2)+'px';
  };
  fit();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  if(window.ResizeObserver)new ResizeObserver(fit).observe(n);else addEventListener('resize',fit);
})();
tick();setInterval(tick,1000);

/* Şehir seçici */
const pop=$('#cityPop'),cin=$('#cityIn'),cmsg=$('#cityMsg');
const fillPop=()=>{
  $('#popName').textContent=place.name;
  paintFc();
  $('#popCoord').textContent=Math.abs(place.lat).toFixed(2)+'° '+(place.lat>=0?'Kuzey':'Güney')+'  ·  '+Math.abs(place.lon).toFixed(2)+'° '+(place.lon>=0?'Doğu':'Batı');
};
$('#sbR').addEventListener('click',e=>{
  if(!e.target.closest('#sbWx'))return;
  e.stopPropagation();if(typeof rpClose==='function')rpClose();pop.hidden=!pop.hidden;
  if(!pop.hidden){fillPop();cmsg.textContent='';cin.value='';cin.focus()}
});
pop.addEventListener('click',e=>e.stopPropagation());
document.addEventListener('click',()=>{pop.hidden=true});
const search=async()=>{
  const q=cin.value.trim();if(!q)return;cmsg.textContent='Aranıyor…';
  try{setPlace(await geocode(q));fillPop();pop.hidden=true}catch{cmsg.textContent='Şehir bulunamadı. Farklı yazmayı dene.'}
};
$('#cityGo').addEventListener('click',search);
cin.addEventListener('keydown',e=>{if(e.key==='Enter')search()});
$('#geoBtn').addEventListener('click',()=>{
  if(!navigator.geolocation){cmsg.textContent='Bu tarayıcı konumu desteklemiyor.';return}
  cmsg.textContent='Konum alınıyor…';
  navigator.geolocation.getCurrentPosition(async p=>{
    let name='Konumum';
    try{const j=await getJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+p.coords.latitude+'&longitude='+p.coords.longitude+'&localityLanguage=tr');name=j.city||j.locality||name}catch{}
    setPlace({name,lat:p.coords.latitude,lon:p.coords.longitude});pop.hidden=true;
  },()=>{cmsg.textContent='Konum izni verilmedi. Şehir adını yazabilirsin.'},{timeout:9000});
});

/* Tema */
function setTheme(t){
  dark=t==='dark';document.documentElement.dataset.theme=t;LS.set('pano.theme',t);
  document.querySelector('meta[name=theme-color]').content=dark?'#070817':'#e8ecfa';
  if(window.__bgTheme)window.__bgTheme(dark);
}
document.addEventListener('click',e=>{if(e.target.closest('#themeBtn'))setTheme(dark?'light':'dark')});
function setLite(on){
  document.documentElement.dataset.lite=on?'1':'0';LS.set('pano.lite',!!on);
  const b=$('#liteBtn');if(b){b.classList.toggle('on',!!on);b.setAttribute('aria-pressed',on?'true':'false')}
  dispatchEvent(new Event('panolite'));
}
document.addEventListener('click',e=>{if(e.target.closest('#liteBtn'))setLite(document.documentElement.dataset.lite!=='1')});
setLite(!!LS.get('pano.lite',false));
setTheme(LS.get('pano.theme',null)||'dark');   /* varsayılan: koyu tema */

render();startTicker();startNewsTicker();
