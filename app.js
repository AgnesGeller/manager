'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const main = $('#main');
const modal = $('#modal');
const STORAGE = 'km-workspace-v1';
const COMPANY = Object.freeze({brand:'Díszkertek',name:'Netteszt Kft',taxNumber:'12437164-2-13',website:'www.diszkertek.hu',phone:'0670 634 9630',email:'info@diszkertek.hu',logo:'./assets/diszkertek-logo.png'});
const LABOR_RATE = Object.freeze({grossDaily:8500,hoursPerDay:7,start:'08:00',end:'15:00'});
const money = value => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(value);
const unitMoney = value => new Intl.NumberFormat('hu-HU', {style:'currency',currency:'HUF',minimumFractionDigits:2,maximumFractionDigits:6}).format(value);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const uid = () => crypto.randomUUID();
const date = () => new Date().toLocaleDateString('sv-SE');
const BASE_TEMPLATES = [
  { id:'lawn', name:'Füvesítés', icon:'⚘', description:'A talaj előkészítésétől a fűmag elvetéséig.', items:['Talaj-előkészítés','Fűmagvetés','Indító trágyázás'], unit:'m²' },
  { id:'renew', name:'Gyepfelújítás', icon:'≋', description:'Új lendület a meglévő gyepnek.', items:['Gyepszellőztetés','Felülvetés','Tápanyag-utánpótlás'], unit:'m²' },
  { id:'bed', name:'Ágyáskialakítás', icon:'❧', description:'Rendezett ágyások, gondosan előkészítve.', items:['Ágyás talaj-előkészítése','Geotextília terítése','Mulcs terítése'], unit:'m²' }
];
BASE_TEMPLATES.push(...LANDSCAPING_TEMPLATES_2026);
const templates=[];
let state = { clients:[], quotes:[], prices:{}, templates:[], hiddenTemplates:[] };
let draft = null;
let dirty = false;
let templateDraft = null;
let templateDirty = false;
let pendingInstall = null;
let storageError = false;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE));
  if (saved) { if (validBackup({...saved,format:'km-backup-v1'})) state = {...saved,templates:saved.templates||[],hiddenTemplates:saved.hiddenTemplates||[]}; else storageError=true; }
} catch { storageError = true; }
syncTemplates();
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 5000); }
function syncTemplates() { templates.splice(0,templates.length,...BASE_TEMPLATES.filter(template=>!state.hiddenTemplates.includes(template.id)),...state.templates); }
function validHiddenTemplates(value) { return value===undefined || (Array.isArray(value) && value.length<=1000 && value.every(id=>typeof id==='string' && id.length<=100)); }
function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); return true; }
  catch { toast('A mentés nem sikerült. Ellenőrizd a böngésző tárhelyét, majd próbáld újra.'); return false; }
}
function total(quote) { const net = quote.items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0); return { net, tax:net * Number(quote.tax) / 100, gross:net * (1 + Number(quote.tax) / 100) }; }
function clientFor(quote) { return state.clients.find(client => client.id === quote.clientId); }
function heading(eyebrow, title, description, action = '') { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtext">${description}</p></div>${action}</div>`; }
function newButton() { return '<button class="btn primary" data-action="new-quote"><span>＋</span> Új árajánlat</button>'; }
function empty(title, description, action, symbol = '❧') { return `<div class="empty"><span class="empty-mark">${symbol}</span><h3>${title}</h3><p>${description}</p>${action}</div>`; }
function overview() {
  const active = state.quotes.filter(quote => quote.status !== 'Elutasítva');
  main.innerHTML = heading('JÓ MUNKÁT A KERTBEN ÉS AZ ASZTALNÁL', 'Minden egy szép kerttel kezdődik.', 'Ajánlatok, ügyfelek, munkák. Átláthatóan, egy helyen.', newButton()) +
  `<section class="hero"><div class="hero-content"><p class="eyebrow">ÖTLETBŐL PONTOS AJÁNLAT</p><h2>Kevesebb számolás.<br>Több megvalósult kert.</h2><p>Indulj egy bevált munkasablonból, add meg a méreteket, és állítsd össze a következő ajánlatodat.</p><a href="#templates" class="btn soft">Munkasablonok felfedezése <span>↗</span></a></div><img class="hero-art" src="./assets/botanical.svg" alt="" width="300" height="350"></section>
  <section class="stats" aria-label="Összesítés"><div class="stat"><div class="stat-label">Folyamatban lévő ajánlatok <span>▤</span></div><div class="stat-value">${active.filter(q => q.status === 'Piszkozat' || q.status === 'Elküldve').length}<small>db</small></div><div class="stat-note">Piszkozatok és elküldött ajánlatok</div></div><div class="stat"><div class="stat-label">Elfogadott ajánlatok értéke <span>↗</span></div><div class="stat-value">${money(active.filter(q => q.status === 'Elfogadva').reduce((sum,q) => sum + total(q).gross,0))}</div><div class="stat-note">Bruttó összeg</div></div><div class="stat"><div class="stat-label">Ügyfelek <span>♧</span></div><div class="stat-value">${state.clients.length}<small>fő</small></div><div class="stat-note">Ezen az eszközön tárolva</div></div></section>
  <div class="columns"><section><div class="section-heading"><h2>Legutóbbi árajánlatok</h2><a class="text-link" href="#quotes">Összes megtekintése →</a></div><div class="panel">${state.quotes.length ? quoteTable(state.quotes.slice(0,4)) : empty('Itt kezdődik a következő kert.','Készítsd el az első árajánlatot néhány egyszerű lépésben.', '<button class="btn" data-action="new-quote">＋ Első árajánlat létrehozása</button>','▤')}</div><div class="tip"><span>✧</span><p><strong>A bevált megoldások újra használhatók.</strong>Mentsd el saját munkasablonjaidat és egységáraidat, hogy a következő ajánlat még gyorsabban elkészüljön.</p></div></section>
  <section><div class="section-heading"><h2>Indulj egy sablonnal</h2><a class="text-link" href="#templates">Összes →</a></div><div class="panel">${templates.slice(0,3).map(t => `<a href="#new/${encodeURIComponent(t.id)}" class="template-row"><span class="template-icon">${t.icon}</span><span><strong>${escapeHTML(t.name)}</strong><small>${t.items.length} munkatétel · ${t.unit} alapján</small></span><span class="arrow">↗</span></a>`).join('')}</div><p class="hint">A sablonok tételeit és árait minden ajánlatban szabadon alakíthatod.</p><button class="btn top-install" data-action="install">↓ Telepítés az eszközre</button><button class="text-link" data-action="refresh" style="margin-left:15px">⟳ Frissítés</button></section></div>`;
}
function quoteTable(quotes) { return `<div class="table-wrap"><table><thead><tr><th>AJÁNLAT / ÜGYFÉL</th><th>ÖSSZEG</th><th>ÁLLAPOT</th><th></th></tr></thead><tbody>${quotes.map(q => `<tr><td class="client-name">${escapeHTML(q.title)}<small>${escapeHTML(clientFor(q)?.name || 'Nincs ügyfél kiválasztva')} · ${escapeHTML(q.created)}</small></td><td>${money(total(q).gross)}</td><td><span class="badge">${escapeHTML(q.status)}</span></td><td><a class="btn small" href="#edit/${encodeURIComponent(q.id)}">Megnyitás</a></td></tr>`).join('')}</tbody></table></div>`; }
function quotesView() { main.innerHTML = heading('AZ ELSŐ ÖTLETTŐL AZ ELFOGADÁSIG','Árajánlatok','Minden ajánlatod, áttekinthetően.',newButton()) + `<div class="toolbar"><input class="search" id="quote-search" type="search" aria-label="Ajánlat keresése" placeholder="Ajánlat vagy ügyfél keresése…"><select id="quote-filter" aria-label="Állapot szerinti szűrés" style="width:auto"><option value="">Minden állapot</option>${['Piszkozat','Elküldve','Elfogadva','Elutasítva'].map(x => `<option>${x}</option>`).join('')}</select></div><div class="panel" id="quote-results"></div>`; filterQuotes(); }
function filterQuotes() { const search = $('#quote-search').value.toLocaleLowerCase('hu'); const status = $('#quote-filter').value; const matches = state.quotes.filter(q => (!status || q.status === status) && `${q.title} ${clientFor(q)?.name || ''}`.toLocaleLowerCase('hu').includes(search)); $('#quote-results').innerHTML = matches.length ? quoteTable(matches) : empty('Még nincs megjeleníthető ajánlat.','Hozz létre egy ajánlatot, vagy módosítsd a keresési feltételeket.',newButton(),'▤'); }
function templatesView() {
  const displayTemplates=[...templates.filter(t=>t.pricing),...templates.filter(t=>!t.pricing)];
  main.innerHTML=heading('BEVÁLT MUNKÁK, GYORSABB TERVEZÉS','Munkasablonok','Válassz munkát, vagy állítsd össze a saját munkasablonodat.','<a href="#template/new" class="btn primary">＋ Új saját sablon</a>')+
    `<div class="notice">Saját munkadíj: <strong>bruttó 8 500 Ft/fő/nap</strong> · 08:00–15:00 · 7 óra. A 2026-os piaci sablonárak külön, szerkeszthető indulóárak; nem a Díszkertek jóváhagyott díjszabása.</div>
    <div class="toolbar"><input id="template-search" class="search" type="search" aria-label="Munkasablon keresése" placeholder="Munka vagy sablon keresése…"></div><p class="hint" id="template-no-results" hidden>Nincs a keresésnek megfelelő sablon.</p><div class="template-scroll-controls"><span>Lapozz oldalra a sablonok között.</span><div><button class="btn small" type="button" data-action="template-prev" aria-label="Előző sablon">←</button><span id="template-scroll-count" role="status">1 / ${displayTemplates.length}</span><button class="btn small" type="button" data-action="template-next" aria-label="Következő sablon">→</button></div></div><div class="template-grid" id="template-gallery" tabindex="0" role="region" aria-label="Oldalra görgethető munkasablonok">${displayTemplates.map(t=>`<div class="template-slide" data-template-search="${escapeHTML([t.name,t.description,...t.items].join(' ').toLocaleLowerCase('hu'))}"><button class="template-delete" type="button" data-action="delete-template" data-id="${escapeHTML(t.id)}" aria-label="${escapeHTML(t.name)} teljes sablon törlése" title="Teljes sablon törlése">×</button><article class="template-card"><span class="template-icon">${t.icon}</span><h2>${escapeHTML(t.name)}</h2><p>${escapeHTML(t.description)}</p><ul>${t.items.map(item=>`<li>${escapeHTML(item)}</li>`).join('')}</ul>${templatePricingHTML(t)}<div class="template-card-actions"><button class="btn" data-action="use-template" data-id="${escapeHTML(t.id)}">Ajánlat ebből a sablonból ↗</button>${state.templates.some(custom=>custom.id===t.id)?`<a class="btn" href="#template/${encodeURIComponent(t.id)}">Szerkesztés</a>`:''}</div></article></div>`).join('')}</div>
    ${templates.length?'':empty('Még nincs munkasablon.','Készíts saját sablont a gyakran végzett munkákhoz.','<a class="btn" href="#template/new">＋ Új saját sablon</a>')}`;
  const gallery=$('#template-gallery');
  gallery.addEventListener('scroll',updateTemplateScroll,{passive:true});
  updateTemplateScroll();
}
function updateTemplateScroll(){
  const gallery=$('#template-gallery');if(!gallery)return;
  const cards=gallery.querySelectorAll('.template-slide:not([hidden])');
  const step=cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:(cards[0]?.offsetWidth||1);
  const index=cards.length?Math.min(cards.length,Math.round(gallery.scrollLeft/Math.max(1,step))+1):0;
  $('#template-scroll-count').textContent=`${index} / ${cards.length}`;
  $('[data-action="template-prev"]').disabled=gallery.scrollLeft<=2;
  $('[data-action="template-next"]').disabled=gallery.scrollLeft+gallery.clientWidth>=gallery.scrollWidth-2;
}
function filterTemplateGallery(){
  const gallery=$('#template-gallery'),query=$('#template-search').value.trim().toLocaleLowerCase('hu');
  gallery.querySelectorAll('.template-slide').forEach(slide=>{slide.hidden=!slide.dataset.templateSearch.includes(query);});
  gallery.scrollTo({left:0,behavior:'auto'});
  $('#template-no-results').hidden=Boolean(gallery.querySelector('.template-slide:not([hidden])'));
  updateTemplateScroll();
}
function templatePricingHTML(template) {
  if(!template.pricing)return '';
  const net=template.lines.reduce((sum,line)=>sum+(line.fixedQuantity?0:line.qty*line.price),0);
  const reference=template.pricing.basis==='bruttó'?template.pricing.sourceRates.reduce((sum,rate)=>sum+rate,0):net;
  return `<div class="price-reference"><strong>${template.pricing.basis==='bruttó'?'Bruttó':'Nettó'} ${unitMoney(reference)} / ${escapeHTML(template.unit)}</strong><span>${template.pricing.starting?'2026-os piaci indulóár':'2026-os piaci referencia'} · ${escapeHTML(template.pricing.scope)}</span><details><summary>Ártartalom és forrás</summary><p>${escapeHTML(template.pricing.exclusions)}</p>${template.pricing.minimumGross?`<p>Minimumdíj: bruttó ${money(template.pricing.minimumGross)}. Rövidebb szakasznál a különbözet külön tételként kerül az ajánlatba.</p>`:''}<p>Forrásár: ${template.pricing.sourceRates.map(money).join(' + ')} / ${escapeHTML(template.unit)} (${escapeHTML(template.pricing.basis)}). Bruttó forrásárnál az ajánlatba kerülő nettó ár az ajánlat ÁFA-kulcsához igazodik, így a bruttó forrásdíj megmarad.</p><a href="${escapeHTML(template.pricing.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(template.pricing.name)} · 2026-os árlista ↗</a><p>Ellenőrizve: 2026. 10. 29.</p></details></div>`;
}
function clientsView() { main.innerHTML = heading('MINDEN KERT MÖGÖTT EGY ÜGYFÉL','Ügyfelek','Kapcsolattartási adatok és a hozzájuk tartozó ajánlatok.','<button class="btn primary" data-action="new-client">＋ Új ügyfél</button>') + `<div class="toolbar"><input type="search" class="search" id="client-search" aria-label="Ügyfél keresése" placeholder="Név, e-mail-cím vagy cím keresése…"></div><div id="client-results" class="panel"></div><p class="hint">Az adatok jelenleg csak ebben a böngészőben érhetők el. A közös ügyféllistával való szinkronizálás még nincs bekapcsolva.</p><div class="header-actions"><button class="btn" data-action="backup">↓ Adatok biztonsági mentése</button><button class="btn" data-action="restore">↑ Biztonsági mentés visszaállítása</button></div>`; filterClients(); }
function filterClients() { const query = $('#client-search').value.toLocaleLowerCase('hu'); const matches = state.clients.filter(c => `${c.name} ${c.email} ${c.address}`.toLocaleLowerCase('hu').includes(query)); $('#client-results').innerHTML = matches.length ? `<div class="table-wrap"><table><thead><tr><th>ÜGYFÉL</th><th>ELÉRHETŐSÉG</th><th>AJÁNLATOK</th><th></th></tr></thead><tbody>${matches.map(c => `<tr><td class="client-name">${escapeHTML(c.name)}<small>${escapeHTML(c.address)}</small></td><td>${escapeHTML(c.email)}<br>${escapeHTML(c.phone)}</td><td>${state.quotes.filter(q => q.clientId === c.id).length} db</td><td><button class="btn small" data-action="edit-client" data-id="${escapeHTML(c.id)}">Szerkesztés</button></td></tr>`).join('')}</tbody></table></div>` : empty('Adj nevet a következő kertnek.','Vedd fel az első ügyfeledet, hogy az ajánlatokat rögtön hozzá kapcsolhasd.','<button class="btn" data-action="new-client">＋ Ügyfél hozzáadása</button>','♧'); }
function newQuote(templateId) { const template = templates.find(t => t.id === templateId); return {id:uid(), title:template ? template.name : '', clientId:'', created:date(), tax:0, status:'Piszkozat', notes:'', items:template ? templateLines(template,1) : [{id:uid(), name:'',qty:1,unit:'m²',price:''}]}; }
function editor() {
  main.innerHTML = `<div class="print-only"><h1>Kertépítési árajánlat</h1><p>Azonosító: KM-${escapeHTML(draft.id.slice(0,8).toUpperCase())} · ${escapeHTML(draft.created)}</p></div>` + heading('PONTOS TÉTELEK. ÁTLÁTHATÓ AJÁNLAT.','Árajánlat összeállítása','Add meg az adatokat, a méreteket és az egységárakat.','<a href="#quotes" class="btn">← Árajánlatok</a>') + `<form id="quote-form"><div class="editor-layout"><div><section class="form-section"><h2>01 <span style="color:#b0b6a7">/</span> Az ajánlat adatai</h2><div class="form-grid"><div class="full"><label for="quote-title">Munka megnevezése *</label><input id="quote-title" data-field="title" required maxlength="150" value="${escapeHTML(draft.title)}" placeholder="Munka megnevezése"></div><div><label for="quote-client">Ügyfél *</label><select id="quote-client" data-field="clientId" required><option value="">Válassz ügyfelet</option>${state.clients.map(c => `<option value="${escapeHTML(c.id)}" ${c.id===draft.clientId?'selected':''}>${escapeHTML(c.name)}</option>`).join('')}</select><button type="button" class="text-link no-print" data-action="new-client">＋ Új ügyfél hozzáadása</button></div><div><label for="quote-date">Ajánlat dátuma *</label><input id="quote-date" type="date" data-field="created" required value="${escapeHTML(draft.created)}"></div><div class="full client-details" id="selected-client"></div></div></section>
  <section class="form-section"><div class="section-heading"><h2>02 <span style="color:#b0b6a7">/</span> Munkák és tételek</h2><button type="button" class="text-link no-print" data-action="add-template">＋ Sablonból</button></div><div class="labor-callout"><div><strong>Saját csapat munkadíja</strong><span>Bruttó 8 500 Ft/fő/nap · 08:00–15:00 · 7 óra</span></div><button class="btn primary" type="button" data-action="labor">＋ Munkadíj hozzáadása</button></div><div id="items" class="items"></div><button type="button" class="btn add-line" data-action="add-item" style="margin-top:15px">＋ Egyedi tétel</button><p class="hint" id="missing-prices"></p></section>
  <section class="form-section"><h2>03 <span style="color:#b0b6a7">/</span> Részletek</h2><div class="form-grid"><div><label for="quote-tax">ÁFA</label><select id="quote-tax" data-field="tax">${[27,18,5,0].map(n => `<option value="${n}" ${Number(draft.tax)===n?'selected':''}>${n}%${n===0?' (adómentes / 0%)':''}</option>`).join('')}</select></div><div class="no-print"><label for="quote-status">Állapot</label><select id="quote-status" data-field="status">${['Piszkozat','Elküldve','Elfogadva','Elutasítva'].map(s => `<option ${draft.status===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="full"><label for="quote-notes">Megjegyzés, vállalási feltételek</label><textarea id="quote-notes" data-field="notes" rows="4" maxlength="5000">${escapeHTML(draft.notes)}</textarea></div></div></section></div>
  <aside class="summary panel"><p class="eyebrow">AZ AJÁNLAT ÉRTÉKE</p><h2>Összesítés</h2><div class="summary-line"><span>Nettó összeg</span><span id="sum-net"></span></div><div class="summary-line"><span id="tax-label"></span><span id="sum-tax"></span></div><div class="summary-total"><span class="subtext">Bruttó végösszeg</span><strong id="sum-gross"></strong></div><small id="summary-warning"></small><button class="btn primary" type="submit">✓ Ajánlat mentése</button><button class="btn" type="button" data-action="print">Nyomtatás / PDF</button><button class="text-link no-print" type="button" data-action="save-prices">Egységárak mentése a sablonokhoz</button><small class="no-print">A mentett ajánlat ezen az eszközön marad. A PDF-et a nyomtatási ablakban mentheted.</small><p class="save-indicator" id="save-indicator"></p></aside></div></form>`;
  renderItems(); updateTotals(); updateClientDetails(); $('.summary').insertAdjacentHTML('beforeend', '<button class="btn no-print" type="button" data-action="save-template">Saját munkasablon mentése</button>');
}
function quoteGroups(items) {
  const groups=new Map();
  items.forEach((item,index)=>{const key=item.groupId||'custom';if(!groups.has(key))groups.set(key,{key,title:item.groupTitle||'Egyedi tételek',items:[]});groups.get(key).items.push({item,index});});
  return [...groups.values()];
}
function quoteItemHTML(item,index) {
  return `<div class="quote-item" data-item="${escapeHTML(item.id)}"><div><label for="name-${index}">Tétel megnevezése *</label><input id="name-${index}" data-item-field="name" required maxlength="180" value="${escapeHTML(item.name)}"></div><div><label for="qty-${index}">Mennyiség *</label><input id="qty-${index}" data-item-field="qty" type="number" inputmode="decimal" min="0.01" max="100000000" step="0.01" required value="${escapeHTML(item.qty)}"></div><div><label for="unit-${index}">Egység *</label><select id="unit-${index}" data-item-field="unit">${['m²','m³','fm','db','zsák','óra','főnap','alkalom','kg','liter'].map(unit=>`<option ${unit===item.unit?'selected':''}>${unit}</option>`).join('')}</select></div><div><label for="price-${index}">Nettó Ft / egység</label><input id="price-${index}" data-item-field="price" type="number" inputmode="decimal" min="0" max="1000000000" step="any" placeholder="Nincs ár" value="${escapeHTML(item.price)}"></div><button type="button" class="remove" data-action="remove-item" data-id="${escapeHTML(item.id)}" aria-label="${index+1}. tétel eltávolítása">×</button></div>`;
}
function renderItems(expandGroup) {
  const container=$('#items');
  const wasEmpty=!container.children.length;
  const previous=new Set([...container.querySelectorAll('.quote-group[open]')].map(group=>group.dataset.group));
  const groups=quoteGroups(draft.items);
  container.innerHTML=groups.map(group=>{
    const open=expandGroup===null?false:expandGroup!==undefined?group.key===expandGroup:previous.has(group.key)||(wasEmpty&&group.key==='custom');
    const net=group.items.reduce((sum,{item})=>sum+Number(item.qty||0)*Number(item.price||0),0);
    return `<details class="quote-group" data-group="${escapeHTML(group.key)}" ${open?'open':''}><summary><strong>${escapeHTML(group.title)}</strong><small>${group.items.length} tétel · nettó <span data-group-total>${money(net)}</span></small></summary><div class="quote-group-content">${group.items.map(({item,index})=>quoteItemHTML(item,index)).join('')}</div></details>`;
  }).join('');
}
function groupQuoteItems(items,title) { const id=uid();return items.map(item=>({...item,groupId:id,groupTitle:title})); }
function updateTotals() { document.querySelectorAll('#items .quote-group').forEach(group=>{const net=draft.items.filter(item=>(item.groupId||'custom')===group.dataset.group).reduce((sum,item)=>sum+Number(item.qty||0)*Number(item.price||0),0);group.querySelector('[data-group-total]').textContent=money(net);}); const amounts = total(draft); $('#sum-net').textContent = money(amounts.net); $('#sum-tax').textContent = money(amounts.tax); $('#sum-gross').textContent = money(amounts.gross); $('#tax-label').textContent = `ÁFA (${draft.tax}%)`; const missing = draft.items.filter(i => i.price === '').length; const warning = missing ? `${missing} tételnél még nincs egységár. A végösszeg ezek nélkül értendő.` : ''; $('#summary-warning').textContent = warning; $('#missing-prices').textContent = warning; $('#save-indicator').textContent = dirty ? 'Nem mentett módosítások' : ''; }
function updateClientDetails() { const c = clientFor(draft); $('#selected-client').textContent = c ? [c.address,c.email,c.phone].filter(Boolean).join(' · ') : ''; }
function preparePrint() {
  const c=clientFor(draft),amounts=total(draft);
  $('.print-only').innerHTML=`<div class="print-brand"><img src="${COMPANY.logo}" width="100" height="111" alt="${COMPANY.brand}"><div class="print-company"><strong>${COMPANY.name}</strong><span>Adószám: ${COMPANY.taxNumber}</span><span>${COMPANY.website} · ${COMPANY.phone}</span><span>${COMPANY.email}</span></div></div><div class="print-document-title"><h1>Kertépítési árajánlat</h1><p>KM-${escapeHTML(draft.id.slice(0,8).toUpperCase())} · ${escapeHTML(draft.created)}</p></div><h2>${escapeHTML(draft.title)}</h2><p><strong>${escapeHTML(c?.name)}</strong><br>${[c?.address,c?.email,c?.phone].filter(Boolean).map(escapeHTML).join('<br>')}</p><table><thead><tr><th>Tétel</th><th>Mennyiség</th><th>Nettó egységár</th><th>Nettó összeg</th></tr></thead><tbody>${draft.items.map(i=>`<tr><td>${escapeHTML(i.name)}</td><td>${escapeHTML(i.qty)} ${escapeHTML(i.unit)}</td><td>${unitMoney(Number(i.price))}</td><td>${money(Number(i.qty)*Number(i.price))}</td></tr>`).join('')}</tbody></table><div class="print-totals"><p>Nettó összeg: <strong>${money(amounts.net)}</strong></p><p>ÁFA (${draft.tax}%): <strong>${money(amounts.tax)}</strong></p><h2>Bruttó végösszeg: ${money(amounts.gross)}</h2></div>${draft.notes?`<h3>Megjegyzés, vállalási feltételek</h3><p class="print-notes">${escapeHTML(draft.notes)}</p>`:''}<div class="print-company-footer">${COMPANY.brand} · ${COMPANY.name} · Adószám: ${COMPANY.taxNumber}<br>${COMPANY.website} · ${COMPANY.phone} · ${COMPANY.email}</div>`;
}
async function waitForPrintLogo() {
  const logo=$('.print-brand img');
  if (!logo) return false;
  if (logo.complete && logo.naturalWidth>0) return true;
  try { await Promise.race([logo.decode(),new Promise(resolve=>setTimeout(resolve,3000))]); }
  catch {}
  if(logo.naturalWidth>0) return true;
  toast('A céglogót nem sikerült betölteni. Ellenőrizd az internetkapcsolatot, majd próbáld újra a nyomtatást.');
  return false;
}
function customTemplateDialog() {
  if (!draft.items.length || draft.items.some(i => !i.name.trim() || !Number.isFinite(Number(i.qty)) || Number(i.qty)<=0 || Number(i.qty)>100000000 || (i.price!=='' && (!Number.isFinite(Number(i.price)) || Number(i.price)<0 || Number(i.price)>1000000000)))) { toast('A sablonhoz adj meg érvényes neveket, mennyiségeket és árakat.'); return; }
  modal.innerHTML=`<form id="custom-template-form"><h2 id="modal-title">Saját munkasablon mentése</h2><label for="custom-template-name">Sablon neve *</label><input id="custom-template-name" required maxlength="80" value="${escapeHTML(draft.title)}"><p class="hint">A munkatételeket, mennyiségeket és az eddig megadott egységárakat mentjük el. Az ügyfél adatai nem kerülnek a sablonba.</p><div class="dialog-actions"><button class="btn" type="button" data-action="close-modal">Mégse</button><button class="btn primary" type="submit">Sablon mentése</button></div></form>`;
  modal.showModal();
  $('#custom-template-form').addEventListener('submit',event=>{
    event.preventDefault();const name=$('#custom-template-name').value.trim();if(!name)return;
    const t={id:uid(),name,icon:'❧',description:'Saját munkatételekből összeállított sablon.',unit:'egyedi',items:draft.items.map(i=>i.name),lines:draft.items.map(i=>({name:i.name,qty:Number(i.qty),unit:i.unit,price:i.price,...(i.grossPrice===undefined?{}:{grossPrice:i.grossPrice})}))};
    state.templates.push(t);if(!persist()){state.templates.pop();return;}templates.push(t);modal.close();toast('A saját munkasablont elmentettük.');
  });
}
function templateLines(t, amount) {
  amount=Math.max(amount,t.minimumQuantity||0);
  const items=(t.lines||t.items.map(name=>({name,qty:1,unit:t.unit,price:''}))).map(line=>{
    const key=`${t.id}:${line.name}`,hasPrice=Object.prototype.hasOwnProperty.call(state.prices,key);
    const grossPrice=hasPrice?undefined:line.grossPrice;
    const price=grossPrice===undefined?(state.prices[key]??line.price):Math.round(Number(grossPrice)/(1+Number(draft?.tax??0)/100)*1000000)/1000000;
    return {id:uid(),name:line.name,qty:line.fixedQuantity?line.qty:Number((line.qty*amount).toFixed(2)),unit:line.unit,price,templateKey:key,...(grossPrice===undefined?{}:{grossPrice:Number(grossPrice)})};
  });
  const net=items.reduce((sum,item)=>sum+Number(item.price||0)*item.qty,0);
  const minimum=t.pricing?.minimumGross?Math.round(t.pricing.minimumGross/(1+Number(draft?.tax??0)/100)*100)/100:t.minimumNet;
  if(minimum&&net<minimum)items.push({id:uid(),name:`Minimum munkadíj kiegészítése – ${t.name}`,qty:1,unit:'alkalom',price:Math.round((minimum-net)*100)/100});
  return items;
}
function validCustomTemplates(list) {
  return list===undefined || (Array.isArray(list) && list.length<=1000 && new Set(list.map(t=>t.id)).size===list.length && list.every(t=>typeof t.id==='string' && t.id.length<=100 && !BASE_TEMPLATES.some(template=>template.id===t.id) && typeof t.name==='string' && t.name.length<=150 && t.icon==='❧' && typeof t.description==='string' && t.description.length<=500 && t.unit==='egyedi' && t.pricing===undefined && t.minimumNet===undefined && t.minimumQuantity===undefined && Array.isArray(t.items) && t.items.every(i=>typeof i==='string' && i.length<=180) && Array.isArray(t.lines) && t.lines.length===t.items.length && t.lines.length>0 && t.lines.length<=500 && t.lines.every(i=>typeof i.name==='string' && i.name.length<=180 && typeof i.unit==='string' && i.unit.length<=20 && Number.isFinite(Number(i.qty)) && Number(i.qty)>0 && Number(i.qty)<=1e8 && (i.price==='' || (Number.isFinite(Number(i.price)) && Number(i.price)>=0 && Number(i.price)<=1e9))&&(i.grossPrice===undefined||(Number.isFinite(Number(i.grossPrice))&&Number(i.grossPrice)>=0&&Number(i.grossPrice)<=1e9)))));
}
function openTemplateEditor(id) {
  const existing = state.templates.find(t => t.id === id);
  if (id !== 'new' && !existing) { location.replace('#templates'); toast('A saját sablon nem található.'); return; }
  if (!templateDraft || (id !== 'new' && templateDraft.id !== id)) {
    templateDraft = existing ? structuredClone(existing) : {id:uid(), name:'', description:'', lines:[{name:'',qty:1,unit:'m²',price:''}]};
    templateDraft.lines = templateDraft.lines.map(line => ({...line,id:uid(),price:existing ? (state.prices[`${existing.id}:${line.name}`] ?? line.price) : line.price}));
    templateDirty = false;
  }
  main.innerHTML = heading('SAJÁT MUNKÁK, SAJÁT TÉTELEK', existing ? 'Saját sablon szerkesztése' : 'Új saját sablon', 'Állítsd össze a gyakran használt munkákat. Ügyféladatokra nincs szükség.', '<a class="btn" href="#templates">← Munkasablonok</a>') + `
    <form id="custom-template-editor">
      <section class="form-section"><h2>A sablon adatai</h2><div class="form-grid">
        <div><label for="template-name">Sablon neve *</label><input id="template-name" data-template-field="name" required maxlength="80" value="${escapeHTML(templateDraft.name)}"></div>
        <div><label for="template-description">Rövid leírás</label><input id="template-description" data-template-field="description" maxlength="500" value="${escapeHTML(templateDraft.description)}"></div>
      </div></section>
      <section class="form-section"><h2>Munkatételek</h2><div id="template-lines" class="items"></div>
        <button class="btn" type="button" data-action="add-template-line" style="margin-top:18px">＋ Új munkatétel</button>
        <p class="hint">Az egységárat később is megadhatod. Új ajánlat készítésekor az itt mentett mennyiségek szorzóval módosíthatók.</p>
      </section>
      <div class="header-actions"><button class="btn primary" type="submit">✓ Saját sablon mentése</button><a class="btn" href="#templates">Mégse</a><span id="template-save-status" class="save-indicator" role="status"></span></div>
      <p class="hint">A saját sablonok jelenleg ebben a böngészőben mentődnek, és a biztonsági mentés is tartalmazza őket.</p>
    </form>`;
  renderTemplateRows();
}
function renderTemplateRows() {
  $('#template-lines').innerHTML = templateDraft.lines.map((line,index) => `
    <div class="quote-item" data-template-line="${line.id}">
      <div><label for="template-line-name-${index}">Tétel megnevezése *</label><input id="template-line-name-${index}" data-template-line-field="name" required maxlength="180" value="${escapeHTML(line.name)}"></div>
      <div><label for="template-line-qty-${index}">Mennyiség *</label><input id="template-line-qty-${index}" data-template-line-field="qty" required type="number" inputmode="decimal" min="0.01" max="100000000" step="0.01" value="${escapeHTML(line.qty)}"></div>
      <div><label for="template-line-unit-${index}">Egység *</label><select id="template-line-unit-${index}" data-template-line-field="unit">${['m²','m³','fm','db','zsák','óra','főnap','alkalom','kg','liter'].map(unit=>`<option ${line.unit===unit?'selected':''}>${unit}</option>`).join('')}</select></div>
      <div><label for="template-line-price-${index}">Nettó Ft / egység</label><input id="template-line-price-${index}" data-template-line-field="price" type="number" inputmode="decimal" min="0" max="1000000000" step="any" placeholder="Nincs ár" value="${escapeHTML(line.price)}"></div>
      <button class="remove" type="button" data-action="remove-template-line" data-id="${line.id}" aria-label="${index+1}. sablontétel eltávolítása">×</button>
    </div>`).join('');
}
function customTemplateRecord(value) {
  const name = value.name.trim();
  const lines = value.lines.map(line => ({name:line.name.trim(),qty:Number(line.qty),unit:line.unit,price:line.price===''?'':Number(line.price),...(line.grossPrice===undefined?{}:{grossPrice:Number(line.grossPrice)})}));
  if (!name || lines.some(line=>!line.name || !['m²','m³','fm','db','zsák','óra','főnap','alkalom','kg','liter'].includes(line.unit))) return null;
  const record = {id:value.id,name,description:value.description.trim(),icon:'❧',unit:'egyedi',items:lines.map(line=>line.name),lines};
  return validCustomTemplates([record]) ? record : null;
}
function storeCustomTemplate(record) {
  const previousTemplates=state.templates, previousPrices=state.prices;
  const exists=state.templates.some(t=>t.id===record.id);
  state.templates=exists?state.templates.map(t=>t.id===record.id?record:t):[...state.templates,record];
  state.prices={...state.prices};
  Object.keys(state.prices).filter(key=>key.startsWith(record.id+':')).forEach(key=>delete state.prices[key]);
  if(!persist()){state.templates=previousTemplates;state.prices=previousPrices;return false;}
  const index=templates.findIndex(t=>t.id===record.id);
  if(index<0)templates.push(record);else templates[index]=record;
  return true;
}
function saveTemplateEditor() {
  if(!$('#custom-template-editor').reportValidity())return;
  const record=customTemplateRecord(templateDraft);
  if(!record){toast('Adj meg nevet és legalább egy érvényes munkatételt.');return;}
  if(!storeCustomTemplate(record))return;
  templateDirty=false;templateDraft=null;location.hash='templates';toast('A saját munkasablont elmentettük.');
}
function deleteTemplate(id) {
  const record=templates.find(template=>template.id===id);
  if(!record)return false;
  if(!confirm(`Biztosan törlöd a(z) „${record.name}” teljes munkasablont? A meglévő árajánlatok megmaradnak.`))return false;
  const previousTemplates=state.templates,previousPrices=state.prices,previousHidden=state.hiddenTemplates;
  if(BASE_TEMPLATES.some(template=>template.id===id))state.hiddenTemplates=[...new Set([...state.hiddenTemplates,id])];
  state.templates=state.templates.filter(template=>template.id!==id);
  state.prices=Object.fromEntries(Object.entries(state.prices).filter(([key])=>!key.startsWith(id+':')));
  if(!persist()){state.templates=previousTemplates;state.prices=previousPrices;state.hiddenTemplates=previousHidden;return false;}
  const index=templates.findIndex(template=>template.id===id);
  if(index>=0)templates.splice(index,1);
  toast('A teljes munkasablont töröltük.');
  return true;
}
function laborItem(people,days,tax) {
  if(!Number.isInteger(people)||people<1||people>100||!Number.isFinite(days)||days<=0||days>1000||![0,5,18,27].includes(Number(tax)))return null;
  return {id:uid(),name:'Kertépítő munkadíj – 7 óra/főnap (08:00–15:00)',qty:Number((people*days).toFixed(2)),unit:'főnap',price:Math.round(LABOR_RATE.grossDaily/(1+Number(tax)/100)*1000000)/1000000,grossPrice:LABOR_RATE.grossDaily};
}
function laborDialog() {
  const hasMarketLabor=draft.items.some(item=>BASE_TEMPLATES.some(template=>template.pricing&&template.pricing.scope!=='Csak anyag'&&item.templateKey?.startsWith(template.id+':')));
  modal.innerHTML=`<form id="labor-form"><h2 id="modal-title">Saját munkadíj számítása</h2><p><strong>Bruttó ${money(LABOR_RATE.grossDaily)}/fő/nap</strong><br>08:00–15:00 · 7 óra munkavégzés</p>${hasMarketLabor?'<p class="notice">Az ajánlatban munkadíjat is tartalmazó piaci sablontétel szerepel. Ugyanarra a munkára ne add hozzá ismét a saját munkadíjat; előbb módosítsd a piaci tételt, vagy csak a külön munkát számold ide.</p>':''}<div class="form-grid"><div><label for="labor-people">Létszám (fő) *</label><input id="labor-people" type="number" min="1" max="100" step="1" required value="1"></div><div><label for="labor-days">Munkanapok száma *</label><input id="labor-days" type="number" min="0.01" max="1000" step="0.01" required value="1"></div></div><p id="labor-result" role="status"></p><p class="hint">Az ajánlat ${draft.tax}% ÁFA-beállításához tartozó nettó egységár kerül a tételbe. A bruttó napidíj ÁFA-váltáskor is megmarad, amíg kézzel át nem írod a tétel árát.</p><div class="dialog-actions"><button class="btn" type="button" data-action="close-modal">Mégse</button><button class="btn primary" type="submit">Munkadíj hozzáadása</button></div></form>`;
  function preview(){const people=Number($('#labor-people').value),days=Number($('#labor-days').value);const item=laborItem(people,days,draft.tax);$('#labor-result').textContent=item?`${item.qty} főnap · ${people*days*LABOR_RATE.hoursPerDay} munkaóra · bruttó ${money(people*days*LABOR_RATE.grossDaily)}`:'Adj meg érvényes létszámot és napszámot.';}
  $('#labor-form').addEventListener('input',preview);preview();modal.showModal();
  $('#labor-form').addEventListener('submit',event=>{event.preventDefault();const item=laborItem(Number($('#labor-people').value),Number($('#labor-days').value),draft.tax);if(!item)return;draft.items=draft.items.filter(item=>item.name||item.price!=='');draft.items.push({...item,groupId:uid(),groupTitle:'Saját csapat munkadíja'});dirty=true;renderItems(null);updateTotals();modal.close();toast('A saját munkadíjat hozzáadtuk az ajánlathoz.');});
}
function saveQuote() { const form = $('#quote-form'); if(!form.checkValidity()){const invalid=form.querySelector(':invalid'),group=invalid?.closest('.quote-group');if(group)group.open=true;form.reportValidity();return false;} if(!draft.title.trim() || draft.items.some(i=>!i.name.trim())){toast('Az ajánlat és a tételek neve nem maradhat üresen.');return false;} if (!draft.items.length) { toast('Adj hozzá legalább egy munkatételt.'); return false; } if (draft.status !== 'Piszkozat' && draft.items.some(item => item.price === '')) { toast('A végleges ajánlat minden tételéhez adj meg egységárat.'); return false; } const previous = state.quotes; state.quotes = [structuredClone(draft),...state.quotes.filter(q => q.id !== draft.id)]; if (!persist()) { state.quotes=previous; return false; } dirty=false; updateTotals(); $('#save-indicator').textContent='Mentve ezen az eszközön'; $('#nav-count').textContent=state.quotes.length; toast('Az árajánlatot elmentettük ezen az eszközön.'); return true; }
function clientDialog(id) { const client = state.clients.find(c => c.id === id) || {name:'',email:'',phone:'',address:''}; modal.innerHTML = `<form id="client-form"><h2 id="modal-title">${id?'Ügyfél szerkesztése':'Új ügyfél'}</h2><div class="form-grid"><div class="full"><label for="client-name">Név *</label><input id="client-name" name="name" required maxlength="120" autocomplete="name" value="${escapeHTML(client.name)}"></div><div><label for="client-email">E-mail-cím</label><input id="client-email" name="email" type="email" maxlength="254" autocomplete="email" value="${escapeHTML(client.email)}"></div><div><label for="client-phone">Telefonszám</label><input id="client-phone" name="phone" type="tel" maxlength="40" autocomplete="tel" value="${escapeHTML(client.phone)}"></div><div class="full"><label for="client-address">Munkavégzés címe</label><input id="client-address" name="address" maxlength="250" autocomplete="street-address" value="${escapeHTML(client.address)}"></div></div><p class="hint">Az ügyfél adatai egyelőre csak ezen az eszközön lesznek elérhetők.</p><div class="dialog-actions"><button class="btn" type="button" data-action="close-modal">Mégse</button><button class="btn primary" type="submit">Ügyfél mentése</button></div></form>`; modal.showModal(); $('#client-form').addEventListener('submit', event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.target)); Object.keys(values).forEach(key => values[key] = values[key].trim()); if (!values.name) { toast('Add meg az ügyfél nevét.'); return; } const previous = state.clients; const record = {...values,id:id || uid()}; state.clients = id ? state.clients.map(c => c.id===id?record:c) : [...state.clients,record]; if (!persist()) {state.clients=previous;return;} modal.close(); if (draft && $('#quote-form')) { draft.clientId=record.id; dirty=true; editor(); } else if (location.hash === '#clients') clientsView(); else overview(); toast('Az ügyfél adatait elmentettük.'); }); }
function templateDialog(id) {
  const available=id?templates.filter(t=>t.id===id):templates;
  if(!available.length){toast('Nincs választható munkasablon.');return;}
  modal.innerHTML=`<form id="template-form"><h2 id="modal-title">Munka hozzáadása sablonból</h2><label for="template-choice">Munkasablon</label><select id="template-choice">${available.map(t=>`<option value="${escapeHTML(t.id)}">${escapeHTML(t.name)}</option>`).join('')}</select><div style="margin-top:18px"><label for="template-area" id="template-quantity-label"></label><input id="template-area" type="number" min="0.01" max="100000000" step="0.01" inputmode="decimal" required autofocus></div><div id="template-price-info"></div><p class="hint">Az egységárak és tételek az ajánlatban módosíthatók. Saját sablonnál 1-es szorzóval az eredeti mennyiségek kerülnek az ajánlatba.</p><div class="dialog-actions"><button class="btn" type="button" data-action="close-modal">Mégse</button><button class="btn primary" type="submit">Tételek hozzáadása</button></div></form>`;
  function updateQuantity(){const t=available.find(t=>t.id===$('#template-choice').value);$('#template-quantity-label').textContent=(t.quantityLabel|| (t.unit==='egyedi'?'Mennyiségi szorzó':t.unit==='m²'?'Terület (m²)':t.unit==='fm'?'Hossz (fm)':t.unit==='db'?'Növények száma (db)':t.unit==='zsák'?'Zsákok száma':'Mennyiség ('+t.unit+')'))+' *';$('#template-area').step=['db','zsák'].includes(t.unit)?'1':'0.01';$('#template-area').min=t.minimumQuantity||(['db','zsák'].includes(t.unit)?'1':'0.01');$('#template-price-info').innerHTML=templatePricingHTML(t);}
  $('#template-choice').addEventListener('change',updateQuantity);updateQuantity();modal.showModal();
  $('#template-form').addEventListener('submit',event=>{
    event.preventDefault();const t=available.find(t=>t.id===$('#template-choice').value),amount=Number($('#template-area').value);
    if(!Number.isFinite(amount)||amount<=0||amount>1e8||(['db','zsák'].includes(t.unit)&&!Number.isInteger(amount)))return;
    const items=groupQuoteItems(templateLines(t,amount),t.name);if(items.some(item=>item.qty>1e8)){toast('A kiszámított mennyiség túl nagy.');return;}
    if(!draft||!$('#quote-form')){draft=newQuote();draft.title=t.name;draft.items=items;location.hash=`edit/${draft.id}`;}
    else{if(!draft.title){draft.title=t.name;$('#quote-title').value=t.name;}draft.items=draft.items.filter(i=>i.name||i.price!=='').concat(items);renderItems(null);}
    if(t.pricing){const note=`${t.name}: ${t.pricing.scope}. ${t.pricing.exclusions}`;draft.notes=[draft.notes,note].filter(Boolean).join('\n');if($('#quote-notes'))$('#quote-notes').value=draft.notes;}
    dirty=true;modal.close();if($('#quote-form'))updateTotals();
  });
}
function installDialog() { modal.innerHTML = `<h2 id="modal-title">A kertek mellé is magaddal viheted.</h2><p>Telepítsd a Kertépítési Menedzser Appot a kezdőképernyőre, hogy egy érintéssel megnyithasd.</p><p><strong>iPhone / iPad:</strong> nyisd meg Safariban, majd a Megosztás menüben válaszd a „Főképernyőhöz adás” lehetőséget.</p><p><strong>Android / számítógép:</strong> a böngésző menüjében válaszd az „Alkalmazás telepítése” vagy a „Hozzáadás a kezdőképernyőhöz” lehetőséget.</p><p class="hint">A telepítéshez támogatott böngésző és HTTPS-kapcsolat szükséges. A telepített alkalmazás internet nélkül is megnyitható, miután először betöltötted.</p><div class="dialog-actions"><button class="btn primary" data-action="close-modal">Értem</button></div>`; modal.showModal(); }
let previousHash = location.hash || '#overview';
function route() {
  const hash = location.hash || '#overview';
  if(templateDirty && hash!==previousHash && !confirm('A sablon módosításai még nincsenek elmentve. Elhagyod az oldalt?')){history.replaceState(null,'',previousHash);return;}
  if (dirty && draft && hash !== `#edit/${draft.id}` && !confirm('Az ajánlat módosításai még nincsenek elmentve. Elhagyod az oldalt?')) { history.replaceState(null,'',previousHash); return; }
  const [page,id] = hash.slice(1).split('/');
  if(page!=='template'){templateDraft=null;templateDirty=false;}
  if (page !== 'edit') { draft=null; dirty=false; }
  const nav = page==='template'?'templates':page==='edit'||page==='new'?'quotes':(['overview','quotes','templates','clients'].includes(page)?page:'overview');
  document.querySelectorAll('[data-nav]').forEach(link => { link.classList.toggle('active',link.dataset.nav===nav); if(link.dataset.nav===nav)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current'); });
  $('#breadcrumb').textContent={overview:'Áttekintés',quotes:'Árajánlatok',templates:'Munkasablonok',clients:'Ügyfelek'}[nav];
  $('#nav-count').textContent=state.quotes.length;
  if (page==='edit') { const saved=state.quotes.find(q => q.id===id); if (!draft || draft.id!==id) { if (!saved) { location.replace('#quotes'); toast('Az ajánlat nem található.');return; } draft=structuredClone(saved);dirty=false; } editor(); }
  else if (page==='new') { draft=newQuote(); history.replaceState(null,'',`#edit/${draft.id}`); editor(); if (id)templateDialog(id); }
  else if(page==='template')openTemplateEditor(id);
  else if (page==='quotes') quotesView(); else if(page==='templates')templatesView(); else if(page==='clients')clientsView(); else overview();
  previousHash=location.hash||'#overview'; window.scrollTo(0,0);
}
document.addEventListener('input', event => {
  if (event.target.id==='quote-search')filterQuotes();
  if (event.target.id==='client-search')filterClients();
  if(event.target.id==='template-search')filterTemplateGallery();
  if(templateDraft && event.target.closest('#custom-template-editor')){
    const field=event.target.dataset.templateField;const lineField=event.target.dataset.templateLineField;
    if(field)templateDraft[field]=event.target.value;
    if(lineField){const line=templateDraft.lines.find(line=>line.id===event.target.closest('[data-template-line]').dataset.templateLine);line[lineField]=event.target.value;if(lineField==='price')delete line.grossPrice;}
    templateDirty=true;$('#template-save-status').textContent='Nem mentett módosítások';return;
  }
  if (!draft || !event.target.closest('#quote-form'))return;
  const field=event.target.dataset.field;
  const itemField=event.target.dataset.itemField;
  if (field) {draft[field]=event.target.value;dirty=true; if(field==='clientId')updateClientDetails();if(field==='tax'){draft.items.forEach(item=>{if(item.grossPrice!==undefined)item.price=Math.round(Number(item.grossPrice)/(1+Number(draft.tax)/100)*1000000)/1000000;});renderItems();}}
  if (itemField) { const item=draft.items.find(i=>i.id===event.target.closest('[data-item]').dataset.item); item[itemField]=event.target.value;if(itemField==='price')delete item.grossPrice;dirty=true; }
  updateTotals();
});
document.addEventListener('change', event => { if(event.target.id==='quote-filter')filterQuotes(); });
document.addEventListener('submit', event => { if(event.target.id==='custom-template-editor'){event.preventDefault();saveTemplateEditor();return;} if(event.target.id==='quote-form'){event.preventDefault();saveQuote();} });
document.addEventListener('click', async event => {
  if(event.target.closest('.skip-link')){event.preventDefault();main.focus();return;}
  const button=event.target.closest('[data-action]'); if(!button)return;
  const action=button.dataset.action;
  if(action==='add-template-line'){templateDraft.lines.push({id:uid(),name:'',qty:1,unit:'db',price:''});templateDirty=true;renderTemplateRows();$('#template-lines .quote-item:last-child input').focus();}
  if(action==='remove-template-line'){templateDraft.lines=templateDraft.lines.filter(line=>line.id!==button.dataset.id);templateDirty=true;renderTemplateRows();}
  if(action==='template-prev'||action==='template-next'){const gallery=$('#template-gallery'),cards=gallery.querySelectorAll('.template-slide:not([hidden])');const step=cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:gallery.clientWidth;gallery.scrollBy({left:step*(action==='template-next'?1:-1),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  if(action==='labor')laborDialog();
  if(action==='delete-template' && deleteTemplate(button.dataset.id))templatesView();
  if(action==='save-template')customTemplateDialog();
  if(action==='new-quote')location.hash='new';
  if(action==='use-template')templateDialog(button.dataset.id);
  if(action==='new-client')clientDialog();
  if(action==='edit-client')clientDialog(button.dataset.id);
  if(action==='close-modal')modal.close();
  if(action==='add-template')templateDialog();
  if(action==='add-item'){draft.items.push({id:uid(),name:'',qty:1,unit:'db',price:''});dirty=true;renderItems('custom');updateTotals();$('#items .quote-group[data-group="custom"] .quote-item:last-child input').focus();}
  if(action==='remove-item'){draft.items=draft.items.filter(i=>i.id!==button.dataset.id);dirty=true;renderItems();updateTotals();}
  if(action==='save-prices'){const previous={...state.prices};draft.items.filter(i=>i.templateKey&&i.price!==''&&Number(i.price)>=0).forEach(i=>state.prices[i.templateKey]=Number(i.price));if(persist())toast('A sablonok egységárait elmentettük.');else state.prices=previous;}
  if(action==='print'){if(draft.items.some(i=>i.price==='')){toast('A nyomtatáshoz minden tételnél add meg az egységárat.');return;}if(saveQuote()){preparePrint();if(await waitForPrintLogo())window.print();}}
  if(action==='install'){if(window.matchMedia('(display-mode: standalone)').matches){toast('Az alkalmazás már telepítve van.');return;}if(pendingInstall){await pendingInstall.prompt();pendingInstall=null;}else installDialog();}
  if(action==='refresh'){
    if((dirty||templateDirty)&&!confirm('Nem mentett módosításaid vannak. Frissíted az alkalmazást?'))return;
    if(!navigator.onLine){toast('Nincs internetkapcsolat. Próbáld újra a frissítést, ha helyreállt a kapcsolat.');return;}
    try{const registration=await navigator.serviceWorker?.getRegistration();if(registration){await registration.update();const worker=registration.installing;if(worker)await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('timeout')),15000);worker.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='redundant'){clearTimeout(timeout);resolve();}});});if(registration.waiting){dirty=false;templateDirty=false;registration.waiting.postMessage('SKIP_WAITING');return;}}dirty=false;templateDirty=false;location.reload();}catch{toast('A frissítést nem sikerült ellenőrizni. Próbáld újra később.');}
  }
  if(action==='backup'){const blob=new Blob([JSON.stringify({...state,format:'km-backup-v1'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`km-mentes-${date()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('A biztonsági mentés letöltése elindult.');}
  if(action==='restore'){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>5000000)throw new Error();const data=JSON.parse(await file.text());if(!validBackup(data))throw new Error();if(!confirm('A visszaállítás felülírja az ezen az eszközön tárolt ügyfeleket, ajánlatokat és sablonárakat. Folytatod?'))return;const previous=state;state={clients:data.clients,quotes:data.quotes,prices:data.prices,templates:data.templates||[],hiddenTemplates:data.hiddenTemplates||[]};if(!persist()){state=previous;return;}syncTemplates();clientsView();toast('A biztonsági mentést visszaállítottuk.');}catch{toast('A fájl nem érvényes KM-biztonsági mentés.');}};input.click();}
});
function validBackup(data){const text=(v,max=5000)=>typeof v==='string'&&v.length<=max;const number=v=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1e12;return data?.format==='km-backup-v1'&&validCustomTemplates(data.templates)&&validHiddenTemplates(data.hiddenTemplates)&&Array.isArray(data.clients)&&Array.isArray(data.quotes)&&data.clients.length<=10000&&data.quotes.length<=10000&&data.prices&&typeof data.prices==='object'&&!Array.isArray(data.prices)&&Object.values(data.prices).every(number)&&data.clients.every(c=>text(c.id,100)&&text(c.name,120)&&c.name.trim()&&['email','phone','address'].every(k=>text(c[k],254)))&&new Set(data.clients.map(c=>c.id)).size===data.clients.length&&new Set(data.quotes.map(q=>q.id)).size===data.quotes.length&&data.quotes.every(q=>text(q.id,100)&&text(q.title,150)&&text(q.clientId,100)&&text(q.created,10)&&/^\d{4}-\d{2}-\d{2}$/.test(q.created)&&text(q.notes)&&[0,5,18,27].includes(Number(q.tax))&&['Piszkozat','Elküldve','Elfogadva','Elutasítva'].includes(q.status)&&Array.isArray(q.items)&&q.items.length<=500&&q.items.every(i=>text(i.id,100)&&text(i.name,180)&&text(i.unit,20)&&number(i.qty)&&Number(i.qty)>0&&(i.price===''||number(i.price))&&(i.groupId===undefined||text(i.groupId,100))&&(i.groupTitle===undefined||text(i.groupTitle,150))&&(i.grossPrice===undefined||number(i.grossPrice))&&(!i.templateKey||text(i.templateKey,250))));}
document.addEventListener('toggle',event=>{
  const group=event.target;
  if(!group.matches?.('.quote-group')||!group.open)return;
  document.querySelectorAll('#items .quote-group[open]').forEach(other=>{if(other!==group)other.open=false;});
},true);
window.addEventListener('hashchange',route);
window.addEventListener('resize',updateTemplateScroll);
window.addEventListener('beforeunload',event=>{if(dirty||templateDirty){event.preventDefault();event.returnValue='';}});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;});
window.addEventListener('appinstalled',()=>{pendingInstall=null;toast('Az alkalmazás telepítése sikerült.');});
function connection(){ $('#connection').textContent=navigator.onLine?'Helyi tárolás':'Offline · helyi tárolás'; }
window.addEventListener('online',connection);window.addEventListener('offline',connection);
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>toast('Az offline működés most nem kapcsolható be. Az alkalmazást továbbra is használhatod.'));let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading){reloading=true;if(!dirty&&!templateDirty)location.reload();else toast('Új verzió érhető el. Mentsd a módosításokat, majd nyomd meg a Frissítés gombot.');}});}
route();connection();if(storageError)toast('A korábbi helyi adatokat nem sikerült beolvasni. Állítsd vissza a biztonsági mentésedet, ha van.');
