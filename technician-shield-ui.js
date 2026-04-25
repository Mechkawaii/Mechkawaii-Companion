(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwTechnicianShieldUiStyles";
  let cachedChars = null;

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function textOf(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.fr || value.en || "";
  }

  function getName(char) {
    return textOf(char?.name, getLang()) || char?.id || "?";
  }

  function getClass(char) {
    return textOf(char?.class, getLang()) || "";
  }

  function getPortrait(char) {
    return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png";
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    return cachedChars;
  }

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentCamp(chars) {
    const id = new URL(location.href).searchParams.get("id");
    return chars.find(c => c.id === id)?.camp || null;
  }

  function getEligibleChars(chars) {
    const draftIds = getDraftIds();
    const camp = getCurrentCamp(chars);
    return chars.filter(char => {
      if (draftIds && !draftIds.includes(char.id)) return false;
      if (camp && (char.camp || "mechkawaii") !== camp) return false;
      return true;
    });
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-tech-shield-target {
        width: 100% !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        text-align: left !important;
        padding: 11px !important;
        margin: 8px 0 !important;
        border-radius: 15px !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        background: rgba(255,255,255,.065) !important;
        color: #fff !important;
        cursor: pointer !important;
        box-shadow: none !important;
      }

      .mkw-tech-shield-target:hover {
        background: rgba(80,150,255,.12) !important;
        border-color: rgba(80,150,255,.52) !important;
      }

      .mkw-tech-shield-portrait {
        width: 48px !important;
        height: 48px !important;
        object-fit: contain !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.08) !important;
        flex: 0 0 auto !important;
        padding: 4px !important;
      }

      .mkw-tech-shield-info {
        flex: 1 !important;
        min-width: 0 !important;
      }

      .mkw-tech-shield-name {
        font-weight: 950 !important;
        color: #fff !important;
        line-height: 1.15 !important;
      }

      .mkw-tech-shield-class {
        font-size: 12px !important;
        color: rgba(255,255,255,.62) !important;
        margin-top: 2px !important;
        line-height: 1.2 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function looksLikeModalButton(button) {
    if (!button || button.dataset.techShieldUi === "1") return false;
    if (button.classList.contains("mkw-protect-target")) return false;
    if (button.closest("#mkwCompanionMenuPanel")) return false;
    if (button.closest("#mkwHistoryPanel")) return false;
    if (button.closest("#mkwEnergyCard")) return false;
    if (button.closest("#unitTabsContainer")) return false;

    const text = normalize(button.textContent || "");
    if (!text || text.includes("annuler") || text.includes("cancel") || text.includes("retirer") || text.includes("remove")) return false;

    const dialogLike = button.closest("[role='dialog'], dialog, .modal, .backdrop, [class*='modal'], [class*='backdrop']");
    const fixedParent = button.closest("div") && getComputedStyle(button.closest("div")).position === "fixed";
    return !!dialogLike || !!fixedParent;
  }

  function findCharForButton(button, chars) {
    const raw = normalize(button.textContent || "");
    if (!raw) return null;
    return chars.find(char => {
      const name = normalize(getName(char));
      return name && raw.includes(name);
    }) || null;
  }

  function enhanceButton(button, char) {
    button.dataset.techShieldUi = "1";
    button.classList.add("mkw-tech-shield-target");
    button.innerHTML = `
      <img class="mkw-tech-shield-portrait" src="${getPortrait(char)}" alt="">
      <div class="mkw-tech-shield-info">
        <div class="mkw-tech-shield-name">${getName(char)}</div>
        <div class="mkw-tech-shield-class">${getClass(char)}</div>
      </div>
    `;
  }

  async function enhanceExistingModals() {
    ensureStyles();
    const chars = getEligibleChars(await loadChars());
    if (!chars.length) return;

    Array.from(document.querySelectorAll("button")).forEach(button => {
      if (!looksLikeModalButton(button)) return;
      const char = findCharForButton(button, chars);
      if (!char) return;
      enhanceButton(button, char);
    });
  }

  function init() {
    ensureStyles();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mkwTimer);
      observer._mkwTimer = setTimeout(enhanceExistingModals, 30);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(enhanceExistingModals, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
