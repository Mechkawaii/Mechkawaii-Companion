(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const LAST_TOKEN_KEY = PREFIX + "blue-shield-expiry-last-token";
  let isSyncingVisuals = false;

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

  function removeShieldClasses(el) {
    if (!el) return;
    el.classList.remove("has-shield", "is-shielded", "shielded", "mkw-tab-shielded", "mkw-tab-shield-pulse");
  }

  function setShieldGlow(targetId, enabled) {
    if (!targetId || targetId !== currentCharId()) return;

    [
      document.querySelector("#hpCard"),
      document.querySelector("#charPortrait"),
      document.querySelector(".topbar"),
      document.querySelector(".hp-shields-wrapper"),
      document.querySelector(".hp-section"),
      document.querySelector(".shields-section")
    ].forEach(el => {
      if (!el) return;
      if (enabled) {
        el.classList.add("has-shield", "is-shielded", "shielded");
      } else {
        removeShieldClasses(el);
      }
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
    if (isSyncingVisuals) return;
    isSyncingVisuals = true;

    try {
      const stillShielded = getStillShieldedIds();
      const currentId = currentCharId();
      const currentIsShielded = currentId && stillShielded.has(currentId);

      document.body.classList.toggle("mkw-current-has-no-shield", !!currentId && !currentIsShielded);

      expiredTargets.forEach(id => {
        if (!stillShielded.has(id)) setShieldGlow(id, false);
      });

      if (currentId && !currentIsShielded) {
        setShieldGlow(currentId, false);
        document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
          if (!el.closest?.("#unitTabs")) removeShieldClasses(el);
        });
      }

      document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
        const charId = tab.dataset.charId;
        const isShielded = stillShielded.has(charId);
        tab.classList.toggle("mkw-tab-shielded", isShielded);
        if (!isShielded) tab.classList.remove("mkw-tab-shield-pulse");
      });
    } finally {
      isSyncingVisuals = false;
    }
  }

  function dispatchBlueExpiry(expiredTargets) {
    const ids = Array.from(new Set(expiredTargets.filter(Boolean)));

    syncVisibleShieldState(ids);

    ids.forEach(id => {
      window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
        detail: { charId: id, type: "technician", expired: true, immediate: true }
      }));
    });

    if (ids.length) {
      window.dispatchEvent(new CustomEvent("mechkawaii:shields-expired", {
        detail: { charIds: ids, type: "technician", immediate: true }
      }));
    }

    requestAnimationFrame(() => syncVisibleShieldState(ids));
    setTimeout(() => syncVisibleShieldState(ids), 40);
    setTimeout(() => syncVisibleShieldState(ids), 120);
    setTimeout(() => syncVisibleShieldState(ids), 260);
    setTimeout(() => syncVisibleShieldState(ids), 700);
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
    setTimeout(expireBlueShields, 40);
    setTimeout(expireBlueShields, 120);
    setTimeout(expireBlueShields, 260);
    setTimeout(expireBlueShields, 700);
  }

  function installVisualObserver() {
    if (document.body?.dataset.blueShieldVisualObserver === "1") return;
    if (!document.body) return;
    document.body.dataset.blueShieldVisualObserver = "1";

    const observer = new MutationObserver(() => {
      clearTimeout(installVisualObserver.timer);
      installVisualObserver.timer = setTimeout(syncVisibleShieldState, 10);
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  function init() {
    const flow = getFlow();
    if (flow?.started && !localStorage.getItem(LAST_TOKEN_KEY)) {
      localStorage.setItem(LAST_TOKEN_KEY, tokenFor(flow));
    }

    installVisualObserver();
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
