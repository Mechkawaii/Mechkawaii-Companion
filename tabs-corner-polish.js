(function () {
  "use strict";

  const STYLE_ID = "mkwTabsCornerPolishStyles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .unit-tab {
        border-radius: 18px !important;
        overflow: hidden !important;
        background-clip: padding-box !important;
        isolation: isolate !important;
        transform: translateZ(0);
      }

      .unit-tab:not(.active) {
        border-color: rgba(255,255,255,.13) !important;
        background: linear-gradient(180deg, rgba(24,24,34,.92), rgba(12,12,18,.92)) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,.035),
          0 8px 22px rgba(0,0,0,.32) !important;
      }

      .unit-tab:not(.active)::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        border-radius: inherit !important;
        pointer-events: none !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.045) !important;
        background: transparent !important;
      }

      .unit-tab.active {
        border-radius: 18px !important;
        overflow: hidden !important;
      }

      .unit-tab.active::before {
        border-radius: 18px 18px 0 0 !important;
        overflow: hidden !important;
      }

      .unit-tab-visual,
      .unit-tab-info,
      .unit-tab-hp {
        position: relative !important;
        z-index: 1 !important;
      }

      .unit-tab-visual img {
        border-radius: 12px !important;
      }

      @supports (overflow: clip) {
        .unit-tab {
          overflow: clip !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    ensureStyles();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
