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

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-resource-action-head {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        margin: 0 0 12px 0 !important;
      }

      .mkw-resource-action-title {
        font-weight: 950 !important;
        color: var(--text, #fff) !important;
        line-height: 1.1 !important;
        margin: 0 !important;
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
    const normalized = String(text || "").trim().toLowerCase();
    const title = String(titleText || "").trim().toLowerCase();
    return normalized === title || normalized === "boucliers (réserve partagée)" || normalized === "clés de réparation" || normalized === "shields (shared pool)" || normalized === "repair keys";
  }

  function collectEnergyRow(section) {
    const rows = Array.from(section.querySelectorAll(".mkw-resource-energy-cost"));
    if (!rows.length) return null;

    const first = rows[0];
    rows.slice(1).forEach(row => row.remove());
    return first;
  }

  function cleanSection(section, titleText) {
    const existingHead = section.querySelector(":scope > .mkw-resource-action-head");
    const energyRow = collectEnergyRow(section);

    Array.from(section.children).forEach(child => {
      if (child === existingHead) return;
      if (child === energyRow) return;
      if (child.classList?.contains("shields-display")) return;
      if (child.id === "shieldsDisplay") return;
      if (child.id === "repairKeysDisplay") return;
      if (child.classList?.contains("mkw-current-shield-remove")) return;

      if (child.classList?.contains("mkw-resource-title-wrap")) {
        child.remove();
        return;
      }

      if (child.tagName === "DIV" && !child.id && !child.className && isGeneratedTitleText(child.textContent, titleText)) {
        child.remove();
      }
    });

    return energyRow;
  }

  function buildHead(section, titleText, descText, energyRow) {
    let head = section.querySelector(":scope > .mkw-resource-action-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "mkw-resource-action-head";
      section.insertBefore(head, section.firstChild);
    }

    head.innerHTML = "";

    const title = document.createElement("div");
    title.className = "mkw-resource-action-title";
    title.textContent = titleText;
    head.appendChild(title);

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
  }

  function applySection(selector, titleText, descText) {
    const section = document.querySelector(selector);
    if (!section) return;

    const energyRow = cleanSection(section, titleText);
    buildHead(section, titleText, descText, energyRow);
  }

  function applyLayout() {
    ensureStyles();
    applySection(".shields-section", tr("protectTitle"), tr("protectText"));
    applySection(".repair-section", tr("repairTitle"), tr("repairText"));
  }

  function scheduleApply() {
    clearTimeout(scheduleApply.timer);
    scheduleApply.timer = setTimeout(applyLayout, 40);
  }

  function init() {
    applyLayout();
    [80, 160, 300, 700, 1200, 2200].forEach(delay => setTimeout(applyLayout, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleApply);
    window.addEventListener("mechkawaii:shield-updated", scheduleApply);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleApply);
    window.addEventListener("mechkawaii:turn-start", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
