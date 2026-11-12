'use strict';
/* AliBaba Terminal · twitch.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Twitch: Kick sekmesinin aynısı (eklediğin kanallar, canlı olanlar üstte, tıklayınca burada oynar) ---------- */
const TW_SLUG=/^[a-z0-9_]{2,25}$/i,TW_RESERVED=['videos','directory','popout','embed','settings','downloads','p'];
const TW_CID='kimne78kx3ncx6brgo4mv6wki5h1ko';
function twitchSlugs(text){
  const out=[];
  String(text||'').split(/[\s,;]+/).forEach(tok=>{
    let t=tok.trim().replace(/^@/,'');if(!t)return;
    t=t.replace(/^https?:\/\//i,'').replace(/^(www\.|m\.|player\.)?twitch\.tv\//i,'').split(/[/?#]/)[0].toLowerCase();
    if(TW_SLUG.test(t)&&!TW_RESERVED.includes(t)&&!out.includes(t))out.push(t);
  });
  return out;
}
function mountTwitch(w,root,tabs){
  const MAX=40,PH='Kanal ekle: twitch.tv/kullanıcı ya da kullanıcı adı';
  root.innerHTML='<div class="tvp">'+hd('twitch','<span lang="en">Twitch</span>',tabs+sbBtn+'<button class="ibtn" type="button" id="twt" title="Kanal listesini aç/kapat" aria-label="Kanal listesini aç/kapat" aria-pressed="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></button>')+
   '<form class="yt-in" id="twf"><input id="twi" type="text" placeholder="'+PH+'" aria-label="Twitch kanalı ekle" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="yt-go" type="submit">Ekle</button></form>'+
   '<div class="tvp-main"><div class="tvp-vid" id="twv"></div><div class="tvp-side"><div class="tvp-list noscroll" id="twl"></div></div></div></div>';
  sbWire(root);
  const tvp=$('.tvp',root),tgl=$('#twt',root),vid=$('#twv',root),list=$('#twl',root),inp=$('#twi',root);
  listWire(tvp,tgl);
  let chs=LS.get('pano.twitch.ch',[]);
  chs=(Array.isArray(chs)?chs:[]).filter(s=>typeof s==='string'&&TW_SLUG.test(s)).slice(0,MAX);
  const info={};let cur=null,busy=false,phT=0,loaded=false;
  const okImg=u=>/^https:\/\/static-cdn\.jtvnw\.net\//i.test(u||'');
  const fmtV=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1).replace('.',',')+' B':String(n);   /* B = bin */
  const note=m=>{vid.innerHTML='<div class="yt-empty"><svg viewBox="0 0 64 56" style="width:56px;height:auto"><rect x="4" y="6" width="56" height="44" rx="12" fill="#9146ff"/><circle cx="32" cy="28" r="6" fill="#fff"/><path d="M19 17a16 16 0 0 0 0 22M45 17a16 16 0 0 1 0 22" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none"/></svg><div>'+m+'</div></div>'};
  const idle=()=>{
    const n=chs.filter(s=>info[s]&&info[s].live).length;
    note(!chs.length?'Takip ettiğin Twitch kanallarını ekle.<br>Canlı olanlar listenin başında görünür, tıklayınca burada oynar.'
      :!loaded?'Canlı yayınlar kontrol ediliyor…'
      :chs.every(s=>info[s]&&info[s].err)?'Twitch\'e ulaşılamadı. Biraz sonra kendiliğinden yeniden denenecek.'
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
  /* Twitch'in herkese açık web sorgusu (gql.twitch.tv); tüm kanallar tek istekte sorulur. İstemci kimliği twitch.tv sayfasının kendi kimliğidir. */
  async function fetchAll(list){
    if(!list.length)return;
    try{
      const r=await fetch('https://gql.twitch.tv/gql',{method:'POST',headers:{'Client-Id':TW_CID},signal:AbortSignal.timeout(9000),
        body:JSON.stringify({query:'query($l:[String!]!){users(logins:$l){login displayName profileImageURL(width:70) stream{viewersCount title game{displayName}}}}',variables:{l:list}})});
      if(!r.ok)throw new Error(r.status);
      const j=await r.json(),us=j&&j.data&&j.data.users;if(!Array.isArray(us))throw new Error('bad');
      const by={};us.forEach(u=>{if(u&&u.login)by[u.login.toLowerCase()]=u});
      list.forEach(s=>{
        const u=by[s.toLowerCase()];
        if(!u){info[s]={nf:true};return}   /* böyle bir kanal yok */
        const l=u.stream;
        info[s]={name:String(u.displayName||u.login||s),pic:u.profileImageURL||'',live:!!l,viewers:l?(+l.viewersCount||0):0,title:l?String(l.title||''):'',cat:l&&l.game?String(l.game.displayName||''):''};
      });
    }catch{
      list.forEach(s=>{if(!info[s]||info[s].err)info[s]={name:s,err:true}});   /* geçici hata: varsa eski bilgi kalsın */
    }
  }
  async function refresh(){
    if(busy||!chs.length||root.hidden)return;
    busy=true;
    try{await fetchAll(chs)}finally{busy=false;loaded=true}
    drawList();if(!cur)idle();
  }
  function play(s){
    const i=info[s]||{};cur=s;drawList();
    if(i.nf){note('<b>'+esc(s)+'</b> adlı bir kanal bulunamadı.<br>Adı kontrol et ya da listeden çıkar.');return}
    if(!i.live&&!i.err){   /* durumu bilinmeyen kanalda yine de oynatıcı açılır; yayın varsa görünür */note('<b>'+esc(i.name||s)+'</b> şu an yayında değil.<br><a class="kk-open" href="https://twitch.tv/'+encodeURIComponent(s)+'" target="_blank" rel="noopener noreferrer">Twitch\'te aç</a>');return}
    if(!/^https?:$/.test(location.protocol)){note('Twitch oynatıcısı yalnızca bir web adresinden açılan sayfada çalışır.<br><a class="kk-open" href="https://www.twitch.tv/'+encodeURIComponent(s)+'" target="_blank" rel="noopener noreferrer">Twitch\'te aç</a>');return}
    vid.innerHTML='<iframe title="Twitch: '+esc(i.name||s)+'" src="https://player.twitch.tv/?channel='+encodeURIComponent(s)+'&parent='+encodeURIComponent(location.hostname)+'&autoplay=true" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  }
  async function add(text){
    const all=twitchSlugs(text);
    if(!all.length){flash('Geçerli bir kanal adı bulunamadı.');return}
    const fresh=all.filter(s=>!chs.includes(s));
    if(!fresh.length){flash('Bu kanal zaten listede.');return}
    if(chs.length+fresh.length>MAX){flash('En fazla '+MAX+' kanal eklenebilir.');return}
    flash('Kontrol ediliyor…');
    await fetchAll(fresh);
    const bad=fresh.filter(s=>info[s]&&info[s].nf);
    bad.forEach(s=>delete info[s]);
    chs=chs.concat(fresh.filter(s=>!bad.includes(s)));LS.set('pano.twitch.ch',chs);
    drawList();if(!cur)idle();
    flash(bad.length?'Bulunamadı: '+bad.join(', '):'Eklendi.');
  }
  $('#twf',root).addEventListener('submit',e=>{e.preventDefault();const v=inp.value;inp.value='';add(v)});
  inp.addEventListener('paste',()=>setTimeout(()=>{if(/twitch\.tv\//i.test(inp.value)){const v=inp.value;inp.value='';add(v)}},30));
  list.addEventListener('click',e=>{
    const x=e.target.closest('[data-rm]');
    if(x){const s=x.dataset.rm;chs=chs.filter(c=>c!==s);delete info[s];LS.set('pano.twitch.ch',chs);if(cur===s)cur=null;drawList();if(!cur)idle();return}
    const b=e.target.closest('.kk-c');if(b)play(b.dataset.s);
  });
  drawList();idle();refresh();every(w,refresh,60e3);
  return{off(){cur=null;vid.innerHTML=''},on(){cur=null;drawList();idle();refresh()},dispose(){vid.innerHTML=''}};   /* görünmeyen sekmede yayın durur */
}
