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

  function ensureLayoutStyles() {
    if (document.getElementById("mkwBreadcrumbMenuLayoutStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwBreadcrumbMenuLayoutStyles";
    style.textContent = `
      #mkw-char-nav-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 0 0 12px 0;
        width: 100%;
      }

      #mkw-char-nav-row #mkw-breadcrumb-char {
        flex: 1 1 auto;
        min-width: 0;
        margin: 0 !important;
        display: flex;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }

      #mkw-char-nav-row #mkw-breadcrumb-char::-webkit-scrollbar {
        display: none;
      }

      #mkw-char-menu-slot {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }

      @media (max-width: 520px) {
        #mkw-char-nav-row {
          gap: 8px;
          margin-bottom: 10px;
        }

        #mkw-char-nav-row #mkw-breadcrumb-char {
          gap: 6px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function inject() {
    ensureLayoutStyles();

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

    const row = document.createElement("div");
    row.id = "mkw-char-nav-row";

    const bc = document.createElement("nav");
    bc.id = "mkw-breadcrumb-char";

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

    const sep1 = document.createElement("span");
    sep1.className = "bc-sep";
    sep1.textContent = ">";

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

    const sep2 = document.createElement("span");
    sep2.className = "bc-sep";
    sep2.textContent = ">";

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

    const sep3 = document.createElement("span");
    sep3.className = "bc-sep";
    sep3.textContent = ">";

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

    const menuSlot = document.createElement("div");
    menuSlot.id = "mkw-char-menu-slot";

    row.appendChild(bc);
    row.appendChild(menuSlot);

    // Insérer avant la topbar, pour avoir le cheminement au-dessus du nom de l'unité
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      topbar.parentNode.insertBefore(row, topbar);
    } else {
      const hpCard = document.getElementById("hpCard");
      if (hpCard) hpCard.parentNode.insertBefore(row, hpCard);
    }

    window.dispatchEvent(new CustomEvent("mechkawaii:nav-row-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
