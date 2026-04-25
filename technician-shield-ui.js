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
      .mkw-tech-shield-modal {
        background: linear-gradient(180deg,#1a1a24,#101018) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 22px 55px rgba(0,0,0,.58) !important;
      }

      .mkw-tech-shield-modal * {
        color: inherit;
      }

      .mkw-tech-shield-modal h1,
      .mkw-tech-shield-modal h2,
      .mkw-tech-shield-modal h3,
      .mkw-tech-shield-modal strong,
      .mkw-tech-shield-modal b {
        color: #fff !important;
      }

      .mkw-tech-shield-modal p,
      .mkw-tech-shield-modal small,
      .mkw-tech-shield-modal .hint,
      .mkw-tech-shield-modal .subtitle {
        color: rgba(255,255,255,.72) !important;
      }

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
        min-height: 70px !important;
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

      .mkw-tech-shield-modal button:not(.mkw-tech-shield-target) {
        color: #fff !important;
        border-color: rgba(255,255,255,.18) !important;
        background: rgba(255,255,255,.08) !important;
        border-radius: 15px !important;
        font-weight: 900 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function excluded(el) {
    if (!el || el.dataset.techShieldUi === "1") return true;
    if (el.classList?.contains("mkw-protect-target")) return true;
    if (el.closest("#mkwCompanionMenuPanel")) return true;
    if (el.closest("#mkwHistoryPanel")) return true;
    if (el.closest("#mkwEnergyCard")) return true;
    if (el.closest("#unitTabsContainer")) return true;
    if (el.closest("#mkwTurnBanner")) return true;
    if (el.closest("#mkwFirstPlayerPanel")) return true;
    return false;
  }

  function isBadText(el) {
    const text = normalize(el.textContent || "");
    return !text || text.includes("annuler") || text.includes("cancel") || text.includes("retirer") || text.includes("remove") || text.includes("utiliser") || text.includes("use");
  }

  function findCharForElement(el, chars) {
    const raw = normalize(el.textContent || "");
    if (!raw) return null;
    return chars.find(char => {
      const name = normalize(getName(char));
      return name && raw.includes(name);
    }) || null;
  }

  function isClickableCandidate(el) {
    if (!el || excluded(el) || isBadText(el)) return false;
    if (el.matches("button, [role='button'], label, .toggle, .btn, .button, [onclick]")) return true;
    const cs = getComputedStyle(el);
    return cs.cursor === "pointer";
  }

  function getBestTarget(el) {
    if (!el) return null;
    return el.closest("button, [role='button'], label, .toggle, .btn, .button, [onclick]") || el;
  }

  function findModalRoot(el) {
    if (!el) return null;
    const explicit = el.closest("[role='dialog'], dialog, .modal, .backdrop, [class*='modal'], [class*='backdrop']");
    if (explicit) return explicit;

    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if ((cs.position === "fixed" || cs.position === "absolute") && rect.width > 240 && rect.height > 160) return node;
      node = node.parentElement;
    }
    return null;
  }

  function enhanceModalAround(el) {
    const modal = findModalRoot(el);
    if (!modal || modal.dataset.techShieldModal === "1") return;
    modal.dataset.techShieldModal = "1";
    modal.classList.add("mkw-tech-shield-modal");
  }

  function enhanceElement(el, char) {
    const target = getBestTarget(el);
    if (!target || excluded(target) || target.dataset.techShieldUi === "1") return;

    enhanceModalAround(target);

    target.dataset.techShieldUi = "1";
    target.classList.add("mkw-tech-shield-target");
    target.innerHTML = `
      <img class="mkw-tech-shield-portrait" src="${getPortrait(char)}" alt="">
      <div class="mkw-tech-shield-info">
        <div class="mkw-tech-shield-name">${getName(char)}</div>
        <div class="mkw-tech-shield-class">${getClass(char)}</div>
      </div>
    `;
  }

  function getPossibleTargets() {
    const selectors = [
      "button",
      "[role='button']",
      "label",
      ".toggle",
      ".btn",
      ".button",
      "[onclick]",
      "div",
      "li"
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  async function enhanceExistingModals() {
    ensureStyles();
    const chars = getEligibleChars(await loadChars());
    if (!chars.length) return;

    getPossibleTargets().forEach(el => {
      if (!isClickableCandidate(el)) return;
      const char = findCharForElement(el, chars);
      if (!char) return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 70 || rect.height < 22) return;

      enhanceElement(el, char);
    });
  }

  function init() {
    ensureStyles();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._mkwTimer);
      observer._mkwTimer = setTimeout(enhanceExistingModals, 20);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    document.addEventListener("click", () => {
      setTimeout(enhanceExistingModals, 20);
      setTimeout(enhanceExistingModals, 120);
      setTimeout(enhanceExistingModals, 300);
    }, true);
    setTimeout(enhanceExistingModals, 250);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
