(function () {
  "use strict";

  const NO_CLASS_ACTION_TOGGLE_IDS = new Set([
    "johanna",
    "goryo",
    "fuyu",
    "goki",
    "khurt",
    "samebito",
    "rasmus",
    "senpoku"
  ]);

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function currentId() {
    return normalize(new URL(location.href).searchParams.get("id") || "");
  }

  function shouldHideClassActionToggle() {
    return NO_CLASS_ACTION_TOGGLE_IDS.has(currentId());
  }

  function removeClassActionToggle() {
    if (!shouldHideClassActionToggle()) return;

    const title = document.querySelector("#classActionTitle");
    const card = title?.closest(".card");
    if (!card) return;

    card.querySelectorAll(".mkw-header-energy-tools .mkw-energy-switch").forEach(toggle => {
      toggle.remove();
    });

    card.querySelectorAll(".mkw-energy-switch").forEach(toggle => {
      toggle.remove();
    });
  }

  function scheduleRemove() {
    clearTimeout(scheduleRemove.timer);
    scheduleRemove.timer = setTimeout(removeClassActionToggle, 30);
  }

  function init() {
    removeClassActionToggle();
    setTimeout(removeClassActionToggle, 120);
    setTimeout(removeClassActionToggle, 400);
    setTimeout(removeClassActionToggle, 900);

    window.addEventListener("mechkawaii:energy-updated", scheduleRemove);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleRemove);
    window.addEventListener("mechkawaii:turn-start", scheduleRemove);
    window.addEventListener("pageshow", scheduleRemove);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
