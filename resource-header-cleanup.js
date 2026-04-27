(function () {
  "use strict";

  const STYLE_ID = "mkwResourceHeaderCleanupStyles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #hpCard .hp-section > div:first-child {
        display: none !important;
      }

      .shields-section > .mkw-resource-action-head,
      .repair-section > .mkw-resource-action-head {
        min-height: 0 !important;
        margin: 0 0 12px 0 !important;
      }

      .shields-section .mkw-resource-action-title,
      .repair-section .mkw-resource-action-title {
        display: none !important;
      }

      .mkw-resource-header-stack {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        width: 100% !important;
      }

      .mkw-resource-header-stack .section-title {
        margin: 0 !important;
      }

      .mkw-resource-header-stack .mkw-resource-energy-cost {
        margin: 0 !important;
        width: 86px !important;
        min-width: 86px !important;
        height: 24px !important;
        min-height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }

      .mkw-resource-header-stack .mkw-resource-energy-cost img {
        width: 86px !important;
        height: 24px !important;
        object-fit: contain !important;
        object-position: left center !important;
        display: block !important;
      }

      .shields-section .mkw-resource-action-desc,
      .repair-section .mkw-resource-action-desc {
        margin-top: 0 !important;
        min-height: 0 !important;
      }

      @media (max-width: 560px) {
        .mkw-resource-header-stack .mkw-resource-energy-cost,
        .mkw-resource-header-stack .mkw-resource-energy-cost img {
          width: 72px !important;
          min-width: 72px !important;
          height: 22px !important;
          min-height: 22px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function removeDuplicateTextNodes(section, allowedIds) {
    if (!section) return;
    Array.from(section.children).forEach(child => {
      if (allowedIds.some(id => child.id === id)) return;
      if (child.classList?.contains("mkw-resource-action-head")) return;
      if (child.classList?.contains("mkw-current-shield-remove")) return;
      if (child.querySelector?.("button, img")) return;

      const text = normalize(child.textContent);
      if (
        text === "points de vie" ||
        text === "se proteger" ||
        text === "reparer" ||
        text === "hit points" ||
        text === "protect" ||
        text === "repair"
      ) {
        child.remove();
      }
    });
  }

  function moveEnergyToHeader(sectionSelector, titleText) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const card = section.closest(".card");
    const header = card?.querySelector(":scope > .card-h");
    let title = header?.querySelector(".section-title");
    if (!section || !header || !title) return;

    title.textContent = titleText;

    let stack = header.querySelector(".mkw-resource-header-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "mkw-resource-header-stack";
      title.replaceWith(stack);
      stack.appendChild(title);
    } else if (!stack.contains(title)) {
      stack.prepend(title);
    }

    const bodyRow = section.querySelector(".mkw-resource-action-head .mkw-resource-energy-cost, .mkw-resource-energy-cost");
    const existingHeaderRow = stack.querySelector(".mkw-resource-energy-cost");

    if (bodyRow && bodyRow !== existingHeaderRow) {
      existingHeaderRow?.remove();
      stack.appendChild(bodyRow);
    }

    section.querySelectorAll(".mkw-resource-action-title").forEach(el => el.remove());
  }

  function cleanup() {
    ensureStyles();

    const hpSection = document.querySelector("#hpCard .hp-section");
    removeDuplicateTextNodes(hpSection, ["hpHearts"]);

    moveEnergyToHeader(".shields-section", "Se protéger");
    moveEnergyToHeader(".repair-section", "Réparer");

    removeDuplicateTextNodes(document.querySelector(".shields-section"), ["shieldsDisplay"]);
    removeDuplicateTextNodes(document.querySelector(".repair-section"), ["repairKeysDisplay"]);
  }

  function scheduleCleanup() {
    clearTimeout(scheduleCleanup.timer);
    scheduleCleanup.timer = setTimeout(cleanup, 0);
  }

  function init() {
    cleanup();
    [40, 100, 250, 600, 1200].forEach(delay => setTimeout(cleanup, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:shield-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:turn-start", scheduleCleanup);
    window.addEventListener("pageshow", scheduleCleanup);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
