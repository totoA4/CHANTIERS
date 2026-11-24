/* Application Suivi de chantiers : vues, carte, cadastre, annotations, partage d'équipe. */
{
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEYS=['francois','elagage','plantation','broyage'];
const ST={prevu:'À venir',en_cours:'En cours',pause:'En pause',termine:'Terminé'};
const ORD={en_cours:0,prevu:1,pause:2,termine:3};
const COL={francois:'#2c6694',elagage:'#7d4f24',plantation:'#2f7a3a',broyage:'#9a5f08'};
const COLS=[['#d93025','Rouge'],['#f29900','Orange'],['#1a73e8','Bleu'],['#188038','Vert'],['#6d4c41','Marron']];
const sv=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const ICON={
francois:sv('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
elagage:sv('<circle cx="12" cy="8.5" r="6"/><path d="M12 22v-8M12 15l-3-3M12 13l3-3"/>'),
plantation:sv('<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 10c0-3 2-5 6-5 0 3-2 5-6 5z"/><path d="M6 21h12"/>'),
broyage:sv('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
back:sv('<path d="M15 5l-7 7 7 7"/>'),
plus:sv('<path d="M12 5v14M5 12h14"/>'),
set:sv('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="7" cy="18" r="2" fill="currentColor"/>')};
const TPL={
francois:['Visite et devis validé','Préparation du terrain','Travaux réalisés','Nettoyage du chantier','Réception client'],
elagage:['DICT / repérage des réseaux','Balisage de la zone de travail','Élagage / taille','Évacuation ou broyage des rémanents','Nettoyage','Photos après travaux'],
plantation:['Livraison des végétaux','Préparation du sol','Trous de plantation','Plantation','Paillage','Arrosage de plantation','Tuteurage'],
broyage:['Accès broyeur vérifié','Tri des branchages','Broyage','Évacuation / épandage des copeaux','Nettoyage']};
const FIELDS={
francois:[{k:'travaux',l:'Type de travaux'},{k:'surface',l:'Surface (m²)',t:'number'}],
elagage:[{k:'arbres',l:'Nombre d’arbres',t:'number'},{k:'essences',l:'Essences'},{k:'hauteur',l:'Hauteur max (m)',t:'number'},{k:'technique',l:'Technique',o:['Grimpe','Nacelle','Démontage','Abattage','Taille douce']},{k:'evac',l:'Rémanents',o:['Évacués','Broyés sur place','Laissés au client']},{k:'reseaux',l:'Réseaux à proximité',o:['Non','Oui – lignes électriques','Oui – voirie','Oui – autre']}],
plantation:[{k:'vegetaux',l:'Végétaux (une ligne par essence)',t:'area'},{k:'paillage',l:'Paillage',o:['Aucun','Copeaux','Toile','Feutre biodégradable']},{k:'arrosage',l:'Arrosage',o:['Manuel','Goutte-à-goutte','Par le client']},{k:'garantie',l:'Garantie de reprise (mois)',t:'number'}],
broyage:[{k:'volume',l:'Volume estimé (m³)',t:'number'},{k:'matiere',l:'Matière',o:['Branchages','Souches','Déchets verts mixtes']},{k:'machine',l:'Machine',o:['Broyeur thermique','Broyeur tracté','Rogneuse de souches']},{k:'copeaux',l:'Copeaux',o:['Laissés sur place','Paillage massifs','Évacués']}]};
const HILLS='<svg class="hills" viewBox="0 0 400 74" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 50C60 20 120 22 190 44S320 30 400 36V74H0z" fill="#2f5a3c"/><g fill="#24492f"><circle cx="70" cy="30" r="13"/><rect x="68" y="38" width="4" height="12" fill="#1a3423"/><circle cx="300" cy="26" r="10"/><circle cx="318" cy="31" r="8"/><rect x="299" y="32" width="3" height="10" fill="#1a3423"/></g><path d="M0 62C90 44 170 50 240 60S350 52 400 56V74H0z" fill="var(--bg)"/></svg>';
const LS='paysage-carte-v1';
/* ---------- partage d'équipe : config.js, sinon configuration collée dans l'app ---------- */
const cfgOK=c=>!!(c&&c.apiKey&&c.projectId);
let FBL=null;try{FBL=JSON.parse(localStorage.getItem('paysage-carte-v1-firebase'))}catch(e){}
const FB=cfgOK(window.FIREBASE_CONFIG)?window.FIREBASE_CONFIG:(cfgOK(FBL)?FBL:null);
const FB_LOCAL=!!FB&&FB===FBL;
function parseCfg(t){const o={};String(t).replace(/(\w+)\s*:\s*["'`]([^"'`]+)["'`]/g,(m,k,v)=>{o[k]=v});return cfgOK(o)?o:null}
const cfgJs=o=>'/* Partage des données entre tous les utilisateurs (Firebase).\n   Remplacez ces valeurs par celles de votre projet, puis envoyez ce fichier sur GitHub. */\nwindow.FIREBASE_CONFIG = {\n'+['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'].map(k=>`  ${k}: "${(o&&o[k])||''}"`).join(',\n')+'\n};\n';
const LSK=FB?LS+'-equipe':LS;
let D=JSON.parse($('#data').textContent);
if(FB){D.chantiers=[];D.exemples=false}
let hadCache=false;try{const l=JSON.parse(localStorage.getItem(LSK));if(l&&Array.isArray(l.chantiers)){D=l;hadCache=true}}catch(e){}
let cloud=null,authState=FB?(hadCache?'ok':'wait'):'off',lastJ={},lastR='',PH={},rq=false,PEND={up:[],del:[],reg:false};
try{PEND=Object.assign(PEND,JSON.parse(localStorage.getItem(LS+'-attente'))||{})}catch(e){}
let P={base:'osm',cad:true};try{Object.assign(P,JSON.parse(localStorage.getItem(LS+'-carte'))||{})}catch(e){}
let V=null,HM=null,mode=null,tmp=null,busy=false,pending=null,filt='tous',q='',last=null,dS='mid';

const lbl=k=>D.reglages.modules[k]||k;
const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const fd=d=>d?new Date(d+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'—';
const fdl=d=>d?new Date(d+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'';
const fmtH=n=>String(Math.round((+n||0)*10)/10).replace('.',',')+' h';
const fmtA=m=>m>=10000?(m/10000).toLocaleString('fr-FR',{maximumFractionDigits:2})+' ha':Math.round(m).toLocaleString('fr-FR')+' m²';
const fmtL=m=>m>=1000?(m/1000).toLocaleString('fr-FR',{maximumFractionDigits:2})+' km':Math.round(m).toLocaleString('fr-FR')+' m';
const uid=()=>Math.random().toString(36).slice(2,9);
const find=id=>D.chantiers.find(c=>c.id===id);
const curC=()=>{const h=location.hash.slice(1);return h.startsWith('c-')?find(h.slice(2)):null};
const prog=c=>c.statut==='termine'?100:(c.taches.length?Math.round(c.taches.filter(t=>t.done).length*100/c.taches.length):0);
const hrs=c=>c.journal.reduce((s,j)=>s+(+j.heures||0),0);
const safe=s=>/^(data:image\/|https:\/\/)/.test(String(s))?s:'';
const sorter=(a,b)=>(ORD[a.statut]-ORD[b.statut])||String(a.debut).localeCompare(String(b.debut));
const hasG=c=>!!c&&c.lat!==''&&c.lat!=null&&c.lon!==''&&c.lon!=null&&!isNaN(+c.lat)&&!isNaN(+c.lon);
const osmUrl=c=>hasG(c)?`https://www.openstreetmap.org/?mlat=${+c.lat}&mlon=${+c.lon}#map=19/${+c.lat}/${+c.lon}`:'https://www.openstreetmap.org/search?query='+encodeURIComponent(c.adresse||'');
const norm=c=>{c.parcelles=c.parcelles||[];c.annotations=c.annotations||[];return c};
D.chantiers.forEach(norm);D.chantiers.forEach(c=>lastJ[c.id]=JSON.stringify(c));lastR=JSON.stringify(D.reglages);

/* ---------- mesures ---------- */
const hv=(a,b)=>{const R=6371008.8,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const len=p=>p.slice(1).reduce((s,x,i)=>s+hv(p[i],x),0);
function area(p){const R=6378137,r=Math.PI/180;let a=0;for(let i=0;i<p.length;i++){const u=p[i],w=p[(i+1)%p.length];a+=(w[1]-u[1])*r*(2+Math.sin(u[0]*r)+Math.sin(w[0]*r))}return Math.abs(a*R*R/2)}
function geomArea(g){if(!g)return 0;const ring=r=>area(r.map(x=>[x[1],x[0]]));if(g.type==='Polygon')return ring(g.coordinates[0]);if(g.type==='MultiPolygon')return g.coordinates.reduce((s,pl)=>s+ring(pl[0]),0);return 0}
const annMeasure=a=>a.type==='ligne'?fmtL(len(a.pts)):a.type==='zone'?fmtA(area(a.pts))+' · périmètre '+fmtL(len([...a.pts,a.pts[0]])):'';

/* ---------- cadastre (IGN) ---------- */
function fixAxis(g,lat,lng){let f=g.coordinates;while(Array.isArray(f[0]))f=f[0];if(Math.abs(f[0]-lat)<Math.abs(f[0]-lng)){const sw=a=>typeof a[0]==='number'?[a[1],a[0]]:a.map(sw);g.coordinates=sw(g.coordinates)}return g}
function parcelOf(f,lat,lng){const p=f.properties||{},g=fixAxis(f.geometry,lat,lng);return{idu:String(p.idu||f.id||uid()),section:String(p.section||''),numero:String(p.numero||''),commune:String(p.nom_com||p.commune||''),contenance:+p.contenance||Math.round(geomArea(g)),estimee:!(+p.contenance),geom:g}}
async function parcelAt(lat,lng){
const g=JSON.stringify({type:'Point',coordinates:[+lng.toFixed(7),+lat.toFixed(7)]});
try{const r=await fetch('https://apicarto.ign.fr/api/cadastre/parcelle?geom='+encodeURIComponent(g));if(r.ok){const j=await r.json();if(j.features&&j.features[0])return parcelOf(j.features[0],lat,lng)}}catch(e){}
try{const u='https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=1&CQL_FILTER='+encodeURIComponent(`INTERSECTS(geom,POINT(${lat} ${lng}))`);const r=await fetch(u);if(r.ok){const j=await r.json();if(j.features&&j.features[0])return parcelOf(j.features[0],lat,lng)}}catch(e){}
return null}
async function geocode(c){try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q='+encodeURIComponent(c.adresse));const j=await r.json();if(j&&j[0]){c.lat=+(+j[0].lat).toFixed(6);c.lon=+(+j[0].lon).toFixed(6);return true}}catch(e){}return false}

/* ---------- couches de carte ---------- */
const wmts=(l,s,f)=>`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${l}&STYLE=${encodeURIComponent(s)}&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=${encodeURIComponent(f)}`;
const T={
osm:()=>L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,maxNativeZoom:19}),
photo:()=>L.tileLayer(wmts('ORTHOIMAGERY.ORTHOPHOTOS','normal','image/jpeg'),{maxZoom:20,maxNativeZoom:19}),
cad:()=>L.tileLayer(wmts('CADASTRALPARCELS.PARCELLAIRE_EXPRESS','PCI vecteur','image/png'),{maxZoom:20,maxNativeZoom:19,minZoom:13})};
const pin=c=>L.circleMarker([+c.lat,+c.lon],{radius:11,color:'#fff',weight:3,fillColor:COL[c.module],fillOpacity:1});
const popupC=c=>`<b>${esc(c.titre)}</b><br>${esc(c.client)} · ${ST[c.statut]}<br><a href="#c-${esc(c.id)}">Ouvrir la fiche</a>`;
const savePref=()=>{try{localStorage.setItem(LS+'-carte',JSON.stringify(P))}catch(e){}};
function setBase(){if(!V||!V.map)return;if(V.base)V.map.removeLayer(V.base);V.base=T[P.base]().addTo(V.map);V.base.bringToBack()}
function setCad(){if(!V||!V.map)return;if(V.cad){V.map.removeLayer(V.cad);V.cad=null}if(P.cad)V.cad=T.cad().addTo(V.map)}
const dpx=()=>innerWidth>=800?0:({min:140,mid:innerHeight*.5,max:innerHeight*.88}[dS]);
function boundsOf(list){const b=L.latLngBounds([]);list.forEach(c=>{c.parcelles.forEach(p=>{try{b.extend(L.geoJSON(p.geom).getBounds())}catch(e){}});c.annotations.forEach(a=>a.pts.forEach(x=>b.extend(x)));if(hasG(c))b.extend([+c.lat,+c.lon])});return b}
function fit(){if(!V||!V.map)return;const list=V.kind==='det'?[curC()]:D.chantiers.filter(c=>c.module===V.mod);let b=boundsOf(list);if(!b.isValid())b=boundsOf(D.chantiers.filter(hasG));
const opt={paddingTopLeft:[innerWidth>=800?480:24,80],paddingBottomRight:[104,dpx()+24],maxZoom:18};
if(!b.isValid())V.map.setView([46.6,2.4],6);else if(b.getNorthEast().equals(b.getSouthWest()))V.map.fitBounds(b.pad(.002),opt);else V.map.fitBounds(b,opt)}
function annLayer(a){const col=a.couleur||'#d93025';let l;
if(a.type==='note')l=L.marker(a.pts[0],{icon:L.divIcon({className:'nwrap',html:`<div class="note-ic" style="--nc:${esc(col)}">${esc(a.texte||'Note')}</div>`,iconSize:[0,0],iconAnchor:[0,0]})});
else if(a.type==='ligne')l=L.polyline(a.pts,{color:col,weight:6,bubblingMouseEvents:false});
else l=L.polygon(a.pts,{color:col,weight:3,fillOpacity:.25,bubblingMouseEvents:false});
if(a.type!=='note'&&a.texte)l.bindTooltip(esc(a.texte),{permanent:true,direction:'center',className:'alab'});
l.on('click',e=>{if(mode){onMapClick(e);return}L.popup().setLatLng(e.latlng).setContent(`<b>${esc(a.texte||{note:'Note',ligne:'Ligne',zone:'Zone'}[a.type])}</b>${annMeasure(a)?'<br>'+annMeasure(a):''}<br><button class="pbtn" data-act="delann" data-a="${esc(a.id)}">Supprimer</button>`).openOn(V.map)});
return l}
function drawOverlays(){if(!V||!V.map)return;if(V.over)V.over.remove();const g=L.layerGroup().addTo(V.map);V.over=g;const det=V.kind==='det';
const list=det?[curC()]:D.chantiers.filter(c=>c.module===V.mod);
list.forEach(c=>{const col=COL[c.module];
c.parcelles.forEach(p=>{const lay=L.geoJSON(p.geom,{style:{color:col,weight:3,fillColor:col,fillOpacity:.22},interactive:!det});
if(det)lay.bindTooltip(esc(p.section+' '+p.numero),{permanent:true,direction:'center',className:'plab'});else lay.bindPopup(popupC(c));lay.addTo(g)});
if(det)c.annotations.forEach(a=>annLayer(a).addTo(g));
if(hasG(c)){const m=pin(c);if(!det)m.bindPopup(popupC(c));m.addTo(g)}});
drawTmp()}
function drawTmp(){if(!V||!V.map)return;if(V.tmpL){V.tmpL.remove();V.tmpL=null}if(!tmp)return;const g=L.layerGroup(),o={color:'#d93025',weight:4,dashArray:'8 6',interactive:false};
if(tmp.pts.length>1)(tmp.type==='zone'&&tmp.pts.length>2?L.polygon(tmp.pts,{...o,fillOpacity:.15}):L.polyline(tmp.pts,o)).addTo(g);
tmp.pts.forEach(x=>L.circleMarker(x,{radius:7,color:'#fff',weight:2,fillColor:'#d93025',fillOpacity:1,interactive:false}).addTo(g));g.addTo(V.map);V.tmpL=g}
function teardown(){if(V&&V.map)V.map.remove();V=null;if(HM){HM.remove();HM=null}mode=null;tmp=null}
function mount(kind,mod,key){teardown();$('#root').innerHTML=shell(kind,mod);V={key,kind,mod,map:null};if(!window.L)return;
const m=L.map('mapbg',{zoomControl:false,attributionControl:false,maxZoom:20}).setView([46.6,2.4],6);V.map=m;setBase();setCad();
m.on('click',onMapClick);
m.on('popupopen',e=>{const el=e.popup.getElement();if(el)el.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',ev=>{ev.stopPropagation();ev.preventDefault();act(b)}))})}
function initHomeMap(){const el=$('#homemap');if(!el)return;if(!window.L){el.innerHTML='<p class="nomap">Carte indisponible : vérifiez la connexion internet.</p>';return}
HM=L.map(el,{scrollWheelZoom:false,attributionControl:false});T.osm().addTo(HM);const cs=D.chantiers.filter(c=>hasG(c)&&c.statut!=='termine');cs.forEach(c=>pin(c).bindPopup(popupC(c)).addTo(HM));
const b=boundsOf(cs);if(b.isValid())HM.fitBounds(b,{padding:[30,30],maxZoom:15});else HM.setView([46.6,2.4],5)}

/* ---------- outils de la fiche ---------- */
function setMode(m){mode=(m&&mode!==m)?m:null;tmp=(mode==='ligne'||mode==='zone')?{type:mode,pts:[]}:null;drawTmp();if(mode)setDrawer('min');updTools();
if(mode==='parcelle'&&V&&V.map&&V.map.getZoom()<16)toast('Zoomez sur le terrain pour bien voir les parcelles')}
function updTools(){const tb=$('#tb-base');if(!tb)return;tb.textContent=P.base==='osm'?'Photo':'Plan';$('#tb-cad').classList.toggle('on',P.cad);
document.querySelectorAll('[data-act=mode]').forEach(b=>b.classList.toggle('on',b.dataset.v===mode));
const h=$('#hint');if(!mode){h.hidden=true;h.innerHTML='';return}h.hidden=false;
const meas=tmp&&tmp.pts.length>1?' · '+(tmp.type==='zone'&&tmp.pts.length>2?fmtA(area(tmp.pts)):fmtL(len(tmp.pts))):'';
const txt={parcelle:'Touchez une parcelle pour l’ajouter au chantier ou la retirer.',note:'Touchez la carte à l’endroit de la note.',ligne:'Touchez les points de la ligne (haie, clôture, bordure…).',zone:'Touchez les angles de la zone (massif, gazon, zone à broyer…).',pin:'Touchez l’emplacement du chantier.'}[mode];
h.innerHTML=`<p>${txt}<b>${meas}</b></p><div class="hb">${tmp?`<button class="btn sm" data-act="undo-pt">Retirer un point</button><button class="btn sm primary" data-act="finish">Terminer</button>`:''}<button class="btn sm" data-act="mode-off">${mode==='parcelle'?'Fini':'Annuler'}</button></div>`}
async function onMapClick(e){const c=curC();if(!c||!mode)return;const lat=e.latlng.lat,lng=e.latlng.lng;
if(mode==='parcelle'){if(busy)return;busy=true;toast('Recherche de la parcelle…');const p=await parcelAt(lat,lng);busy=false;
if(!p){toast('Aucune parcelle trouvée ici (ou pas de connexion)');return}
const i=c.parcelles.findIndex(x=>x.idu===p.idu);
if(i>=0){c.parcelles.splice(i,1);toast(`Parcelle ${p.section} ${p.numero} retirée`)}else{c.parcelles.push(p);toast(`Parcelle ${p.section} ${p.numero} ajoutée · ${fmtA(p.contenance)}`);if(!hasG(c)){c.lat=+lat.toFixed(6);c.lon=+lng.toFixed(6)}}
save();render()}
else if(mode==='note')openSheet(fAnn('note',[[+lat.toFixed(7),+lng.toFixed(7)]]));
else if(tmp){tmp.pts.push([+lat.toFixed(7),+lng.toFixed(7)]);drawTmp();updTools()}
else if(mode==='pin'){c.lat=+lat.toFixed(6);c.lon=+lng.toFixed(6);setMode(null);save();render();toast('Chantier placé sur la carte')}}
function setDrawer(s){dS=s;const d=$('#drawer');if(d)d.dataset.s=s}

/* ---------- vues ---------- */
function card(c){const p=prog(c),n=c.taches.filter(t=>t.done).length,np=c.parcelles.length;
return `<a class="card" href="#c-${esc(c.id)}" style="--mc:var(--${c.module})"><div class="ch"><span class="mod">${ICON[c.module]}${esc(lbl(c.module))}</span><span class="pill s-${c.statut}">${ST[c.statut]}</span></div><h3>${esc(c.titre)}</h3><p class="meta">${esc(c.client)}${c.adresse?' · '+esc(c.adresse):''}</p><div class="bar"><i style="width:${p}%"></i></div><div class="cf"><span>${p} % · ${n}/${c.taches.length} tâches${np?' · '+np+' parcelle'+(np>1?'s':''):''}</span><span>${fd(c.debut)} → ${fd(c.fin)}</span></div></a>`}
function tile(k){const cs=D.chantiers.filter(c=>c.module===k),e=cs.filter(c=>c.statut==='en_cours').length;
return `<a class="tile" href="#m-${k}" style="--mc:var(--${k})"><span class="ti">${ICON[k]}</span><span class="tn">${esc(lbl(k))}</span><span class="tc">${e} en cours · ${cs.length} au total</span></a>`}
function vHome(){const all=D.chantiers,enc=all.filter(c=>c.statut==='en_cours').sort(sorter),av=all.filter(c=>c.statut==='prevu'),m=iso().slice(0,7);
const hm=all.reduce((s,c)=>s+c.journal.filter(j=>String(j.date).startsWith(m)).reduce((a,j)=>a+(+j.heures||0),0),0);
return `<header class="hero"><div class="hero-in"><div class="toprow"><div><p class="date">${fdl(iso())}</p><h1>${esc(D.reglages.entreprise)}</h1></div><button class="ibtn" data-act="settings" aria-label="Réglages">${ICON.set}</button></div>
<div class="kpis"><div><b>${enc.length}</b><span>en cours</span></div><div><b>${av.length}</b><span>à venir</span></div><div><b>${fmtH(hm)}</b><span>ce mois-ci</span></div></div></div>${HILLS}</header>
<main class="wrap"><div class="tiles">${KEYS.map(tile).join('')}</div>
<h2 class="sec">Carte des chantiers</h2><div class="homemap" id="homemap"></div><p class="attr" style="margin-top:6px">Chantiers en cours, à venir et en pause · © OpenStreetMap</p>
<h2 class="sec">Chantiers en cours</h2>${enc.length?`<div class="list">${enc.map(card).join('')}</div>`:'<p class="empty">Aucun chantier en cours.</p>'}
${D.exemples?'<p class="note">Les chantiers affichés sont des exemples. <button class="link" data-act="clear-ex">Les effacer</button></p>':''}</main>`}
function listHTML(k){const s=q.toLowerCase();const cs=D.chantiers.filter(c=>c.module===k&&(filt==='tous'||c.statut===filt)&&(!s||(c.titre+' '+c.client+' '+c.adresse+' '+c.equipe).toLowerCase().includes(s))).sort(sorter);
return cs.length?`<div class="list">${cs.map(card).join('')}</div>`:'<p class="empty">Aucun chantier ici. Touchez « Nouveau » pour en créer un.</p>'}
function shell(kind,mod){const det=kind==='det';
return `<div id="mapbg" class="mapbg">${window.L?'':'<p class="nomap">Carte indisponible : vérifiez la connexion internet.</p>'}</div>
<div class="topbar" style="--mc:var(--${mod})"><a class="fbtn round" href="${det?'#m-'+mod:'#'}" aria-label="Retour">${ICON.back}</a><div class="fbtn ttl"><span class="tic">${ICON[mod]}</span><span id="ttl"></span></div></div>
<div class="tools" style="--mc:var(--${mod})"><button class="tool" data-act="base" id="tb-base">Photo</button><button class="tool" data-act="cad" id="tb-cad">Cadastre</button>
${det?'<span class="tsep"></span>'+[['parcelle','Parcelle'],['note','Note'],['ligne','Ligne'],['zone','Zone'],['pin','Placer']].map(([m,l])=>`<button class="tool" data-act="mode" data-v="${m}">${l}</button>`).join(''):''}
<button class="tool" data-act="me">Ma position</button></div>
<div id="hint" class="hintbar" hidden></div>
<div class="drawer" id="drawer" data-s="${dS}" style="--mc:var(--${mod})"><button class="handle" data-act="drawer" aria-label="Agrandir ou réduire"><i></i></button><div class="dc" id="dc"></div></div>`}
const ATTR='<p class="attr">Fond de carte © contributeurs OpenStreetMap · Cadastre et photos aériennes © IGN</p>';
function dMod(k){const cs=D.chantiers.filter(c=>c.module===k),e=cs.filter(c=>c.statut==='en_cours').length;
return `<div class="dh"><div><h2>${esc(lbl(k))}</h2><p class="sub">${cs.length} chantier${cs.length>1?'s':''} · ${e} en cours</p></div><button class="btn primary" data-act="new" data-m="${k}">${ICON.plus}Nouveau</button></div>
<div class="tools2" style="display:grid;gap:10px"><input id="q" type="search" placeholder="Rechercher un chantier, un client…" value="${esc(q)}" aria-label="Rechercher"><div class="chips">${['tous',...Object.keys(ST)].map(s=>`<button class="chip ${filt===s?'on':''}" data-act="filt" data-v="${s}">${s==='tous'?'Tous':ST[s]}</button>`).join('')}</div></div><div id="lst">${listHTML(k)}</div>${ATTR}`}
function row(l,v){return v?`<div><dt>${l}</dt><dd>${v}</dd></div>`:''}
function dDet(c){const p=prog(c),h=hrs(c),hp=+c.heuresPrevues||0,n=c.taches.filter(t=>t.done).length,col=COL[c.module];
const tel=c.tel?`${esc(c.tel)} · <a href="tel:${esc(c.tel.replace(/[^\d+]/g,''))}">Appeler</a>`:'';
const det=FIELDS[c.module].map(f=>row(esc(f.l),esc(c.details[f.k]))).join('');
const tot=c.parcelles.reduce((s,x)=>s+(+x.contenance||0),0);
const J=[...c.journal].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
return `<div class="dh"><div><h1>${esc(c.titre)}</h1><p class="sub">${esc(c.client)}${c.adresse?' · '+esc(c.adresse):''}</p></div></div>
<div class="seg" role="group" aria-label="Statut">${Object.keys(ST).map(s=>`<button class="${c.statut===s?'on':''}" data-act="status" data-v="${s}">${ST[s]}</button>`).join('')}</div>
<section class="panel stats"><div><b>${p} %</b><span>avancement</span><div class="bar"><i style="width:${p}%"></i></div></div><div><b>${fmtH(h)}${hp?' / '+fmtH(hp):''}</b><span>${hp?'réalisées / prévues':'heures réalisées'}</span><div class="bar ${hp&&h>hp?'over':''}"><i style="width:${hp?Math.min(100,h*100/hp):0}%"></i></div></div></section>
<section class="panel"><div class="ph"><h2>Parcelles cadastrales</h2><button class="btn sm" data-act="mode" data-v="parcelle">${ICON.plus}Parcelle</button></div>
${c.parcelles.length?`<ul class="plist">${c.parcelles.map((x,i)=>`<li><i class="dot" style="background:${col}"></i><button class="lk" data-act="zoomp" data-i="${i}"><b>Section ${esc(x.section)} n° ${esc(x.numero)}</b><span>${esc(x.commune)} · ${x.estimee?'≈ ':''}${fmtA(+x.contenance||0)}</span></button><button class="x" data-act="delp" data-i="${i}" aria-label="Retirer la parcelle">×</button></li>`).join('')}</ul><p class="tot">Surface cadastrale totale : ${fmtA(tot)}</p>`:'<p class="hint">Touchez « Parcelle » puis les parcelles du chantier sur la carte.</p>'}</section>
<section class="panel"><div class="ph"><h2>Annotations</h2><button class="btn sm" data-act="mode" data-v="note">${ICON.plus}Note</button></div>
${c.annotations.length?`<ul class="plist">${c.annotations.map(a=>`<li><i class="dot" style="background:${esc(a.couleur)}"></i><button class="lk" data-act="zooma" data-a="${esc(a.id)}"><b>${esc(a.texte||{note:'Note',ligne:'Ligne',zone:'Zone'}[a.type])}</b><span>${{note:'Note',ligne:'Ligne',zone:'Zone'}[a.type]}${annMeasure(a)?' · '+annMeasure(a):''}</span></button><button class="x" data-act="delann" data-a="${esc(a.id)}" aria-label="Supprimer l’annotation">×</button></li>`).join('')}</ul>`:'<p class="hint">Avec les outils Note, Ligne et Zone, dessinez sur la carte : massif, haie à planter, arbre à abattre, accès…</p>'}</section>
<section class="panel"><h2>Localisation</h2><p class="hint" style="margin-bottom:10px">${hasG(c)?'GPS '+(+c.lat)+', '+(+c.lon):'Chantier pas encore placé : utilisez « Placer » ou le bouton ci-dessous.'}</p><div class="hb"><button class="btn sm" data-act="geo-addr">Localiser l’adresse</button><a class="btn sm" href="${esc(osmUrl(c))}" target="_blank" rel="noopener">Ouvrir OpenStreetMap</a></div></section>
<section class="panel"><h2>Informations</h2><dl class="info">${row('Téléphone',tel)}${row('Dates',fd(c.debut)+' → '+fd(c.fin))}${row('Équipe',esc(c.equipe))}${det}</dl>${c.notes?`<p class="notes">${esc(c.notes)}</p>`:''}</section>
<section class="panel"><h2>Tâches <small>${n}/${c.taches.length}</small></h2><ul class="tasks">${c.taches.map((t,i)=>`<li><label><input type="checkbox" data-act="task" data-i="${i}" ${t.done?'checked':''}><span>${esc(t.t)}</span></label><button class="x" data-act="deltask" data-i="${i}" aria-label="Supprimer la tâche">×</button></li>`).join('')}</ul>
<form class="addt" data-form="task"><input name="t" placeholder="Ajouter une tâche" aria-label="Nouvelle tâche"><button>Ajouter</button></form></section>
<section class="panel"><div class="ph"><h2>Journal de chantier</h2><button class="btn sm" data-act="journal">${ICON.plus}Entrée</button></div>
${J.length?J.map(j=>`<article class="je"><div class="jh"><b>${esc(fdl(j.date))}</b><span>${esc(j.auteur)}${j.auteur?' · ':''}${fmtH(j.heures)}</span></div>${j.note?`<p>${esc(j.note)}</p>`:''}${(j.photos||[]).length?`<div class="phr">${j.photos.map(s=>{const src=phSrc(s);return (src||String(s).startsWith('ph:'))?`<button data-act="zoom" data-src="${esc(s)}"><img data-ph="${esc(s)}" ${src?`src="${esc(src)}"`:''} alt="Photo du chantier" loading="lazy"></button>`:''}).join('')}</div>`:''}<button class="link danger" data-act="delj" data-j="${esc(j.id)}">Supprimer</button></article>`).join(''):'<p class="hint">Notez ici chaque journée : heures, travaux faits, photos.</p>'}</section>
<div class="actions"><button class="btn" data-act="edit">Modifier</button><button class="btn" data-act="dup">Dupliquer</button><button class="btn danger" data-act="del">Supprimer</button></div>${ATTR}`}

function render(){if(authState==='wait'||authState==='login'){teardown();document.body.classList.remove('mapview');$('#root').innerHTML=authState==='wait'?'<div class="login"><p class="lwait">Connexion…</p></div>':vLogin();return}
const h=location.hash.slice(1);let kind='home',mod=null,c=null;
if(h.startsWith('m-')&&KEYS.includes(h.slice(2))){kind='mod';mod=h.slice(2)}
else if(h.startsWith('c-')&&(c=find(h.slice(2)))){kind='det';mod=c.module}
document.body.classList.toggle('mapview',kind!=='home');
if(kind==='home'){teardown();$('#root').innerHTML=vHome();initHomeMap();if(h!==last)window.scrollTo(0,0);last=h;return}
const key=kind+':'+(c?c.id:mod),fresh=!V||V.key!==key;
if(fresh){if(kind==='mod')q='';mount(kind,mod,key)}
$('#ttl').textContent=c?c.titre:lbl(mod);
$('#dc').innerHTML=c?dDet(c):dMod(mod);
drawOverlays();updTools();if(fresh){fit();$('#dc').scrollTop=0}loadPhotos();last=h}

/* ---------- formulaires ---------- */
const inp=(n,l,v,t='text',req)=>`<label class="f"><span>${l}</span><input name="${n}" type="${t}" value="${esc(v)}" ${t==='number'?'inputmode="decimal" step="any" min="0"':''} ${req?'required':''}></label>`;
function field(f,v){const n='d_'+f.k;
if(f.o)return `<label class="f"><span>${esc(f.l)}</span><select name="${n}"><option value="">—</option>${f.o.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
if(f.t==='area')return `<label class="f"><span>${esc(f.l)}</span><textarea name="${n}" rows="4" placeholder="40 × Charme commun 60/80">${esc(v)}</textarea></label>`;
return inp(n,esc(f.l),v,f.t||'text')}
function fChantier(c,k){const e=c||{module:k,details:{},debut:iso()};
return `<form class="sh-in" data-form="chantier"><div class="sh-h"><h2>${c?'Modifier le chantier':'Nouveau chantier'}</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div>
<input type="hidden" name="id" value="${esc(e.id||'')}"><input type="hidden" name="module" value="${e.module}">
${inp('titre','Nom du chantier',e.titre,'text',1)}${inp('client','Client',e.client)}${inp('adresse','Adresse (placée automatiquement sur la carte)',e.adresse)}${inp('tel','Téléphone',e.tel,'tel')}
<div class="two">${inp('debut','Début',e.debut,'date')}${inp('fin','Fin prévue',e.fin,'date')}</div>
<div class="two">${inp('heuresPrevues','Heures prévues',e.heuresPrevues,'number')}${inp('equipe','Équipe',e.equipe)}</div>
<fieldset><legend>${esc(lbl(e.module))}</legend>${FIELDS[e.module].map(f=>field(f,(e.details||{})[f.k])).join('')}</fieldset>
<label class="f"><span>Notes (accès, consignes…)</span><textarea name="notes" rows="3">${esc(e.notes)}</textarea></label>
${c?'':'<p class="hint">Une liste de tâches type est ajoutée. Vous sélectionnerez ensuite les parcelles sur la carte.</p>'}
<button class="btn primary wide">Enregistrer</button></form>`}
function fAnn(type,pts){const nm={note:'Nouvelle note',ligne:'Nouvelle ligne',zone:'Nouvelle zone'}[type];
return `<form class="sh-in" data-form="ann"><div class="sh-h"><h2>${nm}</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div>
<input type="hidden" name="type" value="${type}"><input type="hidden" name="pts" value="${esc(JSON.stringify(pts))}">
${type!=='note'?`<p class="hint">${type==='ligne'?'Longueur : '+fmtL(len(pts)):'Surface : '+fmtA(area(pts))+' · périmètre '+fmtL(len([...pts,pts[0]]))}</p>`:''}
<label class="f"><span>${type==='note'?'Texte de la note':'Nom (ex. haie à planter, zone à broyer)'}</span><textarea name="texte" rows="3" ${type==='note'?'required':''}></textarea></label>
<div class="f"><span>Couleur</span><div class="cols">${COLS.map(([h,n],i)=>`<label class="col"><input type="radio" name="couleur" value="${h}" ${i===0?'checked':''}><i style="background:${h}"></i>${n}</label>`).join('')}</div></div>
<button class="btn primary wide">Enregistrer</button></form>`}
function fJournal(){let a='';try{a=localStorage.getItem(LS+'-auteur')||''}catch(e){}if(!a&&cloud&&cloud.user&&cloud.user.email)a=cloud.user.email.split('@')[0];
return `<form class="sh-in" data-form="journal"><div class="sh-h"><h2>Entrée du journal</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div>
<div class="two">${inp('date','Date',iso(),'date',1)}${inp('heures','Heures (équipe)','','number')}</div>${inp('auteur','Saisi par',a)}
<label class="f"><span>Travaux réalisés, remarques</span><textarea name="note" rows="4"></textarea></label>
<label class="f"><span>Photos</span><input type="file" name="ph" accept="image/*" multiple></label>
<button class="btn primary wide">Ajouter au journal</button></form>`}
function fSettings(){return `<form class="sh-in" data-form="settings"><div class="sh-h"><h2>Réglages</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div>
${inp('entreprise','Nom de l’entreprise',D.reglages.entreprise)}<fieldset><legend>Noms des modules</legend>${KEYS.map((k,i)=>inp('l_'+k,'Module '+(i+1),lbl(k))).join('')}</fieldset>
<button class="btn primary wide">Enregistrer</button>
${FB?(cloud&&cloud.user?`<p class="hint">Connecté : ${esc(cloud.user.email)}. Les chantiers sont partagés en temps réel avec toute l’équipe.</p><button type="button" class="btn" data-act="logout">Se déconnecter</button>`:'<p class="hint">Serveur injoignable pour le moment : les modifications seront envoyées dès le retour de la connexion.</p>'):'<p class="hint">Mode local : les données sont enregistrées sur ce téléphone uniquement.</p><button type="button" class="btn" data-act="fb-setup">Activer le partage d’équipe</button>'}${FB_LOCAL?'<p class="hint">Partage activé sur ce téléphone seulement. Pour que tous les téléphones soient reliés automatiquement, copiez le fichier config.js et envoyez-le sur GitHub.</p><div class="two"><button type="button" class="btn" data-act="fb-copy">Copier config.js</button><button type="button" class="btn danger" data-act="fb-off">Désactiver</button></div>':''}
<div class="two"><button type="button" class="btn" data-act="dl">Télécharger la sauvegarde</button><button type="button" class="btn" data-act="imp">Importer…</button></div></form>`}
function ask(msg,fn){openSheet(`<div class="sh-in"><p class="ask">${esc(msg)}</p><div class="two"><button class="btn" data-act="close">Annuler</button><button class="btn danger-fill" data-act="ok">Confirmer</button></div></div>`);pending=fn}
function openSheet(h){closeSheet();const d=document.createElement('div');d.id='sheet';d.innerHTML=`<div class="scrim" data-act="close"></div><div class="sh" role="dialog" aria-modal="true">${h}</div>`;document.body.appendChild(d);document.body.classList.add('lock')}
function closeSheet(){const s=$('#sheet');if(s)s.remove();document.body.classList.remove('lock')}
const toastEl=document.createElement('div');toastEl.id='toast';document.body.appendChild(toastEl);
let tt;function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('show'),2600)}
function lsSet(){try{localStorage.setItem(LSK,JSON.stringify(D))}catch(e){toast('Mémoire du téléphone pleine')}}
const persistPend=()=>{try{localStorage.setItem(LS+'-attente',JSON.stringify(PEND))}catch(e){}};
function save(){D.stamp=Date.now();lsSet();if(!FB)return;const seen=new Set();
D.chantiers.forEach(c=>{seen.add(c.id);const j=JSON.stringify(c);if(lastJ[c.id]!==j){lastJ[c.id]=j;if(!PEND.up.includes(c.id))PEND.up.push(c.id)}});
Object.keys(lastJ).forEach(id=>{if(!seen.has(id)){delete lastJ[id];PEND.up=PEND.up.filter(x=>x!==id);if(!PEND.del.includes(id))PEND.del.push(id)}});
const r=JSON.stringify(D.reglages);if(r!==lastR){lastR=r;PEND.reg=true}persistPend();flush()}
const fail=e=>toast(/permission/i.test(String(e&&(e.code||e.message)))?'Enregistrement refusé par le serveur':'Synchronisation en attente');
function flush(){if(!cloud||!cloud.user||!cloud.ready)return;const {F,db}=cloud,par=cloud.user.email||'';
PEND.up.splice(0).forEach(id=>{const c=find(id);if(c)F.setDoc(F.doc(db,'chantiers',id),{data:JSON.stringify(c),maj:Date.now(),par}).catch(fail)});
PEND.del.splice(0).forEach(id=>F.deleteDoc(F.doc(db,'chantiers',id)).catch(fail));
if(PEND.reg){PEND.reg=false;F.setDoc(F.doc(db,'app','reglages'),{data:JSON.stringify(D.reglages)}).catch(fail)}persistPend()}
function liveRender(){const a=document.activeElement;if(a&&a.closest&&a.closest('#dc')&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){rq=true;return}render()}
document.addEventListener('focusout',()=>{if(rq){rq=false;setTimeout(render,0)}});
function readLocalOnly(){try{const l=JSON.parse(localStorage.getItem(LS));if(l&&!l.exemples&&Array.isArray(l.chantiers)&&l.chantiers.length)return l.chantiers.map(norm)}catch(e){}return null}
function listen(){const {F,db}=cloud;let first=true;
cloud.unsub.push(F.onSnapshot(F.collection(db,'chantiers'),snap=>{const remote={};
snap.forEach(d=>{try{const c=norm(JSON.parse(d.data().data));remote[c.id]=c}catch(e){}});
if(first){first=false;if(snap.empty&&!PEND.up.length){const loc=readLocalOnly();if(loc)loc.forEach(c=>{remote[c.id]=c;PEND.up.push(c.id)})}}
PEND.up.forEach(id=>{const c=D.chantiers.find(x=>x.id===id)||remote[id];if(c)remote[id]=c});PEND.del.forEach(id=>{delete remote[id]});
D.chantiers=Object.values(remote);lastJ={};D.chantiers.forEach(c=>lastJ[c.id]=JSON.stringify(c));lsSet();cloud.ready=true;flush();liveRender()},
()=>toast('Accès aux données refusé : vérifiez les règles Firestore')));
cloud.unsub.push(F.onSnapshot(F.doc(db,'app','reglages'),d=>{if(d.exists()){if(!PEND.reg)try{D.reglages=JSON.parse(d.data().data);lastR=JSON.stringify(D.reglages)}catch(e){}}else PEND.reg=true;lsSet();flush();liveRender()},()=>{}))}
async function startCloud(){try{const B='https://www.gstatic.com/firebasejs/10.14.1/';
const [A,AU,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
const app=A.initializeApp(FB),auth=AU.getAuth(app);let db;
try{db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})})}catch(e){db=F.getFirestore(app)}
cloud={AU,F,auth,db,user:null,ready:false,unsub:[]};
AU.onAuthStateChanged(auth,u=>{cloud.unsub.forEach(f=>f());cloud.unsub=[];cloud.user=u;cloud.ready=false;if(!u){authState='login';render();return}authState='ok';render();listen()})}
catch(e){authState='off';render();toast('Serveur injoignable : vos modifications seront envoyées plus tard')}}
const phSrc=s=>String(s).startsWith('ph:')?(safe(PH[String(s).slice(3)])||''):safe(s);
function loadPhotos(){if(!cloud||!cloud.user)return;document.querySelectorAll('img[data-ph^="ph:"]').forEach(async im=>{if(im.getAttribute('src'))return;const id=im.dataset.ph.slice(3);try{if(!PH[id]){const d=await cloud.F.getDoc(cloud.F.doc(cloud.db,'photos',id));if(d.exists())PH[id]=d.data().data}if(safe(PH[id]))im.src=PH[id]}catch(e){}})}
function delPhotos(list){if(!cloud||!cloud.user)return;(list||[]).forEach(s=>{if(String(s).startsWith('ph:'))cloud.F.deleteDoc(cloud.F.doc(cloud.db,'photos',String(s).slice(3))).catch(()=>{})})}
function vLogin(){return `<div class="login"><div class="lcard"><p class="date">Suivi de chantiers</p><h1>${esc(D.reglages.entreprise)}</h1><form data-form="login" class="lform"><label class="f"><span>E-mail</span><input name="email" type="email" autocomplete="username" autocapitalize="off" required></label><label class="f"><span>Mot de passe</span><input name="pw" type="password" autocomplete="current-password" required></label><button class="btn primary wide">Se connecter</button><p class="hint">Votre compte est créé par le responsable de l’entreprise.</p></form></div></div>`}
async function photo(file){const b=await shrink(file,1000,.6);return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)})}
function shrink(file,max,qu){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);cv.toBlob(b=>b?res(b):rej(new Error('img')),'image/jpeg',qu)};im.onerror=rej;im.src=u})}
const zoomTo=b=>{if(V&&V.map&&b.isValid()){setDrawer('min');V.map.fitBounds(b,{paddingTopLeft:[innerWidth>=800?480:24,90],paddingBottomRight:[104,(innerWidth>=800?0:140)+24],maxZoom:19})}};

/* ---------- actions ---------- */
function act(b){const a=b.dataset.act,c=curC();
switch(a){
case 'settings':openSheet(fSettings());break;
case 'filt':filt=b.dataset.v;render();break;
case 'new':openSheet(fChantier(null,b.dataset.m));break;
case 'edit':openSheet(fChantier(c));break;
case 'status':c.statut=b.dataset.v;if(c.statut==='termine'&&!c.fin)c.fin=iso();save();render();break;
case 'task':c.taches[+b.dataset.i].done=b.checked;save();render();break;
case 'deltask':c.taches.splice(+b.dataset.i,1);save();render();break;
case 'journal':openSheet(fJournal());break;
case 'zoom':openSheet(`<div class="sh-in"><div class="sh-h"><h2>Photo</h2><button class="ibtn" data-act="close" aria-label="Fermer">×</button></div><img class="zoom" src="${esc(phSrc(b.dataset.src))}" alt="Photo du chantier"></div>`);break;
case 'delj':ask('Supprimer cette entrée du journal ?',()=>{const j0=c.journal.find(j=>j.id===b.dataset.j);delPhotos(j0&&j0.photos);c.journal=c.journal.filter(j=>j.id!==b.dataset.j);save();render()});break;
case 'dup':{const n=JSON.parse(JSON.stringify(c));n.id=uid();n.titre+=' (copie)';n.statut='prevu';n.journal=[];n.taches.forEach(t=>t.done=false);D.chantiers.push(n);save();location.hash='c-'+n.id;toast('Chantier dupliqué');break}
case 'del':ask(`Supprimer le chantier « ${c.titre} » ? Cette action est définitive.`,()=>{c.journal.forEach(j=>delPhotos(j.photos));D.chantiers=D.chantiers.filter(x=>x!==c);save();location.hash='m-'+c.module});break;
case 'clear-ex':ask('Effacer tous les chantiers d’exemple ?',()=>{D.chantiers=[];D.exemples=false;save();render()});break;
case 'dl':{const bl=new Blob([JSON.stringify(D)],{type:'application/json'}),l=document.createElement('a');l.href=URL.createObjectURL(bl);l.download='sauvegarde-chantiers-'+iso()+'.json';document.body.appendChild(l);l.click();l.remove();break}
case 'imp':openSheet(`<form class="sh-in" data-form="import"><div class="sh-h"><h2>Importer</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div><p class="hint">Choisissez un fichier de sauvegarde. Il remplacera toutes les données actuelles.</p><input type="file" name="file" accept=".json,application/json" required><button class="btn primary wide">Importer</button></form>`);break;
case 'base':P.base=P.base==='osm'?'photo':'osm';savePref();setBase();updTools();break;
case 'cad':P.cad=!P.cad;savePref();setCad();updTools();if(P.cad&&V&&V.map&&V.map.getZoom()<13)toast('Zoomez pour voir le cadastre');break;
case 'mode':setMode(b.dataset.v);break;
case 'mode-off':setMode(null);break;
case 'undo-pt':if(tmp){tmp.pts.pop();drawTmp();updTools()}break;
case 'finish':if(!tmp)break;if(tmp.pts.length<(tmp.type==='zone'?3:2)){toast(tmp.type==='zone'?'Placez au moins 3 points':'Placez au moins 2 points');break}openSheet(fAnn(tmp.type,tmp.pts));break;
case 'drawer':{const o=['min','mid','max'];setDrawer(o[(o.indexOf(dS)+1)%3]);break}
case 'me':if(!navigator.geolocation){toast('Position indisponible');break}toast('Recherche de votre position…');navigator.geolocation.getCurrentPosition(p=>{if(!V||!V.map)return;const ll=[p.coords.latitude,p.coords.longitude];if(V.me)V.me.remove();V.me=L.circleMarker(ll,{radius:9,color:'#fff',weight:3,fillColor:'#1a73e8',fillOpacity:1,interactive:false}).addTo(V.map);setDrawer('min');V.map.setView(ll,18)},()=>toast('Position refusée ou indisponible'),{enableHighAccuracy:true,timeout:15000});break;
case 'geo-addr':if(!c.adresse){toast('Ajoutez d’abord une adresse (bouton Modifier)');break}toast('Recherche de l’adresse…');geocode(c).then(ok=>{if(ok){save();render();fit();toast('Chantier placé sur la carte')}else toast('Adresse introuvable : utilisez « Placer »')});break;
case 'zoomp':{const x=c.parcelles[+b.dataset.i];if(x&&window.L)zoomTo(L.geoJSON(x.geom).getBounds());break}
case 'delp':{const x=c.parcelles[+b.dataset.i];ask(`Retirer la parcelle ${x.section} ${x.numero} du chantier ?`,()=>{c.parcelles.splice(+b.dataset.i,1);save();render()});break}
case 'zooma':{const x=c.annotations.find(y=>y.id===b.dataset.a);if(x&&window.L)zoomTo(L.latLngBounds(x.pts).pad(x.pts.length>1?.1:0));break}
case 'delann':{if(V&&V.map)V.map.closePopup();ask('Supprimer cette annotation ?',()=>{c.annotations=c.annotations.filter(y=>y.id!==b.dataset.a);save();render()});break}
case 'logout':ask('Se déconnecter sur ce téléphone ?',()=>{try{localStorage.removeItem(LSK)}catch(e){}D.chantiers=[];lastJ={};cloud.AU.signOut(cloud.auth)});break;
case 'fb-setup':openSheet(`<form class="sh-in" data-form="fbcfg"><div class="sh-h"><h2>Partage d’équipe</h2><button type="button" class="ibtn" data-act="close" aria-label="Fermer">×</button></div><p class="hint">Dans Firebase : Paramètres du projet › Vos applications › Web. Copiez tout le bloc « firebaseConfig » et collez-le ici.</p><textarea name="cfg" rows="9" placeholder='const firebaseConfig = { apiKey: "…", authDomain: "…", projectId: "…", … };' required></textarea><button class="btn primary wide">Activer le partage</button></form>`);break;
case 'fb-copy':navigator.clipboard.writeText(cfgJs(FB)).then(()=>toast('Contenu de config.js copié')).catch(()=>toast('Copie impossible ici'));break;
case 'fb-off':ask('Désactiver le partage sur ce téléphone ?',()=>{try{localStorage.removeItem('paysage-carte-v1-firebase')}catch(e){}location.reload()});break;
case 'close':closeSheet();break;
case 'ok':{const f=pending;pending=null;closeSheet();if(f)f();break}}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.closest('.leaflet-popup'))act(b)});
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;$('#lst').innerHTML=listHTML(location.hash.slice(3))}});
let ty=null;
document.addEventListener('touchstart',e=>{ty=e.target.closest('.handle,.dh')?e.touches[0].clientY:null},{passive:true});
document.addEventListener('touchend',e=>{if(ty==null)return;const dy=e.changedTouches[0].clientY-ty,o=['min','mid','max'],i=o.indexOf(dS);ty=null;if(dy<-40)setDrawer(o[Math.min(2,i+1)]);else if(dy>40)setDrawer(o[Math.max(0,i-1)])},{passive:true});

document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,t=f.dataset.form,v=Object.fromEntries(new FormData(f)),c=curC();
if(t==='fbcfg'){const o=parseCfg(v.cfg);if(!o){toast('Bloc non reconnu : il faut au moins apiKey et projectId');return}try{localStorage.setItem('paysage-carte-v1-firebase',JSON.stringify(o))}catch(err){}location.reload()}
else if(t==='login'){const btn=f.querySelector('.primary');btn.disabled=true;btn.textContent='Connexion…';try{await cloud.AU.signInWithEmailAndPassword(cloud.auth,v.email.trim(),v.pw)}catch(err){btn.disabled=false;btn.textContent='Se connecter';toast(/network/.test(String(err&&err.code))?'Pas de connexion internet':'E-mail ou mot de passe incorrect')}}
else if(t==='task'){const s=String(v.t||'').trim();if(s&&c){c.taches.push({t:s,done:false});save();render()}}
else if(t==='chantier'){const det={};FIELDS[v.module].forEach(x=>det[x.k]=String(v['d_'+x.k]||'').trim());
const base={titre:v.titre.trim(),client:v.client.trim(),adresse:v.adresse.trim(),tel:v.tel.trim(),debut:v.debut,fin:v.fin,heuresPrevues:v.heuresPrevues===''?'':+v.heuresPrevues,equipe:v.equipe.trim(),notes:v.notes.trim(),details:det};
let o=v.id&&find(v.id);const adrChanged=!o||o.adresse!==base.adresse;
if(o)Object.assign(o,base);else{o=norm(Object.assign({id:uid(),module:v.module,statut:v.debut&&v.debut<=iso()?'en_cours':'prevu',taches:TPL[v.module].map(x=>({t:x,done:false})),journal:[]},base));D.chantiers.push(o)}
closeSheet();save();location.hash='c-'+o.id;render();toast('Chantier enregistré');
if(o.adresse&&(!hasG(o)||(adrChanged&&!o.parcelles.length)))geocode(o).then(ok=>{if(ok){save();if(curC()===o){render();fit()}}})}
else if(t==='ann'&&c){c.annotations.push({id:uid(),type:v.type,pts:JSON.parse(v.pts),texte:String(v.texte||'').trim(),couleur:v.couleur||COLS[0][0]});closeSheet();mode=null;tmp=null;save();render();toast('Annotation enregistrée')}
else if(t==='journal'&&c){const btn=f.querySelector('.primary');btn.disabled=true;btn.textContent='Ajout des photos…';
const photos=[];for(const file of f.querySelector('input[type=file]').files){try{const d=await photo(file);if(cloud&&cloud.user){const id=uid()+uid();PH[id]=d;cloud.F.setDoc(cloud.F.doc(cloud.db,'photos',id),{data:d,chantier:c.id,par:cloud.user.email||''}).catch(fail);photos.push('ph:'+id)}else photos.push(d)}catch(err){toast('Une photo n’a pas pu être ajoutée')}}
try{localStorage.setItem(LS+'-auteur',v.auteur)}catch(err){}
c.journal.push({id:uid(),date:v.date,auteur:v.auteur.trim(),heures:+v.heures||0,note:v.note.trim(),photos});
if(c.statut==='prevu')c.statut='en_cours';closeSheet();save();render();toast('Ajouté au journal')}
else if(t==='settings'){D.reglages.entreprise=v.entreprise.trim()||'Mon entreprise';KEYS.forEach(k=>D.reglages.modules[k]=String(v['l_'+k]||'').trim()||lbl(k));closeSheet();save();render()}
else if(t==='import'){try{const o=JSON.parse(await v.file.text());if(!o||!Array.isArray(o.chantiers)||!o.reglages)throw 0;ask('Remplacer toutes les données par cette sauvegarde ?',()=>{o.chantiers.forEach(norm);D=o;save();teardown();render()})}catch(err){toast('Sauvegarde illisible')}}});

window.addEventListener('hashchange',()=>{closeSheet();render()});
window.addEventListener('resize',()=>{if(V&&V.map)V.map.invalidateSize()});
render();if(FB)startCloud();
}
