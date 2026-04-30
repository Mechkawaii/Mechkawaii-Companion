(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const BLUE_KEYS = [
    PREFIX + "blue-shield-by-tech",
    PREFIX + "blue-shield-expiry-meta",
    "blue-shield-by-tech",
    "blue-shield-expiry-meta"
  ];
  const LOCK_PREFIXES = [
    PREFIX + "blue-shield-turn-lock:",
    "blue-shield-turn-lock:"
  ];
  const SHIELD_CLASSES = ["has-shield", "is-shielded", "shielded", "mkw-tab-shielded", "mkw-tab-shield-pulse"];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function currentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function classicShieldedIds() {
    return new Set(Object.values(readJson(PREFIX + "shield-assignments", {})).filter(Boolean));
  }

  function blueTargets() {
    const targets = [];
    [PREFIX + "blue-shield-by-tech", "blue-shield-by-tech"].forEach(key => {
      const map = readJson(key, {});
      Object.values(map || {}).forEach(value => { if (value) targets.push(value); });
    });
    [PREFIX + "blue-shield-expiry-meta", "blue-shield-expiry-meta"].forEach(key => {
      const meta = readJson(key, {});
      Object.values(meta || {}).forEach(info => { if (info && info.targetId) targets.push(info.targetId); });
    });
    return Array.from(new Set(targets));
  }

  function removeShieldClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function clearBlueStorage() {
    BLUE_KEYS.forEach(key => localStorage.removeItem(key));
    Object.keys(localStorage).forEach(key => {
      if (LOCK_PREFIXES.some(prefix => key.startsWith(prefix))) localStorage.removeItem(key);
    });
  }

  function clearBlueVisuals(targets) {
    const classic = classicShieldedIds();
    const current = currentCharId();
    const targetSet = new Set(targets || []);
    const hasTargets = targetSet.size > 0;

    if (current && !classic.has(current) && (!hasTargets || targetSet.has(current))) {
      ["#hpCard", "#charPortrait", ".topbar", ".hp-shields-wrapper", ".hp-section", ".shields-section"].forEach(selector => {
        removeShieldClasses(document.querySelector(selector));
      });
      document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
        if (!el.closest || !el.closest("#unitTabs")) removeShieldClasses(el);
      });
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const id = tab.dataset.charId;
      if (!classic.has(id) && (!hasTargets || targetSet.has(id))) removeShieldClasses(tab);
    });
  }

  function purgeBlueShield(reason) {
    const targets = blueTargets();
    if (!targets.length && !localStorage.getItem(PREFIX + "blue-shield-by-tech") && !localStorage.getItem("blue-shield-by-tech")) return;

    clearBlueStorage();
    clearBlueVisuals(targets);

    window.dispatchEvent(new CustomEvent("mechkawaii:blue-shields-cleared", {
      detail: { charIds: targets, reason }
    }));
    targets.forEach(charId => {
      window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
        detail: { charId, type: "technician", expired: true, reason }
      }));
    });
  }

  function isTurnEndTarget(target) {
    const button = target && target.closest ? target.closest("button, a, [role='button']") : null;
    if (!button) return false;
    if (button.matches(".mkw-end-turn")) return true;
    return !!button.closest("#mkwTurnTransitionBackdrop") && button.matches(".mkw-turn-transition-button");
  }

  function init() {
    document.addEventListener("pointerdown", event => {
      if (isTurnEndTarget(event.target)) purgeBlueShield("turn-ended");
    }, true);
    document.addEventListener("click", event => {
      if (isTurnEndTarget(event.target)) purgeBlueShield("turn-ended");
    }, true);

    window.mkwPurgeBlueShieldBeforeTurn = purgeBlueShield;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
