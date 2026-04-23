/* =========================================================
   MECHKAWAII — Onglets : affiche les 3 persos (tabs-all.js)
   Override de initUnitTabs pour inclure le perso courant.
   À inclure après app.js :
   <script src="./tabs-all.js" defer></script>
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function safeParse(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  /* -------------------------------------------------------
     On réécrit initUnitTabs après que app.js l'a définie
  ------------------------------------------------------- */
  function patchTabs() {
    if (typeof initUnitTabs !== "function") return;

    window.initUnitTabs = function (currentCharId, allChars, lang) {
      const tabsContainer = document.querySelector("#unitTabs");
      const unitTabsWrapper = document.querySelector(".unit-tabs-container");
      if (!tabsContainer || !unitTabsWrapper) return;

      const setup = safeParse(localStorage.getItem(PREFIX + "setup"));
      const draft = safeParse(localStorage.getItem(PREFIX + "draft"));

      if (!Array.isArray(draft?.activeIds) || draft.activeIds.length === 0) {
        unitTabsWrapper.classList.remove("visible");
        document.body.classList.remove("tabs-visible");
        tabsContainer.innerHTML = "";
        return;
      }

      const currentChar = allChars.find(c => c.id === currentCharId);
      const currentCamp = currentChar?.camp || "mechkawaii";

      let tabCharacters = allChars.filter(c => draft.activeIds.includes(c.id));

      // Ne filtrer par camp qu'en mode multi si le setup est encore disponible.
      // Ainsi, un reset partiel n'efface plus les tabs sur la fiche personnage.
      if (setup?.mode === "multi") {
        const activeCamp = setup.camp || currentCamp;
        tabCharacters = tabCharacters.filter(c => (c.camp || "mechkawaii") === activeCamp);
      }

      if (tabCharacters.length === 0) {
        unitTabsWrapper.classList.remove("visible");
        document.body.classList.remove("tabs-visible");
        tabsContainer.innerHTML = "";
        return;
      }

      unitTabsWrapper.classList.add("visible");
      document.body.classList.add("tabs-visible");

      tabsContainer.innerHTML = "";
      tabCharacters.forEach(char => {
        const tab = createCharacterTab(char, lang);
        if (char.id === currentCharId) {
          tab.classList.add("active");
        }
        tabsContainer.appendChild(tab);
      });
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchTabs);
  } else {
    patchTabs();
  }
})();
