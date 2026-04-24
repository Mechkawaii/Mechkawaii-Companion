(function () {
  "use strict";

  const STYLE_ID = "mkwShieldUiStyles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-shield-ui-backdrop {
        background: rgba(0,0,0,.68) !important;
        backdrop-filter: blur(2px);
      }

      .mkw-shield-ui-panel {
        width: min(460px, calc(100vw - 36px)) !important;
        max-height: 82vh !important;
        overflow: auto !important;
        background: linear-gradient(180deg,#1a1a24,#101018) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 22px 55px rgba(0,0,0,.58) !important;
        padding: 16px !important;
      }

      .mkw-shield-ui-panel h1,
      .mkw-shield-ui-panel h2,
      .mkw-shield-ui-panel h3,
      .mkw-shield-ui-panel .title,
      .mkw-shield-ui-panel [class*="title"] {
        color: #fff !important;
        font-weight: 950 !important;
      }

      .mkw-shield-ui-panel button {
        border-radius: 15px !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        background: rgba(255,255,255,.065) !important;
        color: #fff !important;
        font-weight: 900 !important;
        padding: 11px 12px !important;
        box-shadow: none !important;
      }

      .mkw-shield-ui-panel button:hover {
        background: rgba(255,255,255,.1) !important;
        border-color: rgba(255,210,77,.45) !important;
      }

      .mkw-shield-ui-panel button:last-child {
        width: 100% !important;
        margin-top: 12px !important;
        background: rgba(255,255,255,.08) !important;
      }

      .mkw-shield-ui-panel img {
        border-radius: 12px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").toLowerCase();
  }

  function looksLikeShieldModal(el) {
    const txt = textOf(el);
    return txt.includes("bouclier") || txt.includes("shield");
  }

  function findLikelyBackdrop(panel) {
    let node = panel;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (cs.position === "fixed" && (cs.inset === "0px" || (cs.top === "0px" && cs.left === "0px"))) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function styleShieldModal(root) {
    if (!root || root.nodeType !== 1) return;
    ensureStyles();

    const candidates = [root, ...Array.from(root.querySelectorAll("div, section, article, dialog"))];
    const panel = candidates.find(el => {
      if (el.dataset.mkwShieldUi === "1") return false;
      if (!looksLikeShieldModal(el)) return false;
      const buttons = el.querySelectorAll("button");
      return buttons.length >= 1;
    });

    if (!panel) return;

    panel.dataset.mkwShieldUi = "1";
    panel.classList.add("mkw-shield-ui-panel");

    const backdrop = findLikelyBackdrop(panel);
    if (backdrop) backdrop.classList.add("mkw-shield-ui-backdrop");
  }

  function scan() {
    styleShieldModal(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node && node.nodeType === 1) styleShieldModal(node);
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();