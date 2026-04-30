(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";

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

  function isEventRound(roundNumber) {
    const round = Number(roundNumber || 1);
    return round >= 5 && round % 5 === 0;
  }

  function skipEventRound() {
    const state = readJson(FLOW_KEY, null);
    if (!state || !state.started || !isEventRound(state.roundNumber)) return;

    const nextState = {
      ...state,
      roundNumber: Number(state.roundNumber || 1) + 1,
      currentCamp: state.firstCamp || state.currentCamp || "mechkawaii",
      playedThisRound: { mechkawaii: false, prodrome: false }
    };

    writeJson(FLOW_KEY, nextState);
    window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: nextState }));
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: nextState }));

    // game-flow.js ne ré-expose pas son renderBanner : reload léger pour afficher immédiatement le bon round.
    setTimeout(() => location.reload(), 90);
  }

  function init() {
    document.addEventListener("click", event => {
      if (!event.target.closest?.(".mkw-expert-modal-close")) return;
      skipEventRound();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
