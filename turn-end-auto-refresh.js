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

  function isTurnEndButton(target) {
    const button = target?.closest?.("button, a, [role='button']");
    if (!button) return false;

    if (button.matches(".mkw-end-turn, .mkw-turn-transition-button")) return true;

    const text = normalizeText(button.textContent);
    return text.includes("fin de tour") ||
      text.includes("end turn") ||
      text.includes("est termine") ||
      text.includes("turn is finished");
  }

  function scheduleReload() {
    if (reloadScheduled) return;
    reloadScheduled = true;

    // Let game-flow.js finish saving the new turn state before refreshing the character sheet.
    setTimeout(() => {
      location.reload();
    }, 350);
  }

  function init() {
    document.addEventListener("click", event => {
      if (isTurnEndButton(event.target)) scheduleReload();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
