(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const SHIELD_CLASSES = ["has-shield", "is-shielded", "shielded", "mkw-tab-shielded", "mkw-tab-shield-pulse"];
  const STYLE_ID = "mkwBlueShieldTurnEndClearStyles";
  const BODY_NO_BLUE_CLASS = "mkw-current-blue-shield-cleared";

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

  function currentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function classicShielded() {
    return new Set(Object.values(readJson(CLASSIC_ASSIGNMENTS_KEY, {})).filter(Boolean));
  }

  function blueTargets() {
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    return Array.from(new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item && item.targetId).filter(Boolean)
    ]));
  }

  function removeClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body.${BODY_NO_BLUE_CLASS} #hpCard,
      body.${BODY_NO_BLUE_CLASS} #charPortrait,
      body.${BODY_NO_BLUE_CLASS} .topbar,
      body.${BODY_NO_BLUE_CLASS} .hp-shields-wrapper,
      body.${BODY_NO_BLUE_CLASS} .hp-section,
      body.${BODY_NO_BLUE_CLASS} .shields-section {
        animation: none !important;
        filter: none !important;
      }

      body.${BODY_NO_BLUE_CLASS} #hpCard.has-shield,
      body.${BODY_NO_BLUE_CLASS} #hpCard.is-shielded,
      body.${BODY_NO_BLUE_CLASS} #hpCard.shielded,
      body.${BODY_NO_BLUE_CLASS} #charPortrait.has-shield,
      body.${BODY_NO_BLUE_CLASS} #charPortrait.is-shielded,
      body.${BODY_NO_BLUE_CLASS} #charPortrait.shielded,
      body.${BODY_NO_BLUE_CLASS} .topbar.has-shield,
      body.${BODY_NO_BLUE_CLASS} .topbar.is-shielded,
      body.${BODY_NO_BLUE_CLASS} .topbar.shielded {
        box-shadow: var(--shadow) !important;
        border-color: var(--border) !important;
      }

      body.${BODY_NO_BLUE_CLASS} #hpCard::before,
      body.${BODY_NO_BLUE_CLASS} #hpCard::after,
      body.${BODY_NO_BLUE_CLASS} #charPortrait::before,
      body.${BODY_NO_BLUE_CLASS} #charPortrait::after,
      body.${BODY_NO_BLUE_CLASS} .topbar::before,
      body.${BODY_NO_BLUE_CLASS} .topbar::after {
        content: none !important;
        display: none !important;
        animation: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function syncBodyNoBlueClass(targets) {
    const current = currentCharId();
    const classic = classicShielded();
    const targetSet = new Set(targets || []);
    const currentLostBlue = current && !classic.has(current) && (!targetSet.size || targetSet.has(current));
    document.body.classList.toggle(BODY_NO_BLUE_CLASS, !!currentLostBlue);
  }

  function removeVisuals(targets) {
    const classic = classicShielded();
    const current = currentCharId();
    const targetSet = new Set(targets || []);
    const hasTargets = targetSet.size > 0;

    if (current && !classic.has(current) && (!hasTargets || targetSet.has(current))) {
      ["#hpCard", "#charPortrait", ".topbar", ".hp-shields-wrapper", ".hp-section", ".shields-section"].forEach(selector => {
        removeClasses(document.querySelector(selector));
      });
      document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
        if (!el.closest || !el.closest("#unitTabs")) removeClasses(el);
      });
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const id = tab.dataset.charId;
      if (!classic.has(id) && (!hasTargets || targetSet.has(id))) removeClasses(tab);
    });

    syncBodyNoBlueClass(targets);
  }

  function clearBlue(targets, reason) {
    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX + "blue-shield-turn-lock:")) localStorage.removeItem(key);
    });

    removeVisuals(targets);

    window.dispatchEvent(new CustomEvent("mechkawaii:blue-shields-cleared", {
      detail: { charIds: targets, reason }
    }));

    targets.forEach(charId => {
      window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
        detail: { charId, type: "technician", expired: true, reason }
      }));
    });
  }

  function isOpponentTurnButton(target) {
    const button = target && target.closest ? target.closest("button, a, [role='button']") : null;
    return !!button && !!button.closest("#mkwTurnTransitionBackdrop") && button.matches(".mkw-turn-transition-button");
  }

  function clearOnOpponentTurnEnd() {
    const targets = blueTargets();
    if (!targets.length) return;
    [0, 40, 120, 260, 600, 1200].forEach(delay => {
      setTimeout(() => clearBlue(targets, "opponent-turn-ended"), delay);
    });
  }

  function init() {
    installStyle();

    window.addEventListener("mechkawaii:technician-shield-applied", () => {
      document.body.classList.remove(BODY_NO_BLUE_CLASS);
    });

    document.addEventListener("pointerdown", event => {
      if (isOpponentTurnButton(event.target)) clearOnOpponentTurnEnd();
    }, true);
    document.addEventListener("click", event => {
      if (isOpponentTurnButton(event.target)) clearOnOpponentTurnEnd();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
