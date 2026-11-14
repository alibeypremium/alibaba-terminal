'use strict';
/* AliBaba Terminal · daily.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Günün ayeti / duası / esması ---------- */
const AYET=[
['Allah kimseye gücünün yeteceğinden fazlasını yüklemez.','Bakara, 286'],
['Şüphesiz zorlukla beraber bir kolaylık vardır.','İnşirah, 5-6'],
['Biliniz ki kalpler ancak Allah\'ı anmakla huzur bulur.','Ra\'d, 28'],
['Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphesiz Allah sabredenlerle beraberdir.','Bakara, 153'],
['Kim Allah\'a tevekkül ederse, Allah ona yeter.','Talak, 3'],
['Allah\'ın rahmetinden ümit kesmeyin.','Zümer, 53'],
['Siz beni anın, ben de sizi anayım.','Bakara, 152'],
['Sizin Allah katında en değerliniz, takvada en ileri olanınızdır.','Hucurât, 13'],
['Bir toplum kendi durumunu değiştirmedikçe Allah onların durumunu değiştirmez.','Ra\'d, 11'],
['İnsan için ancak çalıştığının karşılığı vardır.','Necm, 39'],
['Gevşemeyin, üzülmeyin. Eğer iman etmiş kimselerseniz üstün olan sizsiniz.','Âl-i İmrân, 139'],
['Rabbin seni terk etmedi, sana darılmadı da.','Duhâ, 3'],
['Kullarım sana beni sorarsa, bilsinler ki ben çok yakınım.','Bakara, 186'],
['Allah adaleti, iyiliği ve yakınlara yardım etmeyi emreder.','Nahl, 90'],
['Namaz, hayasızlıktan ve kötülükten alıkoyar.','Ankebût, 45'],
['İyilik ve takva üzerinde yardımlaşın; günah ve düşmanlık üzerinde yardımlaşmayın.','Mâide, 2'],
['Eğer şükrederseniz, elbette size (nimetimi) artırırım.','İbrahim, 7'],
['De ki: \'Rabbim, ilmimi artır.\'','Tâhâ, 114'],
['Allah bize yeter, O ne güzel vekildir.','Âl-i İmrân, 173'],
['O, her şeyi hakkıyla bilendir.','Bakara, 29'],
['Şüphesiz Rabbim kuluna çok yakındır, duaları kabul edendir.','Hûd, 61'],
['O, her şeye gücü yetendir.','Mülk, 1'],
['Nerede olursanız olun, O sizinle beraberdir.','Hadîd, 4'],
['Hüküm ancak Allah\'ındır.','Yûsuf, 40'],
['Allah, tevekkül edenleri sever.','Âl-i İmrân, 159'],
['Biz her şeyi bir ölçüye göre yarattık.','Kamer, 49'],
['Dinde zorlama yoktur.','Bakara, 256'],
['İyiliğin karşılığı, yalnız iyilik değil midir?','Rahmân, 60'],
['Öfkenizi yutun ve insanları affedin.','Âl-i İmrân, 134'],
['Yeryüzünde böbürlenerek yürüme.','İsrâ, 37'],
['Sözün en güzelini söyleyin.','İsrâ, 53'],
['Birbirinizin kusurlarını ve mahremiyetlerini araştırmayın.','Hucurât, 12'],
['Gıybet etmeyin (birbirinizin arkasından konuşmayın).','Hucurât, 12'],
['Verdiğiniz sözü yerine getirin.','İsrâ, 34'],
['Ölçüyü ve tartıyı adaletle tam yapın.','En\'âm, 152'],
['Yalan sözden kaçının.','Hac, 30'],
['Kötülüğü en güzel olan şeyle uzaklaştır.','Fussilet, 34'],
['Anne ve babaya iyi davranın.','İsrâ, 23'],
['Akrabaya, yoksula ve yolda kalmışa hakkını ver.','İsrâ, 26'],
['Saçıp savurma, israf etme.','İsrâ, 26'],
['Yetimin malına yaklaşmayın.','En\'âm, 152'],
['Zandan çokça kaçının.','Hucurât, 12'],
['İnsanları küçümseyip yüz çevirme.','Lokmân, 18'],
['Yürüyüşünde ölçülü ol, sesini de kıs.','Lokmân, 19'],
['Müminler ancak kardeştirler.','Hucurât, 10'],
['Ben cinleri ve insanları, ancak bana kulluk etsinler diye yarattım.','Zâriyât, 56'],
['Namazı dosdoğru kılın ve zekatı verin.','Bakara, 43'],
['Bana dua edin, duanıza karşılık vereyim.','Mü\'min, 60'],
['Her can ölümü tadacaktır.','Âl-i İmrân, 185'],
['Dünya hayatı ancak bir oyun ve eğlencedir.','En\'âm, 32'],
['Ey iman edenler! Allah\'tan hakkıyla korkun.','Âl-i İmrân, 102'],
['Rabbini hamd ile tesbih et.','Hicr, 98'],
['Secde et ve yaklaş.','Alak, 19'],
['Şüphesiz dönüş ancak Rabbinedir.','Alak, 8'],
['Kur\'an okunduğu zaman onu dinleyin ve susun.','A\'râf, 204'],
['Ey huzura kavuşmuş nefis! Dön Rabbine.','Fecr, 27-28'],
['Şüphesiz ahiret yurdu senin için dünyadan daha hayırlıdır.','Duhâ, 4'],
['Allah tövbe edenleri sever.','Bakara, 222'],
['Allah temizlenenleri sever.','Bakara, 222'],
['O, tövbeleri çokça kabul edendir.','Bakara, 37'],
['Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver.','Bakara, 201'],
['Rabbimiz! Bizi cehennem azabından koru.','Bakara, 201'],
['Kim zerre ağırlığınca bir hayır işlerse, onun mükafatını görür.','Zilzâl, 7'],
['Kim de zerre ağırlığınca bir şer işlerse, onun cezasını görür.','Zilzâl, 8'],
['Siz hiç düşünmez misiniz?','Bakara, 44'],
['Hâlâ akıllanmayacak mısınız?','En\'âm, 32'],
['Şüphesiz bunda düşünen bir toplum için ibretler vardır.','Ra\'d, 3'],
['Hakkı batılla karıştırmayın.','Bakara, 42'],
['Bile bile hakkı gizlemeyin.','Bakara, 42'],
['Ey iman edenler! Özünüz sözünüz bir olsun (Sadıklarla beraber olun).','Tevbe, 119'],
['İnsanlara iyiliği emredip kendinizi unutuyor musunuz?','Bakara, 44'],
['Geceyi ve gündüzü bir ibret kıldık.','İsrâ, 12'],
['Göklerin ve yerin mülkü Allah\'ındır.','Âl-i İmrân, 189'],
['De ki: Hak geldi, batıl yok oldu.','İsrâ, 81'],
['Allah dilediğini aziz kılar, dilediğini zelil kılar.','Âl-i İmrân, 26'],
['Hayır, siz dünya hayatını tercih ediyorsunuz.','A\'lâ, 16'],
['Oysa ahiret daha hayırlı ve daha kalıcıdır.','A\'lâ, 17'],
['O gün ne mal fayda verir ne de evlat.','Şuarâ, 88'],
['Ancak Allah\'a temiz bir kalple gelenler müstesna.','Şuarâ, 89'],
['Onlar, ayakta dururken, otururken Allah\'ı anarlar.','Âl-i İmrân, 191'],
['Rabbiniz çok bağışlayıcıdır.','İsrâ, 25'],
['Şüphesiz O, merhametlilerin en merhametlisidir.','Yûsuf, 92'],
['De ki: Her şey Allah\'ın katındandır.','Nisâ, 78'],
['Şüphesiz Allah, kalplerin özünü bilir.','Âl-i İmrân, 119'],
['Şüphesiz Allah, zalimleri hidayete erdirmez.','Kasas, 50'],
['Şüphesiz benim namazım, ibadetlerim, hayatım ve ölümüm alemlerin Rabbi olan Allah içindir.','En\'âm, 162'],
['Allah, müminlerin dostudur.','Âl-i İmrân, 68'],
['İyilik edin, şüphesiz Allah iyilik edenleri sever.','Bakara, 195'],
['Allah kuluna kâfi değil midir?','Zümer, 36'],
['Biz insanı en güzel biçimde yarattık.','Tîn, 4'],
['Rabbim, göğsümü genişlet.','Tâhâ, 25'],
['İşimi kolaylaştır.','Tâhâ, 26'],
['Dilimin bağını çöz.','Tâhâ, 27'],
['Ki sözümü anlasınlar.','Tâhâ, 28'],
['O, hanginizin daha güzel amel yapacağını sınamak için ölümü ve hayatı yaratandır.','Mülk, 2'],
['Bilin ki, dünya hayatı ancak bir süstür.','Hadîd, 20'],
['Şüphesiz Allah, hakkıyla görendir.','Bakara, 96'],
['Şüphesiz Allah, hakkıyla işitendir.','Bakara, 181'],
['Göklerde ve yerde olanların hepsi O\'nundur.','Bakara, 255'],
['O, yücedir, büyüktür.','Bakara, 255'],
['Hamd, alemlerin Rabbi olan Allah\'a mahsustur.','Fâtiha, 2']
];
const ESMA=`Allah|Bütün güzel isimlerin sahibi, eşsiz ve tek ilah
Er-Rahmân|Dünyada bütün yaratılmışlara merhamet eden
Er-Rahîm|Âhirette müminlere ayrıca merhamet eden
El-Melik|Mülkün ve her şeyin gerçek sahibi
El-Kuddûs|Her türlü eksiklikten uzak ve pak olan
Es-Selâm|Esenlik ve güven veren
El-Mü'min|Güven veren, vaadine sadık olan
El-Müheymin|Her şeyi gözetip koruyan
El-Azîz|Mutlak güç ve izzet sahibi
El-Cebbâr|Dilediğini yapan, kırıkları onaran
El-Mütekebbir|Büyüklükte eşi benzeri olmayan
El-Hâlık|Yoktan var eden, yaratan
El-Bâri'|Her şeyi uyumla ve eksiksiz yaratan
El-Musavvir|Her varlığa şekil ve suret veren
El-Gaffâr|Günahları çokça örten ve bağışlayan
El-Kahhâr|Her şeye galip gelen
El-Vehhâb|Karşılıksız ve çokça bağışlayan
Er-Rezzâk|Rızık veren
El-Fettâh|Hayır kapılarını açan
El-Alîm|Her şeyi bilen
El-Kâbıd|Dilediğine rızkı daraltan
El-Bâsıt|Dilediğine rızkı genişleten
El-Hâfıd|Dilediğini alçaltan
Er-Râfi'|Dilediğini yücelten
El-Mu'ız|İzzet ve şeref veren
El-Müzill|Dilediğini zillete düşüren
Es-Semî'|Her şeyi işiten
El-Basîr|Her şeyi gören
El-Hakem|Hükmeden, hakkı yerine getiren
El-Adl|Mutlak adalet sahibi
El-Latîf|Lütuf sahibi, en ince ayrıntıyı bilen
El-Habîr|Her şeyden haberdar olan
El-Halîm|Yumuşak davranan, cezada acele etmeyen
El-Azîm|Pek yüce ve büyük
El-Gafûr|Çok bağışlayan
Eş-Şekûr|Az amele çok karşılık veren
El-Aliyy|Yüceliği sınırsız olan
El-Kebîr|Pek büyük olan
El-Hafîz|Her şeyi koruyan
El-Mukît|Her canlının rızkını yaratan
El-Hasîb|Kulların hesabını gören, yeten
El-Celîl|Celâl ve azamet sahibi
El-Kerîm|Çok cömert ve ikram sahibi
Er-Rakîb|Her şeyi gözetleyen
El-Mücîb|Duaları kabul eden
El-Vâsi'|İlmi ve rahmeti geniş olan
El-Hakîm|Her işi hikmetli olan
El-Vedûd|Seven ve sevilmeye layık olan
El-Mecîd|Şanı ve şerefi yüce olan
El-Bâis|Ölüleri dirilten
Eş-Şehîd|Her şeye şahit olan
El-Hakk|Varlığı gerçek ve değişmez olan
El-Vekîl|Kendisine güvenilip dayanılan
El-Kaviyy|Güçlü olan
El-Metîn|Kudreti sarsılmaz olan
El-Veliyy|Müminlerin dostu ve yardımcısı
El-Hamîd|Her türlü övgüye layık olan
El-Muhsî|Her şeyi tek tek sayan
El-Mübdi'|Yoktan ilk defa var eden
El-Mu'îd|Yeniden diriltip geri döndüren
El-Muhyî|Hayat veren
El-Mümît|Ölümü yaratan
El-Hayy|Daima diri olan
El-Kayyûm|Her şeyi ayakta tutan
El-Vâcid|Her şeyi bulan, hiçbir şeye muhtaç olmayan
El-Mâcid|Şanı büyük, ikramı bol olan
El-Vâhid|Bir olan
Es-Samed|Hiçbir şeye muhtaç olmayan, herkesin muhtaç olduğu
El-Kâdir|Her şeye gücü yeten
El-Muktedir|Kudret sahibi
El-Mukaddim|Dilediğini öne alan
El-Muahhir|Dilediğini geriye bırakan
El-Evvel|Ezelî olan, ilk
El-Âhir|Ebedî olan, son
Ez-Zâhir|Varlığı açık olan
El-Bâtın|Zatının hakikati gizli olan
El-Vâlî|Her şeyi idare eden
El-Müteâlî|Pek yüce olan
El-Berr|İyilik ve ihsanı bol olan
Et-Tevvâb|Tövbeleri kabul eden
El-Müntakim|Zalimleri adaletle cezalandıran
El-Afüvv|Çok affeden
Er-Raûf|Çok şefkatli olan
Mâlikü'l-Mülk|Mülkün gerçek sahibi
Zü'l-Celâli ve'l-İkrâm|Celâl ve ikram sahibi
El-Muksit|Adaletle davranan
El-Câmi'|Dilediğini bir araya toplayan
El-Ganiyy|Zengin, hiçbir şeye ihtiyacı olmayan
El-Muğnî|Dilediğini zengin eden
El-Mâni'|Dilediğine engel olan
Ed-Dârr|Zarar verecek şeyleri yaratan
En-Nâfi'|Fayda veren şeyleri yaratan
En-Nûr|Nurlandıran, hidayet ışığı veren
El-Hâdî|Hidayete erdiren, yol gösteren
El-Bedî'|Eşsiz ve örneksiz yaratan
El-Bâkî|Varlığı son bulmayan
El-Vâris|Her şeyin asıl sahibi olarak baki kalan
Er-Reşîd|Doğru yolu gösteren
Es-Sabûr|Çok sabırlı olan`.split('\n').map(l=>l.split('|'));

function mountDaily(w,root){
  const TABS=[['ayet','Ayet',AYET,'Günün Ayeti'],['dua','Dua',DUA,'Günün Duası'],['esma','Esma',ESMA,'Günün Esması']];
  let tab=LS.get('pano.daily.tab','ayet');if(!TABS.find(t=>t[0]===tab))tab='ayet';
  const off={ayet:0,dua:0,esma:0};
  /* Metin kutuya sığana kadar yazı boyutunu küçült (en küçük 10px). */
  const fit=()=>{
    const q=$('.dv-q',root);
    if(q){
      let lo=10,hi=28,best=10;
      while(hi-lo>.4){const m=(lo+hi)/2;q.style.fontSize=m+'px';if(q.scrollHeight<=q.clientHeight+1){best=m;lo=m}else hi=m}
      q.style.fontSize=best+'px';return;
    }
    const es=$('.es-n',root);
    if(es){
      const h=$('h3',es),p=$('p',es);let lo=10,hi=24,best=10;
      while(hi-lo>.4){const m=(lo+hi)/2;p.style.fontSize=m+'px';h.style.fontSize=(m*2.5)+'px';if(es.scrollHeight<=es.clientHeight+1){best=m;lo=m}else hi=m}
      p.style.fontSize=best+'px';h.style.fontSize=(best*2.5)+'px';
    }
  };
  const draw=()=>{
    const T=TABS.find(t=>t[0]===tab),items=T[2],n=items.length;
    const i=((dayOfYear()+off[tab])%n+n)%n,it=items[i];
    w.dataset.tab=tab;
    const tabs='<div class="dv-tabs" role="tablist">'+TABS.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" class="'+(t[0]===tab?'on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
    const head='<div class="hd">'+logo(tab)+'<span class="ttl">'+T[3]+'</span><span class="sp"></span>'+tabs+'</div>';
    const nav='<button class="ibtn" type="button" data-d="-1" aria-label="Önceki">'+I.prev+'</button><button class="ibtn" type="button" data-d="1" aria-label="Sonraki">'+I.next+'</button>';
    const body=tab==='esma'
      ?'<div class="es-n"><h3>'+esc(it[0])+'</h3><p>'+esc(it[1])+'</p></div><div class="dv-f"><span class="es-c">'+(i+1)+' / '+n+'</span>'+nav+'</div>'
      :tab==='dua'
      ?'<div class="dv-q noscroll"><span><em class="dv-why">'+esc(it[0])+'</em>“'+esc(it[1])+'”</span></div><div class="dv-f"><span class="dv-ref">'+esc(it[2])+'</span>'+nav+'</div>'
      :'<div class="dv-q noscroll"><span>“'+esc(it[0])+'”</span></div><div class="dv-f"><span class="dv-ref">'+esc(it[1])+'</span>'+nav+'</div>';
    root.innerHTML='<div class="dv">'+head+body+'</div>';
    fit();
  };
  /* Her 60 saniyede ayet → dua → esma → ayet. Elle seçimde süre yeniden başlar. */
  let timer=0;const gen=w._gen;
  const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{
    if(w._gen!==gen)return;   /* widget kaldırıldı */
    off.ayet=off.dua=off.esma=0;
    tab=TABS[(TABS.findIndex(t=>t[0]===tab)+1)%TABS.length][0];
    draw();arm();
  },60e3)};
  root.addEventListener('click',e=>{
    const t=e.target.closest('[data-t]');if(t){tab=t.dataset.t;LS.set('pano.daily.tab',tab);draw();arm();return}
    const b=e.target.closest('[data-d]');if(b){off[tab]+=+b.dataset.d;draw();arm()}
  });
  draw();arm();
  new ResizeObserver(()=>requestAnimationFrame(fit)).observe(root);
  const redraw=()=>{if(!off.ayet&&!off.dua&&!off.esma)draw()};
  every(w,redraw,3600e3);onBus(w,'refresh',redraw);
}
