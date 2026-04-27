(function () {
  "use strict";

  const STYLE_ID = "mkwTabsCornerPolishStyles";
  let cachedChars = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .unit-tabs-container,
      .unit-tabs {
        animation: none !important;
        transform: none !important;
      }

      .unit-tab {
        border-radius: var(--radius, 16px) !important;
        overflow: hidden !important;
        background-clip: padding-box !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        isolation: isolate !important;
        animation: none !important;
        transform: none;
        transition:
          border-color .16s ease,
          box-shadow .16s ease,
          filter .16s ease,
          opacity .16s ease,
          background-color .16s ease !important;
      }

      .unit-tab:not(.active) {
        border-color: var(--border) !important;
      }

      .unit-tab:hover {
        transform: translateY(-2px) !important;
      }

      .unit-tab[data-camp="mechkawaii"] {
        background-image: url("./assets/background_mechkawaii.png") !important;
      }

      .unit-tab[data-camp="prodrome"] {
        background-image: url("./assets/background_prodrome.png") !important;
      }

      .unit-tab:not(.active)::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        border-radius: inherit !important;
        pointer-events: none !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.035) !important;
        background: linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.18)) !important;
        animation: none !important;
        transform: none !important;
      }

      .unit-tab.active {
        border-radius: var(--radius, 16px) !important;
        overflow: hidden !important;
      }

      .unit-tab.active::before {
        border-radius: var(--radius, 16px) var(--radius, 16px) 0 0 !important;
        overflow: hidden !important;
      }

      .unit-tab.mkw-tab-shield-pulse {
        animation: none !important;
      }

      .unit-tab-visual {
        position: relative !important;
        z-index: 1 !important;
        width: 100% !important;
        height: 70% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-bottom: 8px !important;
        animation: none !important;
      }

      .unit-tab-visual img {
        display: block !important;
        margin: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        width: 50% !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        border-radius: 0 !important;
      }

      .unit-tab-info {
        position: relative !important;
        z-index: 1 !important;
        text-align: center !important;
        width: 100% !important;
      }

      .unit-tab-hp {
        position: absolute !important;
        z-index: 3 !important;
        top: 6px !important;
        right: 6px !important;
        left: auto !important;
        bottom: auto !important;
        transform: none !important;
        background: rgba(0, 0, 0, 0.8) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius-full, 999px) !important;
        animation: none !important;
      }

      .unit-tab-name,
      .unit-tab-role {
        color: #fff !important;
        text-shadow: 0 1px 8px rgba(0,0,0,.85), 0 0 10px rgba(0,0,0,.65) !important;
      }

      @supports (overflow: clip) {
        .unit-tab {
          overflow: clip !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    try {
      const res = await fetch("./data/characters.json", { cache: "no-store" });
      cachedChars = await res.json();
      return cachedChars;
    } catch (e) {
      return [];
    }
  }

  async function applyFactionBackgrounds() {
    ensureStyles();
    const chars = await loadChars();
    const byId = new Map(chars.map(char => [char.id, char]));

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const char = byId.get(tab.dataset.charId);
      const camp = char?.camp || "mechkawaii";
      tab.dataset.camp = camp === "prodrome" ? "prodrome" : "mechkawaii";
      tab.classList.remove("mkw-tab-shield-pulse");
    });
  }

  function scheduleApply() {
    clearTimeout(scheduleApply.timer);
    scheduleApply.timer = setTimeout(applyFactionBackgrounds, 40);
  }

  function init() {
    ensureStyles();
    applyFactionBackgrounds();
    [100, 250, 600, 1200, 2200].forEach(delay => setTimeout(applyFactionBackgrounds, delay));
    window.addEventListener("pageshow", scheduleApply);
    window.addEventListener("mechkawaii:hp-updated", scheduleApply);
    window.addEventListener("mechkawaii:shield-updated", scheduleApply);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleApply);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
