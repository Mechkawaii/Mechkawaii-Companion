(function () {
  "use strict";

  const STYLE_ID = "mkwShieldModalSkinStyles";
  let lastShieldSnapshot = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-shield-modal-skin {
        background: linear-gradient(180deg,#1a1a24,#101018) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 22px 55px rgba(0,0,0,.58) !important;
      }

      .mkw-shield-modal-skin h1,
      .mkw-shield-modal-skin h2,
      .mkw-shield-modal-skin h3,
      .mkw-shield-modal-skin [class*="title"] {
        color: #fff !important;
        font-weight: 950 !important;
      }

      .mkw-shield-modal-skin p,
      .mkw-shield-modal-skin .small,
      .mkw-shield-modal-skin [class*="subtitle"] {
        color: rgba(255,255,255,.72) !important;
      }

      .mkw-shield-modal-skin button {
        border-radius: 15px !important;
        border-color: rgba(255,255,255,.16) !important;
        font-weight: 900 !important;
      }

      .mkw-shield-modal-skin button:hover {
        border-color: rgba(255,210,77,.45) !important;
      }

      .mkw-shield-modal-skin .shield-remove-btn,
      .mkw-shield-modal-skin .btn-danger,
      .mkw-shield-modal-skin button[data-action="remove"],
      .mkw-shield-modal-skin button[data-action="delete"] {
        border-color: rgba(255,105,120,.55) !important;
        background: rgba(255,80,100,.12) !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").toLowerCase();
  }

  function isShieldText(el) {
    const txt = textOf(el);
    return txt.includes("bouclier") || txt.includes("shield");
  }

  function isCancelButton(btn) {
    const txt = textOf(btn).trim();
    return txt === "annuler" || txt === "cancel" || txt.includes("annuler") || txt.includes("cancel");
  }

  function rememberShieldButton(btn) {
    if (!btn) return;
    lastShieldSnapshot = {
      btn,
      className: btn.className,
      active: btn.dataset.active,
      backgroundImage: btn.style.backgroundImage,
      backgroundColor: btn.style.backgroundColor,
      opacity: btn.style.opacity,
      filter: btn.style.filter
    };
  }

  function restoreShieldButton() {
    const snap = lastShieldSnapshot;
    if (!snap || !snap.btn || !document.body.contains(snap.btn)) return;

    snap.btn.className = snap.className;

    if (snap.active === undefined) delete snap.btn.dataset.active;
    else snap.btn.dataset.active = snap.active;

    snap.btn.style.backgroundImage = snap.backgroundImage || "";
    snap.btn.style.backgroundColor = snap.backgroundColor || "";
    snap.btn.style.opacity = snap.opacity || "";
    snap.btn.style.filter = snap.filter || "";
  }

  function installShieldClickMemory() {
    if (document.documentElement.dataset.mkwShieldClickMemory === "1") return;
    document.documentElement.dataset.mkwShieldClickMemory = "1";

    document.addEventListener("click", event => {
      const btn = event.target.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button");
      if (!btn) return;
      rememberShieldButton(btn);
    }, true);
  }

  function choosePanel(root) {
    if (!root || root.nodeType !== 1) return null;

    const all = [root, ...Array.from(root.querySelectorAll("div, section, article, dialog"))];
    const shieldNodes = all.filter(el => isShieldText(el) && el.querySelector("button"));
    if (!shieldNodes.length) return null;

    return shieldNodes.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    })[0];
  }

  function installCancelRestore(panel) {
    panel.querySelectorAll("button").forEach(btn => {
      if (!isCancelButton(btn) || btn.dataset.mkwShieldCancelRestore === "1") return;
      btn.dataset.mkwShieldCancelRestore = "1";
      btn.addEventListener("click", () => {
        setTimeout(restoreShieldButton, 0);
        setTimeout(restoreShieldButton, 80);
      }, true);
    });
  }

  function skin(root) {
    ensureStyles();
    installShieldClickMemory();

    const panel = choosePanel(root);
    if (!panel) return;

    panel.classList.add("mkw-shield-modal-skin");
    installCancelRestore(panel);
  }

  function scan() {
    skin(document.body);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node && node.nodeType === 1) skin(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();