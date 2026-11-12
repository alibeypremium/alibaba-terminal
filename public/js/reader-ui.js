'use strict';
/* AliBaba Terminal · reader-ui.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
function openReader(a){
  const msg=a.dataset.rd==='msg',url=rdUrl(a);if(!url)return;
  const tk=a.classList.contains('tk-i'),nw=a.closest('.nw');if(!tk&&!nw)return;
  const title=tk?(a.children[1]?.textContent||''):(a.querySelector('b')?.textContent||'');
  const sub=tk?(a.children[2]?.textContent||''):(a.querySelector('span')?.textContent||'');
  const ov=document.createElement('div'),bd=tk?document.createElement('div'):null;
  ov.className='rdr'+(tk?' rdr-fix':'');
  if(tk){
    const light=document.documentElement.dataset.theme==='light';
    ov.style.cssText=light?'--rdb:#f5f7fc;--t:#14182b;--t2:rgba(20,24,43,.6);--acc:#1a73e8;--line:rgba(20,24,43,.14)':'--rdb:#14161e;--t:#f2f4fa;--t2:rgba(242,244,250,.65);--acc:#7db4ff;--line:rgba(255,255,255,.14)';
    bd.className='rdr-bd';document.body.append(bd);
    document.body.append(ov);
  }else{
    nw.querySelector(':scope>.rdr')?.remove();
    const rgb=(getComputedStyle(a).color.match(/\d+/g)||[255,255,255]).map(Number),lum=.3*rgb[0]+.59*rgb[1]+.11*rgb[2];
    ov.style.setProperty('--rdb',lum>140?'#13151c':'#f5f7fc');nw.appendChild(ov);
  }
  const link=safeUrl(a.getAttribute('href'));
  ov.innerHTML='<div class="rdr-h"><button type="button" class="rdr-x" aria-label="Kapat" title="Kapat (Esc)">←</button><span class="rdr-d">'+esc(msg?'Telegram · '+sub.split(' · ')[0]:rdHost(url))+'</span><a class="rdr-g" href="'+esc(msg?link:url)+'" target="_blank" rel="noopener noreferrer">'+(msg?'Telegram\'da aç ↗':'Siteye git ↗')+'</a></div>'+
    '<div class="rdr-c"><h2 class="rdr-t">'+esc(msg?'':title)+'</h2>'+(msg?(safeUrl(a.dataset.img)?'<img class="rdr-im" src="'+esc(safeUrl(a.dataset.img))+'" alt="" referrerpolicy="no-referrer" loading="lazy">':'')+'<p>'+esc(title)+'</p>':(safeUrl(a.dataset.img)?'<img class="rdr-im" src="'+esc(safeUrl(a.dataset.img))+'" alt="" referrerpolicy="no-referrer">':'')+(a.dataset.sum?'<p class="rdr-lead">'+esc(a.dataset.sum)+'</p>':'')+'<div class="skel"></div><div class="skel" style="width:85%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>')+'</div>';
  const c=$('.rdr-c',ov);
  const onKey=e=>{if(e.key==='Escape')close()};
  const close=()=>{ov.remove();bd?.remove();document.removeEventListener('keydown',onKey)};
  document.addEventListener('keydown',onKey);
  $('.rdr-x',ov).onclick=close;if(bd)bd.onclick=close;
  if(msg){$('.rdr-t',ov).remove();return}   /* mesajda dış bağlantı yok: kayıtlı metin gösterilir */
  const slow=setTimeout(()=>{if(ov.isConnected&&c.querySelector('.skel'))c.insertAdjacentHTML('beforeend','<div class="rdr-w">Site yavaş yanıt veriyor, bekleniyor…</div>')},4000);
  rdFetch(url).then(art=>{
    clearTimeout(slow);
    if(!ov.isConnected)return;
    let h='<h2 class="rdr-t">'+esc(art.title&&art.title.length<title.length*1.6?art.title:title)+'</h2>',ul=false;
    const blocks=art.blocks.some(b=>b.k==='img')||!safeUrl(a.dataset.img)?art.blocks:[{k:'img',v:a.dataset.img},...art.blocks];   /* makalede görsel yoksa Telegram görseli */
    for(const b of blocks){
      if(b.k!=='li'&&ul){h+='</ul>';ul=false}
      if(b.k==='img'){const u=safeUrl(b.v);if(u)h+='<img class="rdr-im" src="'+esc(u)+'" alt="" referrerpolicy="no-referrer" loading="lazy">'}
      else if(b.k==='h')h+='<h3>'+esc(b.v)+'</h3>';
      else if(b.k==='li'){if(!ul){h+='<ul>';ul=true}h+='<li>'+esc(b.v)+'</li>'}
      else h+='<p>'+esc(b.v)+'</p>';
    }
    if(ul)h+='</ul>';
    h+='<p class="rdr-f"><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Orijinal haberi sitesinde aç ↗</a></p>';
    c.innerHTML=h;c.scrollTop=0;rdAI(c,art,url,title);
    if(!blocks.some(b=>b.k==='img'))rdOg(url).then(u=>{if(u&&ov.isConnected&&!$('.rdr-im',c)){const t=$('.rdr-t',c);const im=document.createElement('img');im.className='rdr-im';im.referrerPolicy='no-referrer';im.alt='';im.src=u;im.addEventListener('error',()=>im.remove());if(t)t.after(im);else c.prepend(im)}});
    $$('.rdr-im',c).forEach(i=>i.addEventListener('error',()=>i.remove()));
  }).catch(()=>{
    clearTimeout(slow);
    if(!ov.isConnected)return;
    c.innerHTML='<h2 class="rdr-t">'+esc(title)+'</h2><div class="nw-msg"><div>Metin okuma modunda alınamadı.<br><span style="font-size:11px;opacity:.7">Site izin vermiyor ya da servis yanıt vermedi.</span></div><a class="rdr-btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Siteye git ↗</a></div>';
  });
}
document.addEventListener('error',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('rdr-im'))t.remove()},true);
document.addEventListener('click',e=>{
  const a=e.target.closest&&e.target.closest('a.nw-i[data-rd],a.tk-i[data-rd]');
  if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();openReader(a);
});
