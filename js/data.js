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

/* Glossari · fases noves */
Object.assign(GLOSSARI, {
  reconstruccio:["Reconstrucció","Fase després de l'emergència. L'objectiu és deixar la zona com estava abans: serveis, carreteres, cases i escoles."],
  interdesastre:["Interdesastre","Temps sense desastre. És el moment de preparar-se: prevenir riscos i tenir el pla d'emergència al dia."],
  serveis:["Serveis essencials","Llum, aigua potable, accés per carretera, menjar i un lloc on dormir."],
  bailey:["Pont provisional","Pont metàl·lic que es munta en pocs dies mentre es construeix el pont definitiu."],
  antisismic:["Construcció antisísmica","Edifici fet amb normes especials perquè aguanti els terratrèmols."],
  autoproteccio:["Pla d'autoprotecció","Pla que han de tenir els edificis o activitats on hi ha molta gent o risc: escoles, residències, festivals..."],
  pem:["Pla d'emergència municipal","Pla del poble. Diu quins riscos hi ha, quins recursos té el poble i què ha de fer cadascú."],
  simulacre:["Simulacre","Assaig d'una emergència per practicar el pla, com si fos real."],
  esalert:["ES-Alert","Missatge d'avís que arriba a tots els mòbils d'una zona quan hi ha una emergència."]
});

/* Fase 5 · Reconstrucció (dia 15) */
const P5 = [
  {id:"fase", src:"U2", t:"Han passat 15 dies. Ja no hi ha ningú per rescatar. En quina fase som?", o:["Emergència","Reconstrucció","Interdesastre","Alerta"], a:1, pts:30, neg:10,
   ok:"Els rescats i el triatge s'han acabat. Comença la fase de reconstrucció, recuperació o rehabilitació.", hint:"Pensa: encara hi ha persones atrapades o ara toca arreglar el poble?"},
  {id:"obj", src:"U2", t:"Quin és l'objectiu d'aquesta fase?", o:["Rescatar les persones atrapades","Deixar la zona com estava abans: serveis i infraestructures","Avisar la població que arriba un terratrèmol","Fer el triatge de les víctimes"], a:1, pts:30, neg:10,
   ok:"La reconstrucció vol que la població torni a tenir els serveis i les infraestructures d'abans del desastre. Pot durar molt de temps.", hint:"Pensa en la paraula: re-construir."},
  {id:"creu", src:"U2", t:"Qui s'encarrega dels albergs provisionals i de repartir menjar, aigua i roba d'abric?", o:["La UME","La Creu Roja","El SEM","Els Bombers"], a:1, pts:35, neg:15,
   ok:"La Creu Roja munta i gestiona les àrees d'albergs provisionals i reparteix aliments, beguda i elements d'abric i higiene.", hint:"És una ONG que ja has vist a la fase 3."},
  {id:"aigua", src:"U1", t:"Hi ha hagut dies sense aigua potable. Quin risc per a la salut cal vigilar ara?", o:["Cremades pel sol","Malalties per aigua bruta (diarrees)","Fractures","Al·lèrgies al pol·len"], a:1, pts:35, neg:15,
   ok:"Sense aigua potable apareixen malalties per aigua contaminada: és un efecte tardà. Cal controlar i clorar l'aigua i vigilar els casos de diarrea.", hint:"Recorda els efectes tardans de la fase 2."}
];
/* Obres i accions: quan s'han de fer. 0 = primer (serveis essencials), 1 = després (setmanes), 2 = al final (mesos o anys) */
const REC_OPTS = ["Primer","Després","Al final"];
const REC_HELP = ["serveis essencials, primers dies","setmanes","mesos o anys"];
const OBRES = [
  {id:"llum", n:1, nom:"Tornar la llum", t:"Portar grups electrògens i aixecar una línia elèctrica provisional", a:0, pos:[10.6,6,-6],
   why:"Sense llum no funcionen les neveres de vacunes i insulina ni les bombes d'aigua. És un servei essencial: primer."},
  {id:"aigua", n:2, nom:"Aigua potable", t:"Portar cisternes, clorar l'aigua i analitzar-la", a:0, pos:[-4.6,3.5,0.6],
   why:"L'aigua potable és un servei essencial i evita malalties. Primer."},
  {id:"acces", n:3, nom:"Obrir un accés", t:"Retirar l'esllavissada i muntar un pont provisional", a:0, pos:[5,4,22],
   why:"Sense accés no arriben camions de material ni es poden traslladar els malalts. És el primer pas per tornar a la normalitat."},
  {id:"alberg", n:4, nom:"Albergs provisionals", t:"Muntar tendes i mòduls per a les famílies que no poden tornar a casa", a:0, pos:[-5.5,3.5,15.5],
   why:"Les persones necessiten un lloc segur on dormir des del primer dia. La Creu Roja gestiona els albergs. Primer."},
  {id:"escola", n:5, nom:"Escola en mòduls", t:"Reobrir l'escola en mòduls prefabricats", a:1, pos:[-11.4,4,-7.6],
   why:"Quan els serveis essencials ja funcionen, en unes setmanes cal tornar a fer classe, encara que sigui en mòduls. Després."},
  {id:"hospital", n:6, nom:"Tancar l'hospital de campanya", t:"Desmuntar l'hospital de campanya i reobrir el consultori del poble", a:1, pos:[-7.4,4,6.8],
   why:"Quan ja hi ha accés i el consultori és segur, l'hospital de campanya es desmunta. No és el primer dia: després."},
  {id:"resi", n:7, nom:"Residència segura", t:"Traslladar la gent gran a un edifici segur i reforçar la residència", a:1, pos:[1.3,6,-15.2],
   why:"Primer cal un lloc provisional per a la gent gran. Reforçar l'edifici i tornar-hi porta setmanes: després."},
  {id:"pont", n:8, nom:"Pont definitiu", t:"Construir un pont nou definitiu", a:2, pos:[1.8,4,18.5],
   why:"Un pont nou es projecta i es construeix en mesos o anys. Mentrestant funciona el pont provisional. Al final."},
  {id:"antisis", n:9, nom:"Escola antisísmica", t:"Reconstruir l'escola amb normes antisísmiques", a:2, pos:[-3.9,4,-8.8],
   why:"Reconstruir un edifici amb normes antisísmiques costa mesos o anys. Al final."},
  {id:"psico", n:10, nom:"Suport psicològic", t:"Fer el seguiment de la salut mental (ansietat, estrès) de la població", a:2, pos:[-4.5,3,-19.6],
   why:"L'ansietat i l'estrès són efectes tardans. Cal acompanyar la població durant mesos. Al final (llarg termini)."}
];

/* Fase 6 · Interdesastre (un any després) */
const P6 = [
  {id:"fase", src:"U2", t:"Ha passat un any. El poble ja està reconstruït i no hi ha cap avís de desastre. En quina fase som?", o:["Alerta","Reconstrucció","Interdesastre","Impacte"], a:2, pts:20, neg:10,
   ok:"Sense desastre ni avís de cap desastre a prop, som en fase d'interdesastre: és el temps per preparar-se.", hint:"Pensa: hi ha cap senyal que arribi un desastre?"},
  {id:"funcio", src:"U2 · Protecció civil", t:"Actualitzar el pla d'emergència amb el que heu après és una funció de protecció civil. Quina?", o:["Previsió","Planificació","Intervenció","Rehabilitació"], a:1, partial:{0:5}, pts:20, neg:10,
   ok:"La planificació estableix les respostes davant d'una emergència a través dels plans d'emergència i la seva actualització.",
   part:"La previsió identifica i avalua els riscos. Escriure i actualitzar el pla és planificació.", hint:"Quina funció parla dels plans d'emergència?"},
  {id:"auto", src:"U2", t:"El festival, l'escola i la residència han de tenir el seu propi pla. Quin?", o:["Pla territorial","Pla especial","Pla d'autoprotecció","No els cal cap pla"], a:2, pts:20, neg:10,
   ok:"Les activitats i els edificis amb molta gent o amb risc han de fer un pla d'autoprotecció.", hint:"És el pla que fa cada edifici o activitat per protegir-se."}
];
const RISCOS = [
  {id:"sisme", t:"Rèpliques i nous terratrèmols", a:1, why:"La vall és zona sísmica: hi pot haver rèpliques i nous terratrèmols."},
  {id:"riu", t:"Crescudes del riu i inundacions amb temporal", a:1, why:"Amb el temporal el riu creix. Per això l'hospital no es va muntar a la ribera."},
  {id:"slide", t:"Esllavissades als vessants i a la carretera", a:1, why:"Ja n'hi va haver una que va tallar la carretera. Pot tornar a passar amb pluja o rèpliques."},
  {id:"aillament", t:"Quedar aïllats: només hi ha una entrada a la vall", a:1, why:"Si l'únic accés es talla, el poble queda aïllat i no és evacuable."},
  {id:"foc", t:"Incendi forestal al bosc de pins", a:1, why:"La vall és plena de pins i a l'estiu hi ha festival: és un risc real."},
  {id:"gent", t:"Molta gent junta al festival", a:1, why:"400 persones més al poble: cal un pla d'autoprotecció del festival."},
  {id:"tsunami", t:"Tsunami", a:0, why:"És una vall del Pirineu, lluny del mar: no hi ha risc de tsunami."},
  {id:"nuclear", t:"Accident en una central nuclear de la vall", a:0, why:"A la vall no hi ha cap central nuclear."}
];
const RISC_OPTS = ["No aplica","Risc a tenir en compte"];
const RECURSOS = [
  {id:"camp", t:"Camp de futbol (lloc per a l'hospital de campanya)", a:0, why:"És al poble. Ja va funcionar: és pla, segur i a prop del carrer principal."},
  {id:"heli", t:"Heliport", a:0, why:"És al poble. Serveix perquè aterrin els helicòpters quan el temps ho permet."},
  {id:"volunt", t:"Voluntaris de protecció civil", a:0, why:"Cada municipi pot tenir la seva agrupació de voluntaris de protecció civil."},
  {id:"consult", t:"Consultori i farmàcia", a:0, why:"Són al poble: atenció primària i medicació."},
  {id:"ume", t:"UME", a:1, why:"La UME ve de fora. La demana protecció civil quan cal."},
  {id:"hosp", t:"Hospital de referència", a:1, why:"És a 90 km. No és un recurs del poble i, si la vall queda aïllada, no s'hi pot arribar."}
];
const REC_PLACE = ["Al poble","Cal demanar-lo de fora"];
const MESURES = [
  {id:"acces2", t:"Fer un segon accés a la vall (pont nou i una pista alternativa)", a:1},
  {id:"simul", t:"Fer simulacres cada any amb l'escola, la residència i el festival", a:1},
  {id:"magatzem", t:"Tenir al poble un magatzem amb material sanitari, aigua i un generador", a:1},
  {id:"avisos", t:"Avisar la població amb ES-Alert i sirenes, i tenir un telèfon per satèl·lit", a:1},
  {id:"mapa", t:"Marcar al pla el camp de futbol per a l'hospital de campanya i l'heliport per aterrar", a:1},
  {id:"ribera", t:"Muntar l'hospital de campanya a la ribera del riu perquè és pla", a:0, why:"Amb temporal el riu creix: és una zona de risc."},
  {id:"treure", t:"Treure el terratrèmol del pla perquè ja ha passat", a:0, why:"El risc sísmic continua: el pla ha de tenir en compte el SISMICAT."},
  {id:"esperar", t:"No preparar res al poble i esperar que vingui la UME", a:0, why:"La vall pot quedar aïllada: el poble ha d'estar preparat pels seus mitjans les primeres hores."},
  {id:"prohibir", t:"Prohibir el festival per sempre", a:0, why:"No cal prohibir-lo: cal que tingui un pla d'autoprotecció."}
];
const MESURES_N = 5;
