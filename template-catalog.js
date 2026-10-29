'use strict';
// Public contractor price lists checked on 2026-10-29. These are reference
// starting prices, not the company's own approved price list.
const LANDSCAPING_SOURCES = Object.freeze({
  garden: {name:'Kerti Éden',url:'https://kertieden.hu/cimkek/kertepites-arak',basis:'bruttó',year:2026,checked:'2026-10-29'},
  paving: {name:'Niko Kertép',url:'https://www.gepi-terkovezes.hu/araink/',basis:'nettó',year:2026,checked:'2026-10-29'},
  materials: {name:'Greenframe',url:'https://greenframe.hu/arak',basis:'nettó',year:2026,checked:'2026-10-29'},
  design: {name:'Árgus Kert',url:'https://www.argus-kft.hu/tajekoztato-arak',basis:'nettó',year:2026,checked:'2026-10-29'},
  excavation: {name:'Árgus Kert',url:'https://www.argus-kft.hu/tajekoztato-arak',basis:'bruttó',year:2026,checked:'2026-10-29'}
});
function referenceTemplate(id,name,unit,description,scope,source,rows,exclusions) {
  const lines=rows.map(([name,rate])=>({name,qty:1,unit,price:source.basis==='bruttó'?Math.round(rate/1.27*100)/100:rate,...(source.basis==='bruttó'?{grossPrice:rate}:{})}));
  return {id,name,unit,description,icon:'❧',items:lines.map(line=>line.name),lines,
    pricing:{...source,scope,starting:true,exclusions,sourceRates:rows.map(([,rate])=>rate)}};
}
const LANDSCAPING_TEMPLATES_2026 = [
  referenceTemplate('lawn-turf-2026','Gyepszőnyegezés vakondhálóval','m²','Gyepszőnyeg, vakondvédelem és indító tápanyag.','Anyag és kivitelezés',LANDSCAPING_SOURCES.garden,
    [['Gyepszőnyegezés vakondhálóval – komplett kivitelezés',4500]],'A régi gyep felszedése, talajcsere és földpótlás külön számolandó.'),
  referenceTemplate('lawn-seed-2026','Fűmagos gyeptelepítés vakondhálóval','m²','Talaj-előkészítéstől a vetésig és hengerezésig.','Anyag és kivitelezés',LANDSCAPING_SOURCES.garden,
    [['Fűmagos gyeptelepítés vakondhálóval – komplett kivitelezés',1600]],'A régi gyep bontása és jelentős földpótlás nincs az árban.'),
  referenceTemplate('irrigation-2026','Automata öntözőrendszer kiépítése','m²','Csőhálózat, öntözőelemek és alapvezérlés.','Anyag és kivitelezés',LANDSCAPING_SOURCES.garden,
    [['Automata öntözőrendszer – komplett alapkiépítés',2500]],'Tájékoztató területi becslés; zónaterv és vízhozammérés szükséges. Wifi és kútgépészet külön.'),
  referenceTemplate('hedge-2026','Sövény telepítése cserjékből','db','Cserjék ültetése a tervezett növénydarabszám alapján.','Csak munkadíj',LANDSCAPING_SOURCES.garden,
    [['Cserjék ültetésének munkadíja',1500]],'Növényanyag, talajjavító és mulcs külön tétel. A cserjeméretet egyeztetni kell.'),
  referenceTemplate('perennials-2026','Évelőágyás beültetése','db','Lágyszárú növények telepítése darabszám alapján.','Csak munkadíj',LANDSCAPING_SOURCES.garden,
    [['Évelő növények ültetésének munkadíja',500]],'A növények és az ágyás-előkészítés anyagköltsége külön tétel.'),
  referenceTemplate('lawn-replacement-2026','Régi gyep cseréje gyepszőnyegre','m²','Régi gyep felszedése és új gyepfelület kialakítása.','Vegyes: bontási munkadíj és komplett gyeptelepítés',LANDSCAPING_SOURCES.garden,
    [['Régi gyep eltávolításának munkadíja',750],['Új gyepszőnyeg vakondhálóval – komplett kivitelezés',4500]],'Hulladékelszállítás, jelentős talajcsere és földpótlás külön.'),
  referenceTemplate('paving-2026','Kézi térburkolat építése','m²','Földmunka, tömörített alap és térkőfektetés.','Csak munkadíj',LANDSCAPING_SOURCES.paving,
    [['Térburkolat teljes munkadíja, alapozással',15800]],'Térkő, alapanyagok, szegély és szállítás külön. A rétegrend helyszíni tervezést igényel.'),
  referenceTemplate('edging-2026','Kerti szegély építése','fm','Szegélykövek elhelyezése betonba.','Csak munkadíj',LANDSCAPING_SOURCES.paving,
    [['Betonba ágyazott szegélykő munkadíja',2700]],'Szegélykő, beton és szállítás külön tétel.'),
  referenceTemplate('channel-2026','Vízelvezető folyóka telepítése','fm','Folyóka beépítése beton alátámasztással.','Csak munkadíj',LANDSCAPING_SOURCES.paving,
    [['Vízelvezető folyóka beépítésének munkadíja',4500]],'Folyóka, rács és beton külön; a vízelvezetés végpontját meg kell tervezni.'),
  referenceTemplate('rainwater-pipe-2026','Csapadékvíz-vezeték fektetése','fm','Csőárok, vezetékfektetés és tömörített visszatöltés.','Csak munkadíj',LANDSCAPING_SOURCES.paving,
    [['Csapadékvízcső fektetésének munkadíja, földmunkával',5000]],'Cső, idom és szállítás külön; a lejtést és csatlakozást fel kell mérni.')
];
const ADDITIONAL_TEMPLATES_2026 = [
  referenceTemplate('machine-grading-2026','Gépi tereprendezés','óra','Kis földmunkagép üzemideje, külön kiszállási idővel.','Gépi munkadíj',LANDSCAPING_SOURCES.garden,[['Gépi tereprendezés üzemideje',15500]],'Legalább 4 munkaóra és 2 óra kiszállási idő fizetendő. Földanyag és elszállítás külön.'),
  referenceTemplate('planting-hole-2026','Ültetőgödör kézi kiásása','m³','Kézi gödörásás közepesen kötött talajban.','Szolgáltatási díj',LANDSCAPING_SOURCES.excavation,[['Ültetőgödör kézi földmunkája',12000]],'Növény, talajjavító, kitermelt föld elszállítása külön.'),
  referenceTemplate('weed-preparation-2026','Gyommentesítés telepítés előtt','m²','Vegyszeres előkészítés új növénytelepítéshez.','Munkadíj és gyomirtó',LANDSCAPING_SOURCES.garden,[['Telepítés előtti vegyszeres gyommentesítés',100]],'A kezelést és az ültetés időpontját a választott szer előírásaihoz kell igazítani.'),
  referenceTemplate('irrigation-trench-2026','Öntözési nyomvonal láncos árokásása','fm','Gépi nyomvonalnyitás öntözővezetékhez.','Gépi munkadíj',LANDSCAPING_SOURCES.garden,[['Láncos árokásás munkadíja',650]],'Legalább bruttó 20 000 Ft munkadíj; a kiszállás külön árazandó. Csőfektetés nincs benne.'),
  referenceTemplate('mole-mesh-2026','Vakondháló külön fektetése','m²','Háló elhelyezése előkészített gyepfelület alá.','Csak munkadíj',LANDSCAPING_SOURCES.garden,[['Vakondháló fektetésének munkadíja',180]],'Hálóanyag, takaróföld és gyeptelepítés külön.'),
  referenceTemplate('plastic-border-2026','Műanyag gyepszegély elhelyezése','fm','Rugalmas szegély beépítése ágyás vagy gyep mellé.','Csak munkadíj',LANDSCAPING_SOURCES.garden,[['Műanyag szegély elhelyezésének munkadíja',1000]],'Szegélyanyag és rögzítőelemek külön.'),
  referenceTemplate('tree-planting-2026','Díszfa telepítése','db','Faültetés méret és megközelíthetőség szerinti egyeztetéssel.','Csak munkadíj',LANDSCAPING_SOURCES.garden,[['Díszfa ültetésének munkadíja',19000]],'Faanyag, karózás és szállítás külön; nagy fánál egyedi felmérés kell.'),
  referenceTemplate('green-waste-2026','Telepítés előtti zöldhulladék elszállítása','m³','Előkészítéskor keletkezett növényi hulladék kezelése.','Rakodás, elszállítás és leadás',LANDSCAPING_SOURCES.garden,[['Zöldhulladék elszállítása és leadása',6500]],'Csak növényi hulladék; sitt és veszélyes hulladék nincs az árban.'),
  referenceTemplate('strip-footing-trench-2026','Kerti sávalap árkának kiásása','fm','Szintezett ároknyitás kerti építmény alapjához.','Csak munkadíj',LANDSCAPING_SOURCES.paving,[['Sávalapárok ásásának munkadíja',2600]],'Beton, vasalás, zsaluzás és szerkezeti tervezés külön.'),
  referenceTemplate('compost-soil-2026','Komposztos talajjavítás anyaga','m³','Ömlesztett komposzt beszerzése talajjavításhoz.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Ömlesztett komposzt talajjavításhoz',25000]],'Szállítás és bedolgozás külön. A szükséges mennyiséget a talaj alapján add meg.'),
  referenceTemplate('bark-mulch-2026','Ágyásmulcsozás kéreganyaga','m³','Ömlesztett kéregmulcs az ágyások takarásához.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Ömlesztett kéregmulcs',55000]],'Fuvar és terítés külön; térfogat = takart terület × rétegvastagság méterben.'),
  referenceTemplate('raised-bed-soil-2026','Magaságyás feltöltésének ültetőközege','zsák','Virágföld beszerzése 50 literes kiszerelésben.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Virágföld, 50 liter/zsák',5000]],'Szállítás és feltöltési munkadíj külön. Egy zsák 0,05 m³.'),
  referenceTemplate('plant-organic-feed-2026','Növénytelepítés szerves tápanyaga','kg','Granulált tápanyag ültetendő dísznövényekhez.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Granulált szerves trágya növénytelepítéshez',1500]],'Kijuttatás külön; az adagot a termék előírásából számítsd.'),
  referenceTemplate('lawn-start-feed-2026','Gyeptelepítés tápanyagellátása','kg','Granulált gyeptrágya beszerzési tétele.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Granulált gyeptrágya',2000]],'Kijuttatás külön; az alkalmazott termék dózisa alapján számolj.'),
  referenceTemplate('peat-soil-2026','Tőzeges talajkeverék alapanyaga','zsák','Tőzeg beszerzése 70 literes kiszerelésben.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Tőzeg, 70 liter/zsák',6000]],'Keverés és szállítás külön; a növény talajigényéhez válassz közeget.'),
  referenceTemplate('manure-soil-2026','Ültetőföld szervestrágyás javítóanyaga','zsák','Marhatrágya beszerzése 40 literes kiszerelésben.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Marhatrágya, 40 liter/zsák',5000]],'Szállítás és bedolgozás külön. Egy zsák 0,04 m³.'),
  referenceTemplate('grass-seed-material-2026','Új gyep fűmaganyaga','kg','Fűmag beszerzése önálló anyagtételként.','Csak anyag',LANDSCAPING_SOURCES.materials,[['Fűmag gyeptelepítéshez',4400]],'A vetés munkadíja külön; magkeverék és vetési dózis egyeztetendő.'),
  referenceTemplate('garden-consultation-2026','Kertépítési szaktanácsadás','óra','Külön szakértői konzultáció tervezés előtt.','Szakértői díj',LANDSCAPING_SOURCES.design,[['Kertépítési szakértői konzultáció',26000]],'Kiszállás és tervdokumentáció külön. Nem az általános kertépítő napidíja.'),
  referenceTemplate('designer-supervision-2026','Tervezői művezetés','óra','A terv szerinti megvalósítás szakmai támogatása.','Tervezői díj',LANDSCAPING_SOURCES.design,[['Tervezői művezetés',20000]],'Kiszállás külön; nem tartalmazza a kivitelező csapat munkadíját.'),
  referenceTemplate('garden-concept-2026','Kiskert kertépítészeti koncepciója','alkalom','Külön tervezési szolgáltatás kis kerthez.','Tervezői díj',LANDSCAPING_SOURCES.design,[['Kiskert kertépítészeti koncepcióterve',250000]],'Felmérés, részletes kiviteli terv és kivitelezés külön; helyszíni egyeztetés kell.')
];
const grading=ADDITIONAL_TEMPLATES_2026.find(t=>t.id==='machine-grading-2026');
grading.minimumQuantity=4;
grading.quantityLabel='Gép munkaideje (óra, minimum 4)';
grading.lines.push({name:'Gép kiszállási idődíja, 2 óra',qty:2,unit:'óra',price:Math.round(15500/1.27*100)/100,fixedQuantity:true,grossPrice:15500});
grading.items=grading.lines.map(line=>line.name);
const trench=ADDITIONAL_TEMPLATES_2026.find(t=>t.id==='irrigation-trench-2026');
trench.minimumNet=Math.round(20000/1.27*100)/100;
trench.pricing.minimumGross=20000;
for(const template of ADDITIONAL_TEMPLATES_2026)if(template.pricing.scope==='Csak anyag'||template.pricing.sourceRates[0]===26000||template.pricing.sourceRates[0]===20000)template.pricing.starting=false;
LANDSCAPING_TEMPLATES_2026.push(...ADDITIONAL_TEMPLATES_2026);
