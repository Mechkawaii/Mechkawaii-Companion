(function () {
  "use strict";

  const STYLE_ID = "mkwShieldModalSkinStyles";
  const PREFIX = "mechkawaii:";
  let lastShieldSnapshot = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-shield-modal-skin {
        width: min(460px, calc(100vw - 36px)) !important;
        max-height: 82vh !important;
        overflow: auto !important;
        background: linear-gradient(180deg,#1a1a24,#101018) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 22px 55px rgba(0,0,0,.58) !important;
        padding: 16px !important;
      }

      .mkw-shield-modal-skin h1,
      .mkw-shield-modal-skin h2,
      .mkw-shield-modal-skin h3,
      .mkw-shield-modal-skin [class*="title"] {
        color: #fff !important;
        font-weight: 950 !important;
      }

      .mkw-shield-help {
        color: rgba(255,255,255,.72) !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        margin: 6px 0 14px 0 !important;
      }

      .mkw-shield-modal-skin p,
      .mkw-shield-modal-skin .small,
      .mkw-shield-modal-skin [class*="subtitle"] {
        color: rgba(255,255,255,.72) !important;
      }

      .mkw-shield-modal-skin button:not(.mkw-shield-card) {
        border-radius: 15px !important;
        border-color: rgba(255,255,255,.16) !important;
        font-weight: 900 !important;
      }

      .mkw-shield-modal-skin button:hover {
        border-color: rgba(255,210,77,.45) !important;
      }

      .mkw-shield-card {
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

      .mkw-shield-card:hover {
        background: rgba(255,255,255,.1) !important;
        border-color: rgba(255,210,77,.45) !important;
      }

      .mkw-shield-card-icon {
        width: 48px !important;
        height: 48px !important;
        object-fit: contain !important;
        border-radius: 12px !important;
        background: rgba(255,255,255,.08) !important;
        flex: 0 0 auto !important;
        padding: 6px !important;
      }

      .mkw-shield-card-info {
        flex: 1 !important;
        min-width: 0 !important;
      }

      .mkw-shield-card-name {
        font-weight: 950 !important;
        color: #fff !important;
      }

      .mkw-shield-card-class {
        font-size: 12px !important;
        color: rgba(255,255,255,.62) !important;
        margin-top: 2px !important;
      }

      .mkw-shield-card-value {
        font-weight: 950 !important;
        color: #ffd24d !important;
        white-space: nowrap !important;
      }

      .mkw-shield-modal-skin .shield-remove-btn,
      .mkw-shield-modal-skin .btn-danger,
      .mkw-shield-modal-skin button[data-action="remove"],
      .mkw-shield-modal-skin button[data-action="delete"] {
        width: 100% !important;
        margin-top: 12px !important;
        padding: 12px !important;
        border-radius: 15px !important;
        border-color: rgba(255,105,120,.55) !important;
        background: rgba(255,80,100,.12) !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function getState(id) {
    return readJson(PREFIX + "state:" + id, null);
  }

  function getHpCur(char) {
    const state = getState(char.id);
    const max = Number(char?.hp?.max ?? 0);
    if (!state) return max;
    if (typeof state.hp === "number") return Math.max(0, Math.min(Number(state.hp), max));
    if (state.hp && typeof state.hp === "object") return Math.max(0, Math.min(Number(state.hp.cur ?? max), max));
    return max;
  }

  function getName(char, lang) {
    const n = char?.name;
    if (!n) return char?.id || "?";
    return typeof n === "string" ? n : (n[lang] || n.fr || char.id);
  }

  function getClass(char, lang) {
    const c = char?.class;
    if (!c) return "";
    return typeof c === "string" ? c : (c[lang] || c.fr || "");
  }

  function getPortrait(char) {
    return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png";
  }

  async function loadChars() {
    if (Array.isArray(window.__cachedChars)) return window.__cachedChars;
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    const chars = await res.json();
    window.__cachedChars = chars;
    return chars;
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").toLowerCase();
  }

  function isShieldText(el) {
    const txt = textOf(el);
    return txt.includes("bouclier") || txt.includes("shield");
  }

  function isCancelButton(btn) {
    const txt = textOf(btn).trim();
    return txt === "annuler" || txt === "cancel" || txt.includes("annuler") || txt.includes("cancel");
  }

  function rememberShieldButton(btn) {
    if (!btn) return;
    lastShieldSnapshot = {
      btn,
      className: btn.className,
      active: btn.dataset.active,
      backgroundImage: btn.style.backgroundImage,
      backgroundColor: btn.style.backgroundColor,
      opacity: btn.style.opacity,
      filter: btn.style.filter
    };
  }

  function restoreShieldButton() {
    const snap = lastShieldSnapshot;
    if (!snap || !snap.btn || !document.body.contains(snap.btn)) return;

    snap.btn.className = snap.className;

    if (snap.active === undefined) delete snap.btn.dataset.active;
    else snap.btn.dataset.active = snap.active;

    snap.btn.style.backgroundImage = snap.backgroundImage || "";
    snap.btn.style.backgroundColor = snap.backgroundColor || "";
    snap.btn.style.opacity = snap.opacity || "";
    snap.btn.style.filter = snap.filter || "";
  }

  function installShieldClickMemory() {
    if (document.documentElement.dataset.mkwShieldClickMemory === "1") return;
    document.documentElement.dataset.mkwShieldClickMemory = "1";

    document.addEventListener("click", event => {
      const btn = event.target.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button");
      if (!btn) return;
      rememberShieldButton(btn);
    }, true);
  }

  function choosePanel(root) {
    if (!root || root.nodeType !== 1) return null;

    const all = [root, ...Array.from(root.querySelectorAll("div, section, article, dialog"))];
    const shieldNodes = all.filter(el => isShieldText(el) && el.querySelector("button"));
    if (!shieldNodes.length) return null;

    return shieldNodes.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    })[0];
  }

  function installCancelRestore(panel) {
    panel.querySelectorAll("button").forEach(btn => {
      if (!isCancelButton(btn) || btn.dataset.mkwShieldCancelRestore === "1") return;
      btn.dataset.mkwShieldCancelRestore = "1";
      btn.addEventListener("click", () => {
        setTimeout(restoreShieldButton, 0);
        setTimeout(restoreShieldButton, 80);
      }, true);
    });
  }

  async function decorateShieldButtons(panel) {
    if (panel.dataset.mkwShieldDecorated === "1") return;
    panel.dataset.mkwShieldDecorated = "1";

    const buttons = Array.from(panel.querySelectorAll("button")).filter(btn => !isCancelButton(btn));
    if (!buttons.length) return;

    const lang = getLang();
    const chars = await loadChars().catch(() => []);
    const unused = chars.slice();

    buttons.forEach(btn => {
      if (btn.classList.contains("shield-remove-btn") || btn.classList.contains("btn-danger")) return;
      const txt = textOf(btn);
      const char = unused.find(c => txt.includes(getName(c, lang).toLowerCase()) || txt.includes(String(c.id).toLowerCase()));
      const picked = char || unused.shift();
      if (!picked) return;
      const foundIndex = unused.indexOf(picked);
      if (foundIndex >= 0) unused.splice(foundIndex, 1);

      const max = Number(picked?.hp?.max ?? 0);
      const cur = getHpCur(picked);
      btn.classList.add("mkw-shield-card");
      btn.innerHTML = `
        <img class="mkw-shield-card-icon" src="${getPortrait(picked)}" alt="">
        <div class="mkw-shield-card-info">
          <div class="mkw-shield-card-name">${getName(picked, lang)}</div>
          <div class="mkw-shield-card-class">${getClass(picked, lang)}</div>
        </div>
        <div class="mkw-shield-card-value">${cur}/${max}</div>
      `;
    });
  }

  function ensureHelpText(panel) {
    if (panel.querySelector(".mkw-shield-help")) return;
    const lang = getLang();
    const title = Array.from(panel.querySelectorAll("h1,h2,h3,[class*='title']")).find(Boolean);
    const help = document.createElement("div");
    help.className = "mkw-shield-help";
    help.textContent = lang === "fr"
      ? "Choisis une unité alliée : elle reçoit un bouclier de protection."
      : "Choose an allied unit: it receives a protective shield.";

    if (title && title.parentNode === panel) title.insertAdjacentElement("afterend", help);
    else panel.insertBefore(help, panel.firstChild);
  }

  function skin(root) {
    ensureStyles();
    installShieldClickMemory();

    const panel = choosePanel(root);
    if (!panel) return;

    panel.classList.add("mkw-shield-modal-skin");
    ensureHelpText(panel);
    decorateShieldButtons(panel);
    installCancelRestore(panel);
  }

  function scan() {
    skin(document.body);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node && node.nodeType === 1) skin(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();