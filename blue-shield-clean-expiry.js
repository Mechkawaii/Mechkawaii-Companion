(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const BLUE_LOCK_PREFIX = PREFIX + "blue-shield-turn-lock:";
  const TURN_ACTION_PREFIX = PREFIX + "turn-actions:";
  const PENDING_TARGETS_KEY = PREFIX + "pending-blue-shield-expiry-targets";

  const SHIELD_CLASSES = [
    "has-shield",
    "is-shielded",
    "shielded",
    "mkw-tab-shielded",
    "mkw-tab-shield-pulse"
  ];

  let lastToken = null;
  let isExpiring = false;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(FLOW_KEY, null);
  }

  function getTurnToken(flow = getFlow()) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function getCurrentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getClassicShieldedIds() {
    return new Set(Object.values(readJson(CLASSIC_ASSIGNMENTS_KEY, {})).filter(Boolean));
  }

  function getBlueData() {
    return {
      byTech: readJson(BLUE_BY_TECH_KEY, {}),
      meta: readJson(BLUE_META_KEY, {})
    };
  }

  function getBlueTargets(byTech, meta) {
    return Array.from(new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item?.targetId).filter(Boolean)
    ]));
  }

  function getLiveBlueTargets() {
    const { byTech, meta } = getBlueData();
    return getBlueTargets(byTech, meta);
  }

  function rememberPendingTargets() {
    const targets = getLiveBlueTargets();
    if (targets.length) writeJson(PENDING_TARGETS_KEY, targets);
    return targets;
  }

  function readPendingTargets() {
    return readJson(PENDING_TARGETS_KEY, []);
  }

  function clearPendingTargets() {
    localStorage.removeItem(PENDING_TARGETS_KEY);
  }

  function stripClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function removeBlueVisuals(targets) {
    const classic = getClassicShieldedIds();
    const currentId = getCurrentCharId();
    const uniqueTargets = Array.from(new Set((targets || []).filter(Boolean)));

    if (currentId && uniqueTargets.includes(currentId) && !classic.has(currentId)) {
      [
        "#hpCard",
        "#charPortrait",
        ".topbar",
        ".hp-shields-wrapper",
        ".hp-section",
        ".shields-section"
      ].forEach(selector => stripClasses(document.querySelector(selector)));

      document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
        if (!el.closest?.("#unitTabs")) stripClasses(el);
      });
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const id = tab.dataset.charId;
      if (uniqueTargets.includes(id) && !classic.has(id)) stripClasses(tab);
    });
  }

  function clearExpiredBlueLocks(currentToken) {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(BLUE_LOCK_PREFIX)) return;
      const value = readJson(key, null);
      if (!value || value.token !== currentToken) localStorage.removeItem(key);
    });
  }

  function resetCurrentTechActionUi() {
    const currentId = getCurrentCharId();
    const currentToken = getTurnToken();

    if (currentId) {
      const actionKey = TURN_ACTION_PREFIX + currentId;
      const actionState = readJson(actionKey, null);
      if (actionState && actionState.token !== currentToken) localStorage.removeItem(actionKey);
    }

    document.querySelectorAll(".mkw-tech-blue-shield-disabled, .mkw-energy-disabled-action").forEach(el => {
      el.classList.remove("mkw-tech-blue-shield-disabled", "mkw-energy-disabled-action");
      el.removeAttribute("aria-disabled");
      if (el.dataset) el.dataset.techShieldDisabled = "0";
    });

    const classCard = document.querySelector("#classActionTitle")?.closest(".card");
    classCard?.classList.remove("mkw-tech-class-action-disabled");

    const switchLabel = classCard?.querySelector(".mkw-energy-switch");
    switchLabel?.classList.remove("is-disabled", "mkw-tech-class-action-disabled");
    switchLabel?.removeAttribute("aria-disabled");

    const input = switchLabel?.querySelector("input");
    if (input) {
      input.checked = false;
      input.disabled = false;
    }
  }

  function shouldExpireBlue(currentToken, previousToken, byTech, meta) {
    if (!Object.keys(byTech || {}).length && !Object.keys(meta || {}).length) return false;

    if (previousToken && previousToken !== currentToken) return true;

    return Object.values(meta || {}).some(item => item?.placedToken && item.placedToken !== currentToken);
  }

  function expireBlueShields(reason, forcedTargets = []) {
    if (isExpiring) return;

    const currentToken = getTurnToken();
    const { byTech, meta } = getBlueData();
    const liveTargets = getBlueTargets(byTech, meta);
    const pendingTargets = readPendingTargets();
    const targets = Array.from(new Set([...forcedTargets, ...liveTargets, ...pendingTargets].filter(Boolean)));

    if (!targets.length && !Object.keys(byTech || {}).length && !Object.keys(meta || {}).length) return;

    isExpiring = true;

    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    clearExpiredBlueLocks(currentToken);
    resetCurrentTechActionUi();

    [0, 20, 60, 120, 240, 360, 600].forEach(delay => {
      setTimeout(() => {
        writeJson(BLUE_BY_TECH_KEY, {});
        writeJson(BLUE_META_KEY, {});
        removeBlueVisuals(targets);
        resetCurrentTechActionUi();
        targets.forEach(charId => {
          window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
            detail: { charId, type: "technician", expired: true, reason }
          }));
        });
      }, delay);
    });

    setTimeout(() => {
      clearPendingTargets();
      isExpiring = false;
    }, 700);
  }

  function sync(reason = "sync") {
    const currentToken = getTurnToken();
    const previousToken = lastToken;
    const { byTech, meta } = getBlueData();

    if (lastToken === null) {
      lastToken = currentToken;
      return;
    }

    if (shouldExpireBlue(currentToken, previousToken, byTech, meta)) {
      lastToken = currentToken;
      expireBlueShields(reason);
      return;
    }

    lastToken = currentToken;
  }

  function isOpponentTurnEndButton(target) {
    const button = target?.closest?.("button, a, [role='button']");
    return !!button?.closest?.("#mkwTurnTransitionBackdrop") && button.matches(".mkw-turn-transition-button");
  }

  function scheduleAfterOpponentTurnClick(targets) {
    [0, 30, 90, 180, 360, 600].forEach(delay => {
      setTimeout(() => expireBlueShields("opponent-turn-ended", targets), delay);
    });
  }

  function init() {
    lastToken = getTurnToken();

    document.addEventListener("pointerdown", event => {
      if (!isOpponentTurnEndButton(event.target)) return;
      rememberPendingTargets();
    }, true);

    document.addEventListener("click", event => {
      if (!isOpponentTurnEndButton(event.target)) return;
      const targets = rememberPendingTargets();
      scheduleAfterOpponentTurnClick(targets);
    }, true);

    window.addEventListener("mechkawaii:game-flow-updated", () => sync("game-flow-updated"));
    window.addEventListener("mechkawaii:turn-start", () => sync("turn-start"));
    window.addEventListener("pageshow", () => sync("pageshow"));

    setInterval(() => sync("watchdog"), 150);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
