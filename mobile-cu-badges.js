/* =============================================================
   MECHKAWAII — Mobile CU Badges (consolidated, v2)
   Remplace mobile-cu-badges.js + mobile-cu-badges-fix.js
   ============================================================= */
(function () {
  "use strict";

  const PREFIX       = "mechkawaii:";
  const ROW_ID       = "mkwMobileCuBadgeRow";
  const BADGE_CLASS  = "mkw-cu-badge";
  const EMPTY_CLASS  = "mkw-cu-badge-empty";
  const STYLE_ID     = "mkwMobileCuBadgeStyles";

  const BADGE_SIZE   = 60;   // px — taille affichée
  const MAX_BADGES   = 3;

  /* ----------------------------------------------------------
     Styles injectés (remplace mobile-cu-badges.css)
  ---------------------------------------------------------- */
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @media (max-width: 560px) {
        .page-character .topbar {
          position: relative !important;
          overflow: hidden !important;
          padding-right: ${BADGE_SIZE * MAX_BADGES + 16}px !important;
        }
        .page-character .brand-with-portrait {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }
        .page-character #charName,
        .page-character #charClass {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        /* La row de badges */
        #${ROW_ID} {
          position: absolute !important;
          top: 50% !important;
          right: 10px !important;
          transform: translateY(-50%) !important;
          z-index: 20 !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 4px !important;
          pointer-events: none !important;
        }
        /* Chaque badge */
        #${ROW_ID} .${BADGE_CLASS} {
          position: relative !important;
          inset: auto !important;
          transform: none !important;
          width: ${BADGE_SIZE}px !important;
          height: ${BADGE_SIZE}px !important;
          min-width: ${BADGE_SIZE}px !important;
          min-height: ${BADGE_SIZE}px !important;
          max-width: ${BADGE_SIZE}px !important;
          max-height: ${BADGE_SIZE}px !important;
          flex: 0 0 ${BADGE_SIZE}px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }
        #${ROW_ID} .${BADGE_CLASS} img {
          display: block !important;
          width: ${BADGE_SIZE}px !important;
          height: ${BADGE_SIZE}px !important;
          object-fit: contain !important;
          pointer-events: none !important;
        }
        /* Masquer les controls de suppression partout dans la topbar */
        .page-character .topbar .mkw-cu-remove-btn {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  function isMobile() {
    return window.matchMedia?.("(max-width: 560px)").matches ?? false;
  }

  function srcOf(el) {
    if (!el) return "";
    if (el instanceof HTMLImageElement) return el.getAttribute("src") || "";
    return el.querySelector?.("img")?.getAttribute("src") || "";
  }

  function isEmptyBadge(img) {
    const src = srcOf(img).toLowerCase();
    return src.includes("cu_vide") || src.includes("cu-vide") || src.includes("cuvide");
  }

  /* ----------------------------------------------------------
     Détection des images CU dans la topbar
     On cherche uniquement les <img> dont le src contient "CU_"
     ou "cu_" (ex: ./assets/cu/CU_johanna.png, CU_vide.png…)
  ---------------------------------------------------------- */
  function findCuImages() {
    const topbar = document.querySelector(".page-character .topbar");
    if (!topbar) return [];

    const imgs = [];
    topbar.querySelectorAll("img").forEach(img => {
      if (img.closest("#charPortrait")) return;
      if (img.closest("#mkwEnergyInlineStatus")) return;
      if (img.closest(`#${ROW_ID}`)) return;  // déjà dans la row

      const src = (img.getAttribute("src") || "").toLowerCase();
      if (src.includes("/cu/") || src.includes("cu_") || src.includes("cu-vide")) {
        imgs.push(img);
      }
    });
    return imgs;
  }

  /* ----------------------------------------------------------
     Supprimer les boutons ×/remove autour des badges
  ---------------------------------------------------------- */
  function removeCloseButtons() {
    const topbar = document.querySelector(".page-character .topbar");
    if (!topbar) return;

    topbar.querySelectorAll("button, [role='button']").forEach(btn => {
      if (btn.id === "mkwCompanionMenuButton") return;
      if (btn.closest(`#${ROW_ID}`)) return;
      if (btn.closest("#charPortrait")) return;

      const txt = (btn.textContent || "").trim();
      const cls = (btn.className || "").toLowerCase();
      const lbl = (btn.getAttribute("aria-label") || "").toLowerCase();

      const isClose =
        txt === "×" || txt === "x" || txt === "✕" || txt === "✖" || txt === "✗" ||
        cls.includes("remove") || cls.includes("close") || cls.includes("delete") ||
        lbl.includes("remove") || lbl.includes("close") || lbl.includes("retir") ||
        lbl.includes("suppr");

      // Petit bouton carré ≤ 28px dans la zone de droite = bouton remove
      if (!isClose) {
        const rect = btn.getBoundingClientRect();
        const isSmallCorner = rect.width > 0 && rect.width <= 28 && rect.height <= 28;
        if (!isSmallCorner) return;
      }

      btn.classList.add("mkw-cu-remove-btn");  // CSS le masque
    });
  }

  /* ----------------------------------------------------------
     Sync principal
  ---------------------------------------------------------- */
  let syncing = false;

  function syncBadges() {
    if (syncing || !isMobile()) return;
    syncing = true;
    try {
      ensureStyles();
      removeCloseButtons();

      const topbar = document.querySelector(".page-character .topbar");
      if (!topbar) return;

      // Créer ou récupérer la row
      let row = document.getElementById(ROW_ID);
      if (!row) {
        row = document.createElement("div");
        row.id = ROW_ID;
        row.setAttribute("aria-label", "Badges Coup Unique");
        topbar.appendChild(row);
      }

      // Collecter les images CU (hors celles déjà dans la row)
      const cuImgs = findCuImages();

      // Séparer vide / plein
      const emptyImgs = cuImgs.filter(isEmptyBadge);
      const fullImgs  = cuImgs.filter(img => !isEmptyBadge(img));

      // Dédupliquer par src
      const seen = new Set();
      const ordered = [...emptyImgs, ...fullImgs].filter(img => {
        const k = srcOf(img).toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, MAX_BADGES);

      // Vider la row et la repeupler proprement
      row.innerHTML = "";
      ordered.forEach(img => {
        const wrapper = document.createElement("div");
        wrapper.className = BADGE_CLASS;
        if (isEmptyBadge(img)) wrapper.classList.add(EMPTY_CLASS);

        // Cloner l'image pour éviter de déplacer un nœud DOM vivant
        const clone = img.cloneNode(true);
        clone.style.cssText = "";  // reset styles inline parasites
        wrapper.appendChild(clone);

        // Le wrapper du badge original cliqué = on redirige vers le clone
        const origParent = img.closest("button, [role='button']");
        if (origParent && !isEmptyBadge(img)) {
          wrapper.style.pointerEvents = "auto";
          wrapper.style.cursor = "pointer";
          wrapper.addEventListener("click", () => origParent.click());
        }

        row.appendChild(wrapper);
      });

      row.style.display = ordered.length ? "flex" : "none";

    } finally {
      syncing = false;
    }
  }

  /* ----------------------------------------------------------
     Scheduling
  ---------------------------------------------------------- */
  let timer = null;
  function scheduleSync() {
    clearTimeout(timer);
    timer = setTimeout(syncBadges, 30);
  }

  function init() {
    ensureStyles();
    // Syncs initiaux pour couvrir les rendus progressifs
    syncBadges();
    [50, 120, 250, 500, 1000, 2000].forEach(d => setTimeout(syncBadges, d));

    new MutationObserver(scheduleSync).observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ["src", "class", "style"]
    });

    window.addEventListener("resize",                              scheduleSync);
    window.addEventListener("pageshow",                            scheduleSync);
    window.addEventListener("mechkawaii:energy-updated",           scheduleSync);
    window.addEventListener("mechkawaii:ultimate-cancelled",       scheduleSync);
    window.addEventListener("mechkawaii:ultimate-energy-finalized",scheduleSync);
    window.addEventListener("mechkawaii:game-flow-updated",        scheduleSync);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
