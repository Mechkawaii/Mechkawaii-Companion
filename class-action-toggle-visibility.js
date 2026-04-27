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

  const STYLE_ID = "mkwNoClassActionToggleStyles";

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

  function ensureStyle() {
    if (!shouldHideClassActionToggle()) return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #classActionTitle,
      #classActionBody { }
      #classActionTitle ~ .mkw-header-energy-tools .mkw-energy-switch,
      .card:has(#classActionTitle) .mkw-header-energy-tools .mkw-energy-switch,
      .card:has(#classActionTitle) .mkw-energy-switch {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function removeClassActionToggle() {
    if (!shouldHideClassActionToggle()) return;
    ensureStyle();

    const title = document.querySelector("#classActionTitle");
    const card = title?.closest(".card");
    if (!card) return;

    card.querySelectorAll(".mkw-header-energy-tools .mkw-energy-switch, .mkw-energy-switch").forEach(toggle => {
      toggle.remove();
    });
  }

  function scheduleRemove() {
    clearTimeout(scheduleRemove.timer);
    scheduleRemove.timer = setTimeout(removeClassActionToggle, 20);
  }

  function runForAWhile() {
    let count = 0;
    const interval = setInterval(() => {
      removeClassActionToggle();
      count += 1;
      if (count >= 40) clearInterval(interval);
    }, 100);
  }

  function init() {
    removeClassActionToggle();
    runForAWhile();
    [60, 150, 300, 600, 1000, 1600, 2400, 3500, 5000].forEach(delay => {
      setTimeout(removeClassActionToggle, delay);
    });

    window.addEventListener("mechkawaii:energy-updated", scheduleRemove);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleRemove);
    window.addEventListener("mechkawaii:turn-start", scheduleRemove);
    window.addEventListener("pageshow", scheduleRemove);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
