/* =============================================================
   MECHKAWAII — Mobile CU Badges (v5)
   Gère .cu-header-slot > .cu-badge générés par app.js
   ============================================================= */
(function () {
  "use strict";

  const STYLE_ID = "mkwMobileCuBadgeStyles";
  const SZ = 44; // taille badge px

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @media (max-width: 560px) {

        /* Slot positionné en absolu à droite dans la topbar */
        .page-character .topbar {
          position: relative !important;
          overflow: hidden !important;
        }

        .page-character .cu-header-slot {
          position: absolute !important;
          top: 50% !important;
          right: 8px !important;
          transform: translateY(-50%) !important;
          z-index: 20 !important;
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 3px !important;
          max-width: ${SZ * 2 + 6}px !important;
          pointer-events: auto !important;
        }

        /* Badge individuel */
        .page-character .cu-header-slot .cu-badge {
          position: relative !important;
          width: ${SZ}px !important;
          height: ${SZ}px !important;
          min-width: ${SZ}px !important;
          min-height: ${SZ}px !important;
          max-width: ${SZ}px !important;
          max-height: ${SZ}px !important;
          flex: 0 0 ${SZ}px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          cursor: pointer !important;
        }

        .page-character .cu-header-slot .cu-badge img {
          display: block !important;
          width: ${SZ}px !important;
          height: ${SZ}px !important;
          object-fit: contain !important;
        }

        /* ✅ Masquer les croix × */
        .page-character .cu-header-slot .cu-badge-remove {
          display: none !important;
        }

        /* Réserver l'espace dans la topbar pour ne pas cropper le nom */
        .page-character .brand-with-portrait {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          max-width: calc(100% - ${SZ * 2 + 20}px) !important;
          overflow: hidden !important;
        }

        .page-character .brand-with-portrait .char-name-block,
        .page-character #charName,
        .page-character #charClass {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          max-width: 100% !important;
        }

        /* Éloigner le slot de .brand-with-portrait pour ne pas qu'il soit dans le flux */
        .page-character .brand-with-portrait .cu-header-slot {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------------
     Déplace .cu-header-slot dans .topbar (hors du flux brand)
  ---------------------------------------------------------- */
  function relocateSlot() {
    const topbar = document.querySelector(".page-character .topbar");
    const slot   = document.querySelector(".page-character .cu-header-slot");
    if (!topbar || !slot) return;
    if (slot.parentElement === topbar) return; // déjà bon

    // Retirer le display:none qu'on avait mis sur le slot dans brand
    slot.style.removeProperty("display");
    topbar.appendChild(slot);
  }

  function isMobile() {
    return window.matchMedia?.("(max-width: 560px)").matches ?? false;
  }

  let syncing = false;
  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      ensureStyles();
      if (isMobile()) relocateSlot();
    } finally {
      syncing = false;
    }
  }

  let timer = null;
  function scheduleSync() { clearTimeout(timer); timer = setTimeout(sync, 30); }

  function init() {
    ensureStyles();
    sync();
    [50, 120, 300, 600, 1200, 2400].forEach(d => setTimeout(sync, d));

    new MutationObserver(scheduleSync).observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ["class", "style"]
    });
    window.addEventListener("resize",                               scheduleSync);
    window.addEventListener("pageshow",                             scheduleSync);
    window.addEventListener("mechkawaii:energy-updated",            scheduleSync);
    window.addEventListener("mechkawaii:ultimate-cancelled",        scheduleSync);
    window.addEventListener("mechkawaii:ultimate-energy-finalized", scheduleSync);
    window.addEventListener("mechkawaii:game-flow-updated",         scheduleSync);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
