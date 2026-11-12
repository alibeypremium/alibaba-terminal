'use strict';
/* AliBaba Terminal · bg.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Three.js arka plan ---------- */
(function bg(){
  const T=window.THREE;if(!T){window.__bgTheme=d=>{document.body.style.background=d?'radial-gradient(circle at 20% 10%,#3b2a8f,#070817 60%)':'radial-gradient(circle at 20% 10%,#cdc3ff,#e8ecfa 60%)'};window.__bgTheme(document.documentElement.dataset.theme!=='light');return}
  const canvas=$('#bg');
  let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true})}catch{return}
  renderer.setPixelRatio(matchMedia('(pointer:coarse)').matches?1:Math.min(devicePixelRatio||1,1.5));
  renderer.autoClear=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bgScene=new T.Scene(),bgCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const C=(h)=>new T.Color(h);
  const pal={dark:{c0:C('#070817'),c1:C('#3b2a8f'),c2:C('#0b5fa8'),c3:C('#a82a63')},light:{c0:C('#eaeefb'),c1:C('#bcaaff'),c2:C('#9ad4ff'),c3:C('#ffb6d0')}};
  const U={t:{value:0},res:{value:new T.Vector2(1,1)},m:{value:new T.Vector2(0,0)},c0:{value:pal.dark.c0.clone()},c1:{value:pal.dark.c1.clone()},c2:{value:pal.dark.c2.clone()},c3:{value:pal.dark.c3.clone()}};
  const mat=new T.ShaderMaterial({uniforms:U,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'precision highp float;varying vec2 vUv;uniform float t;uniform vec2 res;uniform vec2 m;uniform vec3 c0,c1,c2,c3;'+
    'float bl(vec2 p,vec2 c,float r){return smoothstep(r,0.,length(p-c));}'+
    'void main(){float a=res.x/res.y;vec2 p=vec2(vUv.x*a,vUv.y);float s=t*.09;vec3 col=c0;'+
    'col=mix(col,c1,bl(p,vec2((.28+.18*sin(s*1.3+m.x))*a,.72+.14*cos(s)),.8));'+
    'col=mix(col,c2,bl(p,vec2((.78+.16*cos(s*.9))*a,.34+.18*sin(s*1.1+m.y)),.85));'+
    'col=mix(col,c3,bl(p,vec2((.5+.25*sin(s*.7+2.))*a,.08+.12*cos(s*1.4)),.7));'+
    'col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.018;gl_FragColor=vec4(col,1.);}'});
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;bgScene.add(quad);

  const scene=new T.Scene(),cam=new T.PerspectiveCamera(45,1,.1,100);cam.position.set(0,0,10);cam.lookAt(0,0,0);
  scene.add(new T.AmbientLight(0xffffff,.65));
  const key=new T.DirectionalLight(0xffffff,1.1);key.position.set(3,5,6);scene.add(key);
  const p1=new T.PointLight(0xff5fa2,1.4,40);p1.position.set(-6,2,4);scene.add(p1);
  const p2=new T.PointLight(0x5fd0ff,1.4,40);p2.position.set(6,-3,4);scene.add(p2);
  const geos=[new T.IcosahedronGeometry(1,0),new T.TorusGeometry(.8,.32,20,48),new T.OctahedronGeometry(1,0),new T.SphereGeometry(.9,32,24),new T.TorusKnotGeometry(.62,.2,96,12),new T.DodecahedronGeometry(.95,0)];
  const cols3=[0x8f7bff,0x4cc9f0,0xff7ab8,0xffd36e,0x6ee7b7,0xa78bfa];
  const N=14,STEP=3.6,objs=[];
  for(let i=0;i<N;i++){
    const m=new T.Mesh(geos[i%geos.length],new T.MeshStandardMaterial({color:cols3[i%cols3.length],metalness:.2,roughness:.22,transparent:true,opacity:.78}));
    m.userData={side:i%2?1:-1,ox:Math.random(),sp:.15+Math.random()*.3,ph:Math.random()*6.28};
    m.position.y=0;m.position.z=-1-Math.random()*5;m.scale.setScalar(.9+Math.random()*.9);
    scene.add(m);objs.push(m);
  }
  let W=1,H=1,aspect=1;
  const size=()=>{W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);aspect=W/H;cam.aspect=aspect;cam.updateProjectionMatrix();U.res.value.set(W,H);
    const vw=2*10*Math.tan(22.5*Math.PI/180)*aspect;
    const vh=2*10*Math.tan(22.5*Math.PI/180);
    objs.forEach((o,i)=>{o.position.x=o.userData.side*(vw*.5*(.45+o.userData.ox*.6));o.userData.by=(((i*.618)%1)-.5)*vh*.95});};
  size();addEventListener('resize',size);
  const target={...pal.dark};const cur={c0:U.c0.value,c1:U.c1.value,c2:U.c2.value,c3:U.c3.value};
  window.__bgTheme=d=>{const p=d?pal.dark:pal.light;target.c0=p.c0;target.c1=p.c1;target.c2=p.c2;target.c3=p.c3;
    objs.forEach(o=>{o.material.opacity=d?.78:.6})};
  const p0=document.documentElement.dataset.theme==='light'?pal.light:pal.dark;
  Object.keys(cur).forEach(k=>{cur[k].copy(p0[k]);target[k]=p0[k]});
  /* Döngü: ekranın yenileme hızında (60 kare/sn) çalışır. Sekme gizliyken, düzenleme/sürükleme sırasında ve "Sade" modda durur.
     Tema değişimi ve yeniden boyutlandırma için kısa süreli "boost" kareleri çizilir. */
  const MIN=matchMedia('(pointer:coarse)').matches?1000/30:0;   /* dokunmatikte 30 kare/sn (pil ve ısı); masaüstünde ekran hızı */
  let last=performance.now(),t=0,raf=0,boost=3;
  const isLite=()=>document.documentElement.dataset.lite==='1';
  const busy=()=>document.hidden||document.body.classList.contains('editing')||document.body.classList.contains('is-dragging');
  function step(dt){
    t+=dt*(reduce?.15:1);U.t.value=t;
    Object.keys(cur).forEach(k=>cur[k].lerp(target[k],.1));
    objs.forEach(o=>{const u=o.userData;o.rotation.x+=dt*u.sp;o.rotation.y+=dt*u.sp*1.3;o.position.y=u.by+Math.sin(t*.5+u.ph)*(reduce?.05:.3)});
    renderer.clear();renderer.render(bgScene,bgCam);renderer.clearDepth();renderer.render(scene,cam);
  }
  function loop(now){
    raf=0;
    if(document.hidden)return;
    if(boost>0)boost--;
    else if(isLite()||busy()){last=now;return}
    if(now-last>=MIN){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt)}
    raf=requestAnimationFrame(loop);
  }
  function wake(n){if(n&&n>boost)boost=n;if(!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(loop)}}
  document.addEventListener('visibilitychange',()=>wake(2));
  new MutationObserver(()=>wake(2)).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('panolite',()=>wake(40));
  const prevTheme=window.__bgTheme;
  window.__bgTheme=d=>{prevTheme(d);wake(45)};
  addEventListener('resize',()=>wake(3));
  wake(3);
})();
