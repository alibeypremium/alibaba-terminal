'use strict';
/* AliBaba Terminal · daily.js — klasik betik (modül değil): tüm js/*.js dosyaları index.html'deki sırayla yüklenir ve aynı genel kapsamı paylaşır. */
/* ---------- Günün ayeti / hadisi / esması ---------- */
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
/* Hadisler: Diyanet İşleri Başkanlığı 40 Hadis ezber listesi */
const HADIS=[
['Güzel söz sadakadır.','Buhârî'],
['Deveyi bağla, sonra tevekkül et.','Tirmizî'],
['Hayâ imandandır.','Buhârî, Müslim, Tirmizî'],
['Sizin en hayırlınız, ahlakı en güzel olanınızdır.','Buhârî'],
['Dünya müminin zindanı, kâfirin ise cennetidir.','Müslim'],
['Kendiniz için sevdiğinizi başkaları için de sevmedikçe iman etmiş olmazsınız.','Buhârî, Müslim'],
['Mümin müminin aynasıdır.','Ebû Dâvûd, Tirmizî'],
['İnsanlara teşekkür etmeyen, Allah\'a şükretmez.','Ebû Dâvûd, Tirmizî'],
['İnsanlara merhamet etmeyene, Allah merhamet etmez.','Tirmizî'],
['Dostunuzu bir gün düşmanınız olabilecek şekilde seviniz. Düşmanınıza da bir gün dostunuz olabilecek şekilde buğz ediniz.','Tirmizî'],
['Kim bir müminin dünya sıkıntılarından bir sıkıntısını giderirse, Allah da onun Kıyamet sıkıntılarından bir sıkıntısını giderir.','Müslim'],
['Allah\'a inandım de, sonra dosdoğru ol.','Müslim'],
['Rahmetim gazabımı geçti. (Allah buyuruyor)','Buhârî'],
['İnsanlar Allah\'ın kullarıdır. O\'na en sevimli olanlar, O\'nun kullarına en faydalı olanlardır.','Müslim'],
['Muhakkak ki, ameller niyetlere göredir ve muhakkak herkesin niyeti ne ise eline o geçer.','Buhârî'],
['Cemaatle kılınan namaz, tek başına kılınan namazdan yirmi yedi derece daha üstündür.','Buhârî'],
['Kardeşine gülümsemen sadakadır.','Tirmizî'],
['Her duyduğunu söylemesi kişiye yalan olarak yeter.','Müslim'],
['Müslüman müslümanın kardeşidir. Ona zulmetmez, onu yardımsız kendi haline bırakmaz.','Müslim'],
['Allah\'ın yanında amellerin en sevimlisi, az da olsa devamlı olanıdır.','Buhârî'],
['Boş şeyleri terk etmesi, kişinin Müslümanlığının güzelliğindendir.','Tirmizî'],
['Kıskançlık, ateşin odunu yediği gibi iyilikleri yer.','Ebû Dâvûd'],
['İnsanlara derecelerine göre muamele ediniz.','Müslim'],
['Kolaylaştırın güçleştirmeyin, müjdeleyin nefret ettirmeyin.','Buhârî'],
['Şüphesiz insanların en kötüsü, şunlara bir yüzle bunlara bir yüzle gelen ikiyüzlü kimsedir.','Müslim'],
['Kim bir hayra vesile olursa, o hayrı işleyenin sevabı kadar sevap alır.','Müslim'],
['Şüphesiz ki Allah sizin sûretlerinize ve mallarınıza bakmaz, fakat sizin kalplerinize ve amellerinize bakar.','Müslim'],
['Mü\'min bir (yılanın) deliğinden iki defa sokulmaz.','Buhârî, Müslim, Ebû Dâvûd'],
['Allah şifasını yaratmadığı hiçbir hastalık vermemiştir.','İbni Mâce'],
['Sizden biriniz bir kötülük görürse, onu hemen eli ile değiştirsin. Eğer buna gücü yetmiyorsa onu dili ile değiştirsin. Ona da gücü yetmiyorsa kalbi ile değiştirsin. Bu ise, imanın en zayıf derecesidir.','Müslim'],
['Nikâhın en hayırlısı, en kolay ve külfetsiz olanıdır.','Ebû Dâvûd'],
['Amellerin en faziletlisi, Allah için sevmek ve Allah için buğz etmektir.','Ebû Dâvûd, İbni Mâce'],
['Münafığın alâmeti üçtür: Konuştuğu zaman yalan söyler, vaat ettiği zaman sözünde durmaz, kendisine bir şey emanet edildiği zaman hıyanetlik eder.','Müslim'],
['Günahına tövbe eden, o günahı işlememiş gibidir.','İbni Mâce'],
['Mümin mümine karşı, parçaları birbirini sağlamca tutan bina gibidir.','Buhârî'],
['Kişi arkadaşının dini üzeredir. O halde sizden her biriniz kiminle arkadaşlık ettiğine iyi baksın.','Tirmizî'],
['Ücretli çalıştırılan kimseye teri kurumadan ücretini veriniz.','Taberânî, Hâkim, İbni Mâce'],
['Nasıl yaparsan, sana da öyle yapılır.','Buhârî'],
['Müminin ferasetinden sakınınız. Çünkü o Allah\'ın Nûru ile bakar.','Tirmizî'],
['(Sohbet edenler) üç kişi olursa, ikisi üçüncünün yanında gizli konuşmasın.','Buhârî, Müslim'],
['Din nasihattir (samimiyettir).','Müslim'],
['Temizlik imanın yarısıdır.','Müslim'],
['Namaz dinin direğidir.','Tirmizî'],
['Namaz nurdur.','Müslim'],
['Dua ibadetin özüdür.','Tirmizî'],
['Oruç bir kalkandır.','Buhârî'],
['Sadaka, suyun ateşi söndürdüğü gibi günahı söndürür.','Tirmizî'],
['Kulun Rabbine en yakın olduğu an secde anıdır.','Müslim'],
['İslâm, güzel ahlâktır.','Kenzü\'l-Ummâl'],
['Sizin en hayırlınız, Kur\'an\'ı öğrenen ve öğretendir.','Buhârî'],
['Bizi aldatan bizden değildir.','Müslim'],
['İman etmedikçe cennete giremezsiniz.','Müslim'],
['Birbirinizi sevmedikçe tam iman etmiş olmazsınız.','Müslim'],
['Komşusu açken tok yatan bizden değildir.','Hâkim'],
['Veren el, alan elden üstündür.','Buhârî'],
['Küçüklerimize merhamet etmeyen, büyüklerimize saygı göstermeyen bizden değildir.','Tirmizî'],
['Cennet, annelerin ayakları altındadır.','Nesâî'],
['Birbirinize hediye verin ki birbirinizi sevesiniz.','Muvatta'],
['Doğruluktan ayrılmayınız; çünkü doğruluk iyiliğe götürür.','Buhârî'],
['Yalandan kaçının; çünkü yalan kötülüğe götürür.','Müslim'],
['Müslüman, dilinden ve elinden Müslümanların güvende olduğu kimsedir.','Buhârî'],
['Selamı aranızda yayın.','Müslim'],
['İki kişinin arasını düzeltmek sadakadır.','Buhârî'],
['Dul ve yetimlerin işine koşan, Allah yolunda cihad eden gibidir.','Buhârî'],
['Zulüm, kıyamet gününde karanlıklardır.','Buhârî'],
['Yumuşak huyluluktan mahrum olan, hayırdan mahrum olur.','Müslim'],
['Zandan kaçının; çünkü zan, sözlerin en yalanıdır.','Buhârî'],
['Kardeşinin uğradığı felakete sevinme.','Tirmizî'],
['Ben ancak güzel ahlakı tamamlamak için gönderildim.','Muvatta'],
['Kıyamet günü mizanı en çok dolduracak şey güzel ahlaktır.','Tirmizî'],
['Hayâ ancak hayır getirir.','Buhârî'],
['Öfkelendiğin zaman sus.','Ahmed b. Hanbel'],
['Gerçek pehlivan, öfkelendiğinde nefsine hakim olan kimsedir.','Buhârî'],
['Mümin, ayıplayan ve lanet eden değildir.','Tirmizî'],
['Her dinin bir ahlakı vardır; İslam\'ın ahlakı da hayâdır.','İbni Mâce'],
['Allah, her işte nezaketle davranılmasını sever.','Buhârî'],
['İki nimet vardır ki insanların çoğu bunda aldanmıştır: Sağlık ve boş vakit.','Buhârî'],
['Nerede olursan ol Allah\'tan kork.','Tirmizî'],
['Kötülüğün peşinden hemen bir iyilik yap ki onu yok etsin.','Tirmizî'],
['İnsanlara güzel ahlakla muamele et.','Tirmizî'],
['İçinizde en sevdiğim kimse, ahlakı en güzel olanınızdır.','Buhârî'],
['Şüphesiz Allah güzeldir, güzelliği sever.','Müslim'],
['Cimrilikten sakının.','Müslim'],
['Söz taşıyan cennete giremez.','Buhârî'],
['İlim talep etmek her Müslümana farzdır.','İbni Mâce'],
['Dünyada tıpkı bir garip veya bir yolcu gibi ol.','Buhârî'],
['Ağızların tadını kaçıran ölümü çokça anın.','Tirmizî'],
['Akıllı kişi, nefsini hesaba çeken ve ölümden sonrası için çalışandır.','Tirmizî'],
['Nasıl yaşarsanız öyle ölürsünüz.','Müslim'],
['Nasıl ölürseniz öyle dirilirsiniz.','Müslim'],
['Şüphesiz her ümmetin bir fitnesi vardır; benim ümmetimin fitnesi ise maldır.','Tirmizî'],
['Kul, malını nereden kazanıp nereye harcadığından sorulmadıkça kıyamette yerinden kımıldayamaz.','Tirmizî'],
['Yalnız şu iki kişiye gıpta edilir: Biri Allah\'ın kendisine verdiği malı hak yolunda harcayan, diğeri ise Allah\'ın kendisine verdiği ilimle amel edip onu başkalarına öğreten.','Buhârî'],
['İnsan ölünce üç şey hariç ameli kesilir: Sadaka-i cariye, faydalanılan ilim ve ona dua eden hayırlı evlat.','Müslim'],
['Cennet cömertlerin yurdudur.','Tirmizî'],
['Kanaat tükenmez bir hazinedir.','Taberânî'],
['Haya bütünüyle hayırdır.','Müslim'],
['Kul din kardeşine yardım ettiği sürece Allah da kula yardım eder.','Müslim'],
['Sana şüphe veren şeyi bırak, şüphe vermeyene bak.','Tirmizî'],
['Kim bir kavme benzemeye çalışırsa, o da onlardandır.','Ebû Dâvûd'],
['İyilik, gönlü huzura kavuşturan şeydir.','Ahmed b. Hanbel'],
['Günah ise kalbi tırmalayan ve insanlardan gizlemek istediğin şeydir.','Müslim'],
['Şaka da olsa yalan söylemeyin.','Ebû Dâvûd'],
['Her kul öldüğü hal üzere diriltilir.','Müslim'],
['Su, buzu erittiği gibi güzel ahlak da günahları eritir.','Taberânî'],
['Allah bir kulu sevdiğinde onu dünyadan korur.','Tirmizî'],
['Yemekten önce ve sonra el yıkamak berekettir.','Ebû Dâvûd'],
['Yatarken sağ tarafınıza yatın.','Buhârî'],
['Yemeği sağ elinizle ve önünüzden yiyin.','Buhârî'],
['Bardağın içine üflemeyin.','Ebû Dâvûd'],
['Aksıran kişi \'Elhamdülillah\' desin.','Buhârî'],
['Onu işiten kişi de \'Yerhamükâllah\' desin.','Buhârî']
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
  const TABS=[['ayet','Ayet',AYET,'Günün Ayeti'],['hadis','Hadis',HADIS,'Günün Hadisi'],['esma','Esma',ESMA,'Günün Esması']];
  let tab=LS.get('pano.daily.tab','ayet');if(!TABS.find(t=>t[0]===tab))tab='ayet';
  const off={ayet:0,hadis:0,esma:0};
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
      :'<div class="dv-q noscroll"><span>“'+esc(it[0])+'”</span></div><div class="dv-f"><span class="dv-ref">'+esc(it[1])+'</span>'+nav+'</div>';
    root.innerHTML='<div class="dv">'+head+body+'</div>';
    fit();
  };
  /* Her 60 saniyede ayet → hadis → esma → ayet. Elle seçimde süre yeniden başlar. */
  let timer=0;const gen=w._gen;
  const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{
    if(w._gen!==gen)return;   /* widget kaldırıldı */
    off.ayet=off.hadis=off.esma=0;
    tab=TABS[(TABS.findIndex(t=>t[0]===tab)+1)%TABS.length][0];
    draw();arm();
  },60e3)};
  root.addEventListener('click',e=>{
    const t=e.target.closest('[data-t]');if(t){tab=t.dataset.t;LS.set('pano.daily.tab',tab);draw();arm();return}
    const b=e.target.closest('[data-d]');if(b){off[tab]+=+b.dataset.d;draw();arm()}
  });
  draw();arm();
  new ResizeObserver(()=>requestAnimationFrame(fit)).observe(root);
  const redraw=()=>{if(!off.ayet&&!off.hadis&&!off.esma)draw()};
  every(w,redraw,3600e3);onBus(w,'refresh',redraw);
}
