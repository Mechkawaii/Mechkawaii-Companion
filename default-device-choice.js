(function () {
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
    setTimeout(defaultToTwoDevices, 0);
    setTimeout(defaultToTwoDevices, 120);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleDefaultChoice);
  else scheduleDefaultChoice();
})();
