/* =============================================================
   MECHKAWAII — Mobile CU Badges (v4)
   ============================================================= */
(function () {
  "use strict";

  const ROW_ID      = "mkwMobileCuBadgeRow";
  const BADGE_CLASS = "mkw-cu-badge";
  const EMPTY_CLASS = "mkw-cu-badge-empty";
  const STYLE_ID    = "mkwMobileCuBadgeStyles";
  const SZ  = 28;  // taille badge px
  const GAP = 3;
  const MAX = 3;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      @media (max-width: 560px) {
        /* Espace réservé à droite */
        .page-character .topbar { position:relative !important; overflow:hidden !important; }
        .page-character .topbar.mkw-cu-1 { padding-right:${SZ+GAP+12}px !important; }
        .page-character .topbar.mkw-cu-2 { padding-right:${SZ*2+GAP*2+12}px !important; }
        .page-character .topbar.mkw-cu-3 { padding-right:${SZ*2+GAP*2+12}px !important; }

        .page-character .brand-with-portrait {
          flex:1 1 auto !important; min-width:0 !important; overflow:hidden !important;
        }
        .page-character #charName,
        .page-character #charClass {
          overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important;
        }

        /* Row */
        #${ROW_ID} {
          position:absolute !important; top:50% !important; right:8px !important;
          transform:translateY(-50%) !important; z-index:20 !important;
          display:grid !important; gap:${GAP}px !important;
          pointer-events:none !important;
          align-items:center !important; justify-items:center !important;
        }
        #${ROW_ID}.mkw-cu-count-1 {
          grid-template-columns:${SZ}px !important;
          grid-template-rows:${SZ}px !important;
        }
        #${ROW_ID}.mkw-cu-count-2 {
          grid-template-columns:repeat(2,${SZ}px) !important;
          grid-template-rows:${SZ}px !important;
        }
        #${ROW_ID}.mkw-cu-count-3 {
          grid-template-columns:repeat(2,${SZ}px) !important;
          grid-template-rows:repeat(2,${SZ}px) !important;
        }
        #${ROW_ID}.mkw-cu-count-3 .${BADGE_CLASS}:first-child {
          grid-column:1/3 !important; justify-self:center !important;
        }

        /* Badge */
        #${ROW_ID} .${BADGE_CLASS} {
          position:relative !important;
          width:${SZ}px !important; height:${SZ}px !important;
          min-width:${SZ}px !important; min-height:${SZ}px !important;
          max-width:${SZ}px !important; max-height:${SZ}px !important;
          margin:0 !important; padding:0 !important;
          overflow:visible !important; pointer-events:auto !important; cursor:pointer !important;
        }
        #${ROW_ID} .${BADGE_CLASS} img {
          display:block !important;
          width:${SZ}px !important; height:${SZ}px !important;
          min-width:${SZ}px !important; min-height:${SZ}px !important;
          max-width:${SZ}px !important; max-height:${SZ}px !important;
          object-fit:contain !important; pointer-events:none !important;
        }

        /* ✅ Masquer TOUTES les croix/boutons remove dans la topbar */
        .page-character .topbar button:not(#mkwCompanionMenuButton):not([data-cu-keep]) {
          display:none !important;
        }
        .page-character .topbar .controls button {
          display:block !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function isMobile() {
    return window.matchMedia?.("(max-width: 560px)").matches ?? false;
  }

  function srcOf(el) {
    if (el instanceof HTMLImageElement) return el.getAttribute("src") || "";
    return el.querySelector?.("img")?.getAttribute("src") || "";
  }

  function isEmptyBadge(img) {
    const src = srcOf(img).toLowerCase();
    return src.includes("cu_vide") || src.includes("cu-vide") || src.includes("cuvide");
  }

  function findCuImages() {
    const topbar = document.querySelector(".page-character .topbar");
    if (!topbar) return [];
    const imgs = [];
    topbar.querySelectorAll("img").forEach(img => {
      if (img.closest("#charPortrait"))          return;
      if (img.closest("#mkwEnergyInlineStatus")) return;
      if (img.closest(`#${ROW_ID}`))             return;
      const src = (img.getAttribute("src") || "").toLowerCase();
      if (src.includes("/cu/") || src.includes("cu_") || src.includes("cu-vide")) {
        imgs.push(img);
      }
    });
    return imgs;
  }

  let syncing = false;

  function syncBadges() {
    if (syncing || !isMobile()) return;
    syncing = true;
    try {
      ensureStyles();

      const topbar = document.querySelector(".page-character .topbar");
      if (!topbar) return;

      let row = document.getElementById(ROW_ID);
      if (!row) {
        row = document.createElement("div");
        row.id = ROW_ID;
        row.setAttribute("aria-label", "Badges Coup Unique");
        topbar.appendChild(row);
      }

      const cuImgs  = findCuImages();
      const empty   = cuImgs.filter(isEmptyBadge);
      const full    = cuImgs.filter(img => !isEmptyBadge(img));
      const seen    = new Set();
      const ordered = [...empty, ...full].filter(img => {
        const k = srcOf(img).toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k); return true;
      }).slice(0, MAX);

      const count = ordered.length;

      row.className = count ? `mkw-cu-count-${count}` : "";
      topbar.classList.remove("mkw-cu-1","mkw-cu-2","mkw-cu-3");
      if (count) topbar.classList.add(`mkw-cu-${count}`);

      row.innerHTML = "";
      ordered.forEach(img => {
        const wrap = document.createElement("div");
        wrap.className = BADGE_CLASS + (isEmptyBadge(img) ? ` ${EMPTY_CLASS}` : "");
        const clone = img.cloneNode(true);
        clone.style.cssText = "";
        wrap.appendChild(clone);
        const origBtn = img.closest("button,[role='button']");
        if (origBtn && !isEmptyBadge(img)) {
          wrap.addEventListener("click", () => origBtn.click());
        }
        row.appendChild(wrap);
      });

      row.style.display = count ? "grid" : "none";
    } finally {
      syncing = false;
    }
  }

  let timer = null;
  function scheduleSync() { clearTimeout(timer); timer = setTimeout(syncBadges, 30); }

  function init() {
    ensureStyles();
    syncBadges();
    [50,120,300,600,1200,2400].forEach(d => setTimeout(syncBadges, d));

    new MutationObserver(scheduleSync).observe(document.body, {
      childList:true, subtree:true,
      attributes:true, attributeFilter:["src","class","style"]
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
