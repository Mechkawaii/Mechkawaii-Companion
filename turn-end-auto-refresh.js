(function () {
  "use strict";

  let reloadScheduled = false;

  function isOpponentTurnEndButton(target) {
    const button = target?.closest?.("button, a, [role='button']");
    if (!button) return false;

    // Only refresh after the user intentionally closes the opponent-turn modal.
    // The modal must never disappear by itself.
    return !!button.closest("#mkwTurnTransitionBackdrop") && button.matches(".mkw-turn-transition-button");
  }

  function scheduleReload() {
    if (reloadScheduled) return;
    reloadScheduled = true;

    // Let game-flow.js close the modal and save the next turn state first.
    setTimeout(() => {
      location.reload();
    }, 350);
  }

  function init() {
    document.addEventListener("click", event => {
      if (isOpponentTurnEndButton(event.target)) scheduleReload();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
