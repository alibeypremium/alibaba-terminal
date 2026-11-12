'use strict';
/* AliBaba Terminal · kick.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Kick: eklediğin kanallar, canlı olanlar üstte, tıklayınca burada oynar ---------- */
/* Kick'in takip listesi giriş oturumu olmadan okunamaz, bu yüzden kanallar elle eklenir ve bu tarayıcıda saklanır.
   Canlı durum kick.com/api/v2/channels/{kanal} adresinden (tarayıcıdan okunabiliyor), oynatıcı Kick'in resmî player.kick.com gömmesidir. */
const KICK_SLUG=/^[a-z0-9][a-z0-9_-]{0,31}$/i;
/* "kick.com/xqc", "https://kick.com/xqc/videos", "@xqc", "xqc" ve boşluk/virgülle ayrılmış listeleri kabul eder. */
function kickSlugs(text){
  const out=[];
  String(text||'').split(/[\s,;]+/).forEach(tok=>{
    let t=tok.trim().replace(/^@/,'');if(!t)return;
    t=t.replace(/^https?:\/\//i,'').replace(/^(www\.|player\.)?kick\.com\//i,'').split(/[/?#]/)[0].toLowerCase();
    if(KICK_SLUG.test(t)&&!out.includes(t))out.push(t);
  });
  return out;
}
function mountKick(w,root,tabs){
  const MAX=40,PH='Kanal ekle: kick.com/kullanıcı ya da kullanıcı adı';
  root.innerHTML='<div class="tvp">'+hd('kick','<span lang="en">Kick</span>',tabs+sbBtn+'<button class="ibtn" type="button" id="kkt" title="Kanal listesini aç/kapat" aria-label="Kanal listesini aç/kapat" aria-pressed="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button>')+
   '<form class="yt-in" id="kkf"><input id="kki" type="text" placeholder="'+PH+'" aria-label="Kick kanalı ekle" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="yt-go" type="submit">Ekle</button></form>'+
   '<div class="tvp-main"><div class="tvp-vid" id="kkv"></div><div class="tvp-side"><div class="tvp-list noscroll" id="kkl"></div></div></div></div>';
  sbWire(root);
  const tvp=$('.tvp',root),tgl=$('#kkt',root),vid=$('#kkv',root),list=$('#kkl',root),inp=$('#kki',root);
  listWire(tvp,tgl);
  let chs=LS.get('pano.kick.ch',[]);
  chs=(Array.isArray(chs)?chs:[]).filter(s=>typeof s==='string'&&KICK_SLUG.test(s)).slice(0,MAX);
  const info={};let cur=null,busy=false,phT=0,loaded=false;
  const okImg=u=>/^https:\/\/[\w.-]+\.kick\.com\//i.test(u||'');
  const fmtV=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1).replace('.',',')+' B':String(n);   /* B = bin */
  const note=m=>{vid.innerHTML='<div class="yt-empty"><svg viewBox="0 0 64 56" style="width:56px;height:auto"><rect x="4" y="6" width="56" height="44" rx="12" fill="#53fc18"/><circle cx="32" cy="28" r="6" fill="#07210a"/><path d="M19 17a16 16 0 0 0 0 22M45 17a16 16 0 0 1 0 22" stroke="#07210a" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg><div>'+m+'</div></div>'};
  const idle=()=>{
    const n=chs.filter(s=>info[s]&&info[s].live).length;
    note(!chs.length?'Takip ettiğin Kick kanallarını ekle.<br>Canlı olanlar listenin başında görünür, tıklayınca burada oynar.'
      :!loaded?'Canlı yayınlar kontrol ediliyor…'
      :chs.every(s=>info[s]&&info[s].err)?'Kick\'e ulaşılamadı. Biraz sonra kendiliğinden yeniden denenecek.'
      :n?'<b>'+n+'</b> kanal şu an canlı. Listeden birine tıkla.':'Eklediğin kanalların hiçbiri şu an yayında değil.');
  };
  const flash=m=>{inp.placeholder=m;clearTimeout(phT);phT=setTimeout(()=>{inp.placeholder=PH},4500)};
  const order=()=>[...chs].sort((a,b)=>{const A=info[a]||{},B=info[b]||{};if(!!A.live!==!!B.live)return B.live?1:-1;if(A.live)return(B.viewers||0)-(A.viewers||0);return a.localeCompare(b)});
  function drawList(){
    if(!chs.length){list.innerHTML='<div class="foot" style="padding:8px">Henüz kanal yok. Yukarıdaki kutudan ekle.</div>';return}
    list.innerHTML=order().map(s=>{
      const i=info[s]||{},nm=i.name||s,live=!!i.live;
      const av=okImg(i.pic)?'<img src="'+esc(i.pic)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="tvp-n">'+esc(nm.slice(0,1).toUpperCase())+'</span>';
      const tip=live?(i.title||'')+(i.cat?' · '+i.cat:''):i.nf?'Kanal bulunamadı':i.err?'Durumu alınamadı':'Şu an yayında değil';
      return'<div class="kk-r"><button type="button" class="tvp-c kk-c'+(live?' live':'')+(s===cur?' on':'')+'" data-s="'+esc(s)+'" title="'+esc(tip)+'">'+av+'<span class="kk-n">'+esc(nm)+'</span>'+(live?'<span class="kk-v"><i class="kk-dot"></i>'+fmtV(i.viewers||0)+'</span>':'')+'</button>'+
        '<button type="button" class="kk-x" data-rm="'+esc(s)+'" aria-label="'+esc(nm)+' kanalını listeden çıkar" title="Listeden çıkar">×</button></div>';
    }).join('');
  }
  async function fetchOne(s){
    try{
      const j=await getJSON('https://kick.com/api/v2/channels/'+encodeURIComponent(s),9000);
      const l=j&&j.livestream,c=l&&Array.isArray(l.categories)&&l.categories[0];
      info[s]={name:String((j.user&&j.user.username)||j.slug||s),pic:(j.user&&j.user.profile_pic)||'',live:!!l,viewers:l?(+l.viewer_count||0):0,title:l?String(l.session_title||''):'',cat:c?String(c.name||''):''};
    }catch(e){
      if(String(e&&e.message)==='404')info[s]={nf:true};   /* böyle bir kanal yok */
      else if(!info[s]||info[s].err)info[s]={name:s,err:true};   /* geçici hata: varsa eski bilgi kalsın, yoksa "bilinmiyor" */
    }
  }
  async function refresh(){
    if(busy||!chs.length||root.hidden)return;
    busy=true;
    try{await Promise.all(chs.map(fetchOne))}finally{busy=false;loaded=true}
    drawList();if(!cur)idle();
  }
  function play(s){
    const i=info[s]||{};cur=s;drawList();
    if(i.nf){note('<b>'+esc(s)+'</b> adlı bir kanal bulunamadı.<br>Adı kontrol et ya da listeden çıkar.');return}
    if(!i.live&&!i.err){   /* durumu bilinmeyen kanalda yine de oynatıcı açılır; yayın varsa görünür */note('<b>'+esc(i.name||s)+'</b> şu an yayında değil.<br><a class="kk-open" href="https://kick.com/'+encodeURIComponent(s)+'" target="_blank" rel="noopener noreferrer">Kick\'te aç</a>');return}
    vid.innerHTML='<iframe title="Kick: '+esc(i.name||s)+'" src="https://player.kick.com/'+encodeURIComponent(s)+'?autoplay=true" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  }
  async function add(text){
    const all=kickSlugs(text);
    if(!all.length){flash('Geçerli bir kanal adı bulunamadı.');return}
    const fresh=all.filter(s=>!chs.includes(s));
    if(!fresh.length){flash('Bu kanal zaten listede.');return}
    if(chs.length+fresh.length>MAX){flash('En fazla '+MAX+' kanal eklenebilir.');return}
    flash('Kontrol ediliyor…');
    await Promise.all(fresh.map(fetchOne));
    const bad=fresh.filter(s=>info[s]&&info[s].nf);
    bad.forEach(s=>delete info[s]);
    chs=chs.concat(fresh.filter(s=>!bad.includes(s)));LS.set('pano.kick.ch',chs);
    drawList();if(!cur)idle();
    flash(bad.length?'Bulunamadı: '+bad.join(', '):'Eklendi.');
  }
  $('#kkf',root).addEventListener('submit',e=>{e.preventDefault();const v=inp.value;inp.value='';add(v)});
  inp.addEventListener('paste',()=>setTimeout(()=>{if(/kick\.com\//i.test(inp.value)){const v=inp.value;inp.value='';add(v)}},30));
  list.addEventListener('click',e=>{
    const x=e.target.closest('[data-rm]');
    if(x){const s=x.dataset.rm;chs=chs.filter(c=>c!==s);delete info[s];LS.set('pano.kick.ch',chs);if(cur===s)cur=null;drawList();if(!cur)idle();return}
    const b=e.target.closest('.kk-c');if(b)play(b.dataset.s);
  });
  drawList();idle();refresh();every(w,refresh,60e3);
  return{off(){cur=null;vid.innerHTML=''},on(){cur=null;drawList();idle();refresh()},dispose(){vid.innerHTML=''}};   /* görünmeyen sekmede yayın durur */
}
