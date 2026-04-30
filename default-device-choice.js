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
    setTimeout(defaultToTwoDevices, 0);
    setTimeout(defaultToTwoDevices, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleDefaultChoice);
  else scheduleDefaultChoice();
})();
