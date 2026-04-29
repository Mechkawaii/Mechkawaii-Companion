(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
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

  function currentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function setShieldGlow(targetId, enabled) {
    if (!targetId || targetId !== currentCharId()) return;

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

  function getStillShieldedIds() {
    const classicAssignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    const blueByTech = readJson(BLUE_BY_TECH_KEY, {});
    return new Set([
      ...Object.values(classicAssignments).filter(Boolean),
      ...Object.values(blueByTech).filter(Boolean)
    ]);
  }

  function syncVisibleShieldState(expiredTargets = []) {
    const stillShielded = getStillShieldedIds();
    const currentId = currentCharId();

    expiredTargets.forEach(id => {
      if (!stillShielded.has(id)) setShieldGlow(id, false);
    });

    if (currentId && !stillShielded.has(currentId)) {
      setShieldGlow(currentId, false);
    }

    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      const isShielded = stillShielded.has(charId);
      tab.classList.toggle("mkw-tab-shielded", isShielded);
      if (!isShielded) tab.classList.remove("mkw-tab-shield-pulse");
    });
  }

  function dispatchBlueExpiry(expiredTargets) {
    const ids = Array.from(new Set(expiredTargets.filter(Boolean)));

    syncVisibleShieldState(ids);

    ids.forEach(id => {
      window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
        detail: { charId: id, type: "technician", expired: true }
      }));
    });

    if (ids.length) {
      window.dispatchEvent(new CustomEvent("mechkawaii:shields-expired", {
        detail: { charIds: ids, type: "technician" }
      }));
    }

    requestAnimationFrame(() => syncVisibleShieldState(ids));
    setTimeout(() => syncVisibleShieldState(ids), 80);
    setTimeout(() => syncVisibleShieldState(ids), 220);
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
    } else {
      syncVisibleShieldState();
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
