/* =========================================================
   MECHKAWAII — Fil d'ariane page Terrain (breadcrumb-terrain.js)
   À inclure dans index.html après app.js :
   <script src="./breadcrumb-terrain.js" defer></script>
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function injectBreadcrumb() {
    const terrainPage = document.getElementById("terrainPage");
    if (!terrainPage) return;

    // Déjà injecté ?
    if (terrainPage.querySelector("#mkw-breadcrumb-terrain")) return;

    const lang = getLang();

    // Créer le fil
    const bc = document.createElement("nav");
    bc.id = "mkw-breadcrumb-terrain";

    // Accueil (cliquable)
    const homeBtn = document.createElement("button");
    homeBtn.className = "bc-step bc-done";
    homeBtn.textContent = lang === "en" ? "Home" : "Accueil";
    homeBtn.addEventListener("click", () => {
      terrainPage.classList.add("hidden");
      const splash = document.getElementById("splash");
      if (splash) splash.style.display = "block";
      document.documentElement.classList.remove("splash-dismissed");
    });

    // Séparateur
    const sep = document.createElement("span");
    sep.className = "bc-sep";
    sep.textContent = ">";

    // Terrain (courant)
    const terrainLabel = document.createElement("button");
    terrainLabel.className = "bc-step bc-current";
    terrainLabel.textContent = lang === "en" ? "Terrain" : "Terrain";
    terrainLabel.disabled = true;

    bc.appendChild(homeBtn);
    bc.appendChild(sep);
    bc.appendChild(terrainLabel);

    // Masquer l'ancien bouton retour
    const backBtn = document.getElementById("terrainBackBtn");
    if (backBtn) backBtn.style.display = "none";

    // Insérer après la topbar de la page terrain
    const topbar = terrainPage.querySelector(".topbar");
    if (topbar?.nextSibling) {
      topbar.parentNode.insertBefore(bc, topbar.nextSibling);
    } else {
      terrainPage.querySelector(".container")?.prepend(bc);
    }
  }

  // Observer l'ouverture de la page terrain
  const observer = new MutationObserver(() => {
    const terrainPage = document.getElementById("terrainPage");
    if (terrainPage && !terrainPage.classList.contains("hidden")) {
      injectBreadcrumb();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const terrainPage = document.getElementById("terrainPage");
    if (terrainPage) {
      observer.observe(terrainPage, { attributes: true, attributeFilter: ["class"] });
    }
  });
})();
