'use strict';
/* AliBaba Terminal · net.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Ağ yardımcıları ---------- */
async function getJSON(url,ms=9000,opt){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{signal:c.signal,...opt});if(!r.ok)throw new Error(r.status);return await r.json()}finally{clearTimeout(t)}
}
async function getText(url,ms=9000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error(r.status);return await r.text()}finally{clearTimeout(t)}
}
const PROXIES=[u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),u=>'https://corsproxy.io/?'+encodeURIComponent(u),u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u),u=>'https://thingproxy.freeboard.io/fetch/'+u,u=>'https://api.cors.lol/?url='+encodeURIComponent(u),u=>'https://yacdn.org/proxy/'+u];
async function viaProxy(url,check){
  const tries=PROXIES.map(p=>getText(p(url),11000).then(t=>{if(!t||t.length<200)throw new Error('kısa');if(check)return check(t);return t}));
  return Promise.any(tries);
}
/* Besleme özeti: etiketler atılır; okuyucu açılır açılmaz gösterilir, tam metin arkadan gelir. */
function rssSum(html){
  const t=document.createElement('textarea');
  t.innerHTML=String(html||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  const s=t.value.replace(/\s+/g,' ').trim();
  return s.length>=40?s.slice(0,360):'';
}
const feedImg=u=>{u=safeUrl(String(u||'').replace(/&amp;/g,'&'));return u&&!/logo|icon|sprite|1x1|\.svg|\.gif/i.test(u)?u:''};
const rdAttr=x=>(feedImg(x.img)?' data-img="'+esc(feedImg(x.img))+'"':'')+(x.sum?' data-sum="'+esc(x.sum)+'"':'');
function parseRSS(xml){
  const d=new DOMParser().parseFromString(xml,'text/xml');
  return [...d.querySelectorAll('item,entry')].slice(0,30).map(i=>{
    const g=t=>i.querySelector(t)?.textContent?.trim()||'';
    const link=g('link')||i.querySelector('link')?.getAttribute('href')||'';
    const raw=(i.getElementsByTagName('content:encoded')[0]?.textContent||'')+' '+(g('description')||g('summary')||g('content'));
    const at=(t,a)=>i.getElementsByTagName(t)[0]?.getAttribute(a)||'';
    const enc=i.querySelector('enclosure[type^="image"]')?.getAttribute('url')||'';
    const im=at('media:thumbnail','url')||at('media:content','url')||enc||(raw.match(/<img[^>]+src=["']([^"']+)/i)||[])[1]||'';
    return{title:g('title'),link,date:g('pubDate')||g('published')||g('updated'),source:g('source'),sum:rssSum(raw),img:im};
  }).filter(x=>x.title&&safeUrl(x.link));
}
function ago(s){
  const t=Date.parse(s);if(!t)return'';
  const m=Math.round((Date.now()-t)/6e4);
  if(m<1)return'şimdi';if(m<60)return m+' dk önce';
  const h=Math.round(m/60);if(h<24)return h+' sa önce';
  const d=Math.round(h/24);return d===1?'dün':d+' gün önce';
}
