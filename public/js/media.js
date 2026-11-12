'use strict';
/* AliBaba Terminal · media.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- YouTube + TV İzle + Video + Bilgisayar (tek widget, dört sekme) ---------- */
function mountMedia(w,root){
  const TABS=[['yt','YouTube'],['kk','Kick'],['tw','Twitch'],['tv','TV'],['vd','Video'],['pc','Bilgisayar']];
  let tab=LS.get('pano.media.tab','yt');if(!TABS.find(t=>t[0]===tab))tab='yt';
  const tabsHtml=()=>'<div class="dv-tabs" role="tablist">'+TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-m="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  root.innerHTML='<div class="mp" data-p="yt"></div><div class="mp" data-p="kk" hidden></div><div class="mp" data-p="tw" hidden></div><div class="mp" data-p="tv" hidden></div><div class="mp" data-p="vd" hidden></div><div class="mp" data-p="pc" hidden></div>';
  const pane={yt:$('[data-p=yt]',root),kk:$('[data-p=kk]',root),tw:$('[data-p=tw]',root),tv:$('[data-p=tv]',root),vd:$('[data-p=vd]',root),pc:$('[data-p=pc]',root)},api={};
  const mounters={yt:mountYT,kk:mountKick,tw:mountTwitch,tv:mountIPTV,vd:mountVideo,pc:mountPC};
  w._dispose=()=>{['kk','tw','tv','vd','pc'].forEach(k=>{if(api[k]&&api[k].dispose)api[k].dispose()})};
  function show(t){
    tab=t;LS.set('pano.media.tab',t);w.dataset.tab=t;
    TABS.forEach(([k])=>{
      if(k===t)return;
      pane[k].hidden=true;if(api[k])api[k].off();   /* görünmeyen sekmede video/ses çalmasın */
    });
    pane[t].hidden=false;
    if(!api[t])api[t]=mounters[t](w,pane[t],tabsHtml())||{};else api[t].on();
    $$('.dv-tabs button',root).forEach(b=>{const on=b.dataset.m===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
    /* Dar ekranda sekme çubuğu kayar: seçili sekmeyi görünür alana ortala. */
    requestAnimationFrame(()=>$$('.dv-tabs',pane[t]).forEach(bar=>{const b=$('button.on',bar);if(!b)return;const r=b.getBoundingClientRect(),q=bar.getBoundingClientRect();bar.scrollLeft+=(r.left+r.width/2)-(q.left+q.width/2)}));
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b&&b.dataset.m!==tab)show(b.dataset.m)});
  show(tab);
}
