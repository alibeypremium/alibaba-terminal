'use strict';
/* AliBaba Terminal · video.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Video: bilgisayardan seçilen dosyayı oynat ---------- */
/* Dosya, sayfa yenilense de kalsın diye IndexedDB'de tutulur (en son seçilen tek video). */
const VDB={
  open(){return new Promise((res,rej)=>{const r=indexedDB.open('pano-video',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
  async run(mode,fn){const db=await this.open();try{return await new Promise((res,rej)=>{const t=db.transaction('f',mode),rq=fn(t.objectStore('f'));t.oncomplete=()=>res(rq&&rq.result);t.onerror=t.onabort=()=>rej(t.error)})}finally{db.close()}},
  get(){return this.run('readonly',s=>s.get('last'))},
  put(v){return this.run('readwrite',s=>s.put(v,'last'))},
  del(){return this.run('readwrite',s=>s.delete('last'))}
};
function mountVideo(w,root,tabs){
  root.innerHTML='<div class="yt">'+hd('video','Video',tabs+sbBtn)+
   '<div class="yt-in"><input id="vdn" type="text" readonly placeholder="Bilgisayardan video seç" aria-label="Seçilen video"><button class="yt-go" type="button" id="vdp">Video seç</button><button class="yt-go alt" type="button" id="vdx" hidden>Kaldır</button></div>'+
   '<input id="vdf" type="file" accept="video/*,.mp4,.m4v,.mov,.webm,.ogv,.mkv" hidden>'+
   '<div class="yt-view" id="vdv"></div></div>';
  sbWire(root);
  const view=$('#vdv',root),nameEl=$('#vdn',root),file=$('#vdf',root),rm=$('#vdx',root);
  let url=null,video=null;
  const free=()=>{if(video){try{video.pause();video.removeAttribute('src');video.load()}catch{}video=null}if(url){URL.revokeObjectURL(url);url=null}};
  const empty=msg=>{free();rm.hidden=true;nameEl.value='';view.innerHTML='<div class="yt-empty pick" id="vde"><svg viewBox="0 0 64 44"><rect width="64" height="44" rx="12" fill="#b08cff"/><path d="M26 12v20l18-10z" fill="#fff"/></svg><div>'+msg+'</div></div>'};
  const EMPTY='Bir video dosyası seç ya da buraya sürükle.<br>Seçtiğin video burada oynar.';
  const warn=m=>{const d=document.createElement('div');d.className='tvp-err';d.textContent=m;view.appendChild(d)};
  function play(blob,name,auto){
    free();url=URL.createObjectURL(blob);
    view.innerHTML='<video controls playsinline'+(auto?' autoplay':'')+'></video>';
    video=$('video',view);video.src=url;
    nameEl.value=name;nameEl.title=name;rm.hidden=false;
    video.addEventListener('error',()=>warn('Bu video tarayıcıda oynatılamıyor. Dosya biçimi ya da kodek desteklenmiyor olabilir (MP4/H.264 ve WebM en güvenlisi).'),{once:true});
    if(auto)video.play().catch(()=>{});
  }
  async function pick(f){
    if(!f)return;
    if(!(f.type||'').startsWith('video/')&&!/\.(mp4|m4v|mov|webm|ogv|mkv)$/i.test(f.name)){empty('Bu bir video dosyası değil.<br>MP4, WebM ya da MOV seç.');return}
    play(f,f.name,true);
    try{await VDB.put({blob:f,name:f.name})}catch{warn('Video kalıcı olarak kaydedilemedi (depolama dolu olabilir). Sayfayı yenileyince silinir.')}
  }
  $('#vdp',root).addEventListener('click',()=>file.click());
  nameEl.addEventListener('click',()=>file.click());
  view.addEventListener('click',e=>{if(e.target.closest('#vde'))file.click()});
  file.addEventListener('change',()=>{const f=file.files[0];file.value='';pick(f)});
  rm.addEventListener('click',async()=>{empty(EMPTY);try{await VDB.del()}catch{}});
  const hasFiles=e=>e.dataTransfer&&Array.from(e.dataTransfer.types||[]).includes('Files');
  view.addEventListener('dragover',e=>{if(!hasFiles(e))return;e.preventDefault();view.classList.add('drag')});
  view.addEventListener('dragleave',()=>view.classList.remove('drag'));
  view.addEventListener('drop',e=>{if(!hasFiles(e))return;e.preventDefault();view.classList.remove('drag');pick(e.dataTransfer.files[0])});
  empty(EMPTY);
  (async()=>{try{const r=await VDB.get();if(r&&r.blob&&!video)play(r.blob,r.name||'Video',false)}catch{}})();
  return{off(){if(video)video.pause()},on(){},dispose:free};
}
