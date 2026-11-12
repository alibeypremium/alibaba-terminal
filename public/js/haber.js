'use strict';
/* AliBaba Terminal · haber.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Son Dakika + Telegram (tek widget, iki sekme; her sekme kendi temasını korur) ---------- */
function mountHaber(w,root){
  const TABS=[['sd','Son Dakika'],['tg','Telegram']];
  let tab='tg';   /* sayfa her açıldığında Telegram sekmesi açık gelir; Son Dakika'ya geçmek için sekmeye tıklanır */
  const tabsHtml=()=>'<div class="dv-tabs wtabs" role="tablist">'+TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-m="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  root.innerHTML='<div class="mp" data-p="sd"></div><div class="mp" data-p="tg" hidden></div>';
  const pane={sd:$('[data-p=sd]',root),tg:$('[data-p=tg]',root)},api={};
  const mounters={sd:(ww,r,t)=>mountNews(ww,r,'gnews',t),tg:mountTelegram};
  function show(t){
    tab=t;LS.set('pano.haber.tab',t);w.dataset.tab=t;
    TABS.forEach(([k])=>{if(k!==t){pane[k].hidden=true;if(api[k]&&api[k].off)api[k].off()}});
    pane[t].hidden=false;
    if(!api[t])api[t]=mounters[t](w,pane[t],tabsHtml())||{};else if(api[t].on)api[t].on();
    $$('.nw-list',pane[t]).forEach(l=>{l.scrollTop=0});   /* Son Dakika ↔ Telegram geçişinde de en üstten başlasın */
    $$('.wtabs button',root).forEach(b=>{const on=b.dataset.m===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b&&b.dataset.m!==tab)show(b.dataset.m)});
  show(tab);
}
