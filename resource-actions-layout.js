(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwResourceActionsLayoutStyles";

  const I18N = {
    fr: {
      protectTitle: "Se protéger",
      protectText: "Pose un bouclier sur une unité alliée ou sur soi-même. Le bouclier absorbe 1 PV, puis est défaussé.",
      repairTitle: "Réparer",
      repairText: "Rend 1 PV à une unité alliée adjacente ou à soi-même. Peut relever une unité HS avec 1 PV."
    },
    en: {
      protectTitle: "Protect",
      protectText: "Place a shield on an allied unit or on itself. The shield absorbs 1 HP, then is discarded.",
      repairTitle: "Repair",
      repairText: "Restore 1 HP to an adjacent allied unit or itself. Can revive a KO unit with 1 HP."
    }
  };

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function tr(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .shields-section,
      .repair-section {
        opacity: 0 !important;
      }

      .shields-section.mkw-resource-layout-ready,
      .repair-section.mkw-resource-layout-ready {
        opacity: 1 !important;
        transition: opacity .08s ease !important;
      }

      .mkw-resource-action-head {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        margin: 0 0 12px 0 !important;
      }

      .mkw-resource-action-title {
        display: none !important;
      }

      .mkw-resource-action-head .mkw-resource-energy-cost {
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }

      .mkw-resource-action-head .mkw-resource-energy-cost img {
        width: 86px !important;
        max-width: 34vw !important;
        height: auto !important;
        display: block !important;
      }

      .mkw-resource-action-desc {
        margin: 0 !important;
        color: var(--muted, rgba(255,255,255,.72)) !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        max-width: 34rem !important;
      }

      .mkw-resource-title-wrap {
        display: none !important;
      }

      @media (max-width: 560px) {
        .mkw-resource-action-head .mkw-resource-energy-cost img {
          width: 72px !important;
          max-width: 30vw !important;
        }

        .mkw-resource-action-desc {
          font-size: 12px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function isGeneratedTitleText(text, titleText) {
    const normalized = normalizeText(text);
    const title = normalizeText(titleText);
    return normalized === title
      || normalized === "boucliers (reserve partagee)"
      || normalized === "cles de reparation"
      || normalized === "shields (shared pool)"
      || normalized === "repair keys";
  }

  function collectEnergyRow(section) {
    const rows = Array.from(section.querySelectorAll(".mkw-resource-energy-cost"));
    if (!rows.length) return null;

    const first = rows[0];
    rows.slice(1).forEach(row => row.remove());
    return first;
  }

  function cleanGeneratedTitlesEverywhere(section, titleText) {
    Array.from(section.querySelectorAll("div, p, span, strong, b")).forEach(el => {
      if (el.closest("#shieldsDisplay") || el.closest("#repairKeysDisplay")) return;
      if (el.classList?.contains("mkw-resource-action-desc")) return;
      if (el.querySelector("img, button, .mkw-resource-energy-cost")) return;
      if (isGeneratedTitleText(el.textContent, titleText)) el.remove();
    });
  }

  function cleanSection(section, titleText) {
    section.classList.remove("mkw-resource-layout-ready");

    const existingHead = section.querySelector(":scope > .mkw-resource-action-head");
    const energyRow = collectEnergyRow(section);

    cleanGeneratedTitlesEverywhere(section, titleText);

    Array.from(section.children).forEach(child => {
      if (child === existingHead) return;
      if (child === energyRow) return;
      if (child.classList?.contains("shields-display")) return;
      if (child.id === "shieldsDisplay") return;
      if (child.id === "repairKeysDisplay") return;
      if (child.id === "mkwCurrentShieldRemove") return;
      if (child.classList?.contains("mkw-current-shield-remove")) return;

      if (child.classList?.contains("mkw-resource-title-wrap")) {
        child.remove();
        return;
      }

      if (isGeneratedTitleText(child.textContent, titleText) && !child.querySelector("button, img")) {
        child.remove();
      }
    });

    return energyRow;
  }

  function buildHead(section, descText, energyRow) {
    let head = section.querySelector(":scope > .mkw-resource-action-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "mkw-resource-action-head";
      section.insertBefore(head, section.firstChild);
    }

    head.innerHTML = "";

    if (energyRow) {
      energyRow.classList.add("mkw-resource-energy-cost");
      head.appendChild(energyRow);
    }

    const desc = document.createElement("p");
    desc.className = "mkw-resource-action-desc";
    desc.textContent = descText;
    head.appendChild(desc);

    if (section.firstElementChild !== head) {
      section.insertBefore(head, section.firstChild);
    }

    section.classList.add("mkw-resource-layout-ready");
  }

  function applySection(selector, titleText, descText) {
    const section = document.querySelector(selector);
    if (!section) return;

    const energyRow = cleanSection(section, titleText);
    buildHead(section, descText, energyRow);
  }

  function applyLayout() {
    ensureStyles();
    applySection(".shields-section", tr("protectTitle"), tr("protectText"));
    applySection(".repair-section", tr("repairTitle"), tr("repairText"));
  }

  function scheduleApply() {
    clearTimeout(scheduleApply.timer);
    scheduleApply.timer = setTimeout(applyLayout, 16);
  }

  function init() {
    applyLayout();
    [40, 100, 220, 500, 900, 1600].forEach(delay => setTimeout(applyLayout, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleApply);
    window.addEventListener("mechkawaii:shield-updated", scheduleApply);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleApply);
    window.addEventListener("mechkawaii:turn-start", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
