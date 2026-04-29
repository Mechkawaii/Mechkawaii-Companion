(function () {
  "use strict";

  let reloadScheduled = false;

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function isOpponentTurnModalButton(button) {
    return !!button?.closest?.("#mkwTurnTransitionBackdrop");
  }

  function isPlayerEndTurnButton(target) {
    const button = target?.closest?.("button, a, [role='button']");
    if (!button) return false;

    // Do not refresh when the opponent-turn modal is clicked: this modal must stay visible.
    if (isOpponentTurnModalButton(button)) return false;

    if (button.matches(".mkw-end-turn")) return true;

    const text = normalizeText(button.textContent);
    return text.includes("fin de tour") || text.includes("end turn");
  }

  function scheduleReload() {
    if (reloadScheduled) return;
    reloadScheduled = true;

    // Leave enough time for game-flow.js to save the new state and display the opponent-turn modal.
    // The page then reloads on that opponent-turn state, so the modal is visible again after refresh.
    setTimeout(() => {
      location.reload();
    }, 1200);
  }

  function init() {
    document.addEventListener("click", event => {
      if (isPlayerEndTurnButton(event.target)) scheduleReload();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
