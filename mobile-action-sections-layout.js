(function () {
  "use strict";

  const STYLE_ID = "mkwMobileActionSectionsLayout";

  function init() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 768px) {
        .patterns-grid {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          gap: 10px !important;
        }

        .patterns-grid .card {
          min-width: 0 !important;
        }

        .patterns-grid .card-h,
        .patterns-grid .card-b {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }

        .patterns-grid .section-title {
          font-size: 13px !important;
          line-height: 1.15 !important;
        }

        .patterns-grid p {
          font-size: 12px !important;
          line-height: 1.28 !important;
        }

        .patterns-grid .image-container {
          min-height: 118px !important;
          padding: 5px !important;
          border-radius: 10px !important;
        }

        .patterns-grid .mkw-header-energy-tools img {
          width: 64px !important;
          max-width: 100% !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-slider {
          width: 44px !important;
          height: 26px !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-slider::after {
          width: 18px !important;
          height: 18px !important;
          left: 3px !important;
          top: 3px !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-switch input:checked + .mkw-energy-slider::after {
          transform: translateX(18px) !important;
        }
      }

      @media (max-width: 360px) {
        .patterns-grid {
          gap: 8px !important;
        }

        .patterns-grid .card-h,
        .patterns-grid .card-b {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        .patterns-grid .mkw-header-energy-tools img {
          width: 56px !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-slider {
          width: 40px !important;
          height: 24px !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-slider::after {
          width: 16px !important;
          height: 16px !important;
        }

        .patterns-grid .mkw-header-energy-tools .mkw-energy-switch input:checked + .mkw-energy-slider::after {
          transform: translateX(16px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
