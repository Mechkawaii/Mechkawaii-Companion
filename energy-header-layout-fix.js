(function () {
  "use strict";

  const STYLE_ID = "mkwEnergyHeaderLayoutFix";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-energy-header-action {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        gap: 8px !important;
        width: 100% !important;
        min-width: 0 !important;
      }

      .mkw-energy-header-action .section-title {
        width: 100% !important;
        min-width: 0 !important;
        flex: 0 0 auto !important;
        margin: 0 !important;
        line-height: 1.15 !important;
      }

      .mkw-header-energy-tools {
        width: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 12px !important;
        flex: 0 0 auto !important;
      }

      .mkw-header-energy-tools img {
        width: 86px !important;
        max-width: 42vw !important;
        height: auto !important;
        display: block !important;
        flex: 0 0 auto !important;
      }

      .mkw-header-energy-tools .mkw-energy-switch {
        margin-left: auto !important;
        flex: 0 0 auto !important;
      }

      .mkw-resource-cards-grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 16px !important;
        margin-top: 16px !important;
      }

      @media (min-width: 769px) {
        .mkw-resource-cards-grid {
          grid-template-columns: 1fr 1fr 1fr !important;
        }
      }

      .mkw-resource-card .card-b {
        min-height: 100% !important;
      }

      .mkw-resource-card .mkw-resource-note {
        color: var(--muted) !important;
        font-size: 12px !important;
        font-weight: 750 !important;
        margin-bottom: 8px !important;
      }

      .mkw-resource-energy-cost {
        margin: 8px 0 10px !important;
      }

      .mkw-resource-energy-cost img {
        width: 86px !important;
        max-width: 42vw !important;
      }

      @media (max-width: 560px) {
        .mkw-energy-header-action {
          gap: 7px !important;
        }

        .mkw-energy-header-action .section-title {
          font-size: 15px !important;
        }

        .mkw-header-energy-tools {
          gap: 10px !important;
        }

        .mkw-header-energy-tools img {
          width: 78px !important;
          max-width: 38vw !important;
        }

        .mkw-resource-energy-cost img {
          width: 78px !important;
          max-width: 38vw !important;
        }

        .mkw-header-energy-tools .mkw-energy-slider {
          width: 48px !important;
          height: 28px !important;
        }

        .mkw-header-energy-tools .mkw-energy-slider::after {
          width: 20px !important;
          height: 20px !important;
          left: 3px !important;
          top: 3px !important;
        }

        .mkw-header-energy-tools .mkw-energy-switch input:checked + .mkw-energy-slider::after {
          transform: translateX(20px) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function makeCard(id, title, bodyClass) {
    const card = document.createElement("div");
    card.className = "card mkw-resource-card";
    card.id = id;
    card.innerHTML = `<div class="card-h"><div class="section-title">${title}</div></div><div class="card-b ${bodyClass}"></div>`;
    return card;
  }

  function moveChildren(from, to) {
    if (!from || !to) return;
    while (from.firstChild) to.appendChild(from.firstChild);
  }

  function addNote(container, text) {
    if (!container || container.querySelector(".mkw-resource-note")) return;
    const note = document.createElement("div");
    note.className = "mkw-resource-note";
    note.textContent = text;
    container.insertBefore(note, container.firstChild);
  }

  function splitResources() {
    if (document.querySelector(".mkw-resource-cards-grid")) return;

    const oldHpCard = document.querySelector("#hpCard");
    const hpSection = oldHpCard?.querySelector(".hp-section");
    const shieldsSection = oldHpCard?.querySelector(".shields-section");
    const repairSection = oldHpCard?.querySelector(".repair-section");

    if (!oldHpCard || !hpSection || !shieldsSection || !repairSection) return;

    const grid = document.createElement("div");
    grid.className = "mkw-resource-cards-grid";

    const hpCard = makeCard("hpCard", "Points de Vie", "hp-section");
    const shieldCard = makeCard("shieldCard", "Se protéger", "shields-section");
    const repairCard = makeCard("repairCard", "Réparer", "repair-section");

    moveChildren(hpSection, hpCard.querySelector(".hp-section"));
    moveChildren(shieldsSection, shieldCard.querySelector(".shields-section"));
    moveChildren(repairSection, repairCard.querySelector(".repair-section"));

    addNote(shieldCard.querySelector(".shields-section"), "Boucliers — réserve partagée");
    addNote(repairCard.querySelector(".repair-section"), "Clés de réparation");

    grid.appendChild(hpCard);
    grid.appendChild(shieldCard);
    grid.appendChild(repairCard);

    oldHpCard.replaceWith(grid);

    window.dispatchEvent(new CustomEvent("mechkawaii:resource-sections-split"));
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: new URL(location.href).searchParams.get("id") || "" } }));
  }

  function init() {
    ensureStyles();
    splitResources();
    setTimeout(splitResources, 100);
    setTimeout(splitResources, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
