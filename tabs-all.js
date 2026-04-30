/* =========================================================
   MECHKAWAII — Onglets : affiche les persos joués
   Version robuste : se reconstruit même si un autre script les vide
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const BACKUP_IDS_KEY = PREFIX + "tabs-active-ids";
  const BACKUP_SETUP_KEY = PREFIX + "tabs-setup-backup";
  let repairQueued = false;
  let pendingHpFeedback = null;

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function ensureTabFeedbackStyles() {
    if (document.getElementById("mkwTabFeedbackStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwTabFeedbackStyles";
    style.textContent = `
      @keyframes mkwTabHealGlow {
        0% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(70,255,145,0); }
        35% { transform: translateY(-3px) scale(1.04); box-shadow: 0 0 0 3px rgba(70,255,145,.30), 0 0 22px rgba(70,255,145,.85); }
        100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(70,255,145,0); }
      }
      @keyframes mkwTabHeartPulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(70,255,145,0)); }
        45% { transform: scale(1.32); filter: drop-shadow(0 0 9px rgba(70,255,145,.95)); }
      }
      .mkw-tab-heal-glow { animation: mkwTabHealGlow .9s ease-out both !important; }
      .mkw-tab-heart-pulse { animation: mkwTabHeartPulse .75s ease-out both !important; transform-origin:center; }
    `;
    document.head.appendChild(style);
  }

  function isCharacterPage() {
    return /character\.html$/i.test(window.location.pathname);
  }

  function getCurrentCharId() {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("id");
    } catch (_) {
      return null;
    }
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

  function rememberSetup() {
    if (!isCharacterPage()) return;
    const setup = safeParse(localStorage.getItem(PREFIX + "setup"));
    if (setup && typeof setup === "object") {
      localStorage.setItem(BACKUP_SETUP_KEY, JSON.stringify(setup));
    }
  }

  function restoreSessionFromBackup() {
    if (!isCharacterPage()) return;

    const draft = safeParse(localStorage.getItem(PREFIX + "draft"));
    const backupIds = safeParse(localStorage.getItem(BACKUP_IDS_KEY));
    if ((!Array.isArray(draft?.activeIds) || draft.activeIds.length === 0) && Array.isArray(backupIds) && backupIds.length > 0) {
      localStorage.setItem(PREFIX + "draft", JSON.stringify({ activeIds: backupIds }));
    }

    const setup = safeParse(localStorage.getItem(PREFIX + "setup"));
    const backupSetup = safeParse(localStorage.getItem(BACKUP_SETUP_KEY));
    if (!setup && backupSetup && typeof backupSetup === "object") {
      localStorage.setItem(PREFIX + "setup", JSON.stringify(backupSetup));
    }
  }

  function getActiveIds() {
    restoreSessionFromBackup();

    const draft = safeParse(localStorage.getItem(PREFIX + "draft"));
    if (Array.isArray(draft?.activeIds) && draft.activeIds.length > 0) {
      if (isCharacterPage()) {
        localStorage.setItem(BACKUP_IDS_KEY, JSON.stringify(draft.activeIds));
      }
      return draft.activeIds;
    }

    const backupIds = safeParse(localStorage.getItem(BACKUP_IDS_KEY));
    if (isCharacterPage() && Array.isArray(backupIds) && backupIds.length > 0) {
      return backupIds;
    }

    return [];
  }

  function shouldShowTabs() {
    return getActiveIds().length > 0;
  }

  function bindDirectNavigation(tab, charId) {
    if (!tab || !charId) return;

    tab.style.cursor = "pointer";
    tab.dataset.charId = charId;

    const goToChar = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      location.href = "character.html?id=" + encodeURIComponent(charId);
    };

    tab.onclick = goToChar;
    tab.addEventListener("click", goToChar);
    tab.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        goToChar(e);
      }
    });
  }

  function setFactionDataset(tab, char) {
    if (!tab || !char) return;
    const camp = char?.camp || "mechkawaii";
    tab.dataset.camp = camp === "prodrome" ? "prodrome" : "mechkawaii";
    tab.classList.remove("mkw-tab-shield-pulse");
  }

  function pulseTab(charId) {
    if (!charId) return;
    ensureTabFeedbackStyles();
    const tab = document.querySelector(`#unitTabs [data-char-id="${CSS.escape(charId)}"]`);
    if (!tab) return;

    tab.classList.remove("mkw-tab-heal-glow");
    void tab.offsetWidth;
    tab.classList.add("mkw-tab-heal-glow");
    setTimeout(() => tab.classList.remove("mkw-tab-heal-glow"), 950);

    const heart = tab.querySelector(".heart, img[src*='pv'], img[src*='heart']");
    if (heart) {
      heart.classList.remove("mkw-tab-heart-pulse");
      void heart.offsetWidth;
      heart.classList.add("mkw-tab-heart-pulse");
      setTimeout(() => heart.classList.remove("mkw-tab-heart-pulse"), 850);
    }
  }

  function renderTabs(currentCharId, allChars, lang) {
    const tabsContainer = document.querySelector("#unitTabs");
    const wrapper = document.querySelector(".unit-tabs-container");
    if (!tabsContainer || !wrapper) return;

    restoreSessionFromBackup();
    const setup = safeParse(localStorage.getItem(PREFIX + "setup"));
    const activeIds = getActiveIds();

    if (!activeIds.length) {
      wrapper.classList.remove("visible");
      document.body.classList.remove("tabs-visible");
      tabsContainer.innerHTML = "";
      return;
    }

    let tabCharacters = allChars.filter(c => activeIds.includes(c.id));

    if (setup?.mode === "multi") {
      const current = allChars.find(c => c.id === currentCharId);
      const camp = setup.camp || current?.camp;
      tabCharacters = tabCharacters.filter(c => (c.camp || "mechkawaii") === camp);
    }

    if (!tabCharacters.length) {
      const current = allChars.find(c => c.id === currentCharId);
      if (current) tabCharacters = [current];
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
      bindDirectNavigation(tab, char.id);
      setFactionDataset(tab, char);
      if (char.id === currentCharId) tab.classList.add("active");
      tabsContainer.appendChild(tab);
    });

    if (pendingHpFeedback) {
      const targetId = pendingHpFeedback;
      pendingHpFeedback = null;
      setTimeout(() => pulseTab(targetId), 40);
    }
  }

  async function forceRender() {
    if (!isCharacterPage()) return;

    const currentCharId = getCurrentCharId();
    if (!currentCharId) return;

    rememberSetup();
    restoreSessionFromBackup();

    const allChars = await getAllChars();
    if (!allChars.length) return;

    if (typeof createCharacterTab !== "function") return;

    const lang = localStorage.getItem(PREFIX + "lang") || "fr";
    renderTabs(currentCharId, allChars, lang);
  }

  function queueRepair() {
    if (!isCharacterPage()) return;
    if (repairQueued) return;
    repairQueued = true;
    requestAnimationFrame(() => {
      repairQueued = false;
      forceRender();
    });
  }

  function installObserver() {
    if (!isCharacterPage()) return;

    const tabsContainer = document.querySelector("#unitTabs");
    const wrapper = document.querySelector(".unit-tabs-container");
    if (!tabsContainer || !wrapper || tabsContainer.dataset.tabsObserverInstalled === "1") return;

    tabsContainer.dataset.tabsObserverInstalled = "1";

    const observer = new MutationObserver(() => {
      if (shouldShowTabs() && tabsContainer.children.length === 0) {
        queueRepair();
      }
      if (shouldShowTabs() && !wrapper.classList.contains("visible")) {
        queueRepair();
      }
    });

    observer.observe(tabsContainer, { childList: true });
    observer.observe(wrapper, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    setInterval(() => {
      if (shouldShowTabs() && tabsContainer.children.length === 0) {
        queueRepair();
      }
    }, 300);
  }

  function patchTabs() {
    if (!isCharacterPage()) return;

    ensureTabFeedbackStyles();
    rememberSetup();

    if (typeof initUnitTabs === "function") {
      window.initUnitTabs = function (currentCharId, allChars, lang) {
        rememberSetup();
        renderTabs(currentCharId, allChars, lang);
      };
    }

    forceRender();
    installObserver();

    const resetBtn = document.querySelector("#resetBtn");
    if (resetBtn && !resetBtn.dataset.tabsFix) {
      resetBtn.dataset.tabsFix = "1";
      resetBtn.addEventListener("click", () => {
        setTimeout(forceRender, 0);
        setTimeout(forceRender, 50);
        setTimeout(forceRender, 150);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchTabs);
  } else {
    patchTabs();
  }

  window.addEventListener("pageshow", forceRender);
  window.addEventListener("storage", queueRepair);
  window.addEventListener("mechkawaii:hp-updated", (event) => {
    pendingHpFeedback = event?.detail?.charId || null;
    setTimeout(forceRender, 0);
    setTimeout(forceRender, 80);
    setTimeout(forceRender, 180);
  });
  window.addEventListener("mechkawaii:shield-updated", forceRender);
  window.addEventListener("mechkawaii:game-flow-updated", forceRender);
})();
