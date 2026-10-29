'use strict';
// Public contractor price lists checked on 2026-10-29. These are reference
// starting prices, not the company's own approved price list.
const LANDSCAPING_SOURCES = Object.freeze({
  garden: {name:'Kerti Éden',url:'https://kertieden.hu/cimkek/kertepites-arak',basis:'bruttó',year:2026,checked:'2026-10-29'},
  paving: {name:'Niko Kertép',url:'https://www.gepi-terkovezes.hu/araink/',basis:'nettó',year:2026,checked:'2026-10-29'}
});
function referenceTemplate(id,name,unit,description,scope,source,rows,exclusions) {
  const lines=rows.map(([name,rate])=>({name,qty:1,unit,price:source.basis==='bruttó'?Math.round(rate/1.27*100)/100:rate}));
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
