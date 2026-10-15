/* Fase 6 · Mapa de riscos i recursos de la Vall d'Arnes (SVG animat, sense 3D)
   Les capes apareixen a mesura que l'alumne respon. Mateixes coordenades que el mapa 3D. */
"use strict";
function createPlan(host){
  const X = x => +(420 + x*15).toFixed(1), Y = z => +(290 + z*8.5).toFixed(1);
  const P = (x, z) => X(x) + "," + Y(z);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cx = z => 0.5 + Math.sin(z*0.04)*1.5, riverX = z => 4.4 + Math.sin(z*0.11) * 1.0;
  const zs = []; for (let z=-36; z<=36; z+=2) zs.push(z);
  const band = d => "M" + zs.map(z => P(cx(z)-d, z)).join(" L") + " L" + zs.slice().reverse().map(z => P(cx(z)+d, z)).join(" L") + "Z";
  const river = "M" + zs.map(z => P(riverX(z), z)).join(" L");
  const ROADS = [[[7.6,40],[7.6,22],[7.5,22],[7.2,18.5]],[[1.0,18.5],[-0.8,15],[-1,5],[-1,-6],[-1,-12],[-1,-22]],[[-1,4.8],[-3.9,4.8]],[[-1,-6],[-9,-6]],[[-1,-12.6],[3.6,-12.6]]];
  const HOUSES = [[-3.6,-3.6,2.2,2],[-3.7,-0.5,2,1.8],[-3.6,2.4,2,1.8],[1.4,-3.2,2,1.8],[1.3,-6.8,1.8,2],[1.6,-9.6,2,1.8],[-3.4,-12.4,2.2,2],[-6.2,-15.4,2,2],[-3.4,-16.4,2,1.8],[1.5,0.4,1.8,1.8],[-9.6,-12.2,2,2],[-9.8,-3.2,2,1.8],[-6.6,-12.4,1.8,1.8],[-9.5,-15.6,2,2]];
  const rect = (x, z, w, d, cls, extra) => `<rect class="${cls}" x="${X(x-w/2)}" y="${Y(z-d/2)}" width="${(w*15).toFixed(1)}" height="${(d*8.5).toFixed(1)}" ${extra||""}/>`;
  // arbres als vessants (punts)
  let trees = ""; for (let i=0;i<520;i++){ const z = -34 + rnd()*68, side = rnd() < .5 ? -1 : 1, x = cx(z) + side*(10.5 + rnd()*14); if (Math.abs(x - riverX(z)) < 2.5) continue; trees += `<circle cx="${X(x)}" cy="${Y(z)}" r="${(2.6+rnd()*2.4).toFixed(1)}"/>`; }
  const badge = (x, y, fill, glyph, txt, k, anchor) => `<g class="pl-l" data-k="${k}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+22}" stroke="#1d2a24" stroke-width="2"/><circle cx="${x}" cy="${y}" r="17" fill="${fill}" stroke="#fff" stroke-width="3"/>${glyph}<text class="pl-tag" x="${x + (anchor === "end" ? -24 : 24)}" y="${y+5}" text-anchor="${anchor||"start"}">${txt}</text></g>`;
  const T = (x, y, s, fill) => `<text x="${x}" y="${y+6}" text-anchor="middle" font-weight="700" font-size="${s||16}" fill="${fill||"#fff"}">`;
  const svg = `<svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="plT plD">
  <title id="plT">Mapa de riscos i recursos de la Vall d'Arnes</title>
  <desc id="plD">Mapa vist des de dalt: la vall, el riu, el poble, el camp de futbol, l'heliport i el festival. Les zones de risc, els recursos i les mesures noves apareixen quan respons.</desc>
  <defs>
    <pattern id="hBrown" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(140,90,40,.18)"/><line x1="0" y1="0" x2="0" y2="10" stroke="#8c5a28" stroke-width="4"/></pattern>
    <pattern id="hFire" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="12" height="12" fill="rgba(230,90,20,.16)"/><line x1="0" y1="0" x2="0" y2="12" stroke="#e0661f" stroke-width="3"/></pattern>
    <radialGradient id="gQuake"><stop offset="0" stop-color="#c21f1f" stop-opacity=".45"/><stop offset="1" stop-color="#c21f1f" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="800" height="560" fill="#cfc6a6"/>
  <g fill="none" stroke="#b5ab88" stroke-width="1.4"><path d="${band(13)}"/><path d="${band(17)}"/><path d="${band(22)}"/><path d="${band(28)}"/></g>
  <path d="${band(9.5)}" fill="#e2e8cf" stroke="#a9b48f" stroke-width="2"/>
  <g fill="#5f7d4e" opacity=".75">${trees}</g>
  <g class="pl-l" data-k="risc:foc"><path d="${band(26)} ${band(10.5)}" fill="url(#hFire)" fill-rule="evenodd"/>
    <g class="pl-flame">${[[-17,-20],[16,-8],[-15,20],[17,24]].map(([x,z]) => `<path d="M${X(x)} ${Y(z)+10} q-9 -10 0 -24 q2 9 8 6 q6 10 -8 18z" fill="#f08a24" stroke="#b33c0c" stroke-width="2"/>`).join("")}</g>
    <text class="pl-tag" x="${X(-17)}" y="${Y(-20)+30}" text-anchor="middle">Incendi forestal</text></g>
  <path d="${band(9.5)}" fill="none" stroke="#a9b48f" stroke-width="2"/>
  <g class="pl-l" data-k="risc:riu"><path d="${river}" fill="none" stroke="#3a86c8" stroke-opacity=".28" stroke-width="44" stroke-linejoin="round"/><text class="pl-tag" x="${X(7.6)}" y="${Y(-4)}">Zona inundable</text></g>
  <path d="${river}" fill="none" stroke="#3f84bd" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
  <path class="pl-flow" d="${river}" fill="none" stroke="#d6ecfb" stroke-width="3" stroke-linecap="round"/>
  <g class="pl-l" data-k="risc:slide"><ellipse cx="${X(9.6)}" cy="${Y(26)}" rx="56" ry="34" fill="url(#hBrown)" stroke="#8c5a28" stroke-width="2"/><ellipse cx="${X(-13.5)}" cy="${Y(-24)}" rx="40" ry="26" fill="url(#hBrown)" stroke="#8c5a28" stroke-width="2"/><text class="pl-tag" x="${X(9.6)-62}" y="${Y(26)+30}" text-anchor="end">Esllavissades</text></g>
  <g fill="none" stroke-linecap="round">${ROADS.map(r => `<path d="M${r.map(([x,z]) => P(x,z)).join(" L")}" stroke="#5d5f5c" stroke-width="7"/>`).join("")}
    ${ROADS.map(r => `<path d="M${r.map(([x,z]) => P(x,z)).join(" L")}" stroke="#ece6cc" stroke-width="1.5" stroke-dasharray="6 6"/>`).join("")}</g>
  <path d="M${P(7.6,40)} L${X(7.6)},560" stroke="#5d5f5c" stroke-width="7"/>
  <g><rect x="${X(1)}" y="${Y(18.5)-6}" width="${X(7.2)-X(1)}" height="12" fill="#8b9196" stroke="#2e3336" stroke-width="2"/><text class="pl-lbl" x="${X(4.1)}" y="${Y(18.5)+26}" text-anchor="middle">Pont</text></g>
  <g class="pl-l" data-k="risc:aillament"><circle class="pl-ring" cx="${X(4.1)}" cy="${Y(18.5)}" r="30" fill="none" stroke="#c21f1f" stroke-width="4"/><circle cx="${X(4.1)}" cy="${Y(18.5)}" r="30" fill="none" stroke="#c21f1f" stroke-width="3" stroke-dasharray="5 5"/><text class="pl-tag" x="${X(4.1)+38}" y="${Y(18.5)-12}">Única entrada a la vall</text></g>
  <g class="pl-l" data-k="mes:acces2"><path class="pl-flow2" d="M${P(-1,-22)} C${P(-2,-28)} ${P(-8,-30)} ${X(-9)},0" fill="none" stroke="#1f7a43" stroke-width="6" stroke-dasharray="10 7"/><text class="pl-tag" x="${X(-8)+8}" y="${Y(-31)}">Segon accés (pista nova)</text></g>
  <g class="pl-l" data-k="mes:pontnou"><rect x="${X(1)}" y="${Y(18.5)-6}" width="${X(7.2)-X(1)}" height="12" fill="#1f7a43"/></g>
  <g stroke="#3b3a35" stroke-width="1.5">${HOUSES.map(([x,z,w,d]) => rect(x,z,w,d,"pl-house")).join("")}
    ${rect(-7.2,-9.8,5,3,"pl-pub")}${rect(1.3,-15.2,5.6,2.6,"pl-pub")}${rect(-6.9,-2.6,2.6,4.2,"pl-house")}${rect(-2,7.6,2,1.8,"pl-pub")}</g>
  <text class="pl-lbl" x="${X(-7.2)}" y="${Y(-9.8)+4}" text-anchor="middle">Escola</text>
  <text class="pl-lbl" x="${X(1.3)}" y="${Y(-15.2)+4}" text-anchor="middle">Residència</text>
  <text class="pl-lbl" x="${X(-6.9)}" y="${Y(-2.6)+4}" text-anchor="middle">Església</text>
  <g>${rect(-7.4,4.5,7,5,"", 'fill="#58a34e" stroke="#f4f6ee" stroke-width="2"')}<line x1="${X(-7.4)}" y1="${Y(2)}" x2="${X(-7.4)}" y2="${Y(7)}" stroke="#f4f6ee" stroke-width="2"/><circle cx="${X(-7.4)}" cy="${Y(4.5)}" r="8" fill="none" stroke="#f4f6ee" stroke-width="2"/>
    <text class="pl-lbl" x="${X(-7.4)}" y="${Y(7)+16}" text-anchor="middle">Camp de futbol</text></g>
  <g><circle cx="${X(-11.8)}" cy="${Y(11.5)}" r="20" fill="#5d6166" stroke="#f2f2f2" stroke-width="3"/>${T(X(-11.8), Y(11.5), 20)}H</text><text class="pl-lbl" x="${X(-11.8)}" y="${Y(11.5)+36}" text-anchor="middle">Heliport</text></g>
  <g><rect x="${X(-9)}" y="${Y(16.2)}" width="${X(-2)-X(-9)}" height="${Y(19)-Y(16.2)}" rx="4" fill="#2b2b2e"/><text class="pl-lbl" x="${X(-5.5)}" y="${Y(13.6)}" text-anchor="middle">Festival</text></g>
  <g class="pl-l" data-k="risc:gent"><circle cx="${X(-5.5)}" cy="${Y(14)}" r="56" fill="rgba(194,31,31,.1)" stroke="#c21f1f" stroke-width="3" stroke-dasharray="3 6"/><g fill="#c21f1f">${Array.from({length:40}, (_,i) => `<circle cx="${(X(-5.5) + Math.cos(i*2.4)*Math.sqrt(i)*7).toFixed(1)}" cy="${(Y(13.2) + Math.sin(i*2.4)*Math.sqrt(i)*4.2).toFixed(1)}" r="2.2"/>`).join("")}</g><text class="pl-tag" x="${X(-5.5)}" y="${Y(14)+66}" text-anchor="middle">Festival: molta gent</text></g>
  <g class="pl-l" data-k="risc:sisme"><circle cx="${X(14)}" cy="${Y(-24)}" r="150" fill="url(#gQuake)"/>
    <circle class="pl-ring" cx="${X(14)}" cy="${Y(-24)}" r="60" fill="none" stroke="#c21f1f" stroke-width="3"/><circle class="pl-ring d2" cx="${X(14)}" cy="${Y(-24)}" r="60" fill="none" stroke="#c21f1f" stroke-width="3"/><circle class="pl-ring d3" cx="${X(14)}" cy="${Y(-24)}" r="60" fill="none" stroke="#c21f1f" stroke-width="3"/>
    <path d="M${X(14)} ${Y(-24)-14} l4 9 10 1 -8 7 3 10 -9 -5 -9 5 3 -10 -8 -7 10 -1z" fill="#c21f1f" stroke="#fff" stroke-width="2"/><text class="pl-tag" x="${X(14)}" y="${Y(-24)+34}" text-anchor="middle">Epicentre · rèpliques</text></g>
  <g class="pl-l" data-k="mes:mapa"><rect x="${X(-11.4)}" y="${Y(1.6)}" width="${X(-3.4)-X(-11.4)}" height="${Y(7.4)-Y(1.6)}" rx="6" fill="none" stroke="#1f7a43" stroke-width="5" stroke-dasharray="10 6"/><circle cx="${X(-11.8)}" cy="${Y(11.5)}" r="28" fill="none" stroke="#1f7a43" stroke-width="5" stroke-dasharray="10 6"/></g>
  ${badge(X(-7.4)+4, Y(4.5)-32, "#1f7a43", `<path d="M${X(-7.4)-6} ${Y(4.5)-26} l10 -13 10 13z" fill="#fff"/>`, "Hospital de campanya", "res:camp", "end")}
  ${badge(X(-11.8)-34, Y(11.5)-26, "#1f5fa8", T(X(-11.8)-34, Y(11.5)-26) + "H</text>", "Aterratge", "res:heli", "end")}
  ${badge(X(-4.6), Y(-5)-6, "#e0a21b", `<path d="M${X(-4.6)} ${Y(-5)-17} l10 17 -20 0z" fill="#1f5fa8"/>`, "Voluntaris PC", "res:volunt")}
  ${badge(X(-2)+16, Y(7.6)-22, "#ffffff", `<path d="M${X(-2)+12} ${Y(7.6)-32}h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="#c21f1f"/>`, "Consultori i farmàcia", "res:consult")}
  ${badge(X(-7.2)-48, Y(-9.8)-10, "#7a3fb0", T(X(-7.2)-48, Y(-9.8)-10, 15) + "S</text>", "Simulacre anual", "mes:simul", "end")}
  ${badge(X(-11.5), Y(-1.5), "#b98c58", `<rect x="${X(-11.5)-8}" y="${Y(-1.5)-8}" width="16" height="14" fill="#fff"/>`, "Magatzem d'emergència", "mes:magatzem", "end")}
  <g class="pl-l" data-k="mes:avisos">${[[-1,-12],[-5.5,9.5],[2.4,-1.5]].map(([x,z]) => `<g><circle class="pl-ring" cx="${X(x)}" cy="${Y(z)}" r="22" fill="none" stroke="#e0661f" stroke-width="3"/><circle class="pl-ring d2" cx="${X(x)}" cy="${Y(z)}" r="22" fill="none" stroke="#e0661f" stroke-width="3"/><circle cx="${X(x)}" cy="${Y(z)}" r="9" fill="#e0661f" stroke="#fff" stroke-width="2"/></g>`).join("")}<text class="pl-tag" x="${X(2.4)+16}" y="${Y(-1.5)+5}">ES-Alert i sirenes</text></g>
  <g transform="translate(596 446)"><rect width="196" height="106" rx="8" fill="rgba(255,255,255,.92)" stroke="#1d2a24" stroke-width="2"/><text class="pl-lbl" x="12" y="22">DE FORA DE LA VALL</text>
    <g class="pl-l" data-k="res:ume"><circle cx="26" cy="50" r="15" fill="#4b5e3a" stroke="#fff" stroke-width="2"/><text x="26" y="55" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">UME</text><text class="pl-tag" x="48" y="55">UME</text></g>
    <g class="pl-l" data-k="res:hosp"><circle cx="26" cy="84" r="15" fill="#c21f1f" stroke="#fff" stroke-width="2"/><text x="26" y="90" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">H</text><text class="pl-tag" x="48" y="89">Hospital · 90 km</text></g></g>
  <path class="pl-flow" d="M596 500 C 560 500 ${X(7.6)+10} 520 ${X(7.6)} 470" fill="none" stroke="#1d2a24" stroke-width="2"/>
  <g transform="translate(10 432)"><rect width="250" height="120" rx="8" fill="rgba(255,255,255,.94)" stroke="#1d2a24" stroke-width="2"/>
    <text x="12" y="24" font-weight="700" font-size="15" fill="#1d2a24">PLA D'EMERGÈNCIA · ARNES</text><text x="12" y="42" font-size="12" fill="#3c4741">Revisió un any després del terratrèmol</text>
    <text id="plCount" x="12" y="66" font-size="13" font-weight="700" fill="#1d2a24"></text><text id="plCount2" x="12" y="86" font-size="13" font-weight="700" fill="#1d2a24"></text><text id="plCount3" x="12" y="106" font-size="13" font-weight="700" fill="#1d2a24"></text></g>
  <g transform="translate(756 40)"><circle r="20" fill="rgba(255,255,255,.9)" stroke="#1d2a24" stroke-width="2"/><path d="M0 -15 L6 4 L0 0 L-6 4Z" fill="#c21f1f"/><text y="16" text-anchor="middle" font-size="10" font-weight="700">N</text></g>
  </svg>`;
  const el = document.createElement("div"); el.className = "plan"; el.id = "plan"; el.hidden = true; el.innerHTML = svg; host.appendChild(el);
  const count = (a, b, c) => { el.querySelector("#plCount").textContent = a; el.querySelector("#plCount2").textContent = b; el.querySelector("#plCount3").textContent = c; };
  return {
    el, count,
    set(k, on){ const g = el.querySelector(`[data-k="${k}"]`); if (g) g.classList.toggle("on", !!on); },
    clear(){ el.querySelectorAll(".pl-l.on").forEach(g => g.classList.remove("on")); },
    setMotion(still){ el.classList.toggle("still", still); }
  };
}
