(function () {
  "use strict";

  let lastShieldSnapshot = null;

  function textOf(el) {
    return (el && el.textContent ? el.textContent : "").toLowerCase().trim();
  }

  function isCancelButton(btn) {
    const txt = textOf(btn);
    return txt === "annuler" || txt === "cancel" || txt.includes("annuler") || txt.includes("cancel");
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

  document.addEventListener("click", event => {
    if (isShieldButton(event.target)) {
      remember(getShieldButton(event.target));
      return;
    }

    const btn = event.target.closest && event.target.closest("button");
    if (!btn || !isCancelButton(btn)) return;

    setTimeout(restore, 0);
    setTimeout(restore, 80);
    setTimeout(restore, 180);
  }, true);
})();
