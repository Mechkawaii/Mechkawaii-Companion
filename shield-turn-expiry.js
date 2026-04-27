(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const CLASSIC_POOL_KEY = PREFIX + "shields";
  const CLASSIC_META_KEY = PREFIX + "shield-expiry-meta";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";

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

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
  }

  function getToken(flow = getFlow()) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function getCamp(flow = getFlow()) {
    return flow?.currentCamp || window.__currentCharacter?.camp || "mechkawaii";
  }

  function dispatchShieldUpdate(charId) {
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId } }));
  }

  function normalizeClassicMeta() {
    const flow = getFlow();
    const token = getToken(flow);
    const camp = getCamp(flow);
    const assignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    const meta = readJson(CLASSIC_META_KEY, {});
    let changed = false;

    Object.keys(meta).forEach(index => {
      if (!Object.prototype.hasOwnProperty.call(assignments, index)) {
        delete meta[index];
        changed = true;
      }
    });

    Object.keys(assignments).forEach(index => {
      if (!meta[index]) {
        meta[index] = {
          targetId: assignments[index],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      } else if (meta[index].targetId !== assignments[index]) {
        meta[index] = {
          targetId: assignments[index],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      }
    });

    if (changed) writeJson(CLASSIC_META_KEY, meta);
  }

  function normalizeBlueMeta() {
    const flow = getFlow();
    const token = getToken(flow);
    const camp = getCamp(flow);
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    let changed = false;

    Object.keys(meta).forEach(techId => {
      if (!Object.prototype.hasOwnProperty.call(byTech, techId)) {
        delete meta[techId];
        changed = true;
      }
    });

    Object.keys(byTech).forEach(techId => {
      if (!meta[techId]) {
        meta[techId] = {
          targetId: byTech[techId],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      } else if (meta[techId].targetId !== byTech[techId]) {
        meta[techId] = {
          targetId: byTech[techId],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      }
    });

    if (changed) writeJson(BLUE_META_KEY, meta);
  }

  function expireClassicShields() {
    const flow = getFlow();
    if (!flow?.started) return [];

    const token = getToken(flow);
    const camp = getCamp(flow);
    const assignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    const shields = readJson(CLASSIC_POOL_KEY, [true, true, true]);
    const meta = readJson(CLASSIC_META_KEY, {});
    const expiredTargets = [];
    let changed = false;

    Object.keys(assignments).forEach(index => {
      const info = meta[index];
      if (!info) return;
      const shouldExpire = info.expireOnCamp === camp && info.placedToken !== token;
      if (!shouldExpire) return;

      const targetId = assignments[index] || info.targetId;
      delete assignments[index];
      delete meta[index];

      const idx = Number(index);
      if (Array.isArray(shields) && Number.isInteger(idx) && idx >= 0 && idx < shields.length) {
        shields[idx] = true;
      }

      if (targetId) expiredTargets.push(targetId);
      changed = true;
    });

    if (changed) {
      writeJson(CLASSIC_ASSIGNMENTS_KEY, assignments);
      writeJson(CLASSIC_META_KEY, meta);
      if (Array.isArray(shields)) writeJson(CLASSIC_POOL_KEY, shields);
    }

    return expiredTargets;
  }

  function expireBlueShields() {
    const flow = getFlow();
    if (!flow?.started) return [];

    const token = getToken(flow);
    const camp = getCamp(flow);
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    const expiredTargets = [];
    let changed = false;

    Object.keys(byTech).forEach(techId => {
      const info = meta[techId];
      if (!info) return;
      const shouldExpire = info.expireOnCamp === camp && info.placedToken !== token;
      if (!shouldExpire) return;

      const targetId = byTech[techId] || info.targetId;
      delete byTech[techId];
      delete meta[techId];

      if (targetId) expiredTargets.push(targetId);
      changed = true;
    });

    if (changed) {
      writeJson(BLUE_BY_TECH_KEY, byTech);
      writeJson(BLUE_META_KEY, meta);
    }

    return expiredTargets;
  }

  function syncShieldExpiry() {
    normalizeClassicMeta();
    normalizeBlueMeta();

    const expired = [
      ...expireClassicShields(),
      ...expireBlueShields()
    ];

    if (expired.length) {
      Array.from(new Set(expired)).forEach(dispatchShieldUpdate);
      window.dispatchEvent(new CustomEvent("mechkawaii:shields-expired", {
        detail: { charIds: Array.from(new Set(expired)) }
      }));
    }
  }

  function delayedSync() {
    setTimeout(syncShieldExpiry, 0);
    setTimeout(syncShieldExpiry, 80);
    setTimeout(syncShieldExpiry, 220);
  }

  function init() {
    delayedSync();
    window.addEventListener("mechkawaii:shield-updated", delayedSync);
    window.addEventListener("mechkawaii:technician-shield-applied", delayedSync);
    window.addEventListener("mechkawaii:turn-start", delayedSync);
    window.addEventListener("mechkawaii:game-flow-updated", delayedSync);
    window.addEventListener("pageshow", delayedSync);
    window.addEventListener("storage", delayedSync);
  }

  window.mkwSyncShieldExpiry = syncShieldExpiry;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
