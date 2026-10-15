/* Accés: correu @isvh.cat + contrasenya comuna (es compara la seva empremta SHA-256) */
(function(){
  "use strict";
  var PASS_SHA256 = "a017f2a772b109f4ab9073155516fd71797d3a1fc329f228f35fb087050f8eb8";
  var DOMAIN_RE = /^[a-z0-9._%+-]+@isvh\.cat$/;
  var SKEY = "hc-arnes-user";
  var login = document.getElementById("login"), app = document.getElementById("app");
  var form = document.getElementById("lgForm"), err = document.getElementById("lgErr");
  applyPrefs();
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function enter(user){
    login.hidden = true; app.hidden = false;
    document.getElementById("who").textContent = user;
    document.getElementById("logout").onclick = function(){ try { sessionStorage.removeItem(SKEY); } catch(e) {} if (window.speechSynthesis) speechSynthesis.cancel(); location.reload(); };
    initA11y();
    startApp(user);
  }
  var saved = null; try { saved = sessionStorage.getItem(SKEY); } catch(e) {}
  if (saved && DOMAIN_RE.test(saved)) { enter(saved); return; }
  document.getElementById("lgEmail").focus();
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var email = document.getElementById("lgEmail").value.trim().toLowerCase();
    var pass = document.getElementById("lgPass").value;
    if (!DOMAIN_RE.test(email)) { err.textContent = "Escriu el teu correu de l'institut. Ha d'acabar en @isvh.cat."; document.getElementById("lgEmail").focus(); return; }
    if (!window.crypto || !crypto.subtle) { err.textContent = "Aquest navegador no pot validar l'accés. Fes servir Chrome, Edge, Firefox o Safari actualitzats."; return; }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(pass)).then(function(buf){
      if (hex(buf) !== PASS_SHA256) { err.textContent = "La contrasenya no és correcta. Torna-ho a provar."; document.getElementById("lgPass").select(); return; }
      err.textContent = "";
      try { sessionStorage.setItem(SKEY, email); } catch(e) {}
      enter(email);
    });
  });
})();
