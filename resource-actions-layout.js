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

  function getOrCreateHead(section, titleText, descText) {
    let head = section.querySelector(":scope > .mkw-resource-action-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "mkw-resource-action-head";
      section.insertBefore(head, section.firstChild);
    }

    let title = head.querySelector(".mkw-resource-action-title");
    if (!title) {
      title = document.createElement("div");
      title.className = "mkw-resource-action-title";
      head.appendChild(title);
    }
    title.textContent = titleText;

    let desc = head.querySelector(".mkw-resource-action-desc");
    if (!desc) {
      desc = document.createElement("p");
      desc.className = "mkw-resource-action-desc";
    }
    desc.textContent = descText;

    return { head, title, desc };
  }

  function moveEnergyCostIntoHead(section, head, desc) {
    const energyRow = section.querySelector(":scope > .mkw-resource-title-wrap .mkw-resource-energy-cost, :scope > .mkw-resource-energy-cost");
    if (!energyRow) return;

    const existing = head.querySelector(".mkw-resource-energy-cost");
    if (existing && existing !== energyRow) existing.remove();

    if (energyRow.parentElement !== head) {
      head.insertBefore(energyRow, desc);
    }
  }

  function cleanOldTitleWrap(section) {
    const oldWrap = section.querySelector(":scope > .mkw-resource-title-wrap");
    if (!oldWrap) return;

    const strayTitle = Array.from(oldWrap.children).find(el => !el.classList.contains("mkw-resource-energy-cost"));
    strayTitle?.remove();

    if (!oldWrap.children.length) oldWrap.remove();
  }

  function applySection(selector, titleText, descText) {
    const section = document.querySelector(selector);
    if (!section) return;

    const { head, desc } = getOrCreateHead(section, titleText, descText);
    moveEnergyCostIntoHead(section, head, desc);

    if (desc.parentElement !== head) head.appendChild(desc);
    cleanOldTitleWrap(section);
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
    [120, 300, 700, 1200, 2200].forEach(delay => setTimeout(applyLayout, delay));

    window.addEventListener("mechkawaii:energy-updated", scheduleApply);
    window.addEventListener("mechkawaii:shield-updated", scheduleApply);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleApply);
    window.addEventListener("mechkawaii:turn-start", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
