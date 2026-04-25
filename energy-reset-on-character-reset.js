(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const MAX_ENERGY = 3;

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

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

  function getRoundToken() {
    const flow = window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
    return flow ? `${flow.roundNumber}:${flow.currentCamp}` : "free";
  }

  function resetCurrentCharacterEnergy() {
    const id = currentId();
    if (!id) return;

    writeJson(PREFIX + "energy:" + id, {
      current: MAX_ENERGY,
      max: MAX_ENERGY
    });

    writeJson(PREFIX + "turn-actions:" + id, {
      token: getRoundToken(),
      used: {}
    });

    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", {
      detail: {
        charId: id,
        current: MAX_ENERGY,
        max: MAX_ENERGY
      }
    }));
  }

  function init() {
    const resetBtn = document.querySelector("#resetBtn");
    if (!resetBtn || resetBtn.dataset.energyResetBound === "1") return;

    resetBtn.dataset.energyResetBound = "1";
    resetBtn.addEventListener("click", () => {
      resetCurrentCharacterEnergy();
      setTimeout(resetCurrentCharacterEnergy, 60);
      setTimeout(resetCurrentCharacterEnergy, 180);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
