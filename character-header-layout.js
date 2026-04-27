(function () {
  "use strict";

  const STYLE_ID = "mkwCharacterHeaderLayoutStyles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .page-character #charName {
        font-size: clamp(26px, 4vw, 42px) !important;
        line-height: 1.02 !important;
        font-weight: 1000 !important;
        letter-spacing: .01em !important;
        margin-bottom: 4px !important;
      }

      .page-character #charClass {
        font-size: clamp(16px, 2.2vw, 22px) !important;
        line-height: 1.12 !important;
        font-weight: 800 !important;
        opacity: .88 !important;
        margin-bottom: 8px !important;
      }

      .page-character #mkwEnergyInlineStatus {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        margin: 8px 0 0 0 !important;
        width: fit-content !important;
      }

      .page-character #mkwEnergyInlineStatus img {
        width: 104px !important;
        max-width: 42vw !important;
        height: auto !important;
        display: block !important;
      }

      @media (max-width: 560px) {
        .page-character #charName {
          font-size: 28px !important;
        }

        .page-character #charClass {
          font-size: 17px !important;
        }

        .page-character #mkwEnergyInlineStatus img {
          width: 96px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function reorderHeader() {
    ensureStyles();

    const name = document.querySelector("#charName");
    const charClass = document.querySelector("#charClass");
    const energy = document.querySelector("#mkwEnergyInlineStatus");

    if (!name || !charClass || !energy) return;

    if (energy.previousElementSibling !== charClass) {
      charClass.insertAdjacentElement("afterend", energy);
    }
  }

  function scheduleReorder() {
    clearTimeout(scheduleReorder.timer);
    scheduleReorder.timer = setTimeout(reorderHeader, 20);
  }

  function init() {
    reorderHeader();
    [80, 160, 320, 700, 1200, 2000].forEach(delay => setTimeout(reorderHeader, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleReorder);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleReorder);
    window.addEventListener("mechkawaii:turn-start", scheduleReorder);
    window.addEventListener("pageshow", scheduleReorder);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
