(function () {
  "use strict";

  const STYLE_ID = "mkwTabsCornerPolishStyles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .unit-tab {
        border-radius: var(--radius, 16px) !important;
        overflow: hidden !important;
        background: rgba(19, 19, 26, 0.85) !important;
        background-clip: padding-box !important;
        isolation: isolate !important;
        transform: translateZ(0);
      }

      .unit-tab:not(.active) {
        border-color: var(--border) !important;
        background: rgba(19, 19, 26, 0.85) !important;
        box-shadow: none !important;
      }

      .unit-tab:not(.active)::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        border-radius: inherit !important;
        pointer-events: none !important;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.035) !important;
        background: transparent !important;
      }

      .unit-tab.active {
        border-radius: var(--radius, 16px) !important;
        overflow: hidden !important;
        background: rgba(255, 210, 0, 0.12) !important;
      }

      .unit-tab.active::before {
        border-radius: var(--radius, 16px) var(--radius, 16px) 0 0 !important;
        overflow: hidden !important;
      }

      .unit-tab-visual {
        position: relative !important;
        z-index: 1 !important;
        width: 100% !important;
        height: 70% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-bottom: 8px !important;
      }

      .unit-tab-visual img {
        display: block !important;
        margin: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        width: 50% !important;
        height: auto !important;
        object-fit: contain !important;
        object-position: center !important;
        border-radius: 0 !important;
      }

      .unit-tab-info {
        position: relative !important;
        z-index: 1 !important;
        text-align: center !important;
        width: 100% !important;
      }

      .unit-tab-hp {
        position: absolute !important;
        z-index: 3 !important;
        top: 6px !important;
        right: 6px !important;
        left: auto !important;
        bottom: auto !important;
        transform: none !important;
        background: rgba(0, 0, 0, 0.8) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius-full, 999px) !important;
      }

      .unit-tab-name,
      .unit-tab-role {
        color: #fff !important;
        text-shadow: 0 1px 8px rgba(0,0,0,.75) !important;
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
