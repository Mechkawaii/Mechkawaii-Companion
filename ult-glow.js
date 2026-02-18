/* =========================================================
   MECHKAWAII — Coup Unique glow (ult-glow.js)
   Illumine le card Coup Unique en orange quand activé.
   À inclure dans character.html après app.js :
   <script src="./ult-glow.js" defer></script>
   ========================================================= */

(function () {
  "use strict";

  function init() {
    const container = document.getElementById("ultToggleContainer");
    if (!container) return;

    // Trouver le card parent (.card) du ultToggleContainer
    const card = container.closest(".card");
    if (!card) return;

    function syncGlow() {
      const sw = container.querySelector(".switch");
      if (!sw) return;
      const isOn = sw.classList.contains("on");
      card.classList.toggle("ult-active", isOn);
    }

    // Observer les changements de classe sur le switch
    const observer = new MutationObserver(syncGlow);
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ["class"] });

    // Sync initial (au chargement)
    setTimeout(syncGlow, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
