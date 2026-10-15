/* Dades de l'activitat · Hospital de campanya (Vall d'Arnes) */
"use strict";
const COMMONS = name => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(name) + "?width=960";
const COMMONS_PAGE = name => "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(name.replace(/ /g, "_"));

const HOTSPOTS = [
  {id:"pont", n:1, nom:"El pont", pos:[3.6,1.6,18.5],
   text:"El pont s'ha trencat. Era l'única entrada a la vall pel sud. Cap cotxe ni ambulància no pot entrar ni sortir.",
   foto:"Interstate 90 Schoharie Creek Bridge collapsed.jpg", alt:"Foto real d'un pont de carretera trencat sobre un riu."},
  {id:"carretera", n:2, nom:"La carretera", pos:[8.4,2.6,27],
   text:"Una esllavissada de terra i roques tapa la carretera en 200 metres. Obrir-la costarà més de 3 dies.",
   foto:"Hurricane Gaston landslide damage.jpg", alt:"Foto real d'una carretera tapada per terra i arbres caiguts."},
  {id:"escola", n:3, nom:"L'escola", pos:[-6.2,3.6,-9.6],
   text:"L'escola feia d'alberg per a 120 persones del festival. Una part s'ha ensorrat. Hi ha persones atrapades.",
   foto:"2023 Turkey Earthquake Damage.jpg", alt:"Foto real d'un edifici ensorrat després d'un terratrèmol."},
  {id:"residencia", n:4, nom:"La residència", pos:[1.3,4.2,-14.6],
   text:"A la residència hi viuen 60 persones grans. L'edifici té esquerdes grans. Cal portar els residents a un espai obert.",
   foto:"FEMA - 44649 - Earthquake damaged buildings in California.jpg", alt:"Foto real d'edificis amb esquerdes i danys per un terratrèmol."},
  {id:"linia", n:5, nom:"La línia elèctrica", pos:[10.6,3.4,-6],
   text:"Han caigut torres elèctriques. Tota la vall està sense llum. El mòbil funciona només a estones.",
   foto:"Parklawn Drive, Rockville, Wires down, storm damage. (7484621376).jpg", alt:"Foto real de cables elèctrics caiguts a terra."},
  {id:"temporal", n:6, nom:"El temporal", pos:[-2,12,6],
   text:"Fa vent fort i plou molt. Ara els helicòpters no poden volar. Potser podran aterrar una estona a l'alba, però no podran evacuar centenars de persones. L'hospital més proper és a 90 km.",
   foto:"Dark clouds over mountains (Unsplash).jpg", alt:"Foto real de núvols foscos de tempesta sobre unes muntanyes."}
];

/* Glossari (llenguatge senzill) */
const GLOSSARI = {
  triatge:["Triatge","Classificar les víctimes per saber a qui s'ha d'atendre primer."],
  start:["Mètode START","Triatge ràpid amb 4 preguntes: camina?, respira?, com li circula la sang?, fa cas a ordres senzilles?"],
  via:["Via aèria","El camí de l'aire: nas, boca i gola. Obrir-la és posar el cap una mica enrere perquè passi l'aire."],
  fr:["Freqüència respiratòria (FR)","Quantes vegades respira una persona en un minut."],
  pols:["Pols radial","Els batecs del cor que es noten al canell."],
  rc:["Reompliment capil·lar","Premem l'ungla i comptem els segons que triga a tornar el color rosat."],
  potencials:["Víctimes potencials","Persones que podrien quedar ferides o afectades pel desastre."],
  escenari:["Escenari","La zona afectada pel desastre."],
  especial:["Pla especial","Pla d'emergència per a un risc concret: terratrèmols, inundacions, accidents químics..."],
  territorial:["Pla territorial","Pla d'emergència general per a tot un territori. A Catalunya és el PROCICAT."],
  esllavissada:["Esllavissada","Terra i roques que cauen d'una muntanya."],
  repliques:["Rèpliques","Terratrèmols més petits que arriben després del principal."],
  ume:["UME","Unitat Militar d'Emergències. Ve a ajudar quan ho demana protecció civil."],
  campanya:["Hospital de campanya","Hospital provisional fet amb tendes, muntat a prop del desastre."],
  evacuable:["Evacuable","Quan es poden portar les víctimes als hospitals. Si no es pot, es munta un hospital de campanya."]
};

/* Fase 2 · Classificació. Opcions SENSE paràmetres de referència. */
const P2 = [
  {id:"causa", src:"U1", t:"Segons la causa, quin tipus de desastre és?", o:["Natural","Tecnològic","Sociològic","Biològic"], a:0, pts:20,
   ok:"Un terratrèmol és un fenomen de la natura (geològic). És un desastre natural.", hint:"Pensa: qui o què ha provocat el desastre? Una persona, una màquina, una malaltia o la natura?"},
  {id:"evol", src:"U1", t:"Segons com evoluciona, com és?", o:["D'aparició sobtada","D'evolució lenta"], a:0, pts:20,
   ok:"El terratrèmol arriba de cop, sense temps per preparar-se. És d'aparició sobtada.", hint:"Pensa: hi va haver temps per avisar la gent abans?"},
  {id:"vel", src:"U1", t:"Velocitat d'instauració: quant triga a arribar a la màxima força?", o:["Ràpida","Lenta"], a:0, pts:20,
   ok:"Arriba a la màxima força en pocs segons. La velocitat d'instauració és ràpida.", hint:"Pensa en els segons que dura la sacsejada forta."},
  {id:"dur", src:"U1", t:"Quant dura el succés?", o:["Curta","Mitja","Perllongada"], a:0, pts:20,
   ok:"La sacsejada principal dura segons. Duració curta (menys d'1 hora).", hint:"Mira la fitxa: a quina hora va començar i quant va durar la sacsejada?"},
  {id:"ext", src:"U1", data:"Radi afectat: uns 6 km", t:"Quina extensió té l'escenari?", o:["Petita","Mitja","Gran"], a:1, pts:20,
   ok:"Un radi de 6 km és una extensió mitja (entre 1 i 10 km).", hint:"Fes servir la dada del radi afectat."},
  {id:"afe", src:"U1", data:"Víctimes potencials: entre 180 i 320", t:"Quina afectació té l'escenari?", o:["Moderada","Mitja","Greu"], a:1, pts:20,
   ok:"Entre 100 i 999 víctimes potencials és una afectació mitja.", hint:"Fes servir la dada de víctimes potencials."},
  {id:"resc", src:"U1", data:"Persones atrapades · carretera tallada 3 dies · sense helicòpters", t:"Quant duraran els rescats?", o:["Curta","Mitja","Perllongada"], a:2, pts:20,
   ok:"Amb persones atrapades i sense accessos, els rescats duraran més de 24 hores: duració perllongada.", hint:"Pensa: es podrà acabar avui mateix?"},
  {id:"evac", src:"U1", t:"Com s'organitza l'atenció sanitària?", o:["Evacuable","No evacuable"], a:1, pts:20,
   ok:"No es poden portar les víctimes a un hospital. És no evacuable: cal un hospital de campanya.", hint:"Pensa: hi ha alguna manera de treure 300 persones de la vall?"}
];
const EFECTES = [
  {t:"Persones atrapades i ferides a l'escola", a:0, why:"Passa al moment del terratrèmol. És un efecte directe."},
  {t:"Danys i esquerdes a la residència", a:0, why:"És un dany a un edifici durant el terratrèmol. Efecte directe."},
  {t:"Les vacunes i la insulina es fan malbé perquè no hi ha llum", a:1, why:"Ve d'un dany directe (la línia elèctrica caiguda). Efecte indirecte."},
  {t:"Malalts crònics sense medicació perquè no poden arribar a la farmàcia", a:1, why:"Ve dels danys als edificis i a les carreteres. Efecte indirecte."},
  {t:"Diarrees per aigua bruta unes setmanes després", a:2, why:"Arriba molt després, per falta d'aigua potable. Efecte tardà."},
  {t:"Més ansietat i estrès mesos després", a:2, why:"Afecta la salut molt temps després. Efecte tardà."}
];
const EF_OPTS = ["Directe","Indirecte","Tardà"];

/* Fase 3 · Activació */
const P3 = [
  {id:"fase", src:"U2", t:"En quina fase del desastre som ara?", o:["Interdesastre","Alerta","Impacte","Emergència (socors o aïllament)","Reconstrucció"], a:3, pts:30, neg:10,
   ok:"El terratrèmol ja ha passat. Comença la fase d'emergència: rescats i atenció sanitària.", hint:"Pensa: el terratrèmol encara està passant o ja ha acabat?"},
  {id:"pla", src:"U2", t:"Quin pla d'emergència s'activa?", o:["PROCICAT","SISMICAT","INUNCAT","PLASEQCAT"], a:1, partial:{0:15}, pts:40, neg:15,
   ok:"El SISMICAT és el pla especial per als terratrèmols. El PROCICAT és el pla territorial per als riscos que no tenen pla especial.",
   part:"El PROCICAT és el pla territorial general. Però per als terratrèmols hi ha un pla especial: el SISMICAT.",
   hint:"Pensa: hi ha un pla especial per a aquest risc concret?"},
  {id:"nivell", src:"PROCICAT", t:"Amb quin nivell s'activa el pla?", o:["Prealerta","Alerta","Emergència 1","Emergència 2"], a:3, partial:{2:15}, pts:40, neg:15,
   ok:"Emergència 2: la vall està aïllada i hi ha una escola i una residència afectades. És una zona especialment vulnerable. S'activen tots els grups.",
   part:"L'emergència 1 és per a una zona petita o poc vulnerable. Aquí la zona és especialment vulnerable: emergència 2.",
   hint:"Pensa: la zona és poc vulnerable o especialment vulnerable?"},
  {id:"lloc", src:"U1", t:"On munteu l'hospital de campanya?", o:["Camp de futbol","Ribera del riu","Pati de l'escola"], a:0, pts:30, neg:10,
   ok:"El camp de futbol és pla, obert, lluny d'edificis trencats i a prop del carrer principal.",
   bad:{1:"Amb el temporal, el riu pot créixer i inundar la zona.",2:"És al costat d'un edifici trencat. Si hi ha rèpliques, és perillós."},
   hint:"Busca un lloc pla, segur i fàcil d'arribar."}
];
const ORDRE = [
  "Activar els recursos de la vall (SEM, Bombers, Protecció Civil municipal)",
  "Demanar ajuda de fora (la UME, a través de protecció civil)",
  "Rescatar i atendre les víctimes: triatge a l'hospital de campanya",
  "Albergs, menjar i roba d'abric (Creu Roja)"
];
const ORDRE_SHUFFLE = [2,0,3,1];

/* Fase 4 · Víctimes (triatge START) */
const VICTIMS = [
  {nom:"Home de 34 anys", d:"Arriba caminant. Té un tall al braç.", camina:"Sí", respira:"Sí", fr:"18", pols:"Sí", rc:"1 s", ordres:"Sí", a:"g",
   why:"Camina, per tant és VERD. Tota persona que camina és verda en el primer triatge."},
  {nom:"Dona de 78 anys", d:"Ve de la residència. No respira. Li obrim la via aèria i continua sense respirar.", camina:"No", respira:"No, ni amb la via oberta", fr:"0", pols:"No", rc:"—", ordres:"No", a:"k",
   why:"No respira ni després d'obrir la via aèria: NEGRE."},
  {nom:"Noi de 19 anys", d:"Té la cuixa deformada. Parla bé i sap on és.", camina:"No", respira:"Sí", fr:"24", pols:"Sí", rc:"1,5 s", ordres:"Sí", a:"y",
   why:"No camina, respira menys de 30 cops per minut, té pols i fa cas a ordres: GROC."},
  {nom:"Dona de 45 anys", d:"Atrapada sota una biga de l'escola. Respira molt de pressa.", camina:"No", respira:"Sí", fr:"34", pols:"Sí", rc:"2 s", ordres:"Sí", a:"r",
   why:"Respira més de 30 cops per minut: VERMELL."},
  {nom:"Home de 60 anys", d:"Inconscient al carrer. No respira. Li obrim la via aèria i comença a respirar.", camina:"No", respira:"Només amb la via oberta", fr:"12", pols:"Sí", rc:"2 s", ordres:"No", a:"r",
   why:"Respira només després d'obrir la via aèria: VERMELL."},
  {nom:"Noia de 16 anys", d:"Camina plorant. Té rascades a les cames.", camina:"Sí", respira:"Sí", fr:"22", pols:"Sí", rc:"1 s", ordres:"Sí", a:"g",
   why:"Camina, per tant és VERD."},
  {nom:"Home de 52 anys", d:"Està pàl·lid i suat. Té una hemorràgia a l'abdomen.", camina:"No", respira:"Sí", fr:"22", pols:"No", rc:"3 s", ordres:"Sí", a:"r",
   why:"No té pols al canell i el reompliment capil·lar és de més de 2 segons: VERMELL. Cal aturar l'hemorràgia."},
  {nom:"Dona de 30 anys", d:"Té un cop al cap. Respira bé, però no fa cas a ordres senzilles.", camina:"No", respira:"Sí", fr:"20", pols:"Sí", rc:"1 s", ordres:"No", a:"r",
   why:"No fa cas a ordres senzilles: VERMELL."},
  {nom:"Home de 70 anys", d:"Li fa mal el maluc després de caure. Sap on és.", camina:"No", respira:"Sí", fr:"18", pols:"Sí", rc:"1 s", ordres:"Sí", a:"y",
   why:"No camina, respira bé, té bona circulació i fa cas a ordres: GROC."},
  {nom:"Dona de 41 anys", d:"Arriba caminant. Diu que li fa mal el pit.", camina:"Sí", respira:"Sí", fr:"28", pols:"Sí", rc:"1 s", ordres:"Sí", a:"g",
   why:"Camina, per tant és VERD. El START és un primer triatge: a l'àrea verda la tornaran a valorar."}
];
const TAGS = {g:["Verd","Lleu"], y:["Groc","Urgent"], r:["Vermell","Immediat"], k:["Negre","Sense vida"]};
const TAG_SHAPE = {
  g:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  y:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 20H2Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  r:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  k:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'
};
const CAPACITY = {r:6, y:8, g:12, k:4};
