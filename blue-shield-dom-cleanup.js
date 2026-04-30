(function () {
  "use strict";

  // Quand game-flow.js efface le bouclier bleu du localStorage,
  // app.js ne se recharge pas → le bouton "Retirer le bouclier (Technicien)"
  // reste dans le DOM. Ce fichier l'enlève immédiatement.

  function removeBlueShieldButton() {
    document.querySelectorAll(".shield-remove-btn").forEach(btn => {
      const txt = btn.textContent || "";
      if (txt.includes("Technicien") || txt.includes("Technician")) {
        btn.remove();
      }
    });
  }

  function onCleared() {
    removeBlueShieldButton();
    // Délais pour couvrir les re-rendus éventuels
    setTimeout(removeBlueShieldButton, 80);
    setTimeout(removeBlueShieldButton, 250);
  }

  window.addEventListener("mechkawaii:blue-shields-cleared", onCleared);
  window.addEventListener("mechkawaii:turn-start", onCleared);
})();
