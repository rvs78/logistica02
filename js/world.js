/* Escenes 3D: la Vall d'Arnes i l'hospital de campanya (three.js r128) */
"use strict";
function createWorld(stage, cb){
  const api = {ok:false, setView(){}, getView(){return "vall";}, setLocked(){}, focusSpot(){}, markFound(){}, showSpots(){}, showSites(){}, focusSite(){},
    playActivation(d){d&&d();}, finishActivation(){}, admit(){}, resetAll(){}, setEra(){}, build(){}, markWork(){}, showWorks(){}, focusWork(){}, overview(){}, setPaused(){}, setMotion(){}, setLabels(){}, zoom(){}, resetCam(){}, free(){return Object.assign({},CAPACITY);}, skipVisible(){return false;}};
  if (!window.THREE || !THREE.OrbitControls){ stage.insertAdjacentHTML("beforeend",'<div class="nogl"><p>No s\'ha pogut carregar l\'escena 3D. Pots fer tota l\'activitat amb els botons del panell.</p></div>'); return api; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"}); }
  catch(e){ stage.insertAdjacentHTML("beforeend",'<div class="nogl"><p>Aquest dispositiu no permet 3D. Pots fer tota l\'activitat amb els botons del panell.</p></div>'); return api; }
  api.ok = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  stage.prepend(renderer.domElement);
  const canvasEl = renderer.domElement;
  let reduced = false, showLabels = true;

  /* ================================================== utilitats */
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const sstep = (a,b,v) => { const t = clamp((v-a)/(b-a),0,1); return t*t*(3-2*t); };
  const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function tex(w, h, draw, rep){
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
    if (rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  }
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({color, roughness:.85, metalness:0}, o||{}));
  function noiseFill(g, w, h, base, amt, n){ g.fillStyle = base; g.fillRect(0,0,w,h); for (let i=0;i<(n||w*h/6);i++){ const v = (rnd()-.5)*amt; g.fillStyle = v>0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(rnd()*w, rnd()*h, 1+rnd()*2, 1+rnd()*2); } }
  function label(text, o){
    o = o || {};
    const c = document.createElement("canvas"), g = c.getContext("2d"), fs = o.fs || 46;
    const font = `700 ${fs}px "Atkinson Hyperlegible", Arial, sans-serif`; g.font = font;
    const lines = String(text).split("\n"); const tw = Math.max(...lines.map(l => g.measureText(l).width));
    const pad = 20, sym = o.shape ? fs + 14 : 0;
    c.width = Math.ceil(tw + pad*2 + sym); c.height = Math.ceil(lines.length * fs * 1.2 + pad*1.4);
    g.font = font;
    g.fillStyle = o.bg || "rgba(255,255,255,.96)"; roundRect(g, 0, 0, c.width, c.height, 14); g.fill();
    g.lineWidth = 5; g.strokeStyle = o.border || "#111"; roundRect(g, 2.5, 2.5, c.width-5, c.height-5, 12); g.stroke();
    if (o.shape){ drawShape(g, o.shape, pad + fs*0.45, c.height/2, fs*0.42, o.fg || "#111"); }
    g.fillStyle = o.fg || "#111"; g.textBaseline = "middle";
    lines.forEach((l,i) => g.fillText(l, pad + sym, pad*0.7 + fs*0.6 + i*fs*1.2));
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:t, depthTest:o.depth === true, transparent:true}));
    const s = (o.scale || 0.018); sp.scale.set(c.width*s, c.height*s, 1); sp.renderOrder = 20; return sp;
  }
  function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
  function drawShape(g, s, x, y, r, col){
    g.save(); g.strokeStyle = col; g.lineWidth = r*0.32; g.lineJoin = "round"; g.beginPath();
    if (s === "g") g.arc(x, y, r*0.85, 0, Math.PI*2);
    if (s === "y"){ g.moveTo(x, y-r); g.lineTo(x+r, y+r*0.8); g.lineTo(x-r, y+r*0.8); g.closePath(); }
    if (s === "r") g.rect(x-r*0.8, y-r*0.8, r*1.6, r*1.6);
    if (s === "k"){ g.moveTo(x-r*.75,y-r*.75); g.lineTo(x+r*.75,y+r*.75); g.moveTo(x+r*.75,y-r*.75); g.lineTo(x-r*.75,y+r*.75); }
    if (s === "t"){ g.moveTo(x-r,y); g.lineTo(x+r,y); g.moveTo(x,y-r); g.lineTo(x,y+r); }
    g.stroke(); g.restore();
  }

  /* ================================================== ESCENA 1 · LA VALL */
  const scene = new THREE.Scene();
  const FOG = 0x7d8a96;
  scene.fog = new THREE.Fog(FOG, 70, 190);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 600);
  camera.position.set(34, 34, 52);
  // cel
  const skyTex = tex(8, 512, (g,w,h) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,"#26364f"); gr.addColorStop(.38,"#5d6f88"); gr.addColorStop(.5,"#9aa4ab"); gr.addColorStop(.56,"#d2a07c"); gr.addColorStop(.62,"#7d8a96"); gr.addColorStop(1,"#55606a"); g.fillStyle = gr; g.fillRect(0,0,w,h); });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({map:skyTex, side:THREE.BackSide, fog:false}));
  scene.add(sky);
  const skyDay = tex(8, 512, (g,w,h) => { const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,"#3f7fc4"); gr.addColorStop(.42,"#8dbbe3"); gr.addColorStop(.55,"#dcebf3"); gr.addColorStop(.62,"#b9c7cf"); gr.addColorStop(1,"#7d8a72"); g.fillStyle = gr; g.fillRect(0,0,w,h); });
  // llums (alba)
  const hemi = new THREE.HemisphereLight(0xc4d3e6, 0x3b4232, 0.72); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd7ad, 1.15); sun.position.set(48, 34, 22);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left:-46, right:46, top:46, bottom:-46, near:1, far:160}); sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);
  const flashLight = new THREE.AmbientLight(0xdfe8ff, 0); scene.add(flashLight);

  /* --- terreny */
  function hash(x, z){ const s = Math.sin(x*127.1 + z*311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, z){ const xi = Math.floor(x), zi = Math.floor(z), xf = x-xi, zf = z-zi, u = xf*xf*(3-2*xf), v = zf*zf*(3-2*zf);
    const a = hash(xi,zi), b = hash(xi+1,zi), c = hash(xi,zi+1), d = hash(xi+1,zi+1); return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v; }
  function fbm(x, z){ let f = 0, amp = .5, fr = 1; for (let i=0;i<5;i++){ f += amp*vnoise(x*fr, z*fr); fr *= 2.03; amp *= .5; } return f; }
  const riverX = z => 4.4 + Math.sin(z*0.11) * 1.0;
  const FLAT = [{x:-3,z:-7,r:12,h:0.12},{x:-7.4,z:4.5,r:6.5,h:0.08},{x:-11.8,z:11.5,r:4.2,h:0.1},{x:1.3,z:-15,r:4,h:0.12},{x:-5.5,z:14,r:5.5,h:0.1}];
  function H(x, z){
    const cx = 0.5 + Math.sin(z*0.04)*1.5, d = Math.abs(x - cx);
    let h = (fbm(x*0.14+3, z*0.14) - .5) * .7;
    const m = sstep(9.5, 24, d);
    h += m * (5 + fbm(x*0.045, z*0.045)*30) + m*m*fbm(x*0.12, z*0.12)*6;
    if (z < -34) h += Math.pow(-z-34, 1.35) * 0.35 * (0.6 + fbm(x*.08, z*.08));
    FLAT.forEach(f => { const dd = Math.hypot(x-f.x, z-f.z); const t = sstep(f.r, f.r*0.55, dd); h = h*(1-t) + f.h*t; });
    const dr = Math.abs(x - riverX(z)); if (dr < 2.0) h -= (1 - dr/2.0) * 1.0;
    return h;
  }
  const SIZE = 130, SEG = 220;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI/2);
  const tp = tg.attributes.position;
  for (let i=0;i<tp.count;i++) tp.setY(i, H(tp.getX(i), tp.getZ(i)));
  tg.computeVertexNormals();
  const tn = tg.attributes.normal, colArr = new Float32Array(tp.count*3), C = new THREE.Color(), C2 = new THREE.Color();
  for (let i=0;i<tp.count;i++){
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), slope = 1 - tn.getY(i), n = fbm(x*.3, z*.3);
    C.setRGB(.27+.05*n, .36+.08*n, .2);                         // herba
    if (y < 0.35 && Math.abs(x-riverX(z)) < 2.4) C.setRGB(.33,.32,.27); // ribera
    C2.setRGB(.42+.1*n, .41+.1*n, .38+.08*n);                   // roca
    C.lerp(C2, sstep(.22, .45, slope) * .9 + sstep(9, 16, y) * .6);
    if (y > 9 && y < 16) C.lerp(new THREE.Color(.22,.3,.2), .25*(1-slope));
    C.lerp(new THREE.Color(.93,.94,.96), sstep(19, 24, y + n*3) * (1 - sstep(.5,.7,slope)));
    colArr[i*3] = C.r; colArr[i*3+1] = C.g; colArr[i*3+2] = C.b;
  }
  tg.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
  const detail = tex(256, 256, (g,w,h) => noiseFill(g, w, h, "#bdbdbd", .5, 9000), [26, 26]);
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({vertexColors:true, map:detail, roughness:.96}));
  terrain.receiveShadow = true; scene.add(terrain);

  /* --- riu */
  function ribbon(pts, width, yFn, mat, step){
    const P = []; step = step || .5;
    for (let i=0;i<pts.length-1;i++){ const [x1,z1] = pts[i], [x2,z2] = pts[i+1]; const L = Math.hypot(x2-x1, z2-z1), n = Math.max(1, Math.ceil(L/step));
      for (let k=0;k<n;k++){ const t = k/n; P.push([x1+(x2-x1)*t, z1+(z2-z1)*t]); } }
    P.push(pts[pts.length-1]);
    const pos = [], uv = [], idx = []; let acc = 0;
    for (let i=0;i<P.length;i++){
      const a = P[Math.max(0,i-1)], b = P[Math.min(P.length-1,i+1)]; let dx = b[0]-a[0], dz = b[1]-a[1]; const l = Math.hypot(dx,dz)||1; dx/=l; dz/=l;
      const nx = -dz, nz = dx; if (i>0) acc += Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]);
      for (const s of [-1,1]){ const x = P[i][0] + nx*s*width/2, z = P[i][1] + nz*s*width/2; pos.push(x, yFn(x,z,P[i]), z); uv.push(s<0?0:1, acc/2); }
      if (i < P.length-1){ const k = i*2; idx.push(k, k+2, k+1, k+1, k+2, k+3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos,3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
  }
  const rpts = []; for (let z=-65; z<=65; z+=1.5) rpts.push([riverX(z), z]);
  const waterMat = new THREE.MeshStandardMaterial({color:0x2f5d78, roughness:.12, metalness:.35, transparent:true, opacity:.92});
  ribbon(rpts, 2.6, () => -0.38, waterMat, 1.5);

  /* --- carreteres */
  const asphalt = tex(64, 256, (g,w,h) => { noiseFill(g, w, h, "#4d5052", .25, 3000); g.fillStyle = "#e9e3c8"; for (let y=0;y<h;y+=64) g.fillRect(w/2-2, y, 4, 34); g.fillStyle="#d9d6cc"; g.fillRect(2,0,3,h); g.fillRect(w-5,0,3,h); });
  asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
  const roadMat = new THREE.MeshStandardMaterial({map:asphalt, roughness:.9, polygonOffset:true, polygonOffsetFactor:-2});
  const ROADS = [
    [[7.6,66],[7.6,40],[7.5,22],[7.2,18.5]],
    [[1.0,18.5],[-0.8,15],[-1,5],[-1,-6],[-1,-12],[-1,-22]],
    [[-1,4.8],[-3.9,4.8]],
    [[-1,-6],[-9,-6]],
    [[-1,-12.6],[3.6,-12.6]]
  ];
  const roadY = (x,z) => Math.max(H(x,z), -0.05) + 0.07;
  ROADS.forEach(r => ribbon(r, 1.5, roadY, roadMat, .45));
  function distSeg(px,pz,a,b){ const dx=b[0]-a[0], dz=b[1]-a[1], L=dx*dx+dz*dz; let t = L? ((px-a[0])*dx+(pz-a[1])*dz)/L : 0; t = clamp(t,0,1); return Math.hypot(px-(a[0]+dx*t), pz-(a[1]+dz*t)); }
  const nearRoad = (x,z,m) => ROADS.some(r => r.some((p,i) => i < r.length-1 && distSeg(x,z,p,r[i+1]) < m));

  /* --- pont trencat */
  const stone = tex(128, 128, (g,w,h) => { noiseFill(g,w,h,"#8d8a83",.35,4000); g.strokeStyle="rgba(40,38,34,.45)"; g.lineWidth=2; for (let y=0;y<h;y+=21){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); for (let x=(y/21%2)*20;x<w;x+=40){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+21); g.stroke(); } } }, [2,1]);
  const stoneMat = std(0xffffff, {map:stone});
  function addBox(w,h,d,mat,x,y,z,ry,par){ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); m.rotation.y = ry||0; m.castShadow = m.receiveShadow = true; (par||scene).add(m); return m; }
  addBox(1.4, 1.6, 2.0, stoneMat, 1.4, 0.2, 18.5); addBox(1.4, 1.6, 2.0, stoneMat, 7.0, 0.3, 18.5);
  const d1 = addBox(2.6, .32, 1.7, stoneMat, 2.9, .55, 18.5); d1.rotation.z = -.32;
  const d2 = addBox(2.2, .32, 1.7, stoneMat, 6.0, .45, 18.5); d2.rotation.z = .42;
  for (let i=0;i<9;i++){ const r = addBox(.4+rnd()*.6,.3+rnd()*.4,.4+rnd()*.6, stoneMat, 3.6+rnd()*2, -0.2, 17.6+rnd()*1.8); r.rotation.set(rnd()*2, rnd()*2, rnd()*2); }

  /* --- esllavissada */
  const slideG = new THREE.SphereGeometry(4, 22, 14); const sp = slideG.attributes.position;
  for (let i=0;i<sp.count;i++){ const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i); const k = 1 + (fbm(x*.8+9, z*.8+y*.5) - .5)*.7; sp.setXYZ(i, x*1.7*k, Math.max(-.2, y*.55*k), z*1.15*k); }
  slideG.computeVertexNormals();
  const slide = new THREE.Mesh(slideG, std(0x6d5338, {roughness:1, flatShading:true})); slide.position.set(9.3, H(9.3,27)+.1, 27); slide.castShadow = slide.receiveShadow = true; scene.add(slide);
  const rockG = new THREE.DodecahedronGeometry(1, 0);
  const rocks = new THREE.InstancedMesh(rockG, std(0x7b766d, {flatShading:true, roughness:1}), 160); rocks.castShadow = rocks.receiveShadow = true;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), E = new THREE.Euler();
  for (let i=0;i<160;i++){
    let x, z;
    if (i < 40){ x = 5.5 + rnd()*8; z = 23 + rnd()*8; } else { x = (rnd()-.5)*120; z = (rnd()-.5)*120; if (Math.abs(x-0.5) < 11) { x += Math.sign(x||1)*14; } }
    const s = i < 40 ? .3 + rnd()*.6 : .4 + rnd()*1.3;
    M4.compose(V.set(x, H(x,z)+s*.3, z), Q.setFromEuler(E.set(rnd()*3, rnd()*3, rnd()*3)), S3.set(s, s*.7, s)); rocks.setMatrixAt(i, M4);
  }
  scene.add(rocks);

  /* --- arbres (pins) */
  const trunkG = new THREE.CylinderGeometry(.07, .12, .7, 5); trunkG.translate(0, .35, 0);
  const foliG = new THREE.ConeGeometry(.75, 2.3, 7); foliG.translate(0, 1.75, 0);
  const NT = 1500;
  const trunks = new THREE.InstancedMesh(trunkG, std(0x4a3626), NT), folis = new THREE.InstancedMesh(foliG, std(0xffffff, {roughness:.95, flatShading:true}), NT);
  folis.castShadow = true; trunks.castShadow = true;
  let nt = 0, tries = 0;
  while (nt < NT && tries < 40000){
    tries++;
    const x = (rnd()-.5)*SIZE*.95, z = (rnd()-.5)*SIZE*.95, y = H(x,z);
    if (y < .5 || y > 17) continue;
    if (Math.abs(x - riverX(z)) < 2.6) continue;
    if (x > -12.5 && x < 4 && z > -19 && z < 8.5) continue;
    if (Math.hypot(x+11.8, z-11.5) < 4.5) continue;
    if (Math.hypot(x+5.5, z-14) < 6.5) continue;
    if (x > 4 && x < 14 && z > 21 && z < 33) continue;
    if (nearRoad(x, z, 1.6)) continue;
    if (y < 2 && rnd() < .55) continue;
    const s = .6 + rnd()*.8;
    M4.compose(V.set(x, y-.05, z), Q.setFromEuler(E.set(0, rnd()*6, 0)), S3.set(s, s*(.9+rnd()*.4), s));
    trunks.setMatrixAt(nt, M4); folis.setMatrixAt(nt, M4);
    C.setRGB(.12 + rnd()*.06, .24 + rnd()*.1, .14 + rnd()*.05); folis.setColorAt(nt, C);
    nt++;
  }
  trunks.count = folis.count = nt; scene.add(trunks, folis);

  /* --- edificis */
  const facCache = {};
  function facade(w, h, o){
    const key = [w.toFixed(1), h.toFixed(1), o.floors, o.wall, o.shut, o.sign||"", o.door?1:0].join("|");
    if (facCache[key]) return facCache[key];
    const pw = Math.max(64, Math.round(w*64)), ph = Math.max(64, Math.round(h*64));
    const t = tex(pw, ph, (g, W, Hh) => {
      noiseFill(g, W, Hh, o.wall, .18, W*Hh/10);
      const fh = (Hh - (o.sign ? 26 : 0)) / o.floors, cols = Math.max(1, Math.round(w/1.15)), cw = W/cols;
      for (let f=0; f<o.floors; f++) for (let c=0; c<cols; c++){
        if (o.door && f === 0 && c === Math.floor(cols/2)){ g.fillStyle = "#4a3324"; g.fillRect(c*cw+cw*.3, Hh - fh*.82, cw*.4, fh*.82); continue; }
        const x = c*cw + cw*.3, y = Hh - (f+1)*fh + fh*.22, ww = cw*.4, hh = fh*.5;
        if (o.shut){ g.fillStyle = o.shut; g.fillRect(x-ww*.42, y, ww*.38, hh); g.fillRect(x+ww*1.04, y, ww*.38, hh); }
        g.fillStyle = "#e9e4d8"; g.fillRect(x-3, y-3, ww+6, hh+6);
        g.fillStyle = "#2b3a48"; g.fillRect(x, y, ww, hh);
        g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x+2, y+2, ww*.35, hh*.4);
      }
      if (o.sign){ g.fillStyle = "#f4f1e7"; g.fillRect(W*.15, 4, W*.7, 22); g.fillStyle = "#1c2a36"; g.font = "bold 17px Arial"; g.textAlign = "center"; g.fillText(o.sign, W/2, 21); }
    });
    return (facCache[key] = t);
  }
  const roofTex = tex(128, 128, (g,w,h) => { noiseFill(g,w,h,"#6e3b2a",.25,3000); g.strokeStyle = "rgba(30,15,10,.5)"; g.lineWidth = 3; for (let y=0;y<h;y+=16){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); } }, [2,2]);
  const slateTex = tex(128, 128, (g,w,h) => { noiseFill(g,w,h,"#3e4448",.25,3000); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 3; for (let y=0;y<h;y+=14){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); } }, [2,2]);
  const roofMat = std(0xffffff, {map:roofTex}), slateMat = std(0xffffff, {map:slateTex}), topMat = std(0x6b6258);
  function gable(w, d, rh, mat){
    const s = new THREE.Shape(); s.moveTo(-w/2-.18, 0); s.lineTo(w/2+.18, 0); s.lineTo(0, rh); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth:d+.3, bevelEnabled:false}); g.translate(0, 0, -(d+.3)/2);
    const m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
  }
  function building(x, z, w, d, floors, o){
    o = Object.assign({wall:"#d8cdb6", shut:"#4f6b3a", door:true, ry:0, roof:"tile", broken:false}, o);
    const h = floors * 1.05 + .25, y0 = H(x,z);
    const grp = new THREE.Group(); grp.position.set(x, y0, z); grp.rotation.y = o.ry;
    const fw = std(0xffffff, {map:facade(w, h, Object.assign({}, o, {floors}))}), fd = std(0xffffff, {map:facade(d, h, Object.assign({}, o, {floors, door:false, sign:""}))});
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [fd, fd, topMat, topMat, fw, fw]); body.position.y = h/2; body.castShadow = body.receiveShadow = true; grp.add(body);
    const rf = gable(w, d, Math.min(w,d)*.42, o.roof === "slate" ? slateMat : roofMat); rf.position.y = h; grp.add(rf);
    if (o.broken){ body.rotation.z = .1; rf.rotation.z = .35; rf.position.set(.3, h-.35, 0); }
    scene.add(grp); return grp;
  }
  const HOUSES = [[-3.6,-3.6,2.2,2,2],[-3.7,-0.5,2,1.8,2,1],[-3.6,2.4,2,1.8,1],[1.4,-3.2,2,1.8,2],[1.3,-6.8,1.8,2,2,1],[1.6,-9.6,2,1.8,2],
    [-3.4,-12.4,2.2,2,2],[-6.2,-15.4,2,2,1],[-3.4,-16.4,2,1.8,2,1],[1.5,0.4,1.8,1.8,1],[-9.6,-12.2,2,2,2],[-9.8,-3.2,2,1.8,1],[-6.6,-12.4,1.8,1.8,2],[-9.5,-15.6,2,2,2]];
  const walls = ["#d8cdb6","#cbbfa6","#e0d6c2","#bfae92","#d4c7b0"], shuts = ["#4f6b3a","#5d4632","#3f5a6e","#6b3f2e"];
  HOUSES.forEach((hh,i) => building(hh[0], hh[1], hh[2], hh[3], hh[4], {wall:walls[i%5], shut:shuts[i%4], roof:i%3===0?"slate":"tile", broken:!!hh[5], ry:(rnd()-.5)*.2}));
  // església
  const church = building(-6.9, -2.6, 2.6, 4.2, 2, {wall:"#b9a98c", shut:null, roof:"slate"});
  const tower = new THREE.Group(); tower.position.set(-6.9, H(-6.9,-5.6), -5.4);
  const tb = addBox(1.3, 5.4, 1.3, std(0xffffff,{map:stone}), 0, 2.7, 0, 0, tower);
  const tr = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.8, 4), slateMat); tr.position.y = 6.3; tr.rotation.y = Math.PI/4; tr.castShadow = true; tower.add(tr);
  scene.add(tower);
  // escola (part ensorrada)
  building(-7.2, -9.8, 5, 3, 2, {wall:"#e8d9b0", shut:"#3f5a6e", sign:"ESCOLA ARNES", roof:"tile"});
  const wingMat = std(0xffffff, {map:facade(3, 2.35, {floors:2, wall:"#e8d9b0", shut:"#3f5a6e"})});
  const schoolRuin = new THREE.Group(); scene.add(schoolRuin);
  const wing = addBox(3, 2.35, 2.4, wingMat, -3.9, .55, -8.8, 0, schoolRuin); wing.rotation.z = .42;
  const slab = addBox(3.4, .2, 2.6, topMat, -3.6, 1.2, -8.8, 0, schoolRuin); slab.rotation.set(.12, 0, -.55);
  for (let i=0;i<16;i++){ const r = addBox(.3+rnd()*.7, .2+rnd()*.4, .3+rnd()*.7, std(0x9c8c6c), -3.2+rnd()*2.4, .2, -10.2+rnd()*2.8, 0, schoolRuin); r.rotation.set(rnd()*3, rnd()*3, rnd()*3); }
  // residència amb esquerdes
  const resi = building(1.3, -15.2, 5.6, 2.6, 3, {wall:"#e6e2d6", shut:"#7a8a92", sign:"RESIDÈNCIA", roof:"slate"});
  const crackTex = tex(128, 256, (g,w,h) => { g.clearRect(0,0,w,h); g.strokeStyle = "#151515"; g.lineWidth = 5; g.beginPath(); let x = w*.5; g.moveTo(x, 0); for (let y=0;y<h;y+=18){ x += (rnd()-.5)*40; g.lineTo(x, y); } g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(w*.5, h*.4); g.lineTo(w*.9, h*.55); g.stroke(); });
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.2), new THREE.MeshBasicMaterial({map:crackTex, transparent:true, depthWrite:false}));
  crack.position.set(1.8, H(1.3,-15.2) + 1.7, -15.2 + 1.31); scene.add(crack);
  // cotxes aparcats
  [[-2.1,-1.5,0],[-2.1,-8.5,0],[0.1,-11.5,0],[-6,-7.1,Math.PI/2]].forEach(([x,z,r],i) => { const c = new THREE.Group(); c.position.set(x, roadY(x,z)-.02, z); c.rotation.y = r;
    addBox(.7,.32,1.4, std([0x8a1f1f,0x2b4a6b,0xbfbfbf,0x2f2f2f][i], {metalness:.3, roughness:.5}), 0,.3,0,0,c); addBox(.62,.26,.75, std(0x1d2730,{roughness:.3}),0,.58,-.05,0,c); scene.add(c); });
  // camp de futbol
  const pitch = tex(512, 360, (g,w,h) => { for (let i=0;i<10;i++){ g.fillStyle = i%2 ? "#3f7a3a" : "#468440"; g.fillRect(i*w/10, 0, w/10, h); } g.strokeStyle = "#f1f4ea"; g.lineWidth = 5;
    g.strokeRect(14,14,w-28,h-28); g.beginPath(); g.moveTo(w/2,14); g.lineTo(w/2,h-14); g.stroke(); g.beginPath(); g.arc(w/2,h/2,46,0,Math.PI*2); g.stroke(); g.strokeRect(14,h/2-80,70,160); g.strokeRect(w-84,h/2-80,70,160); });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), std(0xffffff, {map:pitch, polygonOffset:true, polygonOffsetFactor:-2})); field.rotation.x = -Math.PI/2; field.position.set(-7.4, H(-7.4,4.5)+.04, 4.5); field.receiveShadow = true; scene.add(field);
  const postM = std(0xf0f0f0);
  [-10.7, -4.1].forEach(x => { addBox(.06,.7,.06,postM,x,.35,4.0); addBox(.06,.7,.06,postM,x,.35,5.0); addBox(.06,.06,1.06,postM,x,.7,4.5); });
  // heliport
  const hpad = tex(256, 256, (g,w,h) => { g.fillStyle = "#5d6166"; g.beginPath(); g.arc(w/2,h/2,w/2-2,0,Math.PI*2); g.fill(); g.strokeStyle = "#f2f2f2"; g.lineWidth = 10; g.beginPath(); g.arc(w/2,h/2,w/2-24,0,Math.PI*2); g.stroke();
    g.fillStyle = "#f2f2f2"; g.font = "bold 150px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("H", w/2, h/2+8); });
  const pad = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshStandardMaterial({map:hpad, transparent:true, polygonOffset:true, polygonOffsetFactor:-2})); pad.rotation.x = -Math.PI/2; pad.position.set(-11.8, H(-11.8,11.5)+.05, 11.5); pad.receiveShadow = true; scene.add(pad);

  /* --- línia elèctrica */
  const steel = std(0x9aa1a8, {metalness:.6, roughness:.4});
  function pylon(){ const g = new THREE.Group(); const legG = new THREE.CylinderGeometry(.05, .07, 5.2, 4);
    [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]].forEach(([dx,dz]) => { const l = new THREE.Mesh(legG, steel); l.position.set(dx*.55, 2.6, dz*.55); l.rotation.set(-dz*.17, 0, dx*.17); l.castShadow = true; g.add(l); });
    for (let k=0;k<4;k++){ const b = new THREE.Mesh(new THREE.BoxGeometry(.9-k*.15, .04, .04), steel); b.position.y = 1 + k*1.2; g.add(b); const b2 = b.clone(); b2.rotation.y = Math.PI/2; g.add(b2); }
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, .08, .08), steel); arm.position.y = 4.8; g.add(arm); return g; }
  const PYL = [[10.8,-26],[10.6,-16],[10.7,-6],[10.6,4],[10.9,14]];
  const tops = [], pyls = [];
  const [PX, PZ] = PYL[2], PY0 = H(PX,PZ), TOP_FALLEN = new THREE.Vector3(PX+3.2, H(PX+3,PZ)+.3, PZ), TOP_OK = new THREE.Vector3(PX, PY0+4.8, PZ);
  PYL.forEach(([x,z],i) => { const p = pylon(); p.position.set(x, H(x,z), z); if (i === 2){ p.rotation.set(0, .3, 1.32); p.position.y += .25; tops.push(TOP_FALLEN.clone()); } else tops.push(new THREE.Vector3(x, H(x,z)+4.8, z)); scene.add(p); pyls.push(p); });
  const wireMat = new THREE.LineBasicMaterial({color:0x22272b}), wires = new THREE.Group(); scene.add(wires);
  function drawWires(fixed){
    while (wires.children.length){ const l = wires.children.pop(); l.geometry.dispose(); }
    tops[2].copy(fixed ? TOP_OK : TOP_FALLEN);
    for (let i=0;i<tops.length-1;i++) [-1.1, 1.1].forEach(off => { const a = tops[i].clone(), b = tops[i+1].clone(); a.x += off; b.x += off;
      const pts = []; for (let k=0;k<=24;k++){ const t = k/24; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI*t) * (!fixed && (i===1||i===2) ? 1.6 : .9); pts.push(p); }
      wires.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat)); });
  }
  drawWires(false);

  /* --- núvols i pluja */
  const cloudTex = tex(256, 256, (g,w,h) => { for (let i=0;i<26;i++){ const x = w*(.2+rnd()*.6), y = h*(.35+rnd()*.3), r = w*(.12+rnd()*.16); const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,"rgba(235,238,242,.55)"); gr.addColorStop(1,"rgba(235,238,242,0)"); g.fillStyle = gr; g.fillRect(0,0,w,h); } });
  const clouds = new THREE.Group();
  for (let i=0;i<46;i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex, color:new THREE.Color().setHSL(.6,.06,.42+rnd()*.2), transparent:true, opacity:.75, depthWrite:false}));
    const sc = 16 + rnd()*22; s.scale.set(sc, sc*.55, 1); s.position.set((rnd()-.5)*140, 20 + rnd()*9, (rnd()-.5)*140); clouds.add(s); }
  scene.add(clouds);
  const RN = 1800, rpos = new Float32Array(RN*6);
  for (let i=0;i<RN;i++){ const x = (rnd()-.5)*90, y = rnd()*24, z = (rnd()-.5)*90; rpos.set([x,y,z, x+.08,y-.75,z], i*6); }
  const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute("position", new THREE.BufferAttribute(rpos, 3));
  const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({color:0xb7c6d2, transparent:true, opacity:.42}));
  scene.add(rain);

  /* --- etiquetes de lloc */
  const placeLabels = new THREE.Group(); scene.add(placeLabels);
  [["Poble d'Arnes",-3,6.2,-6.5],["Riu Arnes",6.8,1.4,-2],["Camp de futbol",-7.4,2.2,1.6],["Heliport",-11.8,2,13.8],["Església",-6.9,8.4,-5.4],["Festival · 400 persones",-5.5,4.2,14]].forEach(([t,x,y,z]) => { const l = label(t, {fs:40, scale:.015}); l.position.set(x, H(x,z)+y, z); placeLabels.add(l); });

  /* --- punts d'informació */
  const spotObjs = {}, clickables = [];
  function spotTex(n, found, col){ return tex(128, 128, (g,w,h) => { g.fillStyle = found ? "#1f7a43" : (col || "#d4510f"); g.beginPath(); g.arc(64,64,56,0,Math.PI*2); g.fill(); g.lineWidth = 9; g.strokeStyle = "#ffffff"; g.stroke();
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; if (found){ g.lineWidth = 12; g.beginPath(); g.moveTo(38,66); g.lineTo(56,84); g.lineTo(92,44); g.stroke(); } else { g.font = "bold 70px Arial"; g.fillText(String(n), 64, 68); } }); }
  const spotGroup = new THREE.Group(); scene.add(spotGroup);
  HOTSPOTS.forEach(h => {
    const g = new THREE.Group(); const [x,y,z] = h.pos; const gy = h.id === "temporal" ? y - 3 : H(x,z);
    g.position.set(x, 0, z);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({map:spotTex(h.n,false), depthTest:false, transparent:true})); icon.scale.set(2.3, 2.3, 1); icon.position.y = y + 1; icon.renderOrder = 30;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, y + 1 - gy, 10, 1, true), new THREE.MeshBasicMaterial({color:0xff7a2a, transparent:true, opacity:.45, depthWrite:false}));
    pillar.position.y = gy + (y + 1 - gy)/2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(.7, 1.0, 36), new THREE.MeshBasicMaterial({color:0xff7a2a, transparent:true, opacity:.85, side:THREE.DoubleSide, depthWrite:false}));
    ring.rotation.x = -Math.PI/2; ring.position.y = gy + .12;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), new THREE.MeshBasicMaterial({visible:false})); hit.position.y = y + 1; hit.userData.spot = h.id;
    const name = label(h.nom, {fs:40, scale:.016}); name.position.y = y + 2.9; name.visible = false;
    g.add(icon, pillar, ring, hit, name); spotGroup.add(g); clickables.push(hit);
    spotObjs[h.id] = {g, icon, pillar, ring, name, baseY:y+1, h};
  });
  function markFound(id){ const o = spotObjs[id]; if (!o || o.found) return; o.found = true; o.icon.material.map = spotTex(o.h.n, true); o.icon.material.needsUpdate = true; o.pillar.material.color.setHex(0x3fbf6f); o.ring.material.color.setHex(0x3fbf6f); o.name.visible = true; }

  /* --- llocs candidats per a l'hospital */
  const siteLabels = [[-7.4,4.5,"A · Camp de futbol"],[riverX(-1)-1.6,-1,"B · Ribera del riu"],[-5.6,-7.4,"C · Pati de l'escola"]].map(([x,z,t]) => { const l = label(t, {fs:42, scale:.017, bg:"rgba(255,232,214,.97)"}); l.position.set(x, H(x,z)+2.6, z); l.visible = false; scene.add(l); return {x,z,l}; });

  /* --- vehicles i persones (seqüència d'activació) */
  const ambTex = tex(128, 64, (g,w,h) => { g.fillStyle = "#f2d22e"; g.fillRect(0,0,w,h); for (let i=0;i<16;i++){ g.fillStyle = i%2 ? "#1f7a43" : "#f2d22e"; g.fillRect(i*8, h*.45, 8, 10); g.fillStyle = i%2 ? "#f2d22e" : "#1f7a43"; g.fillRect(i*8, h*.45+10, 8, 10); } });
  const SKINS = [0xe8c4a2,0xd7a77e,0xb07a52,0x8a5a3a,0xf0d2b8];
  const geoP = {leg:new THREE.CylinderGeometry(.055,.05,.4,6), torso:new THREE.CylinderGeometry(.15,.12,.4,8), arm:new THREE.CylinderGeometry(.04,.035,.34,6), head:new THREE.SphereGeometry(.105,12,10), helm:new THREE.SphereGeometry(.125,12,6,0,Math.PI*2,0,Math.PI/2), cap:new THREE.CylinderGeometry(.11,.11,.06,10)};
  geoP.leg.translate(0,-.2,0); geoP.arm.translate(0,-.17,0);
  const matCache = {}; const mc = c => matCache[c] || (matCache[c] = std(c));
  // o: {shirt, pants, skin, helmet, cap, reflect}
  function person(color, helmet, o){
    o = Object.assign({shirt:color, pants:0x2a2f36, skin:SKINS[Math.floor(rnd()*SKINS.length)], helmet}, o||{});
    const g = new THREE.Group(); const legs = [], arms = [];
    [-.07,.07].forEach(x => { const hip = new THREE.Group(); hip.position.set(x,.42,0); const l = new THREE.Mesh(geoP.leg, mc(o.pants)); hip.add(l); g.add(hip); legs.push(hip); });
    const t = new THREE.Mesh(geoP.torso, mc(o.shirt)); t.position.y = .62; t.castShadow = true; g.add(t);
    if (o.reflect){ const b = new THREE.Mesh(new THREE.CylinderGeometry(.152,.14,.05,8), mc(0xd8d8d8)); b.position.y = .55; g.add(b); }
    [-.19,.19].forEach(x => { const sh = new THREE.Group(); sh.position.set(x,.78,0); sh.rotation.z = x < 0 ? -.08 : .08; const a = new THREE.Mesh(geoP.arm, mc(o.shirt)); sh.add(a); g.add(sh); arms.push(sh); });
    const hd = new THREE.Mesh(geoP.head, mc(o.skin)); hd.position.y = .93; g.add(hd);
    if (o.helmet){ const hm = new THREE.Mesh(geoP.helm, mc(o.helmet)); hm.position.y = .95; g.add(hm); }
    else if (o.cap){ const cp = new THREE.Mesh(geoP.cap, mc(o.cap)); cp.position.y = 1.01; g.add(cp); }
    g.userData.legs = legs; g.userData.arms = arms; return g;
  }
  const UNI = {doc:{shirt:0x2d5f9a, pants:0x2d5f9a, cap:0x2d5f9a}, inf:{shirt:0x2f8a7a, pants:0x2f8a7a, cap:0x2f8a7a}, tes:{shirt:0xe3c51b, pants:0x23412f, reflect:true}, log:{shirt:0xe0702a, pants:0x2a2f36, reflect:true}};
  function lying(p, ry){ p.rotation.set(0, ry||0, Math.PI/2); return p; }
  function pose(p, kind){ const L = p.userData.legs, A = p.userData.arms;
    if (kind === "kneel"){ L.forEach(l => l.rotation.x = -1.5); p.position.y -= .32; A.forEach(a => a.rotation.x = -.9); }
    if (kind === "sit"){ L.forEach(l => l.rotation.x = -1.45); p.position.y -= .2; }
    if (kind === "wave"){ A[1].rotation.z = 2.6; }
    if (kind === "cheer"){ A.forEach((a,i) => a.rotation.z = i ? 2.5 : -2.5); }
    return p; }
  /* caminants animats: path = [[x,z],...] (anada i tornada) */
  const walkers = [];
  function addWalker(par, p, path, spd, yFn){ let L = 0; const seg = path.slice(1).map((b,i) => { const a = path[i], l = Math.hypot(b[0]-a[0], b[1]-a[1]); L += l; return l; });
    const w = {p, path, seg, len:L, d:rnd()*L, dir:rnd() < .5 ? 1 : -1, spd:spd||.9, yFn:yFn||(() => 0), ph:rnd()*6}; walkers.push(w); par.add(p); return w; }
  function stepWalkers(dt){
    walkers.forEach(w => { if (!w.p.visible) return;
      w.d += w.dir*w.spd*dt; if (w.d > w.len){ w.d = w.len; w.dir = -1; } if (w.d < 0){ w.d = 0; w.dir = 1; }
      let acc = 0, i = 0; while (i < w.seg.length-1 && w.d > acc + w.seg[i]){ acc += w.seg[i]; i++; }
      const a = w.path[i], b = w.path[i+1], t = w.seg[i] ? (w.d-acc)/w.seg[i] : 0, x = a[0]+(b[0]-a[0])*t, z = a[1]+(b[1]-a[1])*t;
      w.p.position.set(x, w.yFn(x,z), z); w.p.rotation.y = Math.atan2((b[0]-a[0])*w.dir, (b[1]-a[1])*w.dir);
      w.ph += dt*w.spd*7; const k = Math.sin(w.ph)*.55; const L = w.p.userData.legs, A = w.p.userData.arms;
      if (L){ L[0].rotation.x = k; L[1].rotation.x = -k; } if (A && !w.carry){ A[0].rotation.x = -k*.8; A[1].rotation.x = k*.8; } });
  }
  function ambulance(){ const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(.85,.8,1.6), std(0xffffff,{map:ambTex})); body.position.set(0,.62,-.15); body.castShadow = true; g.add(body);
    addBox(.82,.55,.55, std(0xf2d22e), 0,.5,.85, 0, g); addBox(.74,.28,.05, std(0x1d2730,{roughness:.2}), 0,.62,1.13,0,g);
    const lb = addBox(.6,.1,.14, new THREE.MeshStandardMaterial({color:0x2266ff, emissive:0x2266ff, emissiveIntensity:1.5}), 0,1.07,.2,0,g); g.userData.lights = lb;
    [[-.42,.6],[.42,.6],[-.42,-.65],[.42,-.65]].forEach(([x,z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.12,12), std(0x1a1a1a)); w.rotation.z = Math.PI/2; w.position.set(x,.17,z); g.add(w); });
    return g; }
  function fireTruck(){ const g = new THREE.Group(); addBox(1,.9,2.4, std(0xb3191b), 0,.7,-.2,0,g); addBox(.96,.7,.8, std(0xb3191b), 0,.6,1.35,0,g); addBox(.86,.3,.05, std(0x1d2730),0,.72,1.76,0,g);
    addBox(.3,.1,2.2, std(0xd9d9d9,{metalness:.5}), 0,1.25,-.3,0,g); const lb = addBox(.7,.1,.14, new THREE.MeshStandardMaterial({color:0x2266ff, emissive:0x2266ff, emissiveIntensity:1.5}),0,1.0,1.5,0,g); g.userData.lights = lb;
    [[-.48,1.1],[.48,1.1],[-.48,-.9],[.48,-.9]].forEach(([x,z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.14,12), std(0x1a1a1a)); w.rotation.z = Math.PI/2; w.position.set(x,.2,z); g.add(w); });
    return g; }
  function helicopter(col){ const g = new THREE.Group(); const fus = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), std(col, {metalness:.3, roughness:.45})); fus.scale.set(.75, .7, 1.45); fus.position.y = .95; fus.castShadow = true; g.add(fus);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(.62, 14, 10, 0, Math.PI*2, 0, Math.PI/2.2), std(0x1b2833, {roughness:.15, metalness:.4})); glass.rotation.x = Math.PI/2.4; glass.position.set(0, 1.12, 1.05); g.add(glass);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.76,.76,.25,18,1,true), std(0xe2591a)); band.rotation.x = Math.PI/2; band.scale.set(1,1,.93); band.position.y = .95; g.add(band);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(.09, .2, 2.6, 8), std(col)); boom.rotation.x = Math.PI/2; boom.position.set(0, 1.1, -2.3); g.add(boom);
    addBox(.06, .7, .5, std(col), 0, 1.4, -3.5, 0, g);
    const skidM = std(0x2b2f33); [-.55,.55].forEach(x => { addBox(.06,.06,2.4, skidM, x,.08,0,0,g); addBox(.05,.55,.05, skidM, x,.35,.6,0,g); addBox(.05,.55,.05, skidM, x,.35,-.6,0,g); });
    const rotor = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(5.4,.03,.18), std(0x222222)); rotor.add(bl); const bl2 = bl.clone(); bl2.rotation.y = Math.PI/2; rotor.add(bl2); rotor.position.y = 1.78; g.add(rotor);
    const tr2 = new THREE.Mesh(new THREE.BoxGeometry(.03,.9,.1), std(0x222222)); tr2.position.set(.1, 1.45, -3.55); g.add(tr2);
    g.userData.rotor = rotor; g.userData.tail = tr2; return g; }
  function tent(col, w, d){ const g = new THREE.Group(); addBox(w, .9, d, std(0x6b7350), 0, .45, 0, 0, g); const r = gable(w-.2, d, .9, std(col)); r.position.y = .9; g.add(r); return g; }

  /* ================================================== gent a la vall */
  const town = new THREE.Group(); scene.add(town);
  const gY = (x,z) => Math.max(H(x,z), -0.05) + .02;
  const CLOTH = [0x3b5b8c,0x8c3b3b,0x3f6b45,0x6b5a3b,0x5a3b6b,0xd9d4c4,0x2f2f2f,0xb36b2a,0x2a7a8a,0xc9b23a,0x9a2f6a];
  const cl = () => CLOTH[Math.floor(rnd()*CLOTH.length)];
  const civ = o => person(cl(), null, Object.assign({pants: rnd() < .5 ? 0x2a2f36 : 0x3b4a6b}, o||{}));
  // veïns que caminen pels carrers
  const STREETS = [[[-1.4,-20],[-1.4,-6],[-1.4,4]], [[-0.6,-18],[-0.6,-8],[-0.6,3.5]], [[-1.2,-6.3],[-8.5,-6.3]], [[-1,-12.9],[3.2,-12.9]], [[-1.3,4.5],[-3.6,4.5]], [[-3.6,12.2],[-1.6,9.5],[-1.3,4]], [[-7.8,12],[-4.4,8.6],[-1.6,6]]];
  for (let i=0;i<26;i++){ const st = STREETS[i % STREETS.length]; const ox = (rnd()-.5)*.5, oz = (rnd()-.5)*.5; addWalker(town, civ(), st.map(([x,z]) => [x+ox, z+oz]), .45 + rnd()*.6, gY); }
  // residents de la residència al carrer, amb mantes
  const residentsG = new THREE.Group(), hurt = new THREE.Group(); scene.add(residentsG, hurt);
  for (let i=0;i<12;i++){ const x = .1 + (i%6)*.55, z = -12.3 - Math.floor(i/6)*.55; const p = person(rnd() < .5 ? 0x8a8f99 : 0x6b5a4a, null, {cap:0xdedede, pants:0x4a4a4a}); p.position.set(x, gY(x,z), z); p.rotation.y = Math.PI + (rnd()-.5); if (i%3 === 0){ pose(p, "sit"); const bl = addBox(.42,.3,.3, std(0x7a3b3b), 0,.45,.12,0,p); } residentsG.add(p); }
  // ferits estirats i persones que els ajuden
  const BLANKET = std(0xc9a227);
  function injured(x, z, ry, helper, blanket){ const p = civ(); p.position.set(x, gY(x,z)+.13, z); lying(p, ry); hurt.add(p);
    if (blanket){ const b = new THREE.Mesh(new THREE.BoxGeometry(.06,.75,.42), BLANKET); b.position.set(-.06, .5, 0); p.add(b); }
    if (helper){ const d = new THREE.Vector3(0,.55,0).applyEuler(p.rotation); const h = civ(); h.position.set(x + d.x + .35, gY(x,z), z + d.z + .35); h.rotation.y = Math.atan2(-.35,-.35); pose(h, "kneel"); hurt.add(h); } }
  injured(-2.4,-9.0,.3,true); injured(-2.9,-10.7,1.4,true); injured(-2.1,-7.9,2.2,false,true);
  injured(-1.0,-3.2,.8,true); injured(2.6,-11.6,0,false,true); injured(-0.4,1.2,2.6,true);
  injured(-6.6,15.6,.4,true); injured(-4.0,15.4,1.8,true); injured(-7.6,13.0,2.9,false,true); injured(-3.4,12.4,.9,true,true);
  // persones que demanen ajuda
  [[-3.1,-11.4],[-1.8,-10.2],[3.2,-11.8]].forEach(([x,z]) => { const p = civ(); p.position.set(x, gY(x,z), z); pose(p, "wave"); p.rotation.y = rnd()*6; hurt.add(p); });

  /* --- festival: escenari, parades, tendes i multitud */
  const fest = new THREE.Group(); scene.add(fest);
  const FX = -5.5, FZ = 14, fy = (x,z) => H(x,z);
  const bannerT = tex(512, 160, (g,w,h) => { g.fillStyle = "#14141c"; g.fillRect(0,0,w,h); const gr = g.createLinearGradient(0,0,w,0); gr.addColorStop(0,"#ff5a3c"); gr.addColorStop(1,"#ffb13c"); g.fillStyle = gr; g.font = "bold 72px Arial"; g.textAlign = "center"; g.fillText("FESTIVAL", w/2, 78); g.fillStyle = "#f2f2f2"; g.font = "bold 46px Arial"; g.fillText("VALL D'ARNES", w/2, 136); });
  const sy0 = fy(FX, 17.4);
  addBox(5.2,.6,2.6, std(0x2b2b2e), FX, sy0+.3, 17.6, 0, fest);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(5,1.6), std(0xffffff,{map:bannerT})); banner.position.set(FX, sy0+1.6, 18.85); banner.rotation.y = Math.PI; fest.add(banner);
  const bannerBack = addBox(5.1,1.8,.08, std(0x14141c), FX, sy0+1.6, 18.92, 0, fest);
  [[-2.5,16.4],[2.5,16.4],[-2.5,18.8]].forEach(([dx,z]) => addBox(.12,3.4,.12, steel, FX+dx, sy0+1.7, z, 0, fest));
  const fallenPost = addBox(.12,3.4,.12, steel, FX+2.9, sy0+.35, 18.4, 0, fest); fallenPost.rotation.z = 1.3;
  const truss = addBox(5.4,.18,2.7, steel, FX+.2, sy0+3.0, 17.6, 0, fest); truss.rotation.z = -.16;
  const blk = std(0x111111);
  [-3.2, 3.2].forEach(dx => { addBox(.7,1.5,.7, blk, FX+dx, fy(FX+dx,16.6)+.75, 16.6, 0, fest); });
  const tipped = addBox(.7,1.5,.7, blk, FX+3.4, fy(FX+3.4,15.6)+.35, 15.6, 0, fest); tipped.rotation.z = Math.PI/2;
  for (let i=0;i<8;i++){ const x = FX-3 + i*.85; addBox(.8,.5,.06, steel, x, fy(x,15.9)+.25, 15.9, 0, fest); }
  [[-9.3,11.6,0xc0392b],[-2.6,11.0,0x2471a3]].forEach(([x,z,c]) => { const t = tent(c, 1.6, 1.3); t.position.set(x, fy(x,z), z); fest.add(t); });
  const domeG = new THREE.SphereGeometry(.7, 14, 8, 0, Math.PI*2, 0, Math.PI/2);
  for (let i=0;i<14;i++){ const x = -9 + (i%7)*1.05 + (rnd()-.5)*.3, z = 19.6 + Math.floor(i/7)*1.2 + (rnd()-.5)*.3; const d = new THREE.Mesh(domeG, std([0x2e86c1,0xf39c12,0x27ae60,0x8e44ad,0xc0392b][i%5])); d.scale.set(1.2,.9,.9); d.position.set(x, fy(x,z), z); d.castShadow = true; fest.add(d); }
  const NC = 240, bodyG = new THREE.CylinderGeometry(.13,.15,.62,7); bodyG.translate(0,.36,0); const headG = new THREE.SphereGeometry(.1,8,6); headG.translate(0,.77,0);
  const crowdB = new THREE.InstancedMesh(bodyG, std(0xffffff), NC), crowdH = new THREE.InstancedMesh(headG, std(0xffffff), NC);
  crowdB.castShadow = true; const crowd = [];
  for (let i=0, k=0; k<NC && i<4000; i++){
    const a = rnd()*Math.PI*2, r = Math.sqrt(rnd()); let x = FX + Math.cos(a)*r*3.6, z = 13.2 + Math.sin(a)*r*2.4;
    if (z > 15.5) continue; if ([[-6.6,15.6],[-4,15.4],[-7.6,13],[-3.4,12.4]].some(([ix,iz]) => Math.hypot(x-ix, z-iz) < .9)) continue;
    crowd.push({x, z, y:fy(x,z), ph:rnd()*6, ry:rnd()*6}); C.setHex(CLOTH[Math.floor(rnd()*CLOTH.length)]); crowdB.setColorAt(k, C); C.setHex(SKINS[Math.floor(rnd()*SKINS.length)]); crowdH.setColorAt(k, C); k++;
  }
  crowdB.count = crowdH.count = crowd.length;
  function placeCrowd(t){ crowd.forEach((c,i) => { const b = reduced ? 0 : Math.max(0, Math.sin(t*2 + c.ph))*.04; M4.compose(V.set(c.x, c.y + b, c.z), Q.setFromEuler(E.set(0, c.ry, 0)), S3.set(1,1,1)); crowdB.setMatrixAt(i, M4); crowdH.setMatrixAt(i, M4); }); crowdB.instanceMatrix.needsUpdate = crowdH.instanceMatrix.needsUpdate = true; }
  placeCrowd(0); fest.add(crowdB, crowdH);
  // personal de seguretat del festival
  [[-8.9,14.6],[-2.1,14.6],[-5.5,11.2]].forEach(([x,z]) => { const p = person(0x111111, null, {reflect:true}); p.position.set(x, fy(x,z), z); p.rotation.y = Math.PI; fest.add(p); });

  const act = new THREE.Group(); act.visible = false; scene.add(act);
  const hpY = H(-11.8, 11.5) + .05;
  const helis = [
    {m:helicopter(0xe9ecef), curve:new THREE.CatmullRomCurve3([new THREE.Vector3(14,26,72), new THREE.Vector3(9,18,40), new THREE.Vector3(1,12,22), new THREE.Vector3(-8,7,14), new THREE.Vector3(-11.8,hpY+2.5,11.5), new THREE.Vector3(-11.8,hpY,11.5)]), t0:0, dur:7},
    {m:helicopter(0x6c7a4f), curve:new THREE.CatmullRomCurve3([new THREE.Vector3(-4,28,78), new THREE.Vector3(-6,20,46), new THREE.Vector3(-10,14,26), new THREE.Vector3(-14,8,16), new THREE.Vector3(-15.6,hpY+3,12.6), new THREE.Vector3(-15.4,H(-15.4,12.6)+.05,12.6)]), t0:1.5, dur:7.5}
  ];
  helis.forEach(h => act.add(h.m));
  const CAMP_TENTS = [["t",0xeae4d2,-4.6,3.4,1.8,1.5],["r",0xc21f1f,-6.6,3.4,2,1.6],["y",0xf1c21b,-8.8,3.4,2,1.6],["g",0x1f7a43,-6.6,5.8,2,1.6],["k",0x2a2a2a,-8.8,5.8,2,1.6],["m",0x8a8f7a,-10.2,3.8,1.4,2.4]];
  const campTents = CAMP_TENTS.map(([k,col,x,z,w,d]) => { const t = tent(col, w, d); t.position.set(x, H(x,z)+.05, z); t.scale.set(.001,.001,.001); act.add(t); return t; });
  const gen = addBox(.7,.5,.5, std(0xd9a21b), -10.7, H(-10.7,6.6)+.3, 6.6, 0, act);
  const AMB_PATHS = [
    {path:[[-1,-14],[-1,4.8],[-3.2,4.8],[-3.2,2.4]], t0:2, spd:3.4},
    {path:[[-1,-9],[-1,4.8],[-3.0,4.8],[-3.0,6.6]], t0:3, spd:3.4},
    {path:[[-1,-17],[-1,1.6],[-2.2,1.6]], t0:4, spd:3.4}
  ];
  const ambs = AMB_PATHS.map(p => { const m = ambulance(); act.add(m); let L = 0; p.seg = p.path.slice(1).map((b,i) => { const a = p.path[i], l = Math.hypot(b[0]-a[0], b[1]-a[1]); L += l; return l; }); p.len = L; p.m = m; return p; });
  const truck = {path:[[-1,-3],[-1,-6],[-4.6,-6],[-4.6,-7.2]], t0:3.5, spd:2.6, m:fireTruck()}; act.add(truck.m);
  { let L = 0; truck.seg = truck.path.slice(1).map((b,i) => { const a = truck.path[i], l = Math.hypot(b[0]-a[0], b[1]-a[1]); L += l; return l; }); truck.len = L; }
  const rescuers = [];
  [[-4.2,-9.9],[-3.4,-10.4],[-2.9,-9.4],[-4.9,-8.2],[0.2,-13.6],[1.6,-13.4],[2.6,-13.7],[-6,4.4],[-5.6,2.4],[-8,5.0]].forEach(([x,z],i) => { const p = i < 7 ? person(0x2b3138, 0xf2c21b, {reflect:true}) : person(null, null, UNI.tes); p.position.set(x, H(x,z), z); p.rotation.y = rnd()*6; p.scale.set(.001,.001,.001); act.add(p); rescuers.push(p); });
  const lightTowers = [[-3.6,-10.8],[0.8,-13.4],[-4.4,7.2]].map(([x,z]) => { const g = new THREE.Group(); addBox(.08,2.6,.08, steel, 0,1.3,0,0,g); const lamp = addBox(.7,.3,.2, new THREE.MeshStandardMaterial({color:0xfff6d8, emissive:0xfff2c8, emissiveIntensity:1.6}), 0,2.6,0,0,g);
    const L = new THREE.PointLight(0xfff0cc, 0, 9); L.position.y = 2.5; g.add(L); g.userData.L = L; g.position.set(x, H(x,z), z); g.visible = false; act.add(g); return g; });
  function along(p, d){ let acc = 0; for (let i=0;i<p.seg.length;i++){ if (d <= acc + p.seg[i] || i === p.seg.length-1){ const t = clamp((d-acc)/p.seg[i],0,1), a = p.path[i], b = p.path[i+1]; return {x:a[0]+(b[0]-a[0])*t, z:a[1]+(b[1]-a[1])*t, ry:Math.atan2(b[0]-a[0], b[1]-a[1])}; } acc += p.seg[i]; } }
  const T_END = 11;
  function applyAct(t){
    act.visible = true;
    helis.forEach(h => { const u = ease(clamp((t - h.t0)/h.dur, 0, 1)); const p = h.curve.getPointAt(u); h.m.position.copy(p); const tg2 = h.curve.getTangentAt(Math.min(.98, u));
      if (u < .97) h.m.rotation.y = Math.atan2(tg2.x, tg2.z); h.m.visible = t >= h.t0 - .01; });
    campTents.forEach((m,i) => { const s = Math.max(.001, ease(clamp((t - 6 - i*.25)/1.2, 0, 1))); m.scale.set(s,s,s); });
    [...ambs, truck].forEach(p => { const d = clamp((t - p.t0)*p.spd, 0, p.len); const q = along(p, d); p.m.position.set(q.x, roadY(q.x,q.z)-.05, q.z); p.m.rotation.y = q.ry; p.m.visible = t >= p.t0; });
    rescuers.forEach((p,i) => { const s = Math.max(.001, ease(clamp((t - 6.5 - i*.15)/.8, 0, 1))); p.scale.set(s,s,s); });
    lightTowers.forEach(l => { l.visible = t > 7; l.userData.L.intensity = t > 7 ? 1.2 : 0; });
  }
  const anim = {playing:false, t:0, done:null};

  /* ================================================== ESCENA 1 · RECONSTRUCCIÓ I INTERDESASTRE
     Cada obra té set(u): u = 0 (com després del terratrèmol) … 1 (obra acabada). */
  const rec = new THREE.Group(); scene.add(rec);
  const pop = (o, u) => { const b = o.userData.bs || (o.userData.bs = o.scale.clone()); o.visible = u > .001; o.scale.copy(b).multiplyScalar(Math.max(.001, u)); };
  const stag = (grp, u, k) => grp.children.forEach((c,i) => pop(c, ease(clamp(u*(1+k*grp.children.length) - i*k, 0, 1))));
  const recLabels = [], recLabel = (t, x, y, z) => { const l = label(t, {fs:38, scale:.015, bg:"rgba(226,240,255,.97)", border:"#1f5fa8"}); l.position.set(x, H(x,z)+y, z); recLabels.push(l); return l; };
  const syncRecLabels = () => recLabels.forEach(l => { l.material.opacity = era === "rec" && showLabels ? 1 : 0; });
  const B = {};
  // 1 · llum: la torre caiguda s'aixeca, grup electrògen i fanals
  { const g = new THREE.Group(); rec.add(g);
    addBox(1.1,.7,.7, std(0xd9a21b), 9.2, H(9.2,-4.2)+.4, -4.2, 0, g); const lampM = new THREE.MeshStandardMaterial({color:0xfff2c0, emissive:0xffe9a8, emissiveIntensity:1.4});
    [[-0.1,-4],[-0.1,-9],[-0.1,-14],[-2.0,1.5],[-2.0,-11]].forEach(([x,z]) => { const l = new THREE.Group(); addBox(.05,1.4,.05, steel, 0,.7,0,0,l); addBox(.22,.08,.22, lampM, 0,1.42,0,0,l); l.position.set(x, H(x,z), z); g.add(l); });
    g.add(recLabel("Llum restablerta", 9.2, 2.2, -4.2));
    B.llum = {fly:[10.6,2,-6], set(u){ const p = pyls[2]; p.rotation.z = 1.32*(1-u); p.position.y = PY0 + .25*(1-u); stag(g, u, .15); if (u >= 1 && !this.fixed){ this.fixed = true; drawWires(true); } if (u < 1 && this.fixed){ this.fixed = false; drawWires(false); } }}; }
  // 2 · aigua potable: dipòsit i camió cisterna
  { const g = new THREE.Group(); rec.add(g);
    const tank = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,1.3,20), std(0xe8eef2, {roughness:.5})); c.position.y = .65; c.castShadow = true; tank.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.63,.63,.2,20), std(0x2f6fa8)); band.position.y = .9; tank.add(band); tank.position.set(-5.6, H(-5.6,1), 1); g.add(tank);
    const tr = new THREE.Group(); addBox(.75,.6,.9, std(0xe8e8e8), 0,.55,.55,0,tr); const cist = new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,1.5,16), std(0x2f6fa8,{metalness:.4, roughness:.4})); cist.rotation.x = Math.PI/2; cist.position.set(0,.66,-.55); tr.add(cist);
    [[-.38,.55],[.38,.55],[-.38,-.7],[.38,-.7]].forEach(([x,z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.1,10), std(0x1a1a1a)); w.rotation.z = Math.PI/2; w.position.set(x,.16,z); tr.add(w); }); g.add(tr);
    g.add(recLabel("Aigua potable", -5.6, 2.4, 1));
    B.aigua = {fly:[-4,1,0], set(u){ g.visible = u > .001; pop(tank, ease(clamp(u*1.4,0,1))); g.children[2].visible = u > .5; const z = -20 + (2.2+20)*ease(u); tr.position.set(-1, roadY(-1,z)-.04, z); tr.visible = u > .001; }}; }
  // 3 · accés: es retira l'esllavissada, excavadora i pont provisional
  const bailey = new THREE.Group(); rec.add(bailey);
  { const gm = std(0x4d6b3a, {metalness:.5, roughness:.45}); addBox(6.2,.12,1.5, std(0x5a5f63,{metalness:.4}), 0,0,0,0,bailey);
    [-.78,.78].forEach(z => { addBox(6.2,.08,.08, gm, 0,.75,z,0,bailey); addBox(6.2,.08,.08, gm, 0,.05,z,0,bailey); for (let i=0;i<=8;i++){ addBox(.06,.75,.06, gm, -3.1+i*.775,.4,z,0,bailey); if (i<8){ const d = addBox(.05,1.08,.05, gm, -3.1+i*.775+.39,.4,z,0,bailey); d.rotation.z = (i%2?1:-1)*.8; } } });
    bailey.position.set(4.2, 1.12, 18.5); bailey.add(recLabel("Pont provisional", 0, 0, 0));
    bailey.children[bailey.children.length-1].position.set(0, 2.2, 0); }
  const digger = new THREE.Group(); rec.add(digger);
  { addBox(1,.6,1.4, std(0xf2b51b), 0,.55,0,0,digger); addBox(.7,.6,.6, std(0xf2b51b), 0,1.1,.2,0,digger); const arm = addBox(.18,.18,1.8, std(0xf2b51b), 0,1.3,1.4,0,digger); arm.rotation.x = .5; addBox(1.1,.22,1.6, std(0x222222), 0,.15,0,0,digger); digger.position.set(7.6, roadY(7.6,24.5)-.05, 24.5); digger.rotation.y = Math.PI; }
  B.acces = {fly:[6,1,22], set(u){ const k = 1 - .78*ease(u); slide.scale.set(k, k, k); pop(digger, clamp(u*3,0,1)); pop(bailey, B.pont.u >= 1 ? 0 : ease(clamp((u-.3)/.7,0,1))); }};
  // 4 · albergs de la Creu Roja
  const alb = new THREE.Group(); rec.add(alb);
  { const crossT = tex(64,64,(g,w,h) => { g.fillStyle = "#fff"; g.fillRect(0,0,w,h); g.fillStyle = "#d11f1f"; g.fillRect(24,10,16,44); g.fillRect(10,24,44,16); });
    for (let i=0;i<10;i++){ const x = -9.2 + (i%5)*1.7, z = i < 5 ? 11.6 : 13.6; const t = tent(0xf2f2ee, 1.4, 1.2); const s = new THREE.Mesh(new THREE.PlaneGeometry(.45,.45), new THREE.MeshBasicMaterial({map:crossT})); s.position.set(0,.5,.61); t.add(s); t.position.set(x, H(x,z)+.02, z); alb.add(t); }
    const l = recLabel("Albergs · Creu Roja", -5.8, 3, 12.6); alb.add(l); }
  B.alberg = {fly:[-5.6,0,12.6], set(u){ stag(alb, u, .08); }};
  // 5 · escola en mòduls prefabricats
  const mods = new THREE.Group(); rec.add(mods);
  { const mm = std(0xffffff, {map:facade(1.6, 1.1, {floors:1, wall:"#dfe9ee", shut:null, door:true})});
    [[-12.6,-8.6],[-12.6,-6.6],[-10.8,-6.6]].forEach(([x,z]) => { const m = addBox(1.6,1.1,1.8, [mm,mm,std(0x9aa5ab),std(0x9aa5ab),mm,mm], x, H(x,z)+.56, z, 0, mods); });
    mods.add(recLabel("Escola provisional", -11.6, 2.6, -7.4)); }
  B.escola = {fly:[-11.4,0,-7.6], set(u){ stag(mods, u, .2); }};
  // 6 · es desmunta l'hospital de campanya i es reobre el consultori
  const cons = new THREE.Group(); rec.add(cons);
  { const b = building(-2.0, 7.6, 2, 1.8, 1, {wall:"#f4f2ec", shut:"#2f6fa8", sign:"CONSULTORI"}); scene.remove(b); cons.add(b);
    cons.add(recLabel("Consultori reobert", -2.0, 2.6, 7.6)); }
  B.hospital = {fly:[-6,0,5], set(u){ const k = Math.max(.001, 1 - ease(clamp(u*1.4,0,1))); campTents.forEach(t => t.scale.set(k,k,k)); gen.visible = u < .7; stag(cons, ease(clamp((u-.3)/.7,0,1)), .2); }};
  // 7 · la residència: la gent gran marxa a un lloc segur i s'apuntala l'edifici
  const scaf = new THREE.Group(); rec.add(scaf);
  { const sm = std(0xc9cfd4, {metalness:.6, roughness:.4}); const y0 = H(1.3,-15.2);
    for (let i=0;i<=6;i++){ addBox(.05,3.6,.05, sm, -1.5+i, 1.8, 1.55, 0, scaf); }
    for (let k=1;k<=3;k++){ addBox(6.1,.05,.05, sm, 1.5, k*1.15, 1.55, 0, scaf); addBox(6.1,.06,.4, std(0x9b7b52), 1.5, k*1.15-.04, 1.75, 0, scaf); }
    scaf.position.set(-.2, y0, -15.2); const l = recLabel("Residència: obres de reforç", 1.5, 0, 0); l.position.set(1.5, 4.6, 0); scaf.add(l); }
  B.resi = {fly:[1.3,1,-15], set(u){ residentsG.visible = u < .5; pop(scaf, ease(clamp(u*1.2,0,1))); }};
  // 8 · pont definitiu de formigó
  const bridge = new THREE.Group(); rec.add(bridge);
  { const cm = std(0xb9b5ad, {roughness:.8}); addBox(6.6,.32,1.9, cm, 0,0,0,0,bridge); [-.95,.95].forEach(z => addBox(6.6,.35,.08, std(0x8b9196,{metalness:.5}), 0,.33,z,0,bridge)); addBox(.7,1.4,1.2, cm, 0,-.8,0,0,bridge);
    bridge.position.set(4.2, 1.18, 18.5); const l = recLabel("Pont nou", 0, 0, 0); l.position.set(0, 2.1, 0); bridge.add(l); }
  B.pont = {u:0, fly:[4.2,1,18.5], set(u){ this.u = u; pop(bridge, ease(u)); [d1, d2].forEach(d => d.visible = u < .5); pop(bailey, u >= 1 ? 0 : (B.acces.u >= 1 ? 1 : 0)); }};
  // 9 · escola nova antisísmica
  const newWing = new THREE.Group(); rec.add(newWing);
  { const b = building(-3.9, -8.8, 3, 2.4, 2, {wall:"#f3e7c2", shut:"#2f6fa8", roof:"slate", door:false}); scene.remove(b); newWing.add(b); newWing.add(recLabel("Escola antisísmica", -3.9, 4, -8.8)); }
  B.antisis = {fly:[-4,1,-9], set(u){ schoolRuin.visible = u < .5; stag(newWing, u, .3); }};
  // 10 · punt de suport psicològic
  const psy = new THREE.Group(); rec.add(psy);
  { const PXs = -4.5, PZs = -20.4; const t = tent(0x2f8a7a, 1.8, 1.5); t.position.set(PXs, H(PXs,PZs), PZs); psy.add(t);
    for (let i=0;i<6;i++){ const a = i/6*Math.PI*2, x = PXs + Math.cos(a)*1.3, z = PZs + 2 + Math.sin(a)*.8; const p = person(i ? CLOTH[i*2 % CLOTH.length] : 0x2f8a7a, null, {}); p.position.set(x, H(x,z)+.15, z); p.rotation.y = Math.atan2(PXs-x, PZs+2-z); pose(p, "sit"); psy.add(p); }
    psy.add(recLabel("Suport psicològic", PXs, 3, PZs+1)); }
  B.psico = {fly:[-4.5,0,-19.4], set(u){ stag(psy, u, .1); }};
  Object.values(B).forEach(b => { b.u = 0; const f = b.set; b.set = function(u){ this.u = u; f.call(this, u); }; });

  /* --- cercles blaus de les obres (fase 5) */
  const workGroup = new THREE.Group(); workGroup.visible = false; scene.add(workGroup);
  const workObjs = {}, workClick = [];
  OBRES.forEach(o => { const [x,y,z] = o.pos, gy = H(x,z), g = new THREE.Group(); g.position.set(x, 0, z);
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({map:spotTex(o.n, false, "#1f5fa8"), depthTest:false, transparent:true})); icon.scale.set(2, 2, 1); icon.position.y = gy + y; icon.renderOrder = 30;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,y,8,1,true), new THREE.MeshBasicMaterial({color:0x3b8fe0, transparent:true, opacity:.45, depthWrite:false})); pillar.position.y = gy + y/2;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({visible:false})); hit.position.y = gy + y; hit.userData.work = o.id;
    g.add(icon, pillar, hit); workGroup.add(g); workClick.push(hit); workObjs[o.id] = {icon, pillar, o, baseY:gy+y}; });
  function markWork(id, done){ const w = workObjs[id]; if (!w || w.done === done) return; w.done = done; w.icon.material.map = spotTex(w.o.n, done, "#1f5fa8"); w.icon.material.needsUpdate = true; w.pillar.material.color.setHex(done ? 0x3fbf6f : 0x3b8fe0); }

  /* --- èpoques: emergència (temporal), reconstrucció (dia 15), interdesastre (un any després) */
  let era = "emer";
  const setRain = () => { rain.visible = !reduced && era === "emer"; };
  function setEra(e){
    if (e === era) return; era = e; const calm = e !== "emer";
    sky.material.map = calm ? skyDay : skyTex; sky.material.needsUpdate = true;
    scene.fog.color.setHex(calm ? 0x9fb3c2 : FOG); scene.fog.near = calm ? 100 : 70; scene.fog.far = calm ? 280 : 190;
    hemi.intensity = calm ? .9 : .72; sun.intensity = calm ? 1.45 : 1.15; sun.color.setHex(calm ? 0xfff1dc : 0xffd7ad);
    clouds.children.forEach(c => { c.material.opacity = calm ? .32 : .75; c.position.y = calm ? 26 + (c.position.y % 3) : 20 + (c.position.y % 9); });
    flash = 0; flashLight.intensity = 0; setRain();
    hurt.visible = !calm; crowdB.visible = crowdH.visible = !calm;
    rescuers.forEach(p => p.visible = !calm); lightTowers.forEach(l => { l.visible = !calm && act.visible; l.userData.L.intensity = l.visible ? 1.2 : 0; }); helis.forEach(h => h.m.visible = !calm);
    // un any després: tot està fet; ja no calen els mòduls, els albergs ni l'excavadora
    if (e === "pre"){ Object.values(B).forEach(b => b.set(1)); B.escola.set(0); B.alberg.set(0); pop(digger, 0); }
    syncRecLabels();
  }
  function build(id, animate){ const b = B[id]; if (!b || b.u >= 1) return;
    if (!animate || reduced){ b.set(1); return; }
    pTweens.push({t:0, dur:2.4, fn:u => b.set(u), done:() => b.set(1)});
    if (b.fly && view === "vall") flyTo(new THREE.Vector3(b.fly[0]+8, 9, b.fly[2]+11), new THREE.Vector3(b.fly[0], b.fly[1], b.fly[2]));
  }
  function resetRec(){ era = "x"; setEra("emer"); Object.values(B).forEach(b => b.set(0)); Object.keys(workObjs).forEach(id => markWork(id, false)); }
  Object.values(B).forEach(b => b.set(0));

  /* ================================================== ESCENA 2 · HOSPITAL DE CAMPANYA */
  const hs = new THREE.Scene(); hs.background = new THREE.Color(0x8d9aa6); hs.fog = new THREE.Fog(0x8d9aa6, 60, 140);
  const hcam = new THREE.PerspectiveCamera(42, 1, .2, 400); hcam.position.set(18, 19, 28);
  hs.add(new THREE.HemisphereLight(0xe8eef6, 0x4b4f40, .9));
  const hsun = new THREE.DirectionalLight(0xfff1dc, .85); hsun.position.set(20, 30, 18); hsun.castShadow = true; hsun.shadow.mapSize.set(2048,2048);
  Object.assign(hsun.shadow.camera, {left:-28, right:28, top:28, bottom:-28, near:1, far:100}); hs.add(hsun);
  const hin = new THREE.PointLight(0xfff3dc, .5, 40); hin.position.set(0, 6, 0); hs.add(hin);
  const grassT = tex(128,128,(g,w,h) => noiseFill(g,w,h,"#58753f",.35,5000), [24,24]);
  const hground = new THREE.Mesh(new THREE.PlaneGeometry(140,140), std(0xffffff,{map:grassT})); hground.rotation.x = -Math.PI/2; hground.receiveShadow = true; hs.add(hground);
  const floorT = tex(256,256,(g,w,h) => { noiseFill(g,w,h,"#cfd0c7",.15,4000); g.strokeStyle = "rgba(0,0,0,.12)"; for (let i=0;i<w;i+=32){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,h); g.stroke(); g.beginPath(); g.moveTo(0,i); g.lineTo(w,i); g.stroke(); } }, [6,4]);
  const hfloor = new THREE.Mesh(new THREE.BoxGeometry(32, .12, 21), std(0xffffff,{map:floorT})); hfloor.position.y = .06; hfloor.receiveShadow = true; hs.add(hfloor);
  // estructura de la tenda
  const frameM = std(0x9aa0a6, {metalness:.6, roughness:.35});
  for (let i=0;i<9;i++){ const x = -15 + i*3.75; const a = new THREE.Mesh(new THREE.TorusGeometry(10, .09, 6, 40, Math.PI), frameM); a.rotation.y = Math.PI/2; a.scale.set(1, .52, 1); a.position.set(x, .1, 0); hs.add(a); }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,30,6), frameM); ridge.rotation.z = Math.PI/2; ridge.position.y = 5.3; hs.add(ridge);
  const canvasT = tex(128,128,(g,w,h) => noiseFill(g,w,h,"#d9d3bf",.2,3000), [6,3]);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 30, 32, 1, true, Math.PI, Math.PI/2), std(0xffffff, {map:canvasT, side:THREE.DoubleSide, roughness:1}));
  shell.rotation.z = Math.PI/2; shell.scale.set(.52, 1, 1); shell.position.y = .1; shell.receiveShadow = true; hs.add(shell);
  // zones
  const ZONES = {
    t:{n:"TRIATGE", col:"#ece7da", x:12.5, z:0, w:5, d:8, shape:"t"},
    r:{n:"ÀREA VERMELLA · IMMEDIAT", col:"#c21f1f", x:4, z:-6, w:10.5, d:5.5, shape:"r"},
    y:{n:"ÀREA GROGA · URGENT", col:"#f1c21b", x:4, z:6, w:10.5, d:5.5, shape:"y"},
    g:{n:"ÀREA VERDA · LLEU", col:"#1f7a43", x:-8.5, z:6, w:9.5, d:5.5, shape:"g"},
    k:{n:"ÀREA NEGRA", col:"#2a2a2a", x:-9.5, z:-6, w:7.5, d:5.5, shape:"k"}
  };
  Object.entries(ZONES).forEach(([k,zn]) => {
    const mt = tex(256, 160, (g,w,h) => { g.fillStyle = zn.col; g.globalAlpha = .3; g.fillRect(0,0,w,h); g.globalAlpha = 1; g.strokeStyle = zn.col; g.lineWidth = 10; g.setLineDash([22,12]); g.strokeRect(6,6,w-12,h-12); });
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(zn.w, zn.d), new THREE.MeshStandardMaterial({map:mt, transparent:true, polygonOffset:true, polygonOffsetFactor:-2}));
    mat.rotation.x = -Math.PI/2; mat.position.set(zn.x, .13, zn.z); hs.add(mat);
    const s = label(zn.n, {fs:44, scale:.02, shape:zn.shape, bg:k==="k" ? "rgba(30,30,30,.96)" : "rgba(255,255,255,.97)", fg:k==="k" ? "#fff" : "#111", border:zn.col === "#ece7da" ? "#111" : zn.col});
    s.position.set(zn.x, 4.6, zn.z); hs.add(s);
  });
  const entr = label("ENTRADA ▶", {fs:44, scale:.02}); entr.position.set(16.5, 3, 0); hs.add(entr);
  // mobiliari
  const metal = std(0xb9c0c6, {metalness:.5, roughness:.35}), sheet = std(0xf4f6f6), blue = std(0x3c78a8), green = std(0x3f7d5a);
  function bed(){ const g = new THREE.Group(); addBox(2,.08,.9, metal, 0,.55,0,0,g); [[-.92,-.4],[.92,-.4],[-.92,.4],[.92,.4]].forEach(([x,z]) => addBox(.05,.55,.05, metal, x,.27,z,0,g));
    addBox(1.9,.16,.84, blue, 0,.67,0,0,g); addBox(.42,.1,.62, sheet, -.72,.8,0,0,g); return g; }
  function stretcher(){ const g = new THREE.Group(); addBox(2,.05,.7, metal, 0,.45,0,0,g); [[-.9,-.3],[.9,-.3],[-.9,.3],[.9,.3]].forEach(([x,z]) => addBox(.04,.45,.04, metal, x,.22,z,0,g)); addBox(1.9,.06,.66, green, 0,.5,0,0,g); return g; }
  function chair(){ const g = new THREE.Group(); addBox(.5,.05,.5, std(0x3c5a7a), 0,.46,0,0,g); addBox(.5,.5,.05, std(0x3c5a7a), 0,.72,-.23,0,g); [[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]].forEach(([x,z]) => addBox(.03,.46,.03, metal, x,.23,z,0,g)); return g; }
  const ecg = tex(128, 80, (g,w,h) => { g.fillStyle = "#04140c"; g.fillRect(0,0,w,h); g.strokeStyle = "#39ff8a"; g.lineWidth = 3; g.beginPath(); g.moveTo(0,h*.6); for (let x=0;x<w;x+=4){ const k = (x%40); g.lineTo(x, h*.6 - (k===12?34:k===16?-14:0)); } g.stroke(); g.fillStyle="#39ff8a"; g.font="bold 16px Arial"; g.fillText("FC 88", 6, 18); });
  function monitor(){ const g = new THREE.Group(); addBox(.05,1.6,.05, metal, 0,.8,0,0,g); const scr = addBox(.5,.36,.08, std(0x222222), 0,1.55,0,0,g);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(.44,.3), new THREE.MeshBasicMaterial({map:ecg})); face.position.set(0,1.55,.045); g.add(face); return g; }
  function oxy(){ const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1,12), std(0x3d3d3d,{metalness:.4})); c.position.y = .5; g.add(c); const t = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.2,12), std(0xf2f2f2)); t.position.y = 1.08; g.add(t); return g; }
  const SLOTS = {r:[], y:[], g:[], k:[]};
  for (let i=0;i<6;i++){ const b = bed(); const x = -.2 + i*1.7; b.position.set(x, .12, -6.4); b.rotation.y = Math.PI/2; hs.add(b); const m = monitor(); m.position.set(x+.6, .12, -7.8); hs.add(m); const o = oxy(); o.position.set(x-.6, .12, -7.9); hs.add(o); SLOTS.r.push({x, z:-6.4, y:.92, ry:Math.PI/2, lie:true}); }
  for (let i=0;i<8;i++){ const st = stretcher(); const x = .2 + (i%4)*2.4, z = i < 4 ? 4.6 : 7.4; st.position.set(x, .12, z); hs.add(st); SLOTS.y.push({x, z, y:.7, ry:0, lie:true}); }
  for (let i=0;i<12;i++){ const c = chair(); const x = -12 + (i%4)*1.6 + 1, z = 4.4 + Math.floor(i/4)*1.4; c.position.set(x, .12, z); c.rotation.y = Math.PI; hs.add(c); SLOTS.g.push({x, z, y:.12, ry:Math.PI, lie:false, sit:true}); }
  for (let i=0;i<4;i++){ const st = stretcher(); const x = -12 + i*1.6 + .6, z = -6; st.position.set(x, .12, z); st.rotation.y = Math.PI/2; hs.add(st); SLOTS.k.push({x, z, y:.62, ry:Math.PI/2, lie:true, cover:true}); }
  [[-9.5,-3.2,7.6,0],[-13.3,-6,5.6,Math.PI/2],[-5.7,-6,5.6,Math.PI/2]].forEach(([x,z,w,r]) => { const p = addBox(w, 1.7, .06, std(0xf1f1ec), x, 1, z, r, hs); p.material.transparent = true; p.material.opacity = .9; });
  // triatge
  addBox(1.8,.8,.7, std(0x6d7b85), 12,.52,-2.6,0,hs); addBox(.5,.32,.04, std(0x1a1a1a), 12,1.08,-2.75,0,hs);
  const st1 = stretcher(); st1.position.set(12.5,.12,1.6); hs.add(st1); const st2 = stretcher(); st2.position.set(12.5,.12,3.2); hs.add(st2);
  const tagBoard = tex(256,128,(g,w,h) => { g.fillStyle="#fff"; g.fillRect(0,0,w,h); [["#1f7a43","VERD"],["#f1c21b","GROC"],["#c21f1f","VERMELL"],["#141414","NEGRE"]].forEach(([c,t],i) => { g.fillStyle = c; g.fillRect(10+i*61, 14, 52, 70); g.fillStyle = i===1 ? "#111" : "#fff"; g.font = "bold 13px Arial"; g.fillText(t, 14+i*61, 104 - 0); }); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.9), new THREE.MeshBasicMaterial({map:tagBoard})); board.position.set(14.8, 1.7, -2.6); board.rotation.y = -Math.PI/2; hs.add(board);
  // magatzem: caixes i medicació
  function boxTex(t){ return tex(128,128,(g,w,h) => { noiseFill(g,w,h,"#b98c58",.2,2000); g.strokeStyle = "rgba(60,40,20,.6)"; g.lineWidth = 4; g.strokeRect(4,4,w-8,h-8); g.fillStyle = "#fff"; g.fillRect(10,44,w-20,40); g.fillStyle = "#111"; g.font = "bold 15px Arial"; g.textAlign = "center"; t.split("\n").forEach((l,i,a) => g.fillText(l, w/2, 64 + (i - (a.length-1)/2)*16 + 5)); }); }
  const BOXES = [["MATERIAL\nDE CURES",-17,-6],["IMMOBILITZACIÓ",-17,-3],["SÈRUMS",-17,0],["MEDICACIÓ",-17,3],["AIGUA\nPOTABLE",-17,6]];
  BOXES.forEach(([t,x,z]) => { const pal = addBox(1.4,.15,1.4, std(0x9b7b52), x,.08,z,0,hs); const m = std(0xffffff,{map:boxTex(t)});
    for (let k=0;k<6;k++){ addBox(.62,.5,.62, m, x-.33+(k%2)*.66, .42+Math.floor(k/4)*.5, z-.33+(Math.floor(k/2)%2)*.66, 0, hs); } });
  const bl = label("MAGATZEM · CAIXES DE MATERIAL", {fs:40, scale:.018}); bl.position.set(-17, 3.4, 0); hs.add(bl);
  // armari de medicació dins la tenda
  const shelf = new THREE.Group(); shelf.position.set(-1.6, .12, -2.2);
  addBox(2.4,2,.5, std(0x8a949c,{metalness:.4}), 0,1,0,0,shelf);
  const medCols = [0xe04848,0x4a7fd0,0xf0f0f0,0x5ab06d,0xe6b33a];
  for (let r=0;r<3;r++) for (let c=0;c<8;c++) addBox(.22,.26,.3, std(medCols[(r*3+c)%5]), -1+c*.28, .45+r*.58, .12, 0, shelf);
  hs.add(shelf);
  const ml = label("MEDICACIÓ", {fs:40, scale:.018}); ml.position.set(-1.6, 3.1, -2.2); hs.add(ml);
  // oxigen i generador
  for (let i=0;i<6;i++){ const o = oxy(); o.position.set(-19 + (i%3)*.35, .12, -9 + Math.floor(i/3)*.35); hs.add(o); }
  addBox(2,1.3,1.1, std(0xd9a21b), -19,.7,9,0,hs); addBox(.12,.6,.12, std(0x333333), -18.4,1.6,9,0,hs);
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(1.4,20,12), std(0x2f6fa8,{roughness:.6})); bladder.scale.set(1.3,.35,1); bladder.position.set(-19.5,.45,-3); hs.add(bladder);
  const gl = label("GENERADOR", {fs:36, scale:.016}); gl.position.set(-19, 2.4, 9); hs.add(gl);
  // personal sanitari amb uniformes: metge/essa (blau), infermer/a (verd), TES (groc), logística (taronja)
  const staffAt = (u, x, z, ry, k) => { const p = person(null, null, UNI[u]); p.position.set(x,.12,z); p.rotation.y = ry; if (k) pose(p,k); hs.add(p); return p; };
  staffAt("inf", 13.4,-1.7, -Math.PI/2); staffAt("doc", 11.6,-2.1, 0); staffAt("tes", 13.4,2.4, Math.PI);
  [0.6,4.0,7.4].forEach((x,i) => staffAt(i === 1 ? "inf" : "doc", x, -5.05, Math.PI));
  staffAt("inf", 2.6, 6.0, 0); staffAt("doc", 6.4, 6.0, Math.PI); staffAt("inf", -9.6, 3.5, Math.PI); staffAt("tes", -10.6,-4.0, Math.PI); staffAt("inf", -1.6,-1.45, Math.PI);
  staffAt("tes", 18.4, 4.0, -Math.PI/2); staffAt("tes", 20.4, -2.6, Math.PI/2);
  const hstaff = (u, path, spd, carry) => { const p = person(null, null, UNI[u]); const w = addWalker(hs, p, path, spd, () => .12); if (carry){ w.carry = true; p.userData.arms.forEach(a => a.rotation.x = -1.2); addBox(.42,.32,.32, std(0xb98c58), 0,.68,.32,0,p); } return p; };
  hstaff("inf", [[-.4,-4.3],[9.2,-4.3]], .7); hstaff("doc", [[.2,3.3],[9,3.3]], .6); hstaff("log", [[-15.4,1.2],[-8,1.2],[-2.2,-.9]], .8, true); hstaff("log", [[-15.4,-1.4],[-6,-2.6],[0,-3.7]], .7, true); hstaff("tes", [[15.2,-.7],[11.4,-.7]], .5);
  // cua de víctimes a l'entrada (la víctima i del triatge = posició i de la cua)
  const queue = [];
  function buildQueue(){
    queue.forEach(q => q && hs.remove(q.g)); queue.length = 0;
    VICTIMS.forEach((v,i) => { const g = new THREE.Group(); const walks = v.camina === "Sí"; const shirt = CLOTH[(i*3) % CLOTH.length];
      const p = person(shirt, null, {pants: i%2 ? 0x2a2f36 : 0x3b4a6b});
      if (walks){ g.add(p); } else { const st = stretcher(); st.rotation.y = Math.PI/2; g.add(st); p.position.set(0,.6,-.5); lying(p, Math.PI/2); g.add(p); }
      g.position.set(17.8 + (i%5)*1.25, .12, i < 5 ? -.3 : 1.9); hs.add(g); queue.push({g, walks, shirt}); });
  }
  buildQueue();
  // pacients
  const patients = new THREE.Group(); hs.add(patients);
  const used = {r:0, y:0, g:0, k:0}; const pTweens = []; const carriers = new Set();
  const TAGC = {g:0x1f7a43, y:0xf1c21b, r:0xc21f1f, k:0x161616};
  function admit(tag, animate, idx){
    const q = queue[idx]; let sx = 17, sz = 0, walks = true, shirt = 0xd9d4c4;
    if (q){ sx = q.g.position.x; sz = q.g.position.z; walks = q.walks; shirt = q.shirt; hs.remove(q.g); queue[idx] = null; }
    const slot = SLOTS[tag][used[tag]];
    const p = person(shirt, null, {pants:0x2a2f36}); const vest = new THREE.Mesh(new THREE.CylinderGeometry(.165,.17,.2,8), std(TAGC[tag])); vest.position.y = .66; p.add(vest);
    let tx, tz, final;
    if (slot){ tx = slot.x; tz = slot.z; final = slot; }
    else { const zn = ZONES[tag]; tx = zn.x + (rnd()-.5)*2; tz = zn.z + (zn.z < 0 ? 2.4 : -2.4); final = {x:tx, z:tz, y:.12, lie:false}; }
    used[tag]++;
    const place = () => { patients.add(p); p.rotation.set(0,0,0); p.userData.legs.forEach(l => l.rotation.x = 0);
      if (final.lie){ p.rotation.set(0, final.ry, Math.PI/2); const d = new THREE.Vector3(0,.5,0).applyEuler(p.rotation); p.position.set(final.x - d.x, final.y + .03, final.z - d.z);
        if (final.cover){ const sh = new THREE.Mesh(new THREE.BoxGeometry(.06,1.05,.46), std(0xf1f1ec)); sh.position.set(-.13,.52,0); p.add(sh); } }
      else if (final.sit){ p.position.set(final.x, .58, final.z); p.rotation.y = final.ry; pose(p, "sit"); }
      else { p.position.set(final.x, final.y, final.z); } };
    if (!animate || reduced){ place(); return; }
    const route = (e) => { const midx = 12.5; if (e < .4){ const k = e/.4; return [sx + (midx - sx)*k, sz + (0 - sz)*k]; } const k = (e-.4)/.6; return [midx + (tx - midx)*k, (tz)*k]; };
    if (walks){
      patients.add(p);
      pTweens.push({t:0, dur:3.2, fn:u => { const e = ease(u), [x,z] = route(e), [nx,nz] = route(Math.min(1,e+.02)); p.position.set(x,.12,z); p.rotation.y = Math.atan2(nx-x, nz-z); const k = Math.sin(u*40)*.5; p.userData.legs[0].rotation.x = k; p.userData.legs[1].rotation.x = -k; }, done:place});
    } else {
      const car = new THREE.Group(); const st = stretcher(); st.rotation.y = Math.PI/2; car.add(st); car.add(p); p.position.set(0,.6,-.5); lying(p, Math.PI/2);
      const bearers = [person(null,null,UNI.tes), person(null,null,UNI.tes)]; bearers[0].position.set(0,0,1.3); bearers[1].position.set(0,0,-1.3); bearers.forEach(b => { b.userData.arms.forEach(a => a.rotation.x = -.6); car.add(b); });
      hs.add(car); carriers.add(car);
      pTweens.push({t:0, dur:3.6, fn:u => { const e = ease(u), [x,z] = route(e), [nx,nz] = route(Math.min(1,e+.02)); car.position.set(x,.12,z); car.rotation.y = Math.atan2(nx-x, nz-z); const k = Math.sin(u*44)*.45; bearers.forEach(b => { b.userData.legs[0].rotation.x = k; b.userData.legs[1].rotation.x = -k; }); },
        done:() => { car.remove(p); hs.remove(car); carriers.delete(car); place(); }});
    }
  }
  function free(){ return {r:Math.max(0,CAPACITY.r-used.r), y:Math.max(0,CAPACITY.y-used.y), g:Math.max(0,CAPACITY.g-used.g), k:Math.max(0,CAPACITY.k-used.k)}; }

  /* ================================================== càmeres i controls */
  function mkCtl(cam, target, minD, maxD){ const c = new THREE.OrbitControls(cam, canvasEl); c.target.copy(target); c.enableDamping = true; c.dampingFactor = .08; c.minDistance = minD; c.maxDistance = maxD; c.maxPolarAngle = Math.PI*.47; c.screenSpacePanning = false; c.update(); return c; }
  const ctlV = mkCtl(camera, new THREE.Vector3(-1, 0, -2), 8, 120);
  const ctlH = mkCtl(hcam, new THREE.Vector3(0, 0, 0), 6, 70); ctlH.enabled = false;
  let view = "vall", locked = true;
  const HOME_V = {p:new THREE.Vector3(34,34,52), t:new THREE.Vector3(-1,0,-2)}, HOME_H = {p:new THREE.Vector3(18,19,28), t:new THREE.Vector3(0,0,0)};
  let fly = null;
  function flyTo(p, t, dur){ const c = view === "vall" ? camera : hcam, ctl = view === "vall" ? ctlV : ctlH; if (reduced){ c.position.copy(p); ctl.target.copy(t); ctl.update(); return; }
    fly = {c, ctl, p0:c.position.clone(), t0:ctl.target.clone(), p, t, u:0, dur:dur||1.2}; }

  /* --- interacció: toc sobre punts */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  canvasEl.addEventListener("pointerdown", e => { down = {x:e.clientX, y:e.clientY}; fly = null; });
  canvasEl.addEventListener("pointerup", e => { const d0 = down; down = null; if (!d0 || Math.hypot(e.clientX-d0.x, e.clientY-d0.y) > 6 || view !== "vall" || anim.playing) return;
    const r = canvasEl.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(clickables, false).filter(h => h.object.parent.parent.visible); if (hits.length && cb.onSpot){ cb.onSpot(hits[0].object.userData.spot); return; }
    if (workGroup.visible){ const wh = ray.intersectObjects(workClick, false); if (wh.length && cb.onWork) cb.onWork(wh[0].object.userData.work); } });
  canvasEl.addEventListener("pointermove", e => { if (view !== "vall" || e.buttons) return; const r = canvasEl.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ndc, camera);
    canvasEl.style.cursor = (spotGroup.visible && ray.intersectObjects(clickables, false).length) || (workGroup.visible && ray.intersectObjects(workClick, false).length) ? "pointer" : "grab"; });

  function resize(){ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); [camera, hcam].forEach(c => { c.aspect = w/Math.max(1,h); c.updateProjectionMatrix(); }); }
  new ResizeObserver(resize).observe(stage); resize();

  /* ================================================== bucle */
  let last = performance.now(), flash = 0, blink = 0, crowdTick = 0, paused = false;
  function loop(now){
    const dt = Math.min(.05, (now - last)/1000); last = now;
    if (fly){ fly.u = Math.min(1, fly.u + dt/fly.dur); const e = ease(fly.u); fly.c.position.lerpVectors(fly.p0, fly.p, e); fly.ctl.target.lerpVectors(fly.t0, fly.t, e); if (fly.u >= 1) fly = null; }
    if (anim.playing){
      anim.t += dt; applyAct(anim.t);
      const h0 = helis[0].m.position;
      if (anim.t < 6.5){ camera.position.lerp(new THREE.Vector3(h0.x + 14, h0.y + 8, h0.z + 16), .05); ctlV.target.lerp(h0, .08); }
      else { camera.position.lerp(new THREE.Vector3(6, 13, 20), .03); ctlV.target.lerp(new THREE.Vector3(-6, 0, 2), .05); }
      if (anim.t >= T_END){ anim.playing = false; ctlV.enabled = view === "vall"; const d = anim.done; anim.done = null; d && d(); }
    }
    if (view === "vall" && !anim.playing) ctlV.update(); if (view === "hosp") ctlH.update();
    if (act.visible){ helis.forEach(h => { const spin = h.m.position.y > hpY + .3 || anim.playing ? 40 : 10; h.m.userData.rotor.rotation.y += dt*spin; h.m.userData.tail.rotation.x += dt*spin*1.5; });
      blink += dt; const on = Math.floor(blink*3) % 2 === 0; [...ambs.map(a => a.m), truck.m].forEach(m => m.userData.lights.material.emissiveIntensity = on ? 2 : .2); }
    if (!reduced){
      const a = rgeo.attributes.position.array;
      for (let i=0;i<a.length;i+=6){ a[i+1] -= dt*18; a[i+4] -= dt*18; if (a[i+1] < 0){ a[i+1] += 24; a[i+4] += 24; } }
      rgeo.attributes.position.needsUpdate = true;
      clouds.children.forEach((c,i) => { c.position.x += dt*(.3 + (i%5)*.08); if (c.position.x > 75) c.position.x = -75; });
      if (era === "emer" && Math.random() < .0018) flash = 1; flash = Math.max(0, flash - dt*3.2); flashLight.intensity = flash*1.4;
      const s = 1 + Math.sin(now/280)*.14; Object.values(spotObjs).forEach(o => { o.ring.scale.set(s,s,s); o.icon.position.y = o.baseY + Math.sin(now/500 + o.h.n)*.18; });
      if (workGroup.visible) Object.values(workObjs).forEach(o => { o.icon.position.y = o.baseY + Math.sin(now/520 + o.o.n)*.15; });
    }
    if (!reduced){ stepWalkers(dt); if ((crowdTick = (crowdTick + 1) % 2) === 0) placeCrowd(now/1000); }
    for (let i=pTweens.length-1;i>=0;i--){ const tw = pTweens[i]; tw.t += dt; const u = Math.min(1, tw.t/tw.dur); tw.fn(u); if (u >= 1){ pTweens.splice(i,1); tw.done(); } }
    if (!paused) renderer.render(view === "vall" ? scene : hs, view === "vall" ? camera : hcam);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ================================================== API */
  api.setView = v => { view = v; ctlV.enabled = v === "vall" && !anim.playing; ctlH.enabled = v === "hosp" && !locked; canvasEl.classList.toggle("locked", v === "hosp" && locked); fly = null; };
  api.getView = () => view;
  api.setLocked = l => { locked = l; api.setView(view); };
  api.focusSpot = id => { const o = spotObjs[id]; if (!o) return; const [x,y,z] = o.h.pos; const ty = Math.min(y, 3); flyTo(new THREE.Vector3(x+9, ty+9, z+12), new THREE.Vector3(x, ty, z)); };
  api.markFound = markFound;
  api.showSpots = on => { spotGroup.visible = on; };
  api.showSites = on => siteLabels.forEach(s => s.l.visible = on);
  api.focusSite = i => { const s = siteLabels[i]; if (s) flyTo(new THREE.Vector3(s.x+8, 9, s.z+11), new THREE.Vector3(s.x, 0, s.z)); };
  api.playActivation = done => { api.setView("vall"); if (reduced){ applyAct(T_END); anim.t = T_END; done && done(); return; } anim.playing = true; anim.t = 0; anim.done = done; ctlV.enabled = false; };
  api.finishActivation = () => { applyAct(T_END); anim.t = T_END; if (anim.playing){ anim.playing = false; ctlV.enabled = view === "vall"; const d = anim.done; anim.done = null; d && d(); } };
  api.isPlaying = () => anim.playing;
  api.admit = admit; api.free = free;
  api.resetAll = () => { act.visible = false; anim.playing = false; while (patients.children.length) patients.remove(patients.children[0]); Object.keys(used).forEach(k => used[k] = 0); pTweens.length = 0; carriers.forEach(c => hs.remove(c)); carriers.clear(); buildQueue();
    resetRec(); workGroup.visible = false; fly = null; anim.done = null;
    Object.values(spotObjs).forEach(o => { o.found = false; o.icon.material.map = spotTex(o.h.n, false); o.icon.material.needsUpdate = true; o.pillar.material.color.setHex(0xff7a2a); o.ring.material.color.setHex(0xff7a2a); o.name.visible = false; }); };
  api.setMotion = r => { reduced = r; setRain(); };
  api.setEra = setEra; api.build = build; api.markWork = markWork;
  api.showWorks = on => { workGroup.visible = on; };
  api.focusWork = id => { const b = B[id]; if (b && b.fly && view === "vall") flyTo(new THREE.Vector3(b.fly[0]+8, 9, b.fly[2]+11), new THREE.Vector3(b.fly[0], b.fly[1], b.fly[2])); };
  api.overview = () => { if (view === "vall") flyTo(new THREE.Vector3(30, 30, 44), new THREE.Vector3(-1, 0, 0), 1.6); };
  api.setPaused = p => { paused = p; };
  api.setLabels = on => { showLabels = on; placeLabels.visible = on; syncRecLabels(); };
  api.zoom = k => { const c = view === "vall" ? camera : hcam, ctl = view === "vall" ? ctlV : ctlH; const dir = c.position.clone().sub(ctl.target); const L = clamp(dir.length() * (k > 0 ? .8 : 1.25), ctl.minDistance, ctl.maxDistance); c.position.copy(ctl.target).add(dir.setLength(L)); };
  api.resetCam = () => { const H0 = view === "vall" ? HOME_V : HOME_H; flyTo(H0.p.clone(), H0.t.clone()); };
  api.viewHospitalFromValley = () => flyTo(new THREE.Vector3(4, 14, 22), new THREE.Vector3(-7, 0, 4));
  return api;
}
