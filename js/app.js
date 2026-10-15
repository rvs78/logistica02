/* Lògica del joc · Hospital de campanya */
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ICON = {
  speak:'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
};

/* ================================================== Preferències d'accessibilitat */
const PREF_KEY = "hc-arnes-prefs";
const prefs = Object.assign({size:"m", contrast:"normal", font:"atkinson", motion:"on", labels:"on", voice:"auto"}, (() => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch(e){ return {}; } })());
function applyPrefs(){
  const r = document.documentElement;
  r.dataset.size = prefs.size; r.dataset.font = prefs.font;
  if (prefs.contrast === "high") r.dataset.contrast = "high"; else delete r.dataset.contrast;
  if (window.WORLD){ WORLD.setMotion(prefs.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches); WORLD.setLabels(prefs.labels === "on"); }
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch(e) {}
}

/* ================================================== Veu */
let speaking = null;
function speak(text, btn){
  if (!("speechSynthesis" in window)){ if (btn) btn.textContent = "Lectura no disponible"; return; }
  if (speaking === btn && speechSynthesis.speaking){ speechSynthesis.cancel(); btn && btn.classList.remove("on"); speaking = null; return; }
  speechSynthesis.cancel(); document.querySelectorAll(".say.on").forEach(b => b.classList.remove("on"));
  const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
  const vs = speechSynthesis.getVoices(); const v = vs.find(x => /^ca/i.test(x.lang)) || vs.find(x => /^es/i.test(x.lang));
  u.lang = v ? v.lang : "ca-ES"; if (v) u.voice = v; u.rate = .92;
  u.onend = u.onerror = () => { btn && btn.classList.remove("on"); speaking = null; };
  speaking = btn; btn && btn.classList.add("on"); speechSynthesis.speak(u);
}
const sayBtn = (label) => `<button type="button" class="say" data-say>${ICON.speak}<span>${label || "Escolta"}</span></button>`;
function textOf(el){ const c = el.cloneNode(true); c.querySelectorAll("button:not(.term),.say,.hintbtn,svg,textarea,input").forEach(n => n.remove()); return c.textContent; }

/* Glossari */
const term = (key, txt) => `<button type="button" class="term" data-term="${key}">${esc(txt || GLOSSARI[key][0].toLowerCase())}</button>`;
let popEl = null;
function showTerm(btn){
  hidePop(); const [t, d] = GLOSSARI[btn.dataset.term];
  popEl = document.createElement("div"); popEl.className = "pop"; popEl.setAttribute("role", "tooltip");
  popEl.innerHTML = `<b>${esc(t)}</b>${esc(d)}<div class="row" style="margin-top:8px">${sayBtn()}<button type="button" class="say" data-close>Tanca</button></div>`;
  document.body.appendChild(popEl);
  const r = btn.getBoundingClientRect(), w = popEl.offsetWidth, h = popEl.offsetHeight;
  popEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + "px";
  popEl.style.top = (r.bottom + h + 12 > innerHeight ? r.top - h - 8 : r.bottom + 8) + "px";
  popEl.querySelector("[data-say]").onclick = e => speak(t + ". " + d, e.currentTarget);
  popEl.querySelector("[data-close]").onclick = () => { hidePop(); btn.focus(); };
}
function hidePop(){ if (popEl){ popEl.remove(); popEl = null; } }
document.addEventListener("click", e => { const t = e.target.closest(".term"); if (t){ e.preventDefault(); showTerm(t); return; } if (popEl && !e.target.closest(".pop")) hidePop(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") hidePop(); });

/* ================================================== Joc */
function startApp(USER){
  const KEY = "hc-arnes-v2:" + USER;
  const fresh = () => ({phase:0, name:"", found:[], p2:{}, ef:{}, p3:{}, order:[], orderDone:false, activated:false, tri:{}, vi:0, hints:0, hintOpen:{}});
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch(e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} };

  /* --- puntuació (els errors resten del total; el total no baixa de 0) */
  const qDelta = (q, v) => v === undefined ? 0 : v === q.a ? q.pts : (q.partial && q.partial[v]) ? q.partial[v] : -(q.neg || Math.round(q.pts/2));
  const efDelta = (e, v) => v === undefined ? 0 : v === e.a ? 15 : -5;
  const ordDelta = i => !S.orderDone ? 0 : S.order[i] === i ? 15 : -5;
  const triDelta = i => S.tri[i] === undefined ? 0 : S.tri[i] === VICTIMS[i].a ? 40 : -10;
  const sc1 = () => S.found.length*15 + (S.found.length === 6 ? 10 : 0);
  const sc2 = () => P2.reduce((s,q) => s + qDelta(q, S.p2[q.id]), 0) + EFECTES.reduce((s,e,i) => s + efDelta(e, S.ef[i]), 0);
  const sc3 = () => P3.reduce((s,q) => s + qDelta(q, S.p3[q.id]), 0) + [0,1,2,3].reduce((s,i) => s + ordDelta(i), 0);
  const sc4 = () => VICTIMS.reduce((s,v,i) => s + triDelta(i), 0);
  const bonus = () => (S.phase >= 5 && S.hints === 0) ? 50 : 0;
  const total = () => Math.max(0, sc1() + sc2() + sc3() + sc4() + bonus());
  const errors = () => P2.filter(q => S.p2[q.id] !== undefined && S.p2[q.id] !== q.a).length + EFECTES.filter((e,i) => S.ef[i] !== undefined && S.ef[i] !== e.a).length
    + P3.filter(q => S.p3[q.id] !== undefined && S.p3[q.id] !== q.a).length + (S.orderDone ? [0,1,2,3].filter(i => S.order[i] !== i).length : 0) + VICTIMS.filter((v,i) => S.tri[i] !== undefined && S.tri[i] !== v.a).length;

  /* --- món 3D */
  const W = window.WORLD = createWorld($("#stage"), {onSpot: id => openSpot(id)});
  applyPrefs();
  S.found.forEach(id => W.markFound(id));
  if (S.activated) W.finishActivation();
  Object.keys(S.tri).sort((a,b) => a-b).forEach(i => W.admit(S.tri[i], false, +i));

  const panel = $("#panel");
  const PH = ["Inici","Analitza","Classifica","Activa","Triatge","Informe"];

  /* --- vistes */
  function setView(v){
    if (v === "hosp" && !W.ok) return;
    W.setLocked(S.phase < 3); W.setView(v);
    $("#vVall").setAttribute("aria-pressed", v === "vall"); $("#vHosp").setAttribute("aria-pressed", v === "hosp");
    const locked = S.phase < 3;
    $("#lock").hidden = !(v === "hosp" && locked);
    $("#beds").hidden = !(v === "hosp" && !locked);
    $("#hint3d").textContent = v === "vall" ? "Arrossega per girar el mapa · roda o pinça per apropar · toca els cercles taronja" : "Arrossega per girar · roda o pinça per apropar";
    renderBeds();
  }
  let bedsOpen = (() => { try { const v = localStorage.getItem("hc-beds-open"); if (v !== null) return v === "1"; } catch(e) {} return innerWidth > 640; })();
  function renderBeds(){
    const f = W.free(), tot = f.r + f.y + f.g + f.k;
    $("#beds").innerHTML = `<button type="button" class="bedsBtn" id="bedsBtn" aria-expanded="${bedsOpen}" aria-controls="bedsList">${bedsOpen ? "▾ Amaga" : "▸ Mostra"} places lliures <b>(${tot})</b></button>` +
      `<div id="bedsList" ${bedsOpen ? "" : "hidden"}>` + ["r","y","g","k"].map(t => `<div><span style="width:18px;height:18px;color:#fff;display:inline-flex">${TAG_SHAPE[t]}</span>${TAGS[t][0]}: <b>${f[t]}</b> ${t === "g" ? "places" : "llits"} lliures</div>`).join("") + `</div>`;
    $("#bedsBtn").onclick = () => { bedsOpen = !bedsOpen; try { localStorage.setItem("hc-beds-open", bedsOpen ? "1" : "0"); } catch(e) {} renderBeds(); $("#bedsBtn").focus(); };
  }
  $("#vVall").onclick = () => setView("vall");
  $("#lockBack").onclick = () => setView("vall");
  // tocar fora del requadre de l'avís també torna al mapa
  $("#lock").addEventListener("click", e => { if (!e.target.closest(".lockcard")) setView("vall"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#lock").hidden) setView("vall"); });
  $("#vHosp").onclick = () => setView("hosp");
  $("#zIn").onclick = () => W.zoom(1); $("#zOut").onclick = () => W.zoom(-1); $("#zHome").onclick = () => W.resetCam();
  $("#skip").onclick = () => W.finishActivation();

  /* --- capçalera */
  function renderTop(){
    $("#steps").innerHTML = PH.slice(1).map((p,i) => { const n = i+1, cls = n < S.phase ? "done" : (n === S.phase ? "now" : ""); return `<li class="${cls}"${n === S.phase ? ' aria-current="step"' : ""}>${n}. ${p}</li>`; }).join("");
    $("#score").innerHTML = `${total()} <small>/ 1000</small>`;
    const clocks = ["03:12 · terratrèmol","03:25 · reconeixement","03:40 · valoració","03:55 · activació","06:40 · triatge","08:00 · informe"];
    $("#clock").textContent = clocks[S.phase];
    $("#vHosp").innerHTML = (S.phase < 3 ? ICON.lock.replace("<svg", '<svg class="ico"') : "") + "Hospital";
  }

  let shownPhase = -1;
  function render(){
    renderTop();
    panel.innerHTML = [renderIntro, renderP1, renderP2, renderP3, renderP4, renderP5][S.phase]();
    bind();
    W.showSpots(S.phase <= 2);
    W.showSites(S.phase === 3 && S.p3.lloc === undefined);
    if (S.phase === 4 && shownPhase !== 4) setView("hosp"); else setView(W.getView());
    shownPhase = S.phase;
  }
  const todo = (steps) => `<div class="todo"><b>Què has de fer</b><ol>${steps.map(s => `<li>${s}</li>`).join("")}</ol></div>`;
  function hintHTML(key, text){ return S.hintOpen[key] ? `<div class="hintbox"><b>Pista:</b> ${esc(text)}</div>` : `<button type="button" class="hintbtn" data-hint="${key}">Vull una pista (perds la bonificació final de 50 punts)</button>`; }
  function fbHTML(kind, delta, msg, src){
    const label = kind === "ok" ? "Correcte" : kind === "pa" ? "Gairebé" : "No és correcte";
    const d = delta > 0 ? `+${delta}` : `${delta}`;
    return `<div class="fb ${kind}" role="status"><b>${kind === "ok" ? "✓" : kind === "pa" ? "≈" : "✗"} ${label}</b><span class="delta">${d} punts</span><p style="margin:.3em 0 0">${esc(msg)}${src ? ` <span class="muted">(${src})</span>` : ""}</p></div>`;
  }
  function qHTML(q, val, group, first){
    const ans = val !== undefined;
    const opts = q.o.map((o,i) => { let c = "opt"; if (ans){ if (i === q.a) c += " right"; else if (i === val) c += (q.partial && q.partial[i]) ? " partial" : " wrong"; }
      return `<button type="button" class="${c}" data-q="${group}:${q.id}:${i}" ${ans ? "disabled" : ""}>${esc(o)}</button>`; }).join("");
    let fb = "";
    if (ans){ const good = val === q.a, part = !good && q.partial && q.partial[val];
      const msg = good ? q.ok : part ? q.part : ((q.bad && q.bad[val]) ? q.bad[val] + " " : "") + "La resposta correcta és: " + q.o[q.a] + ". " + q.ok;
      fb = fbHTML(good ? "ok" : part ? "pa" : "ko", qDelta(q, val), msg, q.src); }
    return `<div class="q${first ? " first" : ""}"><div class="qh"><h3>${esc(q.t)}</h3><span class="pts">+${q.pts} / −${q.neg || q.pts/2}</span></div>
      ${q.data ? `<span class="data">Dada del cas: <b>${esc(q.data)}</b></span>` : ""}
      <div class="opts" role="group" aria-label="${esc(q.t)}">${opts}</div>${fb || hintHTML(group + q.id, q.hint)}</div>`;
  }

  /* --- Fase 0 */
  function renderIntro(){
    return `<article class="card"><div class="cardhead"><div class="eyebrow">Desastre no evacuable</div>${sayBtn()}</div>
      <h1 class="ptitle">03:12. La vall tremola.</h1>
      <p>Hi ha hagut un <b>terratrèmol</b> a la <b>Vall d'Arnes</b>, al Pirineu. Hi viuen 1.400 persones. Aquest cap de setmana hi ha 400 persones més per un festival de música.</p>
      <p>Una ${term("esllavissada")} ha tallat l'única carretera. El pont s'ha trencat. El temporal no deixa volar els helicòpters. <b>Ningú no pot sortir de la vall.</b></p>
      <p>Tu ets la persona responsable sanitària. Has de muntar un ${term("campanya")}.</p>
      <dl class="fitxa"><dt>Hora</dt><dd>03:12</dd><dt>Magnitud</dt><dd>6,1 · a 4 km del poble</dd><dt>Radi afectat</dt><dd>uns 6 km</dd>
      <dt>Persones a la vall</dt><dd>1.400 + 400 visitants</dd><dt>${term("potencials","Víctimes potencials")}</dt><dd>entre 180 i 320</dd><dt>Hospital més proper</dt><dd>a 90 km, no s'hi pot arribar</dd></dl></article>
      <article class="card"><div class="cardhead"><h2 class="eyebrow">Com funciona</h2>${sayBtn()}</div>
      <p>Hi ha <b>5 fases</b>: analitza, classifica, activa, triatge i informe.</p>
      <p>Cada resposta correcta <b>suma</b> punts. Cada error <b>resta</b> punts. Només pots respondre una vegada.</p>
      <p>Les paraules <span style="text-decoration:underline dotted 2px">subratllades amb punts</span> tenen una explicació: toca-les. El botó <b>Escolta</b> llegeix el text en veu alta.</p>
      <label class="fl" for="nom">Escriu el teu nom i cognoms</label>
      <input type="text" id="nom" autocomplete="name" value="${esc(S.name)}">
      <div class="row" style="margin-top:14px"><button type="button" class="btn" id="start" ${S.name.trim().length < 3 ? "disabled" : ""}>Comença</button></div></article>`;
  }

  /* --- Fase 1 */
  function renderP1(){
    const spots = HOTSPOTS.map(h => { const f = S.found.includes(h.id);
      return `<button type="button" class="spot ${f ? "found" : ""}" data-spot="${h.id}"><span class="num">${f ? "✓" : h.n}</span><span>${esc(h.nom)}<small>${f ? "Revisat" : "Per revisar"}</small></span></button>`; }).join("");
    const n = S.found.length, can = n >= 5;
    return `<article class="card"><div class="cardhead"><div class="eyebrow">Fase 1 · Analitza · fins a 100 punts</div>${sayBtn()}</div>
      <h1 class="ptitle">Mira què ha passat</h1>
      ${todo(["Toca un cercle taronja del mapa o un botó d'aquí sota.","Mira la foto i llegeix què ha passat.","Revisa com a mínim 5 llocs. Si els revises tots 6, guanyes 10 punts més."])}
      <div class="spots">${spots}</div>
      <div class="progress" aria-hidden="true"><span style="width:${n/6*100}%"></span></div>
      <p class="small muted" style="margin-top:6px">${n} de 6 llocs revisats</p></article>
      <div class="row"><button type="button" class="btn" id="next" ${can ? "" : "disabled"}>Continua a la fase 2</button>
      ${can ? "" : `<span class="small muted">${5-n === 1 ? "Falta 1 lloc" : "Falten " + (5-n) + " llocs"} per revisar</span>`}</div>`;
  }
  function openSpot(id){
    const h = HOTSPOTS.find(x => x.id === id); if (!h) return;
    if (S.phase === 1 && !S.found.includes(id)){ S.found.push(id); save(); W.markFound(id); }
    if (W.getView() !== "vall") setView("vall");
    W.focusSpot(id);
    const d = $("#dlg");
    d.innerHTML = `<figure><div class="imgwrap"><img src="${COMMONS(h.foto)}" alt="${esc(h.alt)}" loading="eager" referrerpolicy="no-referrer"></div>
      <figcaption>Foto real d'exemple (no és la Vall d'Arnes). Font: <a href="${COMMONS_PAGE(h.foto)}" target="_blank" rel="noopener">Wikimedia Commons</a> · consulta-hi l'autoria i la llicència.</figcaption></figure>
      <div class="body"><div class="eyebrow">Punt ${h.n} de 6</div><h2>${esc(h.nom)}</h2><p>${esc(h.text)}</p>
      <div class="row" style="margin-top:12px">${sayBtn("Escolta")}<button type="button" class="btn" id="dlgClose">Entesos</button></div></div>`;
    d.querySelector(".say").onclick = e => speak(h.nom + ". " + h.text, e.currentTarget);
    d.querySelector("img").onerror = e => { e.target.closest(".imgwrap").innerHTML = '<p style="color:#fff;padding:20px;text-align:center">No s\'ha pogut carregar la foto. Revisa la connexió.</p>'; };
    const close = () => { try { d.close(); } catch(e) { d.removeAttribute("open"); } if (window.speechSynthesis) speechSynthesis.cancel(); if (S.phase === 1) render(); };
    $("#dlgClose").onclick = close; d.onclose = () => { if (S.phase === 1) render(); };
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    $("#dlgClose").focus();
  }

  /* --- Fase 2 */
  function renderP2(){
    const qs = P2.map((q,i) => qHTML(q, S.p2[q.id], "p2", i === 0)).join("");
    const ef = EFECTES.map((e,i) => { const v = S.ef[i], ans = v !== undefined;
      const opts = EF_OPTS.map((o,k) => { let c = "opt"; if (ans){ if (k === e.a) c += " right"; else if (k === v) c += " wrong"; } return `<button type="button" class="${c}" data-ef="${i}:${k}" ${ans ? "disabled" : ""}>${o}</button>`; }).join("");
      return `<div class="q${i === 0 ? " first" : ""}"><div class="qh"><h3>${esc(e.t)}</h3><span class="pts">+15 / −5</span></div><div class="opts">${opts}</div>${ans ? fbHTML(v === e.a ? "ok" : "ko", efDelta(e, v), v === e.a ? e.why : "És " + EF_OPTS[e.a].toLowerCase() + ". " + e.why, "U1") : ""}</div>`; }).join("");
    const allEf = EFECTES.every((e,i) => S.ef[i] !== undefined);
    const done = P2.every(q => S.p2[q.id] !== undefined) && allEf;
    const left = P2.filter(q => S.p2[q.id] === undefined).length + EFECTES.filter((e,i) => S.ef[i] === undefined).length;
    return `<article class="card"><div class="cardhead"><div class="eyebrow">Fase 2 · Classifica · fins a 250 punts</div>${sayBtn()}</div>
      <h1 class="ptitle">Quin desastre és?</h1>
      ${todo(["Llegeix cada pregunta i les dades del cas.","Tria una resposta. Només tens un intent.","Si encertes, sumes punts. Si t'equivoques, en restes. Llegeix l'explicació."])}
      ${qs}</article>
      <article class="card"><div class="cardhead"><div class="eyebrow">Els efectes del terratrèmol</div>${sayBtn()}</div>
      <p>Tria si cada efecte és <b>directe</b> (passa al moment), <b>indirecte</b> (ve d'un altre dany) o <b>tardà</b> (arriba molt després).</p>
      ${ef}</article>
      <div class="row"><button type="button" class="btn" id="next" ${done ? "" : "disabled"}>Continua a la fase 3</button>${done ? "" : `<span class="small muted">${left === 1 ? "Falta 1 resposta" : "Falten " + left + " respostes"}</span>`}</div>`;
  }

  /* --- Fase 3 */
  function renderP3(){
    const qs = P3.map((q,i) => qHTML(q, S.p3[q.id], "p3", i === 0)).join("");
    const ord = ORDRE_SHUFFLE.map(idx => { const pos = S.order.indexOf(idx); let cls = pos >= 0 ? "sel" : ""; if (S.orderDone) cls += pos === idx ? " okp" : " kop";
      return `<button type="button" class="${cls}" data-ord="${idx}" ${S.orderDone ? "disabled" : ""} aria-label="${esc(ORDRE[idx])}${pos >= 0 ? ", posició " + (pos+1) : ""}"><span class="n">${pos >= 0 ? pos+1 : ""}</span><span>${esc(ORDRE[idx])}${S.orderDone ? (pos === idx ? " ✓" : " ✗") : ""}</span></button>`; }).join("");
    let ofb = "";
    if (S.orderDone){ const good = S.order.every((v,i) => v === i); const d = [0,1,2,3].reduce((s,i) => s + ordDelta(i), 0);
      ofb = fbHTML(good ? "ok" : "ko", d, (good ? "" : "L'ordre correcte és: " + ORDRE.map((o,i) => (i+1) + ". " + o).join(" · ") + ". ") + "Primer s'activen els recursos de la vall i es demana ajuda de fora. Després es rescaten i s'atenen les víctimes. La Creu Roja s'encarrega dels albergs i del menjar.", "U2"); }
    const allQ = P3.every(q => S.p3[q.id] !== undefined), ready = allQ && S.orderDone;
    return `<article class="card"><div class="cardhead"><div class="eyebrow">Fase 3 · Activa · fins a 200 punts</div>${sayBtn()}</div>
      <h1 class="ptitle">Activa el pla</h1>
      <p><b>L'hospital de campanya ja està desbloquejat.</b> Toca el botó <b>Hospital</b> del mapa per veure'l: hi ha llits, zones de ${term("triatge")}, caixes de material i medicació.</p>
      ${todo(["Respon les 4 preguntes.","Ordena les primeres actuacions.","Prem «Activa el pla d'emergència» i mira l'arribada dels equips al mapa."])}
      ${qs}</article>
      <article class="card"><div class="cardhead"><div class="eyebrow">Primeres actuacions · +15 / −5 cadascuna</div>${sayBtn()}</div>
      <p>Toca les actuacions en l'ordre en què s'han de fer (1, 2, 3, 4).</p>
      <div class="order">${ord}</div>
      ${S.orderDone ? "" : `<div class="row" style="margin-top:10px"><button type="button" class="btn ghost" id="ordReset" ${S.order.length ? "" : "disabled"}>Esborra</button><button type="button" class="btn" id="ordOk" ${S.order.length === 4 ? "" : "disabled"}>Confirma l'ordre</button></div>${hintHTML("p3ord","Pensa: abans d'atendre les víctimes, qui ha de venir i qui ho ha de demanar?")}`}
      ${ofb}</article>
      <article class="card"><div class="cardhead"><div class="eyebrow">Activació</div></div>
      ${S.activated ? `<p><b>Pla activat.</b> Els helicòpters de la ${term("ume","UME")} han aterrat amb material i personal. Les ambulàncies i els equips de rescat ja són al seu lloc.</p>
        <p>Els helicòpters no poden evacuar 300 persones i la carretera seguirà tallada: l'atenció es fa aquí, a l'hospital de campanya.</p>
        <button type="button" class="btn" id="next">Continua al triatge</button>`
      : `<p>06:30. El temporal para una estona. És el moment d'activar el pla.</p><button type="button" class="btn" id="activate" ${ready ? "" : "disabled"}>Activa el pla d'emergència</button>${ready ? "" : '<p class="small muted">Primer respon totes les preguntes i confirma l\'ordre.</p>'}`}
      </article>`;
  }

  /* --- Fase 4 */
  const vital = (l, v) => `<div class="vital"><span>${l}</span><b>${esc(v)}</b></div>`;
  function renderP4(){
    let body;
    if (S.vi < VICTIMS.length){
      const i = S.vi, v = VICTIMS[i], ch = S.tri[i];
      const tags = ["g","y","r","k"].map(t => `<button type="button" class="tag ${t} ${ch === t ? "chosen" : ""}" data-tag="${t}" ${ch ? "disabled" : ""} aria-label="${TAGS[t][0]}, ${TAGS[t][1]}">${TAG_SHAPE[t]}<b>${TAGS[t][0]}</b><small>${TAGS[t][1]}</small></button>`).join("");
      let fb = "";
      if (ch){ const ok = ch === v.a; fb = fbHTML(ok ? "ok" : "ko", triDelta(i), (ok ? "" : "Era " + TAGS[v.a][0].toUpperCase() + ". ") + v.why, "START") +
        `<div class="row" style="margin-top:10px"><button type="button" class="btn" id="nextV">${i < VICTIMS.length - 1 ? "Següent víctima" : "Tanca el triatge"}</button></div>`; }
      body = `<article class="card"><div class="vhead"><h3>${esc(v.nom)}</h3><span class="pts">Víctima ${i+1} de 10 · +40 / −10</span></div>
        <div class="row" style="justify-content:space-between"><p style="margin:.4em 0">${esc(v.d)}</p>${sayBtn()}</div>
        <div class="vitals">${vital("Pot caminar?", v.camina)}${vital("Respira?", v.respira)}${vital("Respiracions per minut (FR)", v.fr)}${vital("Pols al canell", v.pols)}${vital("Reompliment capil·lar", v.rc)}${vital("Fa cas a ordres senzilles?", v.ordres)}</div>
        <div class="tags" role="group" aria-label="Tria l'etiqueta de triatge">${tags}</div>${fb}</article>`;
    } else {
      body = `<article class="card"><p><b>Triatge acabat.</b> Has classificat les 10 víctimes. Punts del triatge: ${sc4()} de 400.</p><button type="button" class="btn" id="next">Mostra l'informe</button></article>`;
    }
    const algo = S.hintOpen.algo ? `<div class="algo">${ALGO_SVG}</div>` : `<button type="button" class="hintbtn" data-hint="algo">Mostra l'esquema del mètode START (perds la bonificació final)</button>`;
    return `<article class="card"><div class="cardhead"><div class="eyebrow">Fase 4 · Triatge · fins a 400 punts</div>${sayBtn()}</div>
      <h1 class="ptitle">Fes el triatge</h1>
      ${todo([`Llegeix les dades de la víctima. Toca les paraules subratllades si no les entens: ${term("fr","FR")}, ${term("pols","pols")}, ${term("rc","reompliment capil·lar")}, ${term("via","via aèria")}.`, `Aplica el ${term("start","mètode START")} i tria una etiqueta.`, "La víctima anirà a la seva zona de l'hospital. Mira-ho a la imatge."])}
      ${algo}</article>${body}`;
  }

  /* --- Fase 5 */
  function hashStr(str){ let h = 0x811c9dc5; for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  const code = () => { const h = hashStr([USER, S.name.trim().toLowerCase(), sc1(), sc2(), sc3(), sc4(), bonus(), S.found.join(","), JSON.stringify(S.tri)].join("|")).toString(16).toUpperCase().padStart(8, "0"); return "VA-" + h.slice(0,4) + "-" + h.slice(4); };
  const resultText = () => ["HOSPITAL DE CAMPANYA · VALL D'ARNES", "Alumne/a: " + S.name.trim(), "Correu: " + USER, "1 Analitza: " + sc1() + "/100", "2 Classifica: " + sc2() + "/250", "3 Activa: " + sc3() + "/200", "4 Triatge: " + sc4() + "/400", "Bonificació sense pistes: " + bonus() + "/50", "Errors: " + errors(), "TOTAL: " + total() + "/1000", "Codi de verificació: " + code()].join("\n");
  function renderP5(){
    const b = [["Analista d'escenaris", S.found.length === 6], ["Classificació precisa", sc2() >= 220], ["Coordinació", sc3() >= 170], ["Ull clínic", sc4() >= 360], ["Sense pistes", S.hints === 0]];
    return `<article class="cert"><div class="eyebrow">Informe de guàrdia · Vall d'Arnes</div>
      <div class="row" style="justify-content:space-between;margin-top:6px"><div><div class="small muted">Responsable sanitari/ària</div><div style="font-weight:700;font-size:1.2rem">${esc(S.name.trim())}</div><div class="small muted">${esc(USER)}</div></div>
      <div style="text-align:right"><div class="big">${total()}</div><div class="small muted">punts de 1000</div></div></div>
      <table><tr><td>1 · Analitza</td><td>${sc1()} / 100</td></tr><tr><td>2 · Classifica</td><td>${sc2()} / 250</td></tr><tr><td>3 · Activa</td><td>${sc3()} / 200</td></tr><tr><td>4 · Triatge</td><td>${sc4()} / 400</td></tr><tr><td>Bonificació sense pistes</td><td>${bonus()} / 50</td></tr><tr><td>Errors</td><td>${errors()}</td></tr></table>
      <div class="badges">${b.map(([t,on]) => `<span class="badge ${on ? "" : "off"}">${on ? "★ " : ""}${t}</span>`).join("")}</div>
      <p class="small" style="margin-top:12px">Codi de verificació: <span class="code">${code()}</span></p></article>
      <article class="card"><div class="cardhead"><div class="eyebrow">Lliura-ho a Classroom</div>${sayBtn()}</div>
      <p>Fes una captura de pantalla de l'informe. També pots copiar el text i enganxar-lo a la tasca.</p>
      <div class="row"><button type="button" class="btn" id="copy">Copia el resultat</button><span class="small muted" id="copied" aria-live="polite"></span></div>
      <textarea class="copy" id="resultTxt" readonly aria-label="Resultat en text">${esc(resultText())}</textarea></article>
      <article class="card"><div class="cardhead"><div class="eyebrow">Per pensar</div>${sayBtn()}</div>
      <p>A l'activitat en paper «Alerta al Camp» l'escenari era <b>evacuable</b>. Què canvia quan no ho és? Pensa en el material, el personal, l'aigua, l'electricitat i el temps.</p>
      <div class="row"><button type="button" class="btn ghost" id="restart">Torna a començar</button><span class="small muted" id="rsMsg"></span></div></article>`;
  }

  /* --- esdeveniments */
  function bind(){
    panel.querySelectorAll("[data-say]").forEach(b => b.onclick = () => speak(textOf(b.closest(".card,.cert")), b));
    const nom = $("#nom"); if (nom) nom.oninput = () => { S.name = nom.value; save(); $("#start").disabled = S.name.trim().length < 3; };
    const st = $("#start"); if (st) st.onclick = () => { S.phase = 1; save(); render(); };
    const nx = $("#next"); if (nx) nx.onclick = () => { S.phase++; save(); render(); scrollTo({top:0, behavior: prefs.motion === "off" ? "auto" : "smooth"}); const h = panel.querySelector(".ptitle"); h && h.setAttribute("tabindex","-1"); h && h.focus({preventScroll:true}); };
    panel.querySelectorAll("[data-spot]").forEach(b => b.onclick = () => openSpot(b.dataset.spot));
    panel.querySelectorAll("[data-hint]").forEach(b => b.onclick = () => { const k = b.dataset.hint; if (!S.hintOpen[k]){ S.hintOpen[k] = true; S.hints++; save(); render(); } });
    panel.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { const [g, id, i] = b.dataset.q.split(":"); const store = g === "p2" ? S.p2 : S.p3; if (store[id] !== undefined) return; store[id] = +i; save();
      if (g === "p3" && id === "lloc"){ W.focusSite(+i); } render(); focusFb(b.dataset.q); });
    panel.querySelectorAll("[data-ef]").forEach(b => b.onclick = () => { const [i,k] = b.dataset.ef.split(":").map(Number); if (S.ef[i] === undefined){ S.ef[i] = k; save(); render(); focusFb(b.dataset.ef, "ef"); } });
    panel.querySelectorAll("[data-ord]").forEach(b => b.onclick = () => { const idx = +b.dataset.ord, p = S.order.indexOf(idx); if (p >= 0) S.order.splice(p, 1); else if (S.order.length < 4) S.order.push(idx); save(); render(); const nb = panel.querySelector(`[data-ord="${idx}"]`); nb && nb.focus(); });
    const orr = $("#ordReset"); if (orr) orr.onclick = () => { S.order = []; save(); render(); };
    const ook = $("#ordOk"); if (ook) ook.onclick = () => { S.orderDone = true; save(); render(); };
    const ac = $("#activate"); if (ac) ac.onclick = () => { ac.disabled = true; setView("vall"); $("#skip").hidden = false; W.playActivation(() => { $("#skip").hidden = true; S.activated = true; save(); render(); const n = $("#next"); n && n.focus(); }); };
    panel.querySelectorAll("[data-tag]").forEach(b => b.onclick = () => { const i = S.vi; if (S.tri[i]) return; S.tri[i] = b.dataset.tag; save(); setView("hosp"); W.admit(b.dataset.tag, true, i); render(); renderBeds(); const n = $("#nextV"); n && n.focus(); });
    const nv = $("#nextV"); if (nv) nv.onclick = () => { S.vi++; save(); render(); };
    const cp = $("#copy"); if (cp) cp.onclick = () => { const msg = $("#copied"), fallback = () => { const ta = $("#resultTxt"); ta.focus(); ta.select(); msg.textContent = "Text seleccionat. Copia'l amb Ctrl+C."; };
      try { navigator.clipboard.writeText(resultText()).then(() => { msg.textContent = "Copiat."; }, fallback); } catch(e){ fallback(); } };
    const rs = $("#restart"); if (rs) rs.onclick = () => { if (rs.dataset.armed){ S = fresh(); save(); W.resetAll(); render(); return; } rs.dataset.armed = "1"; rs.textContent = "Sí, esborra-ho tot"; $("#rsMsg").textContent = "Es perdrà la puntuació. Torna a prémer per confirmar."; };
  }
  function focusFb(key, kind){ const sel = kind === "ef" ? `[data-ef^="${key.split(":")[0]}:"]` : `[data-q^="${key.split(":").slice(0,2).join(":")}:"]`; const b = panel.querySelector(sel); const fb = b && b.closest(".q") && b.closest(".q").querySelector(".fb"); if (fb){ fb.setAttribute("tabindex","-1"); fb.focus({preventScroll:false}); } }

  render();
}

/* Esquema START (pista) */
const ALGO_SVG = `<svg viewBox="0 0 580 270" role="img" aria-label="Esquema del mètode START: si camina, verd. Si no respira ni amb la via oberta, negre. Si respira només amb la via oberta, vermell. Si respira més de 30 vegades per minut, vermell. Si no té pols al canell o el reompliment és de més de 2 segons, vermell. Si no fa cas a ordres, vermell. Si no, groc.">
<style>.bx{fill:var(--surface);stroke:var(--ink);stroke-width:1.6}.tx{fill:var(--ink);font:700 13px var(--f-body)}.sm{fill:var(--ink);font:700 12px var(--f-body)}.ln{stroke:var(--ink);stroke-width:1.6;fill:none}</style>
<rect class="bx" x="10" y="10" width="130" height="36" rx="5"/><text class="tx" x="75" y="33" text-anchor="middle">Camina?</text>
<rect class="bx" x="10" y="74" width="130" height="36" rx="5"/><text class="tx" x="75" y="97" text-anchor="middle">Respira?</text>
<rect class="bx" x="170" y="74" width="140" height="36" rx="5"/><text class="tx" x="240" y="97" text-anchor="middle">Obre la via aèria</text>
<rect class="bx" x="10" y="138" width="130" height="36" rx="5"/><text class="tx" x="75" y="161" text-anchor="middle">FR més de 30?</text>
<rect class="bx" x="10" y="202" width="150" height="40" rx="5"/><text class="tx" x="85" y="218" text-anchor="middle">Sense pols al canell</text><text class="tx" x="85" y="234" text-anchor="middle">o reompliment &gt; 2 s?</text>
<rect class="bx" x="220" y="202" width="140" height="40" rx="5"/><text class="tx" x="290" y="227" text-anchor="middle">Fa cas a ordres?</text>
<rect x="170" y="10" width="100" height="36" rx="5" fill="var(--t-green)"/><text x="220" y="33" text-anchor="middle" fill="#fff" style="font:700 13px var(--f-body)">● VERD</text>
<rect x="340" y="62" width="100" height="30" rx="5" fill="var(--t-black)" stroke="var(--t-black-line)"/><text x="390" y="82" text-anchor="middle" fill="#fff" style="font:700 13px var(--f-body)">✕ NEGRE</text>
<rect x="450" y="130" width="120" height="36" rx="5" fill="var(--t-red)"/><text x="510" y="153" text-anchor="middle" fill="#fff" style="font:700 13px var(--f-body)">■ VERMELL</text>
<rect x="450" y="214" width="120" height="36" rx="5" fill="var(--t-yellow)"/><text x="510" y="237" text-anchor="middle" fill="#1e1600" style="font:700 13px var(--f-body)">▲ GROC</text>
<path class="ln" d="M140 28H170"/><text class="sm" x="144" y="22">sí</text>
<path class="ln" d="M75 46V74"/><text class="sm" x="80" y="64">no</text>
<path class="ln" d="M140 92H170"/><text class="sm" x="144" y="86">no</text>
<path class="ln" d="M310 82H340"/><text class="sm" x="314" y="77">no</text>
<path class="ln" d="M310 100H360V140H450"/><text class="sm" x="364" y="124">respira</text>
<path class="ln" d="M75 110V138"/><text class="sm" x="80" y="128">sí</text>
<path class="ln" d="M140 150H450"/><text class="sm" x="144" y="145">sí</text>
<path class="ln" d="M75 174V202"/><text class="sm" x="80" y="192">no</text>
<path class="ln" d="M160 210H190V158H450"/><text class="sm" x="166" y="205">sí</text>
<path class="ln" d="M160 228H220"/><text class="sm" x="180" y="250">no</text>
<path class="ln" d="M360 212H400V162H450"/><text class="sm" x="404" y="190">no</text>
<path class="ln" d="M360 232H450"/><text class="sm" x="372" y="248">sí</text>
</svg>`;

/* ================================================== Panell d'accessibilitat (sempre disponible) */
function initA11y(){
  const btn = $("#a11yBtn"), box = $("#a11y");
  if (!btn) return;
  const sync = () => { box.querySelectorAll("input").forEach(i => { i.checked = prefs[i.name] === i.value; }); };
  btn.onclick = () => { box.hidden = !box.hidden; btn.setAttribute("aria-expanded", !box.hidden); if (!box.hidden){ sync(); box.querySelector("input:checked").focus(); } };
  box.addEventListener("change", e => { if (e.target.name){ prefs[e.target.name] = e.target.value; applyPrefs(); } });
  $("#a11yClose").onclick = () => { box.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); };
  applyPrefs();
}
