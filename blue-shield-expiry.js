(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const LAST_TOKEN_KEY = PREFIX + "blue-shield-expiry-last-token";

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

  function tokenFor(flow) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function setShieldGlow(targetId, enabled) {
    const currentId = new URL(location.href).searchParams.get("id") || "";
    if (!targetId || targetId !== currentId) return;

    [
      document.querySelector("#hpCard"),
      document.querySelector("#charPortrait"),
      document.querySelector(".topbar")
    ].forEach(el => {
      if (!el) return;
      el.classList.toggle("has-shield", enabled);
      el.classList.toggle("is-shielded", enabled);
      el.classList.toggle("shielded", enabled);
    });
  }

  function dispatchBlueExpiry(expiredTargets) {
    const ids = Array.from(new Set(expiredTargets.filter(Boolean)));
    ids.forEach(id => {
      setShieldGlow(id, false);
      window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
        detail: { charId: id, type: "technician", expired: true }
      }));
    });

    if (ids.length) {
      window.dispatchEvent(new CustomEvent("mechkawaii:shields-expired", {
        detail: { charIds: ids, type: "technician" }
      }));
    }
  }

  function expireBlueShields() {
    const flow = getFlow();
    if (!flow?.started) return;

    const currentToken = tokenFor(flow);
    const previousToken = localStorage.getItem(LAST_TOKEN_KEY);
    const tokenChanged = !!previousToken && previousToken !== currentToken;

    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    const expiredTargets = [];
    let changed = false;

    Object.keys(byTech).forEach(techId => {
      const info = meta[techId];
      const targetId = byTech[techId] || info?.targetId;

      // Same behavior as the orange shields: once the turn token changes, the protection expires.
      // Metadata is still supported for old saves, but the decisive rule is the token change.
      const placedToken = info?.placedToken;
      const metaSaysExpired = !!placedToken && placedToken !== currentToken;
      const legacyExpired = !info && tokenChanged;

      if (!metaSaysExpired && !legacyExpired) return;

      delete byTech[techId];
      delete meta[techId];
      if (targetId) expiredTargets.push(targetId);
      changed = true;
    });

    if (changed) {
      writeJson(BLUE_BY_TECH_KEY, byTech);
      writeJson(BLUE_META_KEY, meta);
      dispatchBlueExpiry(expiredTargets);
    }

    localStorage.setItem(LAST_TOKEN_KEY, currentToken);
  }

  function scheduleExpiry() {
    setTimeout(expireBlueShields, 0);
    setTimeout(expireBlueShields, 80);
    setTimeout(expireBlueShields, 220);
    setTimeout(expireBlueShields, 600);
  }

  function init() {
    const flow = getFlow();
    if (flow?.started && !localStorage.getItem(LAST_TOKEN_KEY)) {
      localStorage.setItem(LAST_TOKEN_KEY, tokenFor(flow));
    }

    window.addEventListener("mechkawaii:game-flow-updated", scheduleExpiry);
    window.addEventListener("mechkawaii:turn-start", scheduleExpiry);
    window.addEventListener("mechkawaii:shield-updated", scheduleExpiry);
    window.addEventListener("storage", scheduleExpiry);
    window.addEventListener("pageshow", scheduleExpiry);
    scheduleExpiry();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
