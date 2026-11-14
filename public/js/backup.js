'use strict';
/* AliBaba Terminal · backup.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Yedekle ve aktar: ayarlar tarayıcıda (localStorage) durduğu için başka cihaza ya da adrese taşımak için dosyaya yazılır ---------- */
const BK_OK=/^pano\.[\w.-]{1,80}$/;
const BK_SKIP=/^pano\.(kurul\.c$|sys\.|news\.(c\.|strip$)|tech\.c\.|tg\.(c|ts|t)$|rd\.(c|ai)$|radio\.ch3$|tk$|wx$|prayer$|steam\.f$|fb\.|x\.)/;   /* önbellekler: yeniden indirilir, yedeğe girmez */
function bkCollect(withKeys){
  const o={};
  try{for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||!BK_OK.test(k)||BK_SKIP.test(k)||(!withKeys&&k.startsWith('pano.key.')))continue;
    const v=localStorage.getItem(k);if(v!=null)o[k]=v;
  }}catch{}
  return o;
}
/* Yedek dosyası güvenilmeyen veridir: yalnızca pano.* anahtarları, geçerli JSON metin değerleri ve boyut sınırı kabul edilir. */
function bkParse(text){
  let j;try{j=JSON.parse(text)}catch{return{err:'Bu dosya geçerli bir yedek değil.'}}
  if(!j||j.app!=='alibaba-terminal'||!j.data||typeof j.data!=='object'||Array.isArray(j.data))return{err:'Bu dosya AliBaba Terminal yedeği değil.'};
  const out={};let n=0;
  for(const [k,v] of Object.entries(j.data)){
    if(!BK_OK.test(k)||BK_SKIP.test(k)||typeof v!=='string'||v.length>1.5e6)continue;
    try{JSON.parse(v)}catch{continue}
    out[k]=v;n++;
  }
  return n?{data:out,n,keys:Object.keys(out).some(k=>k.startsWith('pano.key.'))}:{err:'Yedekte alınabilecek ayar bulunamadı.'};
}
function openBackup(){
  if($('.bk-ov'))return;
  const prev=document.activeElement;
  const ov=document.createElement('div');ov.className='bk-ov';
  ov.innerHTML='<div class="bk" role="dialog" aria-modal="true" aria-labelledby="bkT"><h3 id="bkT">Yedekle ve aktar</h3>'+
    '<p>Notların, kanal listelerin, PlayStation istek listen, ayarların ve yerleşimin tek bir dosyaya yazılır. Başka bir cihaza ya da yeni bir adrese taşımak için kullanılır.</p>'+
    '<label class="bk-ck"><input type="checkbox" id="bkKeys"><span>API anahtarlarını da ekle. Dosyayı o zaman gizli tut.</span></label>'+
    '<div class="bk-row"><button type="button" class="bk-b on" id="bkDl">Yedeği indir</button><button type="button" class="bk-b" id="bkUp">Yedeği yükle</button></div>'+
    '<input type="file" id="bkFile" accept=".json,application/json" hidden>'+
    '<div class="bk-msg" id="bkMsg" role="status" aria-live="polite"></div>'+
    '<div class="bk-row"><button type="button" class="bk-b on" id="bkApply" hidden>Bu yedeği uygula</button><button type="button" class="bk-b" id="bkX">Kapat</button></div></div>';
  document.body.appendChild(ov);
  const $b=s=>$(s,ov),msg=$b('#bkMsg'),apply=$b('#bkApply'),file=$b('#bkFile');
  let pending=null;
  const close=()=>{document.removeEventListener('keydown',onKey,true);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch{}};
  const onKey=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};
  document.addEventListener('keydown',onKey,true);
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  $b('#bkX').addEventListener('click',close);
  $b('#bkDl').addEventListener('click',()=>{
    const data=bkCollect($b('#bkKeys').checked),n=Object.keys(data).length;
    const blob=new Blob([JSON.stringify({app:'alibaba-terminal',v:1,t:new Date().toISOString(),data},null,1)],{type:'application/json'});
    const a=document.createElement('a'),d=new Date(),p=x=>String(x).padStart(2,'0');
    a.href=URL.createObjectURL(blob);a.download='alibaba-terminal-yedek-'+d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    msg.textContent=n+' ayar dosyaya yazıldı.';
  });
  $b('#bkUp').addEventListener('click',()=>file.click());
  file.addEventListener('change',()=>{
    const f=file.files&&file.files[0];pending=null;apply.hidden=true;if(!f)return;
    if(f.size>5e6){msg.textContent='Dosya çok büyük, yedek olamaz.';return}
    const r=new FileReader();
    r.onload=()=>{const p=bkParse(String(r.result||''));
      if(p.err){msg.textContent=p.err;return}
      pending=p;msg.textContent=p.n+' ayar bulundu'+(p.keys?' (API anahtarları dahil)':'')+'. Uygularsan bu tarayıcıdaki aynı ayarların üzerine yazılır, sayfa yenilenir.';apply.hidden=false};
    r.onerror=()=>{msg.textContent='Dosya okunamadı.'};
    r.readAsText(f);
  });
  apply.addEventListener('click',()=>{
    if(!pending)return;let bad=0;
    for(const [k,v] of Object.entries(pending.data)){try{localStorage.setItem(k,v)}catch{bad++}}
    msg.textContent=bad?bad+' ayar yazılamadı (depolama dolu olabilir).':'Yedek uygulandı, sayfa yenileniyor…';
    apply.hidden=true;if(!bad)setTimeout(()=>location.reload(),900);
  });
  $b('#bkDl').focus();
}
document.addEventListener('click',e=>{if(e.target.closest('#bkBtn'))openBackup()});

/* ---------- Widget kaydı ve ızgara ---------- */
