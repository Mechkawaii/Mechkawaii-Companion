(function () {
  function loadExpertEvents() {
    try {
      if (window.__mkwExpertEventsScriptInjected) return;
      window.__mkwExpertEventsScriptInjected = true;
      const script = document.createElement("script");
      script.src = "./expert-events.js?v=1";
      script.defer = true;
      document.head.appendChild(script);
    } catch (error) {}
  }

  function updateDifficultyDescription() {
    try {
      const desc = document.querySelector('[data-i18n="setup_difficulty_desc"]');
      if (!desc) return;
      const lang = localStorage.getItem("mechkawaii:lang") || "fr";
      desc.innerHTML = lang === "en"
        ? "<strong>Normal Mode:</strong> Standard movement and attack patterns.<br><strong>Expert Mode:</strong> Unique movement and attack patterns for each unit. Every 5 rounds, an event occurs on the battlefield."
        : "<strong>Mode Normal :</strong> Schémas de déplacement et d’attaque standards.<br><strong>Mode Expert :</strong> Schémas de déplacement et d’attaque uniques à chaque unité. Tous les 5 tours, un événement se produit sur le champ de bataille.";
    } catch (error) {}
  }

  function defaultToTwoDevices() {
    try {
      if (localStorage.getItem("mechkawaii:setup")) return;
      const setupCard = document.getElementById("setupCard");
      const modeMulti = document.getElementById("modeMulti");
      const campPick = document.getElementById("campPick");
      if (!setupCard || !modeMulti || setupCard.style.display === "none") return;
      if (modeMulti.dataset.defaultApplied === "1") return;
      modeMulti.dataset.defaultApplied = "1";
      modeMulti.click();
      if (campPick) campPick.style.display = "block";
    } catch (error) {}
  }

  function scheduleDefaultChoice() {
    loadExpertEvents();
    updateDifficultyDescription();
    setTimeout(updateDifficultyDescription, 50);
    setTimeout(updateDifficultyDescription, 200);
    setTimeout(defaultToTwoDevices, 0);
    setTimeout(defaultToTwoDevices, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleDefaultChoice);
  else scheduleDefaultChoice();
})();
