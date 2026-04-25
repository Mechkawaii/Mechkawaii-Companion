(function () {
  "use strict";

  const STYLE_ID = "mkwEnergyHeaderLayoutFix";

  function init() {
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
