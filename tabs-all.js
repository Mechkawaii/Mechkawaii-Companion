/* =========================================================
   MECHKAWAII — Onglets : affiche les 3 persos (tabs-all.js)
   Version robuste : se reconstruit même après reset
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function getCurrentCharId() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("id");
    } catch (_) { return null; }
  }

  async function getAllChars() {
    if (Array.isArray(window.__cachedChars) && window.__cachedChars.length) {
      return window.__cachedChars;
    }
    try {
      const res = await fetch("./data/characters.json", { cache: "no-store" });
      if (!res.ok) return [];
      const chars = await res.json();
      window.__cachedChars = chars;
      return chars;
    } catch (_) {
      return [];
    }
  }

  function renderTabs(currentCharId, allChars, lang) {
    const tabsContainer = document.querySelector("#unitTabs");
    const wrapper = document.querySelector(".unit-tabs-container");
    if (!tabsContainer || !wrapper) return;

    const setup = safeParse(localStorage.getItem(PREFIX + "setup"));
    const draft = safeParse(localStorage.getItem(PREFIX + "draft"));

    if (!Array.isArray(draft?.activeIds) || draft.activeIds.length === 0) {
      wrapper.classList.remove("visible");
      document.body.classList.remove("tabs-visible");
      tabsContainer.innerHTML = "";
      return;
    }

    let tabCharacters = allChars.filter(c => draft.activeIds.includes(c.id));

    if (setup?.mode === "multi") {
      const current = allChars.find(c => c.id === currentCharId);
      const camp = setup.camp || current?.camp;
      tabCharacters = tabCharacters.filter(c => (c.camp || "mechkawaii") === camp);
    }

    if (!tabCharacters.length) {
      wrapper.classList.remove("visible");
      document.body.classList.remove("tabs-visible");
      tabsContainer.innerHTML = "";
      return;
    }

    wrapper.classList.add("visible");
    document.body.classList.add("tabs-visible");
    tabsContainer.innerHTML = "";

    tabCharacters.forEach(char => {
      const tab = createCharacterTab(char, lang);
      if (char.id === currentCharId) tab.classList.add("active");
      tabsContainer.appendChild(tab);
    });
  }

  async function forceRender() {
    const currentCharId = getCurrentCharId();
    if (!currentCharId) return;

    const allChars = await getAllChars();
    if (!allChars.length) return;

    const lang = localStorage.getItem(PREFIX + "lang") || "fr";
    if (typeof createCharacterTab !== "function") return;

    renderTabs(currentCharId, allChars, lang);
  }

  function patchTabs() {
    if (typeof initUnitTabs === "function") {
      window.initUnitTabs = function (currentCharId, allChars, lang) {
        renderTabs(currentCharId, allChars, lang);
      };
    }

    // 🔥 reconstruction automatique
    forceRender();

    // 🔥 après reset bouton
    const resetBtn = document.querySelector("#resetBtn");
    if (resetBtn && !resetBtn.dataset.tabsFix) {
      resetBtn.dataset.tabsFix = "1";
      resetBtn.addEventListener("click", () => {
        setTimeout(forceRender, 0);
        setTimeout(forceRender, 50);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchTabs);
  } else {
    patchTabs();
  }

  window.addEventListener("pageshow", forceRender);
})();
