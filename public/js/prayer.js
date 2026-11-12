'use strict';
/* AliBaba Terminal · prayer.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Namaz vakitleri ---------- */
const PRAYERS=[['Fajr','İmsak'],['Sunrise','Güneş'],['Dhuhr','Öğle'],['Asr','İkindi'],['Maghrib','Akşam'],['Isha','Yatsı']];
/* Küçük etiket: girecek vaktin adı. İmsak girince sabah namazı vakti başlar; Güneş bir namaz vakti değildir. */
const PRAYER_LABEL=['Sabah Namazı','Güneş','Öğle Namazı','İkindi Namazı','Akşam Namazı','Yatsı Namazı'];
const HIJRI=['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'];
function secsIn(tz){
  const f=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const p=Object.fromEntries(f.formatToParts(new Date()).map(x=>[x.type,x.value]));
  return(+p.hour%24)*3600+(+p.minute)*60+(+p.second);
}
/* ---------- Dini günler (hicri tarihten hesaplanır, tarih tablosu tutulmaz) ---------- */
/* Hicri tarih tarayıcının Umm el-Kura takviminden gelir; Diyanet'in yayımladığı listelerle gün gün karşılaştırıldı (2026-27 kandiller, Ramazan, bayramlar, 2027 Mevlid, Hicri Yılbaşı, Aşure).
   Kandiller bir önceki akşam başlar: Diyanet listesindeki miladi gün, gecenin adındaki hicri günden bir önceki gündür (Miraç 27. gece → 26 Recep). */
const HJ_FMT=(()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{timeZone:'UTC',day:'numeric',month:'numeric',year:'numeric'})}catch{return null}})();
function hijriAt(ms){
  if(!HJ_FMT)return null;
  try{const p={};HJ_FMT.formatToParts(new Date(ms)).forEach(x=>{p[x.type]=x.value});const d=+p.day,m=+p.month,y=+p.year;return d>0&&m>0&&y>0?{d,m,y}:null}catch{return null}
}
/* base: bugünün miladi tarihi, UTC öğle saati (ms). Dönüş: {n:ad, off:kaç gün sonra, night:gece mi, k:bayramın kaçıncı günü (varsa)} */
function nextReligiousDay(base){
  const H=i=>hijriAt(base+i*864e5),t=H(0);
  if(!t)return null;
  if(t.m===10&&t.d<=3)return{n:'Ramazan Bayramı',off:0,k:t.d};          /* bayramın içindeyiz */
  if(t.m===12&&t.d>=10&&t.d<=13)return{n:'Kurban Bayramı',off:0,k:t.d-9};
  for(let i=0;i<=400;i++){
    const h=i?H(i):t,nx=H(i+1);if(!h||!nx)continue;
    let n=null,night=false;
    /* Regaip: Recep'in ilk Cuma gecesi, yani o Cuma'dan bir önceki Perşembe akşamı. */
    if(new Date(base+i*864e5).getUTCDay()===4&&nx.m===7&&nx.d<=7){n='Regaip Kandili';night=true}
    else if(h.m===7&&h.d===1)n='Üç Aylar Başlangıcı';
    else if(h.m===7&&h.d===26){n='Miraç Kandili';night=true}
    else if(h.m===8&&h.d===14){n='Berat Kandili';night=true}
    else if(h.m===9&&h.d===1)n='Ramazan Başlangıcı';
    else if(h.m===9&&h.d===26){n='Kadir Gecesi';night=true}
    else if(nx.m===10&&nx.d===1)n='Ramazan Bayramı arefesi';
    else if(h.m===10&&h.d===1)n='Ramazan Bayramı';
    else if(h.m===12&&h.d===9)n='Kurban Bayramı arefesi';
    else if(h.m===12&&h.d===10)n='Kurban Bayramı';
    else if(h.m===1&&h.d===1)n='Hicri Yılbaşı';
    else if(h.m===1&&h.d===10)n='Aşure Günü';
    else if(h.m===3&&h.d===11){n='Mevlid Kandili';night=true}
    if(n)return{n,off:i,night};
  }
  return null;
}
function religiousText(r){
  if(r.k)return r.n+' · '+r.k+'. gün';
  if(r.off===0)return(r.night?'Bu gece':'Bugün')+' · '+r.n;
  if(r.off===1)return(r.night?'Yarın gece':'Yarın')+' · '+r.n;
  return r.n+' · '+r.off+' gün sonra';
}
function mountPrayer(w,root){
  root.innerHTML='<div class="pr"><div class="hd">'+logo('prayer')+'<span class="ttl">Namaz Vakitleri</span><span class="sp"></span><span class="pr-hjw"><span class="pr-hj" id="hj"></span><span class="pr-ev" id="pev"></span></span></div><div class="pr-next"><div class="pr-nm" id="pnm">Yükleniyor…</div><div class="pr-cd" id="pcd">--:--:--</div></div><div class="pr-times" id="ptm"></div><div class="foot">Diyanet hesaplama yöntemi · '+'<span id="pcity"></span></div></div>';
  let data=null,secs=[],tz='Europe/Istanbul';
  const day2=wPanel(w,root,'prayer','Namaz vakitleri',()=>paintDay());
  const paintDay=()=>{
    if(!data||!day2.open)return;
    const now=secsIn(tz),ni=secs.findIndex(s=>s>now);
    const hj=data.date&&data.date.hijri,sub=new Intl.DateTimeFormat('tr-TR',{timeZone:tz,day:'numeric',month:'long',weekday:'long'}).format(new Date())+(hj&&innerWidth>0?'':'');
    day2.set(3,PRAYERS.map((p,i)=>'<div class="pt'+(i===ni?' next':'')+(secs[i]<=now?' past':'')+'"><span>'+p[1]+'</span><b>'+data.timings[p[0]].match(/\d{1,2}:\d{2}/)[0]+'</b></div>').join(''),sub);
  };
  const draw=()=>{
    if(!data)return;
    paintDay();
    const now=secsIn(tz);let ni=secs.findIndex(s=>s>now);let rem,name,at;
    if(ni<0){
      rem=secs[0]+86400-now;name='İmsak';ni=0;
      /* Yatsıdan sonra sıradaki vakit yarının İmsak'ı: saati yarının vakitlerinden gelir (yüklenene kadar yalnızca "yarın"). */
      loadTom();at=tom&&tom.key===tomKey()?'yarın '+tom.fajr:'yarın';
    }else{rem=secs[ni]-now;name=PRAYERS[ni][1];at=data.timings[PRAYERS[ni][0]].match(/\d{1,2}:\d{2}/)[0]}
    const hh=Math.floor(rem/3600),mm=Math.floor(rem%3600/60),ss=rem%60;
    /* .pr-at yalnızca vakit ızgarası gizliyken (küçük boyut) görünür; büyük boyutta saat ızgarada zaten var. */
    $('#pnm',root).innerHTML=esc(PRAYER_LABEL[ni])+'<span class="pr-at"> · '+at+'</span><b>'+name+' vaktine kalan</b>';
    $('#pcd',root).textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
    const ptmHtml=PRAYERS.map((p,i)=>'<div class="pt'+(i===ni&&now<secs[5]+1&&secs.findIndex(s=>s>now)>=0?' next':'')+(secs[i]<=now?' past':'')+'"><span>'+p[1]+'</span><b>'+data.timings[p[0]].match(/\d{1,2}:\d{2}/)[0]+'</b></div>').join('');
    if(ptmHtml!==w._ptm){w._ptm=ptmHtml;$('#ptm',root).innerHTML=ptmHtml}
  };
  /* Bugünün tarihi, seçili şehrin saat dilimine göre alınır (cihaz saatine göre değil). */
  const today=()=>new Intl.DateTimeFormat('en-GB',{timeZone:tz,day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date()).replace(/\//g,'-');
  /* Tarihin altına en yakın dini gün: bayram, kandil, Ramazan başlangıcı vb. Hesaplanamazsa satır gizlenir. */
  const paintEv=()=>{
    const el=$('#pev',root);if(!el)return;
    const [dd,mm,yy]=today().split('-').map(Number);
    let r=null;try{r=nextReligiousDay(Date.UTC(yy,mm-1,dd,12))}catch{}
    el.textContent=r?religiousText(r):'';
    el.title=r?new Date(Date.UTC(yy,mm-1,dd+r.off,12)).toLocaleDateString('tr-TR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric',weekday:'long'})+(r.night?' (akşamı başlar)':''):'';
  };
  /* Yarının İmsak saati (yalnızca Yatsı ile gece yarısı arasında gerekir). Hata olursa 60 sn sonra yeniden dener. */
  let tom=null,tomBusy=false,tomRetry=0;
  const tomKey=()=>new Intl.DateTimeFormat('en-GB',{timeZone:tz,day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(Date.now()+864e5)).replace(/\//g,'-')+'|'+place.lat.toFixed(2)+'|'+place.lon.toFixed(2);
  const loadTom=async()=>{
    const key=tomKey();
    if(tomBusy||(tom&&tom.key===key)||Date.now()<tomRetry)return;
    tomBusy=true;
    try{
      const r=await getJSON('https://api.aladhan.com/v1/timings/'+key.split('|')[0]+'?latitude='+place.lat+'&longitude='+place.lon+'&method=13');
      const m=r.data.timings.Fajr.match(/\d{1,2}:\d{2}/);
      if(!m)throw new Error('fajr');
      tom={key,fajr:m[0]};
    }catch{tomRetry=Date.now()+60e3}
    tomBusy=false;
  };
  let tzFix=false;
  const load=async()=>{
    const dd=today();
    const key=dd+'|'+place.lat.toFixed(2)+'|'+place.lon.toFixed(2);
    let j=null;
    const cache=LS.get('pano.prayer',null);
    if(cache&&cache.key===key)j=cache.j;
    else{
      try{const r=await getJSON('https://api.aladhan.com/v1/timings/'+dd+'?latitude='+place.lat+'&longitude='+place.lon+'&method=13');j=r.data;LS.set('pano.prayer',{key,j})}
      catch{if(cache)j=cache.j}
    }
    if(!j){$('#pnm',root).textContent='Vakitler alınamadı';status('pr',false);return}
    const newTz=(j.meta&&j.meta.timezone)||tz,tzChanged=newTz!==tz;
    data=j;status('pr',true);tz=newTz;
    secs=PRAYERS.map(p=>{const m=j.timings[p[0]].match(/(\d{1,2}):(\d{2})/);return(+m[1])*3600+(+m[2])*60});
    const h=j.date&&j.date.hijri;if(h)$('#hj',root).textContent=h.day+' '+(HIJRI[(+h.month.number)-1]||'')+' '+h.year;
    paintEv();
    $('#pcity',root).textContent=place.name.split(',')[0];
    draw();
    /* Saat dilimi değiştiyse (ör. başka ülke seçildi) doğru günün vakitleri için bir kez daha yükle. */
    if(tzChanged&&!tzFix){tzFix=true;load()}else tzFix=false;
  };
  /* Gün değişince (gece yarısı) vakitleri hemen yeniden çek; eski güne ait sayaç çalışmasın. */
  let day=today();
  load();every(w,()=>{draw();const d=today();if(d!==day){day=d;load()}},1000);every(w,load,3600e3);onBus(w,'place',load);onBus(w,'refresh',load);
}
