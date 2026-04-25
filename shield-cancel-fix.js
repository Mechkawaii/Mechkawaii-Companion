(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwProtectModalStyles";
  const SHIELD_ON = "./assets/icons/shield_on.svg";

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function getCurrentCharId() {
    return new URL(location.href).searchParams.get("id");
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

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentTeam(chars) {
    const currentId = getCurrentCharId();
    const current = chars.find(c => c.id === currentId);
    if (!current) return [];
    const camp = current.camp || "mechkawaii";
    const draftIds = getDraftIds();
    return chars.filter(c => {
      if ((c.camp || "mechkawaii") !== camp) return false;
      if (draftIds && !draftIds.includes(c.id)) return false;
      return true;
    }).slice(0, 3);
  }

  function getSharedShields() {
    return readJson(PREFIX + "shields", [true, true, true]);
  }

  function setSharedShields(shields) {
    writeJson(PREFIX + "shields", shields);
  }

  function getShieldAssignments() {
    return readJson(PREFIX + "shield-assignments", {});
  }

  function setShieldAssignments(assignments) {
    writeJson(PREFIX + "shield-assignments", assignments);
  }

  function getBlueShieldByTech() {
    return readJson(PREFIX + "blue-shield-by-tech", {});
  }

  function setBlueShieldByTech(map) {
    writeJson(PREFIX + "blue-shield-by-tech", map);
  }

  function setShieldGlow(targetId, enabled) {
    if (!targetId || targetId !== getCurrentCharId()) return;
    [qs("#hpCard"), qs("#charPortrait"), qs(".topbar")].forEach(el => {
      if (!el) return;
      el.classList.toggle("has-shield", enabled);
      el.classList.toggle("is-shielded", enabled);
      el.classList.toggle("shielded", enabled);
    });
  }

  function assignShield(index, targetCharId, btn) {
    const shields = getSharedShields();
    const assignments = getShieldAssignments();
    const blueMap = getBlueShieldByTech();

    shields[index] = false;
    assignments[index] = targetCharId;
    blueMap["shared-shield-" + index] = targetCharId;

    setSharedShields(shields);
    setShieldAssignments(assignments);
    setBlueShieldByTech(blueMap);

    if (btn) {
      btn.dataset.active = "false";
      btn.style.display = "none";
    }

    setShieldGlow(targetCharId, true);
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId: targetCharId } }));
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-protect-backdrop {
        position: fixed;
        inset: 0;
        z-index: 5200;
        background: rgba(0,0,0,.68);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }

      .mkw-protect-panel {
        width: min(460px, 100%);
        max-height: 82vh;
        overflow: auto;
        background: linear-gradient(180deg,#1a1a24,#101018);
        color: #fff;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 20px;
        box-shadow: 0 22px 55px rgba(0,0,0,.58);
        padding: 16px;
      }

      .mkw-protect-title {
        font-weight: 950;
        font-size: 19px;
        margin-bottom: 6px;
      }

      .mkw-protect-help {
        color: rgba(255,255,255,.72);
        font-size: 13px;
        line-height: 1.35;
        margin-bottom: 14px;
      }

      .mkw-protect-target {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        padding: 11px;
        margin: 8px 0;
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.065);
        color: #fff;
        cursor: pointer;
        box-shadow: none;
      }

      .mkw-protect-target:hover {
        background: rgba(255,255,255,.1);
        border-color: rgba(255,210,77,.45);
      }

      .mkw-protect-portrait {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: 12px;
        background: rgba(255,255,255,.08);
        flex: 0 0 auto;
        padding: 4px;
      }

      .mkw-protect-info {
        flex: 1;
        min-width: 0;
      }

      .mkw-protect-name {
        font-weight: 950;
        color: #fff;
      }

      .mkw-protect-class {
        font-size: 12px;
        color: rgba(255,255,255,.62);
        margin-top: 2px;
      }

      .mkw-protect-value {
        font-weight: 950;
        color: #ffd24d;
        white-space: nowrap;
      }

      .mkw-protect-cancel {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.08);
        color: #fff;
        font-weight: 900;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function getShieldButton(el) {
    return el.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button");
  }

  function isShieldButton(el) {
    return !!(el && el.closest && getShieldButton(el));
  }

  function getShieldIndex(btn) {
    const buttons = qsa("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button");
    return Math.max(0, buttons.indexOf(btn));
  }

  function resetClickedShield(btn) {
    if (!btn) return;
    btn.dataset.active = "true";
    btn.style.display = "";
    btn.style.backgroundImage = btn.style.backgroundImage || `url('${SHIELD_ON}')`;
  }

  async function openProtectModal(index, btn) {
    ensureStyles();
    resetClickedShield(btn);

    const chars = await loadChars();
    const team = getCurrentTeam(chars);

    const backdrop = document.createElement("div");
    backdrop.className = "mkw-protect-backdrop";

    const panel = document.createElement("div");
    panel.className = "mkw-protect-panel";
    panel.innerHTML = `
      <div class="mkw-protect-title">Se protéger</div>
      <div class="mkw-protect-help">Applique un bouclier à un allié ou à soi-même.</div>
    `;

    team.forEach(char => {
      const max = Number(char?.hp?.max ?? 0);
      const cur = getHpCur(char);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mkw-protect-target";
      row.innerHTML = `
        <img class="mkw-protect-portrait" src="${getPortrait(char)}" alt="">
        <div class="mkw-protect-info">
          <div class="mkw-protect-name">${getName(char, getLang())}</div>
          <div class="mkw-protect-class">${getClass(char, getLang())}</div>
        </div>
        <div class="mkw-protect-value">${cur}/${max}</div>
      `;
      row.addEventListener("click", () => {
        assignShield(index, char.id, btn);
        backdrop.remove();
      });
      panel.appendChild(row);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mkw-protect-cancel";
    cancel.textContent = "Annuler";
    cancel.addEventListener("click", () => {
      resetClickedShield(btn);
      backdrop.remove();
    });

    panel.appendChild(cancel);
    backdrop.appendChild(panel);
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        resetClickedShield(btn);
        backdrop.remove();
      }
    });
    document.body.appendChild(backdrop);
  }

  function init() {
    document.addEventListener("click", event => {
      if (!isShieldButton(event.target)) return;

      const btn = getShieldButton(event.target);
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (btn.dataset.active === "false" || btn.style.display === "none") return;

      openProtectModal(getShieldIndex(btn), btn);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();