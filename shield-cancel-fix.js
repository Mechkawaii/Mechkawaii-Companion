(function () {
  "use strict";

  const STYLE_ID = "mkwShieldModalSafeSkin";
  let lastShieldSnapshot = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-shield-safe-modal {
        background: linear-gradient(180deg,#1a1a24,#101018) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.15) !important;
        border-radius: 20px !important;
        box-shadow: 0 22px 55px rgba(0,0,0,.58) !important;
      }

      .mkw-shield-safe-modal h1,
      .mkw-shield-safe-modal h2,
      .mkw-shield-safe-modal h3,
      .mkw-shield-safe-modal [class*="title"] {
        color: #fff !important;
        font-weight: 950 !important;
      }

      .mkw-shield-safe-help {
        color: rgba(255,255,255,.72) !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        margin: 6px 0 14px 0 !important;
      }

      .mkw-shield-safe-modal button {
        border-radius: 15px !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        background: rgba(255,255,255,.065) !important;
        color: #fff !important;
        font-weight: 900 !important;
        box-shadow: none !important;
      }

      .mkw-shield-safe-modal button:hover {
        background: rgba(255,255,255,.1) !important;
        border-color: rgba(255,210,77,.45) !important;
      }

      .mkw-shield-safe-modal .shield-remove-btn,
      .mkw-shield-safe-modal .btn-danger,
      .mkw-shield-safe-modal button[data-action="remove"],
      .mkw-shield-safe-modal button[data-action="delete"] {
        width: 100% !important;
        margin-top: 12px !important;
        padding: 12px !important;
        border-color: rgba(255,105,120,.55) !important;
        background: rgba(255,80,100,.12) !important;
        color: #fff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").toLowerCase().trim();
  }

  function isCancelButton(btn) {
    const txt = textOf(btn);
    return txt === "annuler" || txt === "cancel" || txt.includes("annuler") || txt.includes("cancel");
  }

  function isShieldModalText(el) {
    const txt = textOf(el);
    return txt.includes("bouclier") || txt.includes("shield");
  }

  function isShieldButton(el) {
    return !!(el && el.closest && el.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button"));
  }

  function getShieldButton(el) {
    return el.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button, .shields-section .shield-button");
  }

  function remember(btn) {
    if (!btn) return;

    lastShieldSnapshot = {
      btn,
      className: btn.className,
      active: btn.dataset.active,
      ariaPressed: btn.getAttribute("aria-pressed"),
      backgroundImage: btn.style.backgroundImage,
      backgroundColor: btn.style.backgroundColor,
      display: btn.style.display,
      opacity: btn.style.opacity,
      filter: btn.style.filter
    };
  }

  function restore() {
    const snap = lastShieldSnapshot;
    if (!snap || !snap.btn || !document.body.contains(snap.btn)) return;

    snap.btn.className = snap.className;

    if (snap.active === undefined) delete snap.btn.dataset.active;
    else snap.btn.dataset.active = snap.active;

    if (snap.ariaPressed === null) snap.btn.removeAttribute("aria-pressed");
    else snap.btn.setAttribute("aria-pressed", snap.ariaPressed);

    snap.btn.style.backgroundImage = snap.backgroundImage || "";
    snap.btn.style.backgroundColor = snap.backgroundColor || "";
    snap.btn.style.display = snap.display || "";
    snap.btn.style.opacity = snap.opacity || "";
    snap.btn.style.filter = snap.filter || "";
  }

  function findShieldModal(root) {
    if (!root || root.nodeType !== 1) return null;
    const nodes = [root, ...Array.from(root.querySelectorAll("div, section, article, dialog"))];
    const candidates = nodes.filter(el => isShieldModalText(el) && el.querySelector("button"));
    if (!candidates.length) return null;
    return candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    })[0];
  }

  function addHelpText(modal) {
    if (!modal || modal.querySelector(".mkw-shield-safe-help")) return;
    const help = document.createElement("div");
    help.className = "mkw-shield-safe-help";
    help.textContent = "Choisis une unité alliée : elle reçoit un bouclier de protection.";

    const title = Array.from(modal.querySelectorAll("h1,h2,h3,[class*='title']")).find(Boolean);
    if (title && title.parentElement === modal) title.insertAdjacentElement("afterend", help);
    else modal.insertBefore(help, modal.firstChild);
  }

  function skinShieldModal(root) {
    ensureStyles();
    const modal = findShieldModal(root);
    if (!modal || modal.dataset.mkwShieldSafeSkin === "1") return;
    modal.dataset.mkwShieldSafeSkin = "1";
    modal.classList.add("mkw-shield-safe-modal");
    addHelpText(modal);
  }

  document.addEventListener("click", event => {
    if (isShieldButton(event.target)) {
      remember(getShieldButton(event.target));
      setTimeout(() => skinShieldModal(document.body), 0);
      setTimeout(() => skinShieldModal(document.body), 80);
      return;
    }

    const btn = event.target.closest && event.target.closest("button");
    if (!btn || !isCancelButton(btn)) return;

    setTimeout(restore, 0);
    setTimeout(restore, 80);
    setTimeout(restore, 180);
  }, true);

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node && node.nodeType === 1) skinShieldModal(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
