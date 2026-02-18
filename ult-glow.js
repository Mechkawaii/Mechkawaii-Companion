/* =========================================================
   MECHKAWAII — Coup Unique glow (ult-glow.js)
   ========================================================= */

(function () {
  "use strict";

  function init() {
    const container = document.getElementById("ultToggleContainer");
    if (!container) return;

    // Ajouter un id sur le card parent pour le CSS
    const card = container.closest(".card");
    if (!card) return;
    card.id = "ultCard";

    function syncGlow() {
      const sw = container.querySelector(".switch");
      if (!sw) return;
      const isUsed = sw.classList.contains("on");
      card.classList.toggle("ult-used", isUsed);
    }

    const observer = new MutationObserver(syncGlow);
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ["class"] });

    setTimeout(syncGlow, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
