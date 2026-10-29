# Kertépítési Menedzser App · Díszkertek

Magyar nyelvű, reszponzív kertépítési ajánlatkészítő frontend, kizárólag HTML, CSS és vanilla JavaScript használatával. Nincs telepítendő alkalmazásfüggőség és nincs buildlépés.

## Indítás

Az előnézethez, ha van Node.js a gépen:

```sh
node tools/serve.mjs
```

Nyisd meg: http://127.0.0.1:8791

Alternatíva: tetszőleges statikus HTTP-kiszolgálóval szolgáld ki a projekt gyökerét. A `file://` megnyitás nem támogatott: a PWA és a helyi munkamenet HTTP/HTTPS-környezetet igényel. A Node.js kizárólag opcionális fejlesztőeszköz; a publikált apphoz nem kell Node.js.

## Elkészült

- Áttekintés valós, helyben tárolt adatokból.
- Árajánlatok létrehozása, szerkesztése, állapot szerinti szűrése és keresése.
- Füvesítés, gyepfelújítás és ágyáskialakítás területalapú munkasablonjai.
- Saját sablonok mentése vegyes mértékegységű tételekkel, újrafelhasználás mennyiségi szorzóval.
- Egyedi tételek, mennyiségek, egységek, nettó árak és választható ÁFA.
- A sablonokhoz elmenthető saját egységárak. A hiányzó ár nem számít ingyenes munkának: a felület jelzi, és nem enged végleges állapotot vagy nyomtatást.
- Ügyfelek felvétele, szerkesztése és keresése.
- Nyomtatási nézet; a böngésző nyomtatóablakában PDF-be mentés.
- Helyi JSON-biztonsági mentés és ellenőrzött visszaállítás.
- Nem mentett változások védelme navigáláskor és frissítéskor.
- PWA-manifeszt, 192/512 px ikon, iOS-ikon, offline alkalmazásváz, telepítési útmutató és frissítés gomb.
- Sötét smaragdzöld, élénkzöld növényfüzéres ikon fehér, kézírásos KM monogrammal; betűtípustól független SVG-körvonalak és egyező PNG-ikonok.
- A munkalap app változtatás nélkül átvett hivatalos Díszkertek logója és cégadatai az alkalmazásban és a nyomtatási nézetben.
- „Kertépítési Menedzser App” linkelőnézeti cím, Díszkertek megosztási kép és verziózott képcímek.

## Adatok és jogosultságok

Ez frontend, nincs hozzáférés Supabase-hez. Egyetlen táblát, felhasználót vagy jogosultságot sem módosít. A böngésző `localStorage` tárolóját használja (`km-workspace-v1`), ami nem titkosított felhasználói adatbázis; ugyanazon böngészőprofil használói ugyanazokat az adatokat látják. A böngészőadatok törlésével a helyi adatok elvesznek, ezért rendelkezésre áll a biztonsági mentés.

Nincs kitalált ügyfél, mintaajánlat vagy becsült egységár. A munkasablonok szerkeszthető kiinduló munkatételek. Anyagszükségletre még nincs kertészeti képlet: a megadott terület a munkatételek mennyisége lesz.

A következő integrációs szakaszban egyeztetendő:

1. A meglévő kalkulátor és a közös ügyféllista pontos sémája, mezői és API-ja.
2. Mit jelent pontosan a „kassza altable”: csak az egyértelműen engedélyezett adatbázis-objektumhoz szabad írni. A közös ügyféllista írási engedélyét külön tisztázni kell, ha más táblát érint.
3. Supabase Auth és adatbázisoldali RLS: Ági és Tamás teljes hozzáférése, a kilenc dolgozó kizárólag kiosztott munkái, ügyfelenként saját ajánlatok. A szerepkörválasztó frontend önmagában nem hozzáférés-védelem, ezért nincs látszatbelépés vagy nem védett szerepkörváltó.
4. Dolgozói és ügyfélfelület végleges tartalma, majd a hitelesített munkamenethez kötött megvalósítás.

## Publikálás és telepítés

A deploymentet a repository tulajdonosa végzi. A megosztási metaadatok előkészített GitHub Pages-címe: `https://agnesgeller.github.io/manager/`. Az előkészítés önmagában nem jelenti azt, hogy az oldal már él. GitHub Pages használatakor a repository Settings → Pages felületén a `main` ág gyökerét (`/root`) kell kiválasztani; nincs szükség buildparancsra. Más végleges URL esetén az alábbi segéddel frissíthetők a metaadatok.

Nyilvános megosztáshoz és mobilos PWA-telepítéshez HTTPS-kapcsolat szükséges. A telepítés böngésző- és platformfüggő: ahol támogatott, a Telepítés gomb megnyitja a natív telepítési ablakot; iOS-en a Safari megosztási menüjéből adható a főképernyőhöz. A böngésző felhasználói jóváhagyását az app nem tudja megkerülni.

A végleges URL jóváhagyása után állítsd be a megosztási metaadatokat:

```sh
node tools/prepare-publication.mjs https://A-JOVAHAGYOTT-TARHELY-CIME/
```

Ez állítja be az abszolút `og:url`, canonical, `og:image` és Twitter Card képcímeket. A favicon böngészőfülön, az alkalmazásikon telepítéskor, a közösségi előnézeti kép megosztáskor jelenik meg; az előnézet pontos megjelenése a fogadó platformtól és gyorsítótárától is függ.

Az app működéséhez szükséges fájlok: `index.html`, `styles.css`, `template-catalog.js`, `app.js`, `sw.js`, `manifest.webmanifest` és az `assets/` könyvtár. A `.nojekyll` fájl a közvetlen statikus kiszolgálást segíti. A `.git`, `tools`, `tests`, `docs` és README nem az app része; semmi érzékenyet és semmilyen helyi adatmentést ne tegyél a publikus repositoryba. Ágból történő GitHub Pages-publikálás a repository egyéb statikus fájljait is elérhetővé teheti.

Új kiadásnál emeld a `sw.js` `CACHE` verzióját és a felületen látható verziószámot. A frissítés gomb ellenőrzi az új service workert, és aktiválja, ha elérhető; az ajánlatokat nem törli. A service worker kizárólag a felsorolt alkalmazásfájlokat gyorsítótárazza, későbbi API-válaszokat nem.

## Ellenőrzés

```sh
node --check app.js
node --check sw.js
node --test tests/app.test.mjs
```

30 automatizált ellenőrzés: számítás, hiányzó árak kezelése, mentés és tárhelyhiba, sablonszorzás, HTML-escape, visszaállítás validálása, telepítési fájlok, nyomtatási cégadatok. Böngészős vizsgálat: asztali, 768 px táblagépes, 390 és 320 px mobilnézet; területalapú sablon és élő összesítés. A tényleges telefonos telepítést, az offline indítást és a közösségi linkelőnézetet a deployment után, a végleges HTTPS-címen is ellenőrizni kell.

## Céges arculat forrása

A hivatalos logó az `AgnesGeller/diszkertek-munkalap` projekt `official-logo.png` fájljának változatlan másolata (`assets/diszkertek-logo.png`). A cégadatok a munkalap `index.html` céges láblécéből származnak: Netteszt Kft; adószám: 12437164-2-13; www.diszkertek.hu; 0670 634 9630; info@diszkertek.hu. A forrás nem tartalmazott céges székhelyet vagy bankszámlaszámot, ezért ilyet nem adtunk hozzá. A munkalap repositoryja és az adatbázis változatlan maradt.

Az 1.1.0 kiadás a service worker és az ikonhivatkozások verzióját is frissíti. A már telepített app ikonjának cseréjét az operációs rendszer ütemezheti; a linkelőnézetet a közösségi platform saját gyorsítótára is befolyásolja.

Az 1.2.0 kiadás nagyobb, vastagabb, különálló KM betűket és 16–256 px méreteket tartalmazó Windows ICO-fájlt használ. Külön 32 px favicon és 48 px alkalmazásikon is elérhető. A funkció nélküli profiljelvény és a Saját munkaterület felirat eltávolítva; a helyi/offline tárolás állapotjelzője megmaradt.

Az 1.2.0 megosztási képe nagy, kontrasztos címet és hangsúlyos Díszkertek logót használ, apró kísérőszövegek nélkül. A képfájl új neve (`share-v1.2.0.png`) segíti a képelőnézet frissítését; a korábban elküldött üzenetek előnézete a küldő platform gyorsítótárától is függ.

Az 1.3.0 kiadásban a Munkasablonok → Új saját sablon felületen ügyfél és ajánlat nélkül hozható létre sablon. Megadható a név, leírás, több tétel, mennyiség, egység és opcionális egységár. A saját sablonok Szerkesztés gombbal módosíthatók. A mentetlen sablonváltoztatásokat a navigáció és a frissítés figyelembe veszi. A tárolási formátum és a korábbi sablonok kompatibilisek maradtak.

Az 1.3.1 kiadás a PDF nyomtatásakor elrejti a böngésző által hozzáadott alkalmazáscímet és webcímet: a lap felső és alsó nyomtatási margója nulla, a dokumentum saját belső térköze pedig megtartja a tartalmi margókat. A céges fejléc, ajánlatcím és céges lábléc megmarad. Többoldalas dokumentumnál a belső térköz a lapokra tördeléskor ismétlődik. Forrás: https://developer.chrome.com/blog/print-margins és https://developer.chrome.com/blog/box-decoration-break.

Az 1.3.2 kiadás a lábléc céges logóját az eredeti képből optimalizált PNG-ként, közvetlenül a HTML-be ágyazza. A lábléc megjelenése ezért offline és telepített módban sem függ külön képfájl letöltésétől. Az eredeti hivatalos logó a fejléc és a PDF számára változatlanul megmarad.

Az 1.4.0 kiadásban a saját munkasablonok megerősítés után törölhetők a Munkasablonok oldalon. A törlés a saját sablont és annak mentett sablonárait érinti; az ügyfeleket, meglévő ajánlatokat és beépített sablonokat nem módosítja. Mentési hiba esetén a korábbi állapot megmarad. A kiadás tartalmazza a beágyazott lábléclogó javítását is.

## 1.5.0 · 2026-os sablonok és saját munkadíj

Tíz új, m²-, fm- vagy db-alapú kertépítési sablon került a `template-catalog.js` fájlba. A 2026. október 29-én ellenőrzött források:

- Kerti Éden: https://kertieden.hu/cimkek/kertepites-arak — bruttó indulóárak; a nettó egységárak 27% ÁFA levonásával készültek.
- Niko Kertép: https://www.gepi-terkovezes.hu/araink/ — 2026 januárjától érvényes nettó kivitelezési munkadíjak, anyag nélkül.

A külső árak piaci referenciaértékek, nem a Díszkertek jóváhagyott díjai. A sablon megmutatja a forrást, a bruttó/nettó alapot, az anyag- és munkadíj-tartalmat és a kizárt munkákat. Az ajánlat megjegyzésébe bekerül a kiválasztott csomag műszaki határa; a másik szolgáltató neve és linkje a belső sablontájékoztatás része. Egyben publikált csomagárat nem bontunk fel kitalált részárakra. A kizárt anyagok és szolgáltatások külön tételként adhatók az ajánlathoz.

A felhasználó által megadott saját, ügyfélnek számlázott munkadíj bruttó 8 500 Ft/fő/nap, napi 7 óra, 08:00–15:00. A Saját munkadíj számítása gomb létszám és napok alapján ad főnap-tételt az ajánlathoz. A nettó árat az ajánlat ÁFA-kulcsából számolja; ÁFA-váltáskor a bruttó napidíjat tartja, amíg az ár kézi módosítása ezt felül nem írja. Munkadíjat már tartalmazó piaci tételeknél külön jelzi a dupla számlálás veszélyét.

Minden teljes munkasablon törölhető megerősítéssel. A beépített sablonok eltávolítása a `hiddenTemplates` helyi listában marad meg, így újraindítás után sem jelennek vissza. A meglévő saját sablonok, ügyfelek és ajánlatok megmaradnak; a régebbi biztonsági mentések továbbra is beolvashatók. A biztonsági mentés az eltávolított beépített sablonok listáját is tartalmazza.

Mobilon a sablonlista oldalra görgethető, lapozógombokkal és lapszámjelzővel. A sablonok részletei korlátozott magasságú kártyán belül görgethetők, így a teljes lista nem növeli több képernyőnyire az oldalt. Asztali nézetben a rács megmarad.

## 1.6.0 · Bővített katalógus és ajánlatcsoportok

További 20, ellenőrzött 2026-os sablon került a katalógusba, így 30 forrásárazott és 3 korábbi alap munkasablon érhető el. Az új anyagtételek forrása a Greenframe 2026. február 1-től érvényes nettó árlistája (https://greenframe.hu/arak); a gödörásás és tervezői szolgáltatások forrása az Árgus Kert 2026-os listája (https://www.argus-kft.hu/tajekoztato-arak). További kivitelezési tételek a korábban ellenőrzött Kerti Éden és Niko Kertép listából származnak.

A tisztán anyagáras sablon külön jelölést kap; nem tartalmaz automatikusan kitalált munkaidőt vagy munkadíjat. A Saját munkadíj hozzáadása funkcióval a tényleges csapat és munkanap számolható hozzá. A láncos árokásás rövid szakaszainál a forrás bruttó 20 000 Ft minimumdíját külön minimumdíj-kiegészítés biztosítja. A gépi tereprendezés legalább 4 munkaórával és ettől független, fix 2 óra kiszállási idővel számol.

A listában minden sablon jobb felső külső sarkán egy piros × törlőgomb található, amely egy kattintással megerősítést kér. Kereső szűkíti a mobilon oldalra lapozható listát. Az ajánlatba tetszőleges számú sablon adható; külön lenyitható csoportokban jelennek meg. Új sablon hozzáadása után a csoportok összecsukódnak, és egyszerre egy nyitható ki. A korábbi, csoport nélküli ajánlatok továbbra is szerkeszthetők.

Új ajánlatnál az ÁFA alapértelmezése 0%; a mentett ajánlatok korábbi ÁFA-kulcsa változatlan. A saját csapat munkadíja külön, hangsúlyos blokkban adható hozzá a tételek előtt. A munkadíj 8 500 Ft/fő/nap bruttó, napi 7 óra, 08:00–15:00.

Bruttó forrástételeknél az ajánlat nettó egységára az aktuális ÁFA-kulcshoz igazodik, és a bruttó forrásdíj 0% ÁFA mellett is megmarad. Az automatikus nettósítás nagyobb pontosságot használ, hogy több munkás és több nap összesítésekor se keletkezzen egész forintos eltérés. A felhasználó kézi árátírása felülírja a bruttó árhoz kötést.
