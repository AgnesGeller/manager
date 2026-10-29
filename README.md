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

Az app működéséhez szükséges fájlok: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest` és az `assets/` könyvtár. A `.nojekyll` fájl a közvetlen statikus kiszolgálást segíti. A `.git`, `tools`, `tests`, `docs` és README nem az app része; semmi érzékenyet és semmilyen helyi adatmentést ne tegyél a publikus repositoryba. Ágból történő GitHub Pages-publikálás a repository egyéb statikus fájljait is elérhetővé teheti.

Új kiadásnál emeld a `sw.js` `CACHE` verzióját és a felületen látható verziószámot. A frissítés gomb ellenőrzi az új service workert, és aktiválja, ha elérhető; az ajánlatokat nem törli. A service worker kizárólag a felsorolt alkalmazásfájlokat gyorsítótárazza, későbbi API-válaszokat nem.

## Ellenőrzés

```sh
node --check app.js
node --check sw.js
node --test tests/app.test.mjs
```

11 automatizált ellenőrzés: számítás, hiányzó árak kezelése, mentés és tárhelyhiba, sablonszorzás, HTML-escape, visszaállítás validálása, telepítési fájlok, nyomtatási cégadatok. Böngészős vizsgálat: asztali, 768 px táblagépes, 390 és 320 px mobilnézet; területalapú sablon és élő összesítés. A tényleges telefonos telepítést, az offline indítást és a közösségi linkelőnézetet a deployment után, a végleges HTTPS-címen is ellenőrizni kell.

## Céges arculat forrása

A hivatalos logó az `AgnesGeller/diszkertek-munkalap` projekt `official-logo.png` fájljának változatlan másolata (`assets/diszkertek-logo.png`). A cégadatok a munkalap `index.html` céges láblécéből származnak: Netteszt Kft; adószám: 12437164-2-13; www.diszkertek.hu; 0670 634 9630; info@diszkertek.hu. A forrás nem tartalmazott céges székhelyet vagy bankszámlaszámot, ezért ilyet nem adtunk hozzá. A munkalap repositoryja és az adatbázis változatlan maradt.

Az 1.1.0 kiadás a service worker és az ikonhivatkozások verzióját is frissíti. A már telepített app ikonjának cseréjét az operációs rendszer ütemezheti; a linkelőnézetet a közösségi platform saját gyorsítótára is befolyásolja.
