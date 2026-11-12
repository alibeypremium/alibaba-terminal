'use strict';
/* AliBaba Terminal · fx.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Döviz ---------- */
function spark(vals,up){
  if(vals.length<2)return'';
  const mn=Math.min(...vals),mx=Math.max(...vals),r=mx-mn||1,W=70,H=26;
  const pts=vals.map((v,i)=>[i/(vals.length-1)*W,H-2-((v-mn)/r)*(H-5)]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const col=up?'#b6f25c':'#ffb3a6',id='sp'+(mid++);
  return'<svg class="fx-sp" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".5"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs><path d="'+d+' L'+W+' '+H+' L0 '+H+'Z" fill="url(#'+id+')"/><path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1].toFixed(1)+'" r="2.4" fill="'+col+'"/></svg>';
}
const sk=b=>'<svg viewBox="0 0 32 32" aria-hidden="true">'+b+'</svg>';
const FLAG={
 USD:sk('<rect width="32" height="32" fill="#fff"/>'+[0,2,4,6].map(i=>'<rect y="'+(i*32/7).toFixed(2)+'" width="32" height="'+(32/7).toFixed(2)+'" fill="#d22f3f"/>').join('')+'<rect width="15.5" height="18.3" fill="#2b3f8c"/>'+[[3,3],[7.7,3],[12.4,3],[5.3,7],[10,7],[3,11],[7.7,11],[12.4,11],[5.3,15],[10,15]].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1" fill="#fff"/>').join('')),
 EUR:sk('<rect width="32" height="32" fill="#0039a6"/>'+Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return'<circle cx="'+(16+9*Math.sin(a)).toFixed(1)+'" cy="'+(16-9*Math.cos(a)).toFixed(1)+'" r="1.6" fill="#fc0"/>'}).join('')),
 GBP:sk('<rect width="32" height="32" fill="#012169"/><path d="M0 0L32 32M32 0L0 32" stroke="#fff" stroke-width="6"/><path d="M0 0L32 32M32 0L0 32" stroke="#c8102e" stroke-width="2"/><path d="M16 0V32M0 16H32" stroke="#fff" stroke-width="10"/><path d="M16 0V32M0 16H32" stroke="#c8102e" stroke-width="6"/>'),
 CHF:sk('<rect width="32" height="32" fill="#d52b1e"/><rect x="13.5" y="7" width="5" height="18" fill="#fff"/><rect x="7" y="13.5" width="18" height="5" fill="#fff"/>'),
 XAU:sk('<defs><linearGradient id="gldg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#d49a1a"/></linearGradient></defs><rect width="32" height="32" fill="url(#gldg)"/><circle cx="16" cy="16" r="11" fill="none" stroke="#fff3c4" stroke-width="1.4"/><text x="16" y="20.6" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="12.5" font-weight="800" fill="#7a5200">Au</text>')
};
/* Altın logoları: gram (külçe) ve tam altın (Cumhuriyet altını, hilal-yıldız). */
FLAG.GRAM=sk('<defs><linearGradient id="gldg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#d49a1a"/></linearGradient></defs><rect width="32" height="32" fill="url(#gldg2)"/><path d="M6.5 23 9.8 12.5h12.4L25.5 23z" fill="#fff0b0" stroke="#9a6b08" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.8 12.5h12.4l1.3 4.2H8.5z" fill="#fffbe0" opacity=".85"/><text x="16" y="21.6" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="7.6" font-weight="800" fill="#7a5200">1 gr</text>');
FLAG.TAM=sk('<defs><linearGradient id="gldg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#d49a1a"/></linearGradient></defs><rect width="32" height="32" fill="url(#gldg3)"/><circle cx="16" cy="16" r="11.5" fill="#ffd75e" stroke="#9a6b08" stroke-width="1.4"/><circle cx="16" cy="16" r="8.6" fill="none" stroke="#fff3c4" stroke-width="1.1" stroke-dasharray="1.6 1.4"/><circle cx="14.6" cy="16" r="4.3" fill="#7a5200"/><circle cx="16.1" cy="16" r="3.5" fill="#ffd75e"/><path d="M20.4 13.4l.65 1.5 1.6.15-1.2 1.05.35 1.6-1.4-.85-1.4.85.35-1.6-1.2-1.05 1.6-.15z" fill="#7a5200"/>');
const COIN={
 BTC:sk('<rect width="32" height="32" fill="#f7931a"/><text x="16" y="22.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="800" fill="#fff">₿</text>'),
 ETH:sk('<rect width="32" height="32" fill="#627eea"/><path d="M16 5l-7 11.2 7 4.1 7-4.1z" fill="#fff"/><path d="M16 22l-7-4.1L16 28l7-10.1z" fill="#fff" fill-opacity=".75"/>')
};
const fmt0=n=>n.toLocaleString('tr-TR',{maximumFractionDigits:0});
const CUR=[['USD','Amerikan Doları'],['EUR','Euro']];
let fxCache=null;
function getFX(force){
  if(!force&&fxCache&&Date.now()-fxCache.t<4*60e3)return fxCache.p;
  const p=(async()=>{
    const out={rates:{},gold:null,src:''};
    try{
      const s0=new Date(Date.now()-35*864e5).toISOString().slice(0,10);
      const j=await getJSON('https://api.frankfurter.dev/v1/'+s0+'..?base=TRY&symbols='+CUR.map(c=>c[0]).join(','));
      const days=Object.keys(j.rates).sort();
      CUR.forEach(c=>{const ser=days.map(d=>1/j.rates[d][c[0]]);const v=ser[ser.length-1],pv=ser[ser.length-2];out.rates[c[0]]={v,chg:pv?(v/pv-1)*100:null,ser:ser.slice(-24)}});
      out.src='Avrupa Merkez Bankası · '+new Date(days[days.length-1]+'T12:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
    }catch{}
    try{
      const e=await getJSON('https://open.er-api.com/v6/latest/USD');const tl=e.rates.TRY;
      if(!Object.keys(out.rates).length){CUR.forEach(c=>{out.rates[c[0]]={v:c[0]==='USD'?tl:tl/e.rates[c[0]],chg:null,ser:null}});out.src='ExchangeRate-API · anlık'}
      if(e.rates.XAU)out.gold=(tl/e.rates.XAU)/31.1035;
    }catch{}
    if(!out.gold&&out.rates.USD){try{const g=await getJSON('https://api.gold-api.com/price/XAU',7000);if(g&&g.price>0)out.gold=out.rates.USD.v*g.price/31.1035}catch{}}
    if(!Object.keys(out.rates).length)throw new Error('fx');
    return out;
  })();
  fxCache={t:Date.now(),p};p.catch(()=>{fxCache=null});return p;
}
function mountFX(w,root){
  root.innerHTML='<div class="fx">'+hd('fx','Döviz Kurları','<button class="ibtn" type="button" id="fxr" aria-label="Yenile">'+I.refresh+'</button>')+'<div class="fx-list noscroll" id="fxl"></div><div class="foot" id="fxf">Yükleniyor…</div></div>';
  const list=$('#fxl',root),foot=$('#fxf',root);
  const row=(fl,code,name,val,chg,series)=>'<div class="fx-r"><span class="fx-fl">'+fl+'</span><div class="fx-n"><b>'+code+'</b><span>'+name+'</span></div>'+(series?spark(series,chg>=0):'<span class="fx-sp"></span>')+'<div class="fx-v"><b>₺'+fmt2(val)+'</b>'+(chg==null?'':'<span class="'+(chg>=0?'up':'dn')+'">'+(chg>=0?'▲ +':'▼ ')+chg.toFixed(2)+'%</span>')+'</div></div>';
  const load=async force=>{
    try{
      const d=await getFX(force);
      const rows=CUR.map(c=>{const r=d.rates[c[0]];return row(FLAG[c[0]],c[0],c[1],r.v,r.chg,r.ser)});
      /* Tam altın: Cumhuriyet tam altını 7,216 g ve 22 ayar (0,916) = yaklaşık 6,61 g saf altın. Piyasadaki işçilik farkı dahil değildir. */
      if(d.gold){rows.push(row(FLAG.GRAM,'GRAM ALTIN','24 ayar · ons paritesinden',d.gold,null,null));rows.push(row(FLAG.TAM,'TAM ALTIN','Cumhuriyet · yaklaşık değer',d.gold*7.216*0.916,null,null))}
      list.innerHTML=rows.join('');foot.textContent=d.src;status('fx',true);
    }catch{list.innerHTML='<div class="nw-msg">Kurlar alınamadı.</div>';foot.textContent='';status('fx',false)}
  };
  $('#fxr',root).addEventListener('click',()=>load(true));load();every(w,load,5*60e3);onBus(w,'refresh',()=>load(true));
}
