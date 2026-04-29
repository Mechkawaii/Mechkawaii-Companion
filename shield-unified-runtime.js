(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const BLUE_LOCK_PREFIX = PREFIX + "blue-shield-turn-lock:";
  const TURN_ACTION_PREFIX = PREFIX + "turn-actions:";

  const SHIELD_CLASSES = ["has-shield", "is-shielded", "shielded", "mkw-tab-shielded", "mkw-tab-shield-pulse"];
  let cachedChars = null;
  let pendingBlueTargets = [];

  const MESSAGES = {
    fr: "Cette unité a déjà un bouclier.",
    en: "This unit already has a shield."
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
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
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    window.__cachedChars = cachedChars;
    return cachedChars;
  }

  async function getCurrentTeam() {
    const chars = await loadChars();
    const currentId = getCurrentCharId();
    const current = chars.find(char => char.id === currentId);
    if (!current) return [];

    const camp = current.camp || "mechkawaii";
    const draftIds = getDraftIds();

    return chars.filter(char => {
      if ((char.camp || "mechkawaii") !== camp) return false;
      if (draftIds && !draftIds.includes(char.id)) return false;
      return true;
    }).slice(0, 3);
  }

  function classicShieldedIds() {
    return Object.values(readJson(CLASSIC_ASSIGNMENTS_KEY, {})).filter(Boolean);
  }

  function blueShieldedIds() {
    return Object.values(readJson(BLUE_BY_TECH_KEY, {})).filter(Boolean);
  }

  function allShieldedIds() {
    return new Set([...classicShieldedIds(), ...blueShieldedIds()]);
  }

  function stripShieldClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function showToast(message) {
    const root = document.querySelector("#mkwToastRoot");
    if (root) {
      const el = document.createElement("div");
      el.className = "mkw-toast";
      el.textContent = message;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2300);
      return;
    }

    const toast = document.createElement("div");
    toast.className = "mkw-shield-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2100);
  }

  function dispatchShieldUpdate(charId, extra = {}) {
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
      detail: { charId, ...extra }
    }));
  }

  function isShielded(charId) {
    return !!charId && allShieldedIds().has(charId);
  }

  function blockShieldedTargetClick(event) {
    const row = event.target.closest?.(".mkw-protect-target, .mkw-tech-shield-target");
    if (!row) return;

    const charId = row.dataset.charId;
    if (!isShielded(charId)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showToast(MESSAGES[getLang()] || MESSAGES.fr);
  }

  async function tagShieldModalTargets(root = document) {
    const modal = root.querySelector?.(".mkw-protect-backdrop, .mkw-tech-shield-backdrop") ||
      document.querySelector(".mkw-protect-backdrop, .mkw-tech-shield-backdrop");
    if (!modal || modal.dataset.shieldTargetsTagged === "1") return;

    const rows = Array.from(modal.querySelectorAll(".mkw-protect-target, .mkw-tech-shield-target"));
    if (!rows.length) return;

    const team = await getCurrentTeam();
    const shielded = allShieldedIds();

    rows.forEach((row, index) => {
      const charId = team[index]?.id;
      if (!charId) return;

      row.dataset.charId = charId;
      const alreadyShielded = shielded.has(charId);
      row.classList.toggle("mkw-shield-target-disabled", alreadyShielded);
      row.toggleAttribute("aria-disabled", alreadyShielded);
      if (alreadyShielded) row.title = MESSAGES[getLang()] || MESSAGES.fr;
    });

    modal.dataset.shieldTargetsTagged = "1";
  }

  function getBlueTargets() {
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    return Array.from(new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item?.targetId).filter(Boolean)
    ]));
  }

  function clearBlueLocks() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(BLUE_LOCK_PREFIX)) localStorage.removeItem(key);
    });
  }

  function clearBlueClassActionIfStale() {
    const currentId = getCurrentCharId();
    if (!currentId) return;
    const key = TURN_ACTION_PREFIX + currentId;
    const state = readJson(key, null);
    const flow = window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
    const token = flow?.started ? `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}` : "free";
    if (state && state.token !== token) localStorage.removeItem(key);
  }

  function removeBlueVisuals(targets) {
    const classic = new Set(classicShieldedIds());
    const uniqueTargets = Array.from(new Set((targets || []).filter(Boolean)));
    const targetFilterIsKnown = uniqueTargets.length > 0;
    const currentId = getCurrentCharId();

    if (currentId && !classic.has(currentId) && (!targetFilterIsKnown || uniqueTargets.includes(currentId))) {
      ["#hpCard", "#charPortrait", ".topbar", ".hp-shields-wrapper", ".hp-section", ".shields-section"].forEach(selector => {
        stripShieldClasses(document.querySelector(selector));
      });

      document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
        if (!el.closest?.("#unitTabs")) stripShieldClasses(el);
      });
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      if (!classic.has(charId) && (!targetFilterIsKnown || uniqueTargets.includes(charId))) stripShieldClasses(tab);
    });
  }

  function expireBlueShields(reason = "turn-start") {
    const targets = Array.from(new Set([...pendingBlueTargets, ...getBlueTargets()].filter(Boolean)));

    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    clearBlueLocks();
    clearBlueClassActionIfStale();

    [0, 30, 90, 180, 360, 700].forEach(delay => {
      setTimeout(() => {
        writeJson(BLUE_BY_TECH_KEY, {});
        writeJson(BLUE_META_KEY, {});
        removeBlueVisuals(targets);
        if (targets.length) {
          targets.forEach(charId => dispatchShieldUpdate(charId, { type: "technician", expired: true, reason }));
        } else {
          dispatchShieldUpdate(null, { type: "technician", expired: true, reason });
        }
      }, delay);
    });

    pendingBlueTargets = [];
  }

  function isOpponentTurnEndButton(target) {
    const button = target?.closest?.("button, a, [role='button']");
    return !!button?.closest?.("#mkwTurnTransitionBackdrop") && button.matches(".mkw-turn-transition-button");
  }

  function installStyles() {
    if (document.getElementById("mkwUnifiedShieldRuntimeStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwUnifiedShieldRuntimeStyles";
    style.textContent = `
      .mkw-protect-target.mkw-shield-target-disabled,
      .mkw-tech-shield-target.mkw-shield-target-disabled {
        opacity: .46 !important;
        filter: grayscale(.75) !important;
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    installStyles();

    document.addEventListener("pointerdown", event => {
      if (!isOpponentTurnEndButton(event.target)) return;
      pendingBlueTargets = getBlueTargets();
    }, true);

    document.addEventListener("click", event => {
      blockShieldedTargetClick(event);
      if (event.defaultPrevented) return;
      if (isOpponentTurnEndButton(event.target)) expireBlueShields("opponent-turn-ended");
    }, true);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) tagShieldModalTargets(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mechkawaii:turn-start", () => expireBlueShields("turn-start"));
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(() => tagShieldModalTargets(), 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
