'use strict';
/* AliBaba Terminal · controls.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Kontrol widget'ı (Sade · Tema · Düzenle) ---------- */
/* Tam ekran: Kontrol'deki düğme ya da klavyede \" tuşu (Shift+2 / Shift+'); yazı yazılırken çalışmaz. */
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
const isFS=()=>!!fsEl();
const fsOK=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function toggleFS(){
  try{
    if(isFS()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}
    else{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(f){const r=f.call(d);r&&r.catch&&r.catch(()=>{})}}
  }catch{}
}
document.addEventListener('keydown',e=>{
  if(e.key!=='"'||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
  if(!fsOK())return;e.preventDefault();toggleFS();
});
function mountControls(w,root){
  root.innerHTML='<div class="nw ctlw">'+hd('controls','Kontrol')+'<div class="ctl">'+
    '<button type="button" id="liteBtn" aria-pressed="false" title="Sade mod: arka plan animasyonunu durdur" aria-label="Sade mod">'+I.leaf+'</button>'+
    '<button type="button" id="themeBtn" title="Açık / koyu tema" aria-label="Temayı değiştir">'+I.half+'</button>'+
    '<button type="button" id="bkBtn" title="Yedekle ve aktar" aria-label="Yedekle ve aktar">'+I.save+'</button>'+
    '<button type="button" id="editBtn" title="Düzenle" aria-label="Düzenle">'+I.pencil+'</button>'+
    (fsOK()?'<button type="button" id="fsBtn" title="Tam ekran (\" tuşu)" aria-label="Tam ekran">'+I.full+'</button>':'')+'</div></div>';
  const fb=$('#fsBtn',root);if(fb){fb.addEventListener('click',toggleFS);const sync=()=>{const on=isFS();fb.innerHTML=on?I.fullx:I.full;fb.classList.toggle('on',on)};document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);w._dispose=(p=>()=>{document.removeEventListener('fullscreenchange',sync);document.removeEventListener('webkitfullscreenchange',sync);p&&p()})(w._dispose);sync()}
  /* Düğme durumlarını mevcut ayarlarla eşitle (olaylar belge düzeyinde dinleniyor). */
  const on=document.documentElement.dataset.lite==='1';
  $('#liteBtn',root).classList.toggle('on',on);$('#liteBtn',root).setAttribute('aria-pressed',on?'true':'false');
  const ed=document.body.classList.contains('editing');
  $('#editBtn',root).innerHTML=ed?I.check:I.pencil;$('#editBtn',root).classList.toggle('on',ed);
}
