(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const BLUE_LOCK_PREFIX = PREFIX + "blue-shield-turn-lock:";
  const ACTION_PREFIX = PREFIX + "turn-actions:";
  const SHIELD_CLASSES = ["has-shield", "is-shielded", "shielded", "mkw-tab-shielded", "mkw-tab-shield-pulse"];

  let lastToken = null;
  let clearing = false;

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

  function flowState() {
    return window.mkwGetGameFlowState?.() || readJson(FLOW_KEY, null);
  }

  function tokenFor(flow = flowState()) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function currentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function classicShieldedIds() {
    return new Set(Object.values(readJson(CLASSIC_ASSIGNMENTS_KEY, {})).filter(Boolean));
  }

  function blueTargets() {
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    return Array.from(new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item?.targetId).filter(Boolean)
    ]));
  }

  function hasBlueShieldData() {
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    return Object.keys(byTech || {}).length > 0 || Object.keys(meta || {}).length > 0;
  }

  function strip(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function removeBlueVisuals(targets) {
    const classic = classicShieldedIds();
    const current = currentCharId();
    const shouldStripCurrent = current && (!targets.length || targets.includes(current)) && !classic.has(current);

    if (shouldStripCurrent) {
      [
        "#hpCard",
        "#charPortrait",
        ".topbar",
        ".hp-shields-wrapper",
        ".hp-section",
        ".shields-section"
      ].forEach(selector => strip(document.querySelector(selector)));

      document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
        if (!el.closest?.("#unitTabs")) strip(el);
      });
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const id = tab.dataset.charId;
      if ((!targets.length || targets.includes(id)) && !classic.has(id)) strip(tab);
    });
  }

  function clearBlueLocksForNewToken(currentToken) {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(BLUE_LOCK_PREFIX)) return;
      const state = readJson(key, null);
      if (!state || state.token !== currentToken) localStorage.removeItem(key);
    });
  }

  function clearBlueClassActionIfStale(currentToken) {
    const id = currentCharId();
    if (!id) return;
    const key = ACTION_PREFIX + id;
    const state = readJson(key, null);
    if (state && state.token !== currentToken) localStorage.removeItem(key);
  }

  function expireBlue(reason) {
    if (clearing) return;
    const targets = blueTargets();
    if (!targets.length && !hasBlueShieldData()) return;

    clearing = true;
    const currentToken = tokenFor();

    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    clearBlueLocksForNewToken(currentToken);
    clearBlueClassActionIfStale(currentToken);

    [0, 20, 60, 120, 240, 500, 900, 1400].forEach(delay => {
      setTimeout(() => {
        writeJson(BLUE_BY_TECH_KEY, {});
        writeJson(BLUE_META_KEY, {});
        removeBlueVisuals(targets);
        targets.forEach(charId => {
          window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
            detail: { charId, type: "technician", expired: true, reason }
          }));
        });
      }, delay);
    });

    setTimeout(() => { clearing = false; }, 1500);
  }

  function placedBlueTokenChanged(currentToken) {
    const meta = readJson(BLUE_META_KEY, {});
    return Object.values(meta || {}).some(item => item?.placedToken && item.placedToken !== currentToken);
  }

  function sync() {
    const currentToken = tokenFor();

    if (lastToken === null) {
      lastToken = currentToken;
      return;
    }

    if (currentToken !== lastToken) {
      lastToken = currentToken;
      expireBlue("turn-token-changed");
      return;
    }

    if (placedBlueTokenChanged(currentToken)) expireBlue("stale-blue-token");
    else if (!hasBlueShieldData()) removeBlueVisuals([]);
  }

  function init() {
    lastToken = tokenFor();
    setInterval(sync, 100);
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(sync, 0));
    window.addEventListener("mechkawaii:turn-start", () => setTimeout(sync, 0));
    window.addEventListener("pageshow", () => setTimeout(sync, 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
