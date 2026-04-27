(function () {
  "use strict";

  const STYLE_ID = "mkwResourceMiniCardsCleanupStyles";

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isTitleLike(text) {
    const t = normalize(text);
    return t === "points de vie"
      || t === "se proteger"
      || t === "reparer"
      || t === "health points"
      || t === "protect"
      || t === "repair";
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .hp-section > .mkw-mini-card-header,
      .shields-section > .mkw-mini-card-header,
      .repair-section > .mkw-mini-card-header {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
      }

      .hp-section > .mkw-mini-card-header .mkw-resource-energy-cost,
      .shields-section > .mkw-mini-card-header .mkw-resource-energy-cost,
      .repair-section > .mkw-mini-card-header .mkw-resource-energy-cost {
        margin: 0 !important;
      }

      .hp-section > .mkw-mini-card-header .mkw-resource-energy-cost img,
      .shields-section > .mkw-mini-card-header .mkw-resource-energy-cost img,
      .repair-section > .mkw-mini-card-header .mkw-resource-energy-cost img {
        width: 86px !important;
        height: 24px !important;
        object-fit: contain !important;
        object-position: left center !important;
        display: block !important;
      }

      .mkw-mini-title-duplicate {
        display: none !important;
      }

      @media (max-width: 560px) {
        .hp-section > .mkw-mini-card-header .mkw-resource-energy-cost img,
        .shields-section > .mkw-mini-card-header .mkw-resource-energy-cost img,
        .repair-section > .mkw-mini-card-header .mkw-resource-energy-cost img {
          width: 72px !important;
          height: 22px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getHeader(section) {
    let header = section.querySelector(":scope > .mkw-mini-card-header");
    if (header) return header;

    const firstTitle = Array.from(section.children).find(child => {
      if (child.id || child.classList.contains("mkw-resource-action-head")) return false;
      if (child.querySelector("button, img")) return false;
      return isTitleLike(child.textContent);
    });

    if (firstTitle) {
      firstTitle.classList.add("mkw-mini-card-header");
      firstTitle.style.marginBottom = "8px";
      return firstTitle;
    }

    header = document.createElement("div");
    header.className = "mkw-mini-card-header";
    section.insertBefore(header, section.firstChild);
    return header;
  }

  function cleanTextDuplicates(section, header) {
    Array.from(section.querySelectorAll("div, p, span, strong, b")).forEach(el => {
      if (el === header || el.closest(".mkw-mini-card-header")) return;
      if (el.closest("#hpHearts") || el.closest("#shieldsDisplay") || el.closest("#repairKeysDisplay")) return;
      if (el.querySelector("button, img, .heart, .mkw-resource-energy-cost")) return;
      if (el.classList.contains("mkw-resource-action-desc")) return;

      if (isTitleLike(el.textContent)) {
        el.classList.add("mkw-mini-title-duplicate");
        el.remove();
      }
    });
  }

  function moveEnergyToHeader(section, header) {
    const rows = Array.from(section.querySelectorAll(".mkw-resource-energy-cost"));
    if (!rows.length) return;

    const first = rows[0];
    rows.slice(1).forEach(row => row.remove());

    if (!header.contains(first)) {
      header.appendChild(first);
    }
  }

  function flattenResourceHead(section) {
    const resourceHead = section.querySelector(":scope > .mkw-resource-action-head");
    if (!resourceHead) return;

    const desc = resourceHead.querySelector(".mkw-resource-action-desc");
    if (desc) {
      section.insertBefore(desc, resourceHead.nextSibling);
    }

    resourceHead.querySelectorAll(".mkw-resource-action-title").forEach(el => el.remove());
    if (!resourceHead.querySelector(".mkw-resource-energy-cost")) resourceHead.remove();
  }

  function cleanupSection(selector, titleText) {
    const section = document.querySelector(selector);
    if (!section) return;

    const header = getHeader(section);
    if (titleText && !normalize(header.textContent).includes(normalize(titleText))) {
      const textNode = document.createElement("span");
      textNode.textContent = titleText;
      header.insertBefore(textNode, header.firstChild);
    }

    flattenResourceHead(section);
    moveEnergyToHeader(section, header);
    cleanTextDuplicates(section, header);
  }

  function cleanup() {
    ensureStyles();
    cleanupSection(".hp-section", "Points de Vie");
    cleanupSection(".shields-section", "Se protéger");
    cleanupSection(".repair-section", "Réparer");
  }

  function scheduleCleanup() {
    clearTimeout(scheduleCleanup.timer);
    scheduleCleanup.timer = setTimeout(cleanup, 20);
  }

  function init() {
    cleanup();
    [60, 120, 260, 500, 900, 1600].forEach(delay => setTimeout(cleanup, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:shield-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleCleanup);
    window.addEventListener("mechkawaii:turn-start", scheduleCleanup);
    window.addEventListener("pageshow", scheduleCleanup);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
