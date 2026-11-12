'use strict';
/* AliBaba Terminal · weather.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Konum ---------- */
let place=LS.get('pano.place',{name:'Ankara',lat:39.9334,lon:32.8597});
async function geocode(q){
  const j=await getJSON('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=1&language=tr&format=json');
  const r=j.results&&j.results[0];if(!r)throw new Error('yok');
  return{name:r.name+(r.admin1&&r.admin1!==r.name?', '+r.admin1:''),lat:r.latitude,lon:r.longitude};
}
function setPlace(p){place=p;LS.set('pano.place',p);delete TK.wx;paintTicker();persistTk();bus.dispatchEvent(new Event('place'))}

/* ---------- Hava ---------- */
const WX={0:['Açık','sun'],1:['Çoğunlukla açık','sun'],2:['Parçalı bulutlu','part'],3:['Kapalı','cloud'],45:['Sisli','fog'],48:['Kırağılı sis','fog'],51:['Hafif çisenti','rain'],53:['Çisenti','rain'],55:['Yoğun çisenti','rain'],56:['Dondurucu çisenti','rain'],57:['Dondurucu çisenti','rain'],61:['Hafif yağmur','rain'],63:['Yağmur','rain'],65:['Şiddetli yağmur','rain'],66:['Dondurucu yağmur','rain'],67:['Dondurucu yağmur','rain'],71:['Hafif kar','snow'],73:['Kar','snow'],75:['Yoğun kar','snow'],77:['Kar taneleri','snow'],80:['Hafif sağanak','rain'],81:['Sağanak','rain'],82:['Şiddetli sağanak','rain'],85:['Kar sağanağı','snow'],86:['Kar sağanağı','snow'],95:['Gök gürültülü fırtına','storm'],96:['Dolu ile fırtına','storm'],99:['Dolu ile fırtına','storm']};
let mid=0;
function wxIcon(code,day){
  const kind=(WX[code]||['','cloud'])[1];const id='m'+(mid++);
  const cloud=(fill)=>'<g fill="'+fill+'"><circle cx="22" cy="40" r="10"/><circle cx="34" cy="31" r="13"/><circle cx="46" cy="40" r="9"/><rect x="22" y="38" width="24" height="12"/></g>';
  const sun='<g stroke="#ffd54a" stroke-width="3" stroke-linecap="round"><path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.2 4.2M13.6 50.4l4.2-4.2M46.2 17.8l4.2-4.2"/></g><circle cx="32" cy="32" r="13" fill="#ffd54a"/>';
  const moon='<mask id="'+id+'"><rect width="64" height="64" fill="#fff"/><circle cx="40" cy="25" r="13" fill="#000"/></mask><circle cx="30" cy="34" r="17" fill="#f4efc2" mask="url(#'+id+')"/>';
  let b='';
  if(kind==='sun')b=day?sun:moon;
  else if(kind==='part')b=(day?'<g transform="translate(-8,-8) scale(.7)">'+sun+'</g>':'<g transform="translate(-6,-10) scale(.75)">'+moon+'</g>')+cloud('#fff');
  else if(kind==='cloud')b=cloud('#e9eef7');
  else if(kind==='fog')b='<g fill="#dfe6f2" opacity=".9"><circle cx="24" cy="26" r="9"/><circle cx="35" cy="20" r="11"/><circle cx="46" cy="27" r="8"/><rect x="24" y="24" width="22" height="10"/></g><g stroke="#fff" stroke-width="3.4" stroke-linecap="round"><path d="M12 42h40M18 50h34M14 58h30"/></g>';
  else if(kind==='rain')b=cloud('#dfe7f3')+'<g stroke="#6cc4ff" stroke-width="3.4" stroke-linecap="round"><path d="M24 54l-3 7M34 54l-3 7M44 54l-3 7"/></g>';
  else if(kind==='snow')b=cloud('#eef3fb')+'<g fill="#fff"><circle cx="24" cy="57" r="2.6"/><circle cx="34" cy="55" r="2.6"/><circle cx="44" cy="57" r="2.6"/></g>';
  else b=cloud('#aab4c8')+'<path d="M35 42 28 54h6l-3 9 12-14h-7l3-7z" fill="#ffd54a"/>';
  return '<svg viewBox="0 0 64 64">'+b+'</svg>';
}
function skyOf(code,day){const k=(WX[code]||['','cloud'])[1];if(k==='storm')return'storm';if(k==='snow')return'snow';if(k==='rain')return'rain';if(!day)return'night';if(k==='cloud'||k==='fog')return'cloud';return'day'}

/* Widget içi açılır panel (popup gibi, ama widget'ın içinde): × / Esc ile kapanır, düzenleme modunda açılmaz. */
function wPanel(w,root,kind,title,onOpen){
  let ov=null;
  const close=()=>{if(!ov)return;ov.remove();ov=null;root.classList.remove('wov-on');document.removeEventListener('keydown',onKey,true)};
  const onKey=e=>{if(e.key==='Escape'&&ov){e.stopPropagation();close()}};
  const open=()=>{
    if(ov||document.body.classList.contains('editing'))return;
    ov=document.createElement('div');ov.className='wov';ov.title='Kapatmak için tıkla';
    ov.innerHTML='<div class="hd">'+logo(kind)+'<span class="ttl">'+esc(title)+'</span><span class="sp"></span><span class="wov-sub"></span><i class="wov-x" aria-hidden="true">✕</i></div><div class="wov-g"></div>';
    ov.addEventListener('click',close);
    root.classList.add('wov-on');root.appendChild(ov);document.addEventListener('keydown',onKey,true);onOpen&&onOpen();
  };
  root.addEventListener('click',e=>{if(e.target.closest('button,a,input,select,textarea,.wov'))return;open()});
  const prevD=w._dispose;w._dispose=()=>{close();prevD&&prevD()};
  return{set(cols,html,sub){if(!ov)return false;$('.wov-sub',ov).textContent=sub||'';const g=$('.wov-g',ov);g.className='wov-g c'+cols;if(g._h!==html){g._h=html;g.innerHTML=html}return true},get open(){return!!ov},close};
}
function mountWeather(w,root){
  root.innerHTML='<div class="wx"></div>';
  const box=$('.wx',root);
  let lastJ=null;
  const week=wPanel(w,root,'weather','7 günlük hava',()=>paintWeek());
  const paintWeek=()=>{
    const j=lastJ;if(!j||!week.open)return;
    const d=j.daily,n=Math.min(7,d.time.length);
    const tiles=d.time.slice(0,n).map((t,i)=>{
      const nm=i?new Date(t+'T12:00').toLocaleDateString('tr-TR',{weekday:'short'}):'Bugün',pp=d.precipitation_probability_max&&d.precipitation_probability_max[i];
      return'<div class="pt wov-d'+(i===0?' next':'')+'"><div class="wov-w"><span>'+esc(nm)+'</span>'+wxIcon(d.weather_code[i],1)+'</div><b>'+Math.round(d.temperature_2m_max[i])+'°<small>'+Math.round(d.temperature_2m_min[i])+'°</small></b>'+(pp>=10?'<small class="wov-pp">💧'+Math.round(pp)+'%</small>':'')+'</div>';
    }).join('');
    week.set(4,tiles,place.name.split(',')[0]);
  };
  const render=j=>{
    lastJ=j;
    const c=j.current,h=j.hourly,d=j.daily;
    const day=!!c.is_day,cond=(WX[c.weather_code]||['—'])[0];
    w.dataset.sky=skyOf(c.weather_code,day);
    let hi=h.time.findIndex(t=>t>=c.time.slice(0,13)+':00');if(hi<0)hi=0;
    const hours=[0,1,2,3,4,5].map(k=>{const i=hi+k*1;return i<h.time.length?'<div class="wx-h"><span>'+(k?h.time[i].slice(11,13)+':00':'Şimdi')+'</span>'+wxIcon(h.weather_code[i],h.is_day[i])+'<b>'+Math.round(h.temperature_2m[i])+'°</b></div>':''}).join('');
    const lo=Math.min(...d.temperature_2m_min),hi2=Math.max(...d.temperature_2m_max),span=Math.max(1,hi2-lo);
    const days=d.time.slice(0,6).map((t,i)=>{
      const nm=i?new Date(t+'T12:00').toLocaleDateString('tr-TR',{weekday:'short'}):'Bugün';
      const a=d.temperature_2m_min[i],b=d.temperature_2m_max[i];
      return'<div class="wx-d"><b>'+nm+'</b>'+wxIcon(d.weather_code[i],1)+'<div class="bar"><i style="left:'+((a-lo)/span*100)+'%;right:'+(100-(b-lo)/span*100)+'%"></i></div><span>'+Math.round(a)+'° / '+Math.round(b)+'°</span></div>';
    }).join('');
    box.innerHTML='<div class="wx-top"><div class="wx-place">'+I.pin+esc(place.name.split(',')[0])+'</div><div class="wx-cond">'+esc(cond)+'</div></div>'+
      '<div class="wx-main"><div class="wx-icon">'+wxIcon(c.weather_code,day)+'</div><div><div class="wx-temp">'+Math.round(c.temperature_2m)+'°</div></div></div>'+
      '<div class="wx-hilo">Y: '+Math.round(d.temperature_2m_max[0])+'°  D: '+Math.round(d.temperature_2m_min[0])+'° · Hissedilen '+Math.round(c.apparent_temperature)+'° · Nem %'+Math.round(c.relative_humidity_2m)+' · Rüzgâr '+Math.round(c.wind_speed_10m)+' km/sa</div>'+
      '<div class="wx-hours">'+hours+'</div><div class="wx-days noscroll">'+days+'</div>';
    paintWeek();
  };
  const load=async()=>{
    try{
      const j=await getJSON('https://api.open-meteo.com/v1/forecast?latitude='+place.lat+'&longitude='+place.lon+'&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7');
      LS.set('pano.wx',{p:place.name,j});render(j);status('wx',true);
    }catch{
      status('wx',false);
      const c=LS.get('pano.wx',null);
      if(c){render(c.j)}else box.innerHTML='<div class="wx-cond">Hava durumu alınamadı. Bağlantını kontrol et.</div>';
    }
  };
  load();every(w,load,15*60e3);onBus(w,'place',load);onBus(w,'refresh',load);
}
