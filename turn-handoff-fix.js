(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const STYLE_ID = "mkwTurnHandoffFixStyle";

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

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function opponent(camp) {
    return camp === "mechkawaii" ? "prodrome" : "mechkawaii";
  }

  function getState() {
    return readJson(FLOW_KEY, null);
  }

  function setState(state) {
    writeJson(FLOW_KEY, state);
    window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: state }));
  }

  function advancePastOpponentTurn() {
    const state = getState();
    if (!state?.started) return null;

    const current = state.currentCamp;
    state.playedThisRound = state.playedThisRound || { mechkawaii: false, prodrome: false };
    state.playedThisRound[current] = true;

    const other = opponent(current);

    if (state.playedThisRound[other]) {
      state.roundNumber = Number(state.roundNumber || 1) + 1;
      state.playedThisRound = { mechkawaii: false, prodrome: false };
      state.currentCamp = state.firstCamp || "mechkawaii";
    } else {
      state.currentCamp = other;
    }

    setState(state);
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
    return state;
  }

  function closeTransition() {
    document.querySelector("#mkwTurnTransitionBackdrop")?.remove();
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[lang="fr"] .mkw-turn-transition-round,
      body .mkw-turn-transition-round {
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);
  }

  function fixFrenchRoundText(root = document) {
    if (getLang() !== "fr") return;

    root.querySelectorAll?.(".mkw-turn-transition-round").forEach(el => {
      el.textContent = el.textContent.replace(/^Round\b/i, "Tour");
    });

    const bannerTitle = root.querySelector?.(".mkw-turn-title");
    if (bannerTitle) bannerTitle.textContent = bannerTitle.textContent.replace(/^Round\b/i, "Tour");
  }

  function watchText() {
    const obs = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) fixFrenchRoundText(node);
        });
      });
      fixFrenchRoundText(document);
    });

    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => fixFrenchRoundText(document), 100);
    setTimeout(() => fixFrenchRoundText(document), 400);
  }

  function bindHandoffButton() {
    document.addEventListener("click", event => {
      const button = event.target.closest?.(".mkw-turn-transition-button");
      if (!button) return;

      const backdrop = button.closest("#mkwTurnTransitionBackdrop");
      if (!backdrop) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      closeTransition();
      advancePastOpponentTurn();
      setTimeout(() => fixFrenchRoundText(document), 50);
    }, true);
  }

  function init() {
    ensureStyles();
    bindHandoffButton();
    watchText();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
