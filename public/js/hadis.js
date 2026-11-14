'use strict';
/* AliBaba Terminal · hadis.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Rehber › Hadis: Kütüb-i Sitte ----------
   Veri siteyle birlikte sunulur (public/data/hadis/, kaynak: data/kutubu_sitte.txt; .github/scripts/hadis.mjs üretir).
   idx.json: bölüm/konu/râvi/kaynak dizinleri · t0..t11.json: metinler · gun.json: günün hadisi için sabit sıra.
   Metin olduğu gibi gösterilir; değiştirilmez, özetlenmez. */
const HD_BASE='data/hadis/';
const hdFold=s=>String(s||'').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ı/g,'i').replace(/[’'`´]/g,'').replace(/\s+/g,' ').trim();
const hdP={};   /* dosya → söz (başarısız olursa silinir, sonra yeniden denenir) */
const hdGet=f=>hdP[f]||(hdP[f]=getJSON(HD_BASE+f,20000).catch(e=>{delete hdP[f];throw e}));
const hdIdx=()=>hdGet('idx.json');
const hdChunkNo=(ix,i)=>{let c=0;while(c+1<ix.ch.length&&ix.ch[c+1]<=i)c++;return c};
const hdChunk=n=>hdGet('t'+n+'.json');
/* Bir satırın (indeks) metni ve referansı; ilgili parça yüklenir. */
async function hdText(ix,i){const c=await hdChunk(hdChunkNo(ix,i)),k=i-c.i0;return{t:c.t[k],f:c.f[k]}}
const hdSrcNames=(ix,m)=>ix.src.filter((_,b)=>m>>b&1);
/* Günün hadisi: herkes için aynı. Gün, İstanbul takvimine göre; gun.json'daki sıra 2026-01-01'den başlar. */
const hdIstDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul'}).format(Date.now());
async function hdToday(){
  const [ix,g]=await Promise.all([hdIdx(),hdGet('gun.json')]);
  const m=hdIstDay().match(/^(\d{4})-(\d{2})-(\d{2})$/),b=g.base.split('-').map(Number);
  const n=Math.floor((Date.UTC(+m[1],+m[2]-1,+m[3])-Date.UTC(b[0],b[1]-1,b[2]))/864e5),L=g.order.length;
  const i=g.order[((n%L)+L)%L];
  return{ix,i,...await hdText(ix,i)};
}
function hdOpen(start){
  if($('.kr-ov'))return;
  const prev=document.activeElement;
  let ix=null,all=null,busy=false,view='list',cur=-1,q='',fs='',fb='',fk='',fr='',shown=50,hay=null;
  const ov=document.createElement('div');ov.className='kr-ov hd-ov';
  ov.innerHTML='<div class="kr" role="dialog" aria-modal="true" aria-labelledby="hdT">'+
    '<div class="kr-h"><span class="kr-t" id="hdT">Kütüb-i Sitte · Hadis</span><button type="button" class="kr-x" aria-label="Kapat" data-a="x">✕</button></div>'+
    '<div class="kr-tools"><input type="search" class="kr-s" placeholder="Hadis metni, konu, bölüm, râvi veya kaynak ara" aria-label="Ara" autocomplete="off">'+
    '<div class="hd-sel"><select data-f="s" aria-label="Kaynak"></select><select data-f="b" aria-label="Bölüm"></select><select data-f="k" aria-label="Konu başlığı"></select><select data-f="r" aria-label="Râvi"></select></div></div>'+
    '<div class="kr-b noscroll" tabindex="-1"><div class="kr-wait">Yükleniyor…</div></div>'+
    '<div class="kr-f">Kütüb-i Sitte · <span class="hd-n"></span></div></div>';
  document.body.appendChild(ov);
  const body=$('.kr-b',ov),inp=$('.kr-s',ov),sel={};
  ['s','b','k','r'].forEach(k=>sel[k]=$('[data-f='+k+']',ov));
  const close=()=>{document.removeEventListener('keydown',onKey,true);ov.remove();if(prev&&prev.focus)try{prev.focus()}catch{}};
  const onKey=e=>{if(e.key==='Escape'){e.stopPropagation();if(view==='detail')back();else close()}};
  document.addEventListener('keydown',onKey,true);
  const opt=(v,t,on)=>'<option value="'+esc(v)+'"'+(on?' selected':'')+'>'+esc(t)+'</option>';
  const paintSel=()=>{
    sel.s.innerHTML=opt('','Tüm kaynaklar',!fs)+ix.src.map((n,b)=>opt(b,n,fs===String(b))).join('');
    sel.b.innerHTML=opt('','Tüm bölümler',!fb)+ix.b.map((n,b)=>opt(b,n,fb===String(b))).join('');
    const ks=ix.k.map((x,i)=>[i,x]).filter(([,x])=>fb!==''&&x[0]===+fb);
    sel.k.innerHTML=opt('',fb===''?'Konu (önce bölüm seç)':'Tüm konular',!fk)+ks.map(([i,x])=>opt(i,x[1],fk===String(i))).join('');
    sel.k.disabled=fb==='';
    sel.r.innerHTML=opt('','Tüm râviler',!fr)+ix.gn.map((n,g)=>[g,n]).sort((a,b)=>a[1].localeCompare(b[1],'tr')).map(([g,n])=>opt(g,n+' ('+ix.gc[g]+')',fr===String(g))).join('');
  };
  /* Arama metni: üst veri (konu, bölüm, râvi, kaynak) hemen; hadis metni ve referans parçalar yüklendikçe. */
  const metaHay=i=>hay.m[i]||(hay.m[i]=hdFold([ix.b[ix.k[ix.kb[i]][0]],ix.k[ix.kb[i]][1],ix.ra[i]>=0?ix.rv[ix.ra[i]]+' '+ix.gn[ix.rg[ix.ra[i]]]:'',hdSrcNames(ix,ix.m[i]).join(' '),'no '+ix.id[i]].join(' ')));
  const textHay=i=>{const c=all&&all[hdChunkNo(ix,i)];if(!c)return'';const k=i-c.i0;return hay.t[i]||(hay.t[i]=hdFold(c.t[k]+' '+c.f[k]))};
  const rows=()=>{
    const terms=hdFold(q).split(' ').filter(Boolean),out=[];
    for(let i=0;i<ix.n;i++){
      const kb=ix.k[ix.kb[i]];
      if(fs!==''&&!(ix.m[i]>>+fs&1))continue;
      if(fb!==''&&kb[0]!==+fb)continue;
      if(fk!==''&&ix.kb[i]!==+fk)continue;
      if(fr!==''&&!(ix.ra[i]>=0&&ix.rg[ix.ra[i]]===+fr))continue;
      if(terms.length){const h=metaHay(i)+' '+textHay(i);if(!terms.every(t=>h.includes(t)))continue}
      out.push(i);
    }
    return out;
  };
  const loadAll=()=>{
    if(all||busy)return;busy=true;
    Promise.all(ix.ch.map((_,n)=>hdChunk(n))).then(cs=>{all=cs;busy=false;if(view==='list')paintList()}).catch(()=>{busy=false});
  };
  const snip=(i)=>{const c=all&&all[hdChunkNo(ix,i)];if(!c)return'';const t=c.t[i-c.i0];return t.length>150?t.slice(0,150).replace(/\s+\S*$/,'')+'…':t};
  const paintList=()=>{
    view='list';cur=-1;
    const r=rows();
    body.innerHTML=(r.length?r.slice(0,shown).map(i=>{const kb=ix.k[ix.kb[i]];
      return'<button type="button" class="kr-i hd-i" data-i="'+i+'"><b>'+esc(kb[1])+'</b>'+(snip(i)?'<em>'+esc(snip(i))+'</em>':'')+
        '<span>'+esc([hdSrcNames(ix,ix.m[i]).join(', '),ix.b[kb[0]],ix.ra[i]>=0?ix.rv[ix.ra[i]]:''].filter(Boolean).join(' · '))+'</span></button>'}).join('')+
        (r.length>shown?'<button type="button" class="kr-more" data-a="more">Daha fazla göster</button>':''):'<div class="kr-empty">Sonuç bulunamadı.</div>');
    $('.hd-n',ov).textContent=r.length+' hadis'+((q&&!all)?' · metinlerde arama için yükleniyor…':'');
  };
  const paintDetail=async i=>{
    view='detail';cur=i;
    const kb=ix.k[ix.kb[i]],names=hdSrcNames(ix,ix.m[i]);
    body.innerHTML='<button type="button" class="kr-back" data-a="back">‹ Listeye dön</button>'+
      '<div class="kr-meta">'+esc(names.join(', ')+' · Kayıt '+ix.id[i])+'</div>'+
      '<div class="kr-cat"><button type="button" class="hd-lk" data-b="'+kb[0]+'">'+esc(ix.b[kb[0]])+'</button> › <button type="button" class="hd-lk" data-b="'+kb[0]+'" data-k="'+ix.kb[i]+'">'+esc(kb[1])+'</button></div>'+
      (ix.ra[i]>=0?'<div class="kr-meta">Râvi: <button type="button" class="hd-lk" data-r="'+ix.rg[ix.ra[i]]+'">'+esc(ix.rv[ix.ra[i]])+'</button></div>':'')+
      '<div class="hd-t kr-wait">Yükleniyor…</div><div class="hd-ref"></div>'+
      '<div class="hd-nav"><button type="button" data-a="prev">‹ Önceki</button><button type="button" data-a="next">Sonraki ›</button></div>';
    body.scrollTop=0;
    try{
      const x=await hdText(ix,i);if(cur!==i||view!=='detail')return;
      const t=$('.hd-t',body);t.className='hd-t';t.innerHTML='<span>'+esc(x.t)+'</span>';
      $('.hd-ref',body).textContent=x.f;
    }catch{if(cur===i){const t=$('.hd-t',body);if(t)t.textContent='Hadis metni şu an alınamadı. Bağlantını kontrol edip tekrar dene.'}}
  };
  const back=()=>{paintList()};
  const step=d=>{const r=rows(),p=r.indexOf(cur);const n=p<0?-1:r[p+d];if(n!=null&&n>=0)paintDetail(n)};
  const refilter=()=>{shown=50;paintList();body.scrollTop=0};
  ov.addEventListener('click',e=>{
    if(e.target===ov){close();return}
    const t=e.target.closest('button');if(!t)return;
    const d=t.dataset;
    if(d.a==='x')close();
    else if(d.a==='back')back();
    else if(d.a==='more'){shown+=50;paintList()}
    else if(d.a==='prev')step(-1);
    else if(d.a==='next')step(1);
    else if(d.i!=null)paintDetail(+d.i);
    else if(d.b!=null||d.r!=null){
      if(d.b!=null){fb=d.b;fk=d.k||'';}
      if(d.r!=null){fr=d.r}
      paintSel();refilter();
    }
  });
  ov.addEventListener('change',e=>{
    const f=e.target.dataset&&e.target.dataset.f;if(!f)return;
    const v=e.target.value;
    if(f==='s')fs=v;else if(f==='b'){fb=v;fk=''}else if(f==='k')fk=v;else fr=v;
    paintSel();refilter();
  });
  let tm=0;
  inp.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{q=inp.value.trim();if(q)loadAll();if(view==='detail')paintList();else refilter()},150)});
  hdIdx().then(j=>{
    ix=j;hay={m:[],t:[]};paintSel();
    if(start!=null)paintDetail(start);else paintList();
    loadAll();
    inp.focus({preventScroll:true});
  }).catch(()=>{body.innerHTML='<div class="kr-wait">Hadis verisi şu an alınamadı. Bağlantını kontrol edip tekrar dene.</div>'});
}
