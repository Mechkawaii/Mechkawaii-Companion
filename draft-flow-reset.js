(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";

  function resetTurnFlow() {
    localStorage.removeItem(FLOW_KEY);
    localStorage.removeItem(PREFIX + "turn-flow-started");
  }

  function wrapConfirmDraftSelection() {
    if (typeof window.mkwConfirmDraftSelection !== "function") return false;
    if (window.mkwConfirmDraftSelection.__mkwFlowResetWrapped) return true;

    const original = window.mkwConfirmDraftSelection;
    const wrapped = function (...args) {
      resetTurnFlow();
      return original.apply(this, args);
    };
    wrapped.__mkwFlowResetWrapped = true;
    window.mkwConfirmDraftSelection = wrapped;
    return true;
  }

  function bindClickFallback() {
    document.addEventListener("click", event => {
      const btn = event.target.closest?.("#confirmDraft, #skipDraft, [data-confirm-draft], [data-skip-draft]");
      if (!btn) return;
      resetTurnFlow();
    }, true);
  }

  function init() {
    bindClickFallback();
    wrapConfirmDraftSelection();
    setTimeout(wrapConfirmDraftSelection, 100);
    setTimeout(wrapConfirmDraftSelection, 400);
    setTimeout(wrapConfirmDraftSelection, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
