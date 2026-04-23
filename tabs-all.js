/* =========================================================
   MECHKAWAII — Onglets : affiche les 3 persos (tabs-all.js)
   Override de initUnitTabs pour inclure le perso courant.
   À inclure après app.js :
   <script src="./tabs-all.js" defer></script>
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  /* -------------------------------------------------------
     On réécrit initUnitTabs après que app.js l'a définie
  ------------------------------------------------------- */
  function patchTabs() {
    if (typeof initUnitTabs !== "function") return;

    window.initUnitTabs = function (currentCharId, allChars, lang) {
      const tabsContainer = document.querySelector("#unitTabs");
      const unitTabsWrapper = document.querySelector(".unit-tabs-container");
      if (!tabsContainer || !unitTabsWrapper) return;

      const setupRaw = localStorage.getItem(PREFIX + "setup");
      const draftRaw = localStorage.getItem(PREFIX + "draft");
      if (!setupRaw) return;

      const setup = JSON.parse(setupRaw);
      const draft = draftRaw ? JSON.parse(draftRaw) : null;

      let tabCharacters = [];

      if (setup.mode === "single") {
        if (Array.isArray(draft.activeIds) && draft.activeIds.length) {
          // ✅ Plus d'exclusion du perso courant
          tabCharacters = allChars.filter(c => draft.activeIds.includes(c.id));
        }
      } else {
        const currentCamp = setup.camp || "mechkawaii";
        if (Array.isArray(draft.activeIds) && draft.activeIds.length) {
          tabCharacters = allChars.filter(c =>
            draft.activeIds.includes(c.id) &&
            (c.camp || "mechkawaii") === currentCamp
          );
        }
      }

      if (tabCharacters.length === 0) {
        unitTabsWrapper.classList.remove("visible");
        document.body.classList.remove("tabs-visible");
        return;
      }

      unitTabsWrapper.classList.add("visible");
      document.body.classList.add("tabs-visible");

      tabsContainer.innerHTML = "";
      tabCharacters.forEach(char => {
        const tab = createCharacterTab(char, lang);
        // Marquer le perso courant comme actif
        if (char.id === currentCharId) {
          tab.classList.add("active");
        }
        tabsContainer.appendChild(tab);
      });
    };
  }

  // app.js définit initUnitTabs en dehors du DOMContentLoaded,
  // donc on peut l'écraser directement après le chargement du script
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchTabs);
  } else {
    patchTabs();
  }
})();
