(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const FLOW_KEY = PREFIX + "game-flow";
  const BLUE_TOKEN_KEY = PREFIX + "shield-state-sync-blue-token";

  const SHIELD_CLASSES = [
    "has-shield",
    "is-shielded",
    "shielded",
    "mkw-tab-shielded",
    "mkw-tab-shield-pulse"
  ];

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

  function getCurrentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getFlowToken() {
    const flow = window.mkwGetGameFlowState?.() || readJson(FLOW_KEY, null);
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
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

  function getBlueShieldedIds() {
    const { byTech, meta } = getBlueData();
    return new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item?.targetId).filter(Boolean)
    ]);
  }

  function clearBlueShields() {
    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX + "blue-shield-turn-lock:")) localStorage.removeItem(key);
    });
  }

  function expireBlueIfTurnChanged() {
    const blue = getBlueShieldedIds();
    if (!blue.size) {
      localStorage.setItem(BLUE_TOKEN_KEY, getFlowToken());
      return;
    }

    const currentToken = getFlowToken();
    const previousToken = localStorage.getItem(BLUE_TOKEN_KEY);

    if (!previousToken) {
      localStorage.setItem(BLUE_TOKEN_KEY, currentToken);
      return;
    }

    if (previousToken !== currentToken) {
      clearBlueShields();
      localStorage.setItem(BLUE_TOKEN_KEY, currentToken);
    }
  }

  function removeShieldClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function syncCurrentCharacter(allShielded) {
    const currentId = getCurrentCharId();
    if (!currentId || allShielded.has(currentId)) return;

    [
      "#hpCard",
      "#charPortrait",
      ".topbar",
      ".hp-shields-wrapper",
      ".hp-section",
      ".shields-section"
    ].forEach(selector => removeShieldClasses(document.querySelector(selector)));

    document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
      if (!el.closest?.("#unitTabs")) removeShieldClasses(el);
    });
  }

  function syncTabs(allShielded) {
    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      const shielded = allShielded.has(charId);
      tab.classList.toggle("mkw-tab-shielded", shielded);
      if (!shielded) tab.classList.remove("mkw-tab-shield-pulse");
    });
  }

  function syncShieldVisualState() {
    expireBlueIfTurnChanged();

    const classic = getClassicShieldedIds();
    const blue = getBlueShieldedIds();
    const allShielded = new Set([...classic, ...blue]);

    syncCurrentCharacter(allShielded);
    syncTabs(allShielded);
  }

  function init() {
    localStorage.setItem(BLUE_TOKEN_KEY, getFlowToken());

    window.mkwSyncShieldVisualState = syncShieldVisualState;
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("mechkawaii:turn-start", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("mechkawaii:shield-updated", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("pageshow", syncShieldVisualState);

    setInterval(syncShieldVisualState, 100);
    syncShieldVisualState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
