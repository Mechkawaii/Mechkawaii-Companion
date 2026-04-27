(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const MAX_ENERGY = 3;
  let cachedChars = null;
  let lastResetToken = null;

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

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
  }

  function getRoundToken(flow) {
    return flow ? `${flow.roundNumber}:${flow.currentCamp}` : "free";
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

  function getActiveIds() {
    const ids = new Set();
    const draft = readJson(PREFIX + "draft", null);
    const oppDraft = readJson(PREFIX + "opp-draft", null);

    if (Array.isArray(draft?.activeIds)) draft.activeIds.forEach(id => ids.add(id));
    if (Array.isArray(oppDraft?.activeIds)) oppDraft.activeIds.forEach(id => ids.add(id));

    return ids;
  }

  async function resetEnergyForActiveCamp(flow, options = {}) {
    flow = flow || getFlow();
    if (!flow?.started || !flow.currentCamp) return;

    const token = getRoundToken(flow);
    if (!options.force && lastResetToken === token) return;
    lastResetToken = token;

    const chars = await loadChars();
    const activeIds = getActiveIds();
    const currentCharId = currentId();
    let currentCharWasReset = false;

    chars.forEach(char => {
      if ((char.camp || "mechkawaii") !== flow.currentCamp) return;
      if (activeIds.size && !activeIds.has(char.id)) return;

      writeJson(PREFIX + "energy:" + char.id, {
        current: MAX_ENERGY,
        max: MAX_ENERGY
      });

      writeJson(PREFIX + "turn-actions:" + char.id, {
        token,
        used: {}
      });

      writeJson(PREFIX + "road-start:" + char.id, {
        token,
        enabled: false,
        used: false
      });

      if (char.id === currentCharId) currentCharWasReset = true;
    });

    if (currentCharWasReset) {
      window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", {
        detail: {
          charId: currentCharId,
          current: MAX_ENERGY,
          max: MAX_ENERGY
        }
      }));
    }

    window.dispatchEvent(new CustomEvent("mechkawaii:turn-energy-reset", {
      detail: {
        currentCamp: flow.currentCamp,
        roundNumber: flow.roundNumber,
        token
      }
    }));
  }

  function init() {
    window.mkwResetEnergyForActiveCamp = function (force = true) {
      return resetEnergyForActiveCamp(getFlow(), { force });
    };

    window.addEventListener("mechkawaii:game-flow-updated", event => {
      resetEnergyForActiveCamp(event.detail || getFlow(), { force: true });
    });

    window.addEventListener("mechkawaii:turn-start", event => {
      resetEnergyForActiveCamp(event.detail || getFlow(), { force: true });
    });

    document.addEventListener("click", event => {
      if (!event.target.closest?.(".mkw-end-turn")) return;
      setTimeout(() => resetEnergyForActiveCamp(getFlow(), { force: true }), 40);
      setTimeout(() => resetEnergyForActiveCamp(getFlow(), { force: true }), 180);
    }, true);

    setTimeout(() => resetEnergyForActiveCamp(getFlow(), { force: false }), 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
