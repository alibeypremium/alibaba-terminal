'use strict';
/* AliBaba Terminal · notes.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Notlar ---------- */
function mountNotes(w,root){
  let notes=LS.get('pano.notes',null);
  if(!notes||!notes.length)notes=[{id:uid(),text:'Hoş geldin!\nYazdıkların bu tarayıcıda kaydedilir. + ile yeni not ekleyebilirsin.',t:Date.now()}];
  let cur=LS.get('pano.notes.cur',notes[0].id);if(!notes.find(n=>n.id===cur))cur=notes[0].id;
  root.innerHTML='<div class="nt">'+hd('notes','Notlarım','<button class="ibtn" type="button" id="nadd" aria-label="Yeni not">'+I.plus+'</button><button class="ibtn" type="button" id="ndel" aria-label="Notu sil">'+I.trash+'</button>')+'<div class="nt-tabs noscroll" id="ntt"></div><textarea id="nta" placeholder="Bir şeyler yaz…" aria-label="Not"></textarea></div>';
  const tabs=$('#ntt',root),ta=$('#nta',root);
  const title=n=>(n.text.split('\n')[0].trim()||'Yeni not').slice(0,22);
  const save=()=>{LS.set('pano.notes',notes);LS.set('pano.notes.cur',cur)};
  const paintTabs=()=>{tabs.innerHTML=notes.map(n=>'<button type="button" class="nt-tab'+(n.id===cur?' on':'')+'" data-id="'+n.id+'">'+esc(title(n))+'</button>').join('')};
  const open=id=>{cur=id;ta.value=notes.find(n=>n.id===id).text;paintTabs();save()};
  tabs.addEventListener('click',e=>{const b=e.target.closest('.nt-tab');if(b)open(b.dataset.id)});
  let tm;
  ta.addEventListener('input',()=>{const n=notes.find(x=>x.id===cur);n.text=ta.value;n.t=Date.now();clearTimeout(tm);tm=setTimeout(()=>{paintTabs();save()},300)});
  $('#nadd',root).addEventListener('click',()=>{const n={id:uid(),text:'',t:Date.now()};notes.push(n);open(n.id);ta.focus()});
  $('#ndel',root).addEventListener('click',()=>{
    const n=notes.find(x=>x.id===cur);
    if(n.text.trim()&&!$('#ndel',root).dataset.arm){const b=$('#ndel',root);b.dataset.arm=1;b.style.background='#d9382a';b.style.color='#fff';setTimeout(()=>{delete b.dataset.arm;b.style.background='';b.style.color=''},2200);return}
    notes=notes.filter(x=>x.id!==cur);if(!notes.length)notes=[{id:uid(),text:'',t:Date.now()}];
    const b=$('#ndel',root);delete b.dataset.arm;b.style.background='';b.style.color='';open(notes[0].id);
  });
  open(cur);
}
