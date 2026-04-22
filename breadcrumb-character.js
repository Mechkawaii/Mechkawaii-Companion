/* =========================================================
   MECHKAWAII — Fil d'ariane page personnage (breadcrumb-character.js)
   À inclure dans character.html après app.js :
   <script src="./breadcrumb-character.js" defer></script>
   (breadcrumb.css est déjà partagé)
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function inject() {
    // Masquer le bouton retour existant
    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.style.display = "none";

    // Déjà injecté ?
    if (document.getElementById("mkw-breadcrumb-char")) return;

    const lang = getLang();
    const clear = window.mkwClearStorage || function (opts = {}) {
      if (opts.setup) localStorage.removeItem(PREFIX + "setup");
      if (opts.draft) localStorage.removeItem(PREFIX + "draft");
      if (opts.oppDraft) localStorage.removeItem(PREFIX + "opp-draft");
      if (opts.splash) localStorage.removeItem(PREFIX + "splashDismissed");
    };

    const bc = document.createElement("nav");
    bc.id = "mkw-breadcrumb-char";
    bc.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:12px;";

    // Accueil
    const homeBtn = document.createElement("button");
    homeBtn.className = "bc-step bc-done";
    homeBtn.textContent = lang === "en" ? "Home" : "Accueil";
    homeBtn.addEventListener("click", () => {
      clear({
        setup: true,
        draft: true,
        oppDraft: true,
        shared: true,
        cu: true,
        states: true,
        splash: true
      });
      location.href = "./index.html";
    });

    // Séparateur
    const sep1 = document.createElement("span");
    sep1.className = "bc-sep";
    sep1.textContent = ">";

    // Configuration
    const setupBtn = document.createElement("button");
    setupBtn.className = "bc-step bc-done";
    setupBtn.textContent = lang === "en" ? "Setup" : "Configuration";
    setupBtn.addEventListener("click", () => {
      clear({
        setup: true,
        draft: true,
        oppDraft: true,
        shared: true
      });
      location.href = "./index.html";
    });

    // Séparateur
    const sep2 = document.createElement("span");
    sep2.className = "bc-sep";
    sep2.textContent = ">";

    // Unités
    const unitsBtn = document.createElement("button");
    unitsBtn.className = "bc-step bc-done";
    unitsBtn.textContent = lang === "en" ? "Units" : "Unités";
    unitsBtn.addEventListener("click", () => {
      clear({
        draft: true,
        oppDraft: true
      });
      location.href = "./index.html";
    });

    // Séparateur
    const sep3 = document.createElement("span");
    sep3.className = "bc-sep";
    sep3.textContent = ">";

    // Gestion (courant)
    const gestionBtn = document.createElement("button");
    gestionBtn.className = "bc-step bc-current";
    gestionBtn.textContent = lang === "en" ? "Game" : "Gestion";
    gestionBtn.disabled = true;

    bc.appendChild(homeBtn);
    bc.appendChild(sep1);
    bc.appendChild(setupBtn);
    bc.appendChild(sep2);
    bc.appendChild(unitsBtn);
    bc.appendChild(sep3);
    bc.appendChild(gestionBtn);

    // Insérer avant #hpCard (premier élément après la topbar sur page-character)
    bc.style.marginTop = "14px";
    const hpCard = document.getElementById("hpCard");
    if (hpCard) {
      hpCard.parentNode.insertBefore(bc, hpCard);
    } else {
      const topbar = document.querySelector(".topbar");
      if (topbar?.nextSibling) {
        topbar.parentNode.insertBefore(bc, topbar.nextSibling);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
