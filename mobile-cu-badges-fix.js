(function () {
  "use strict";

  const STYLE_ID = "mkwMobileCuBadgesFixStyles";
  const ROW_CLASS = "mkw-mobile-cu-badges-row";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 560px) {
        .page-character .topbar {
          overflow: visible !important;
        }

        .page-character .brand-with-portrait {
          position: relative !important;
          width: 100% !important;
          min-width: 0 !important;
          padding-right: 104px !important;
          overflow: visible !important;
        }

        .page-character .brand-with-portrait > div:not(#charPortrait):not(.${ROW_CLASS}) {
          min-width: 0 !important;
          max-width: 100% !important;
        }

        .page-character #charName,
        .page-character #charClass {
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .page-character .${ROW_CLASS} {
          position: absolute !important;
          top: 50% !important;
          right: 2px !important;
          transform: translateY(-50%) !important;
          z-index: 120 !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 4px !important;
          width: 96px !important;
          max-width: 96px !important;
          height: 34px !important;
          max-height: 34px !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }

        .page-character .${ROW_CLASS} > * {
          position: relative !important;
          inset: auto !important;
          right: auto !important;
          left: auto !important;
          top: auto !important;
          bottom: auto !important;
          transform: none !important;
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          min-height: 30px !important;
          max-width: 30px !important;
          max-height: 30px !important;
          margin: 0 !important;
          padding: 0 !important;
          flex: 0 0 30px !important;
          overflow: visible !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .page-character .${ROW_CLASS} > * *,
        .page-character .${ROW_CLASS} img,
        .page-character .${ROW_CLASS} svg,
        .page-character .${ROW_CLASS} canvas {
          position: static !important;
          inset: auto !important;
          transform: none !important;
          display: block !important;
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          min-height: 30px !important;
          max-width: 30px !important;
          max-height: 30px !important;
          object-fit: contain !important;
          object-position: center !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
      }

      @media (max-width: 390px) {
        .page-character .brand-with-portrait {
          padding-right: 92px !important;
        }

        .page-character .${ROW_CLASS} {
          width: 84px !important;
          max-width: 84px !important;
          height: 30px !important;
          max-height: 30px !important;
          gap: 3px !important;
        }

        .page-character .${ROW_CLASS} > *,
        .page-character .${ROW_CLASS} > * *,
        .page-character .${ROW_CLASS} img,
        .page-character .${ROW_CLASS} svg,
        .page-character .${ROW_CLASS} canvas {
          width: 26px !important;
          height: 26px !important;
          min-width: 26px !important;
          min-height: 26px !important;
          max-width: 26px !important;
          max-height: 26px !important;
          flex-basis: 26px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function isTopbarBadgeImage(img) {
    if (!img || !(img instanceof HTMLImageElement)) return false;
    if (!img.closest(".page-character .topbar")) return false;
    if (img.closest("#charPortrait")) return false;
    if (img.closest("#mkwEnergyInlineStatus")) return false;
    if (img.closest(`.${ROW_CLASS}`)) return false;

    const src = String(img.getAttribute("src") || "").toLowerCase();
    const klass = String(img.className || "").toLowerCase();
    const id = String(img.id || "").toLowerCase();
    const alt = String(img.getAttribute("alt") || "").toLowerCase();

    if (src.includes("energy_") || src.includes("pv") || src.includes("heart") || src.includes("icon-") || src.includes("logo")) return false;
    if (klass.includes("energy") || id.includes("energy")) return false;

    return (
      src.includes("badge") ||
      src.includes("ult") ||
      src.includes("ultimate") ||
      src.includes("unique") ||
      klass.includes("badge") ||
      klass.includes("ult") ||
      klass.includes("cu") ||
      id.includes("badge") ||
      id.includes("ult") ||
      id.includes("cu") ||
      alt.includes("coup") ||
      alt.includes("unique") ||
      alt.includes("ultimate")
    );
  }

  function getBadgeRoot(img) {
    const root = img.closest("button, a, [role='button'], [class*='badge'], [class*='Badge'], [class*='ult'], [class*='Ult'], [class*='cu'], [class*='CU']");
    if (!root) return img;
    if (root.closest("#charPortrait") || root.closest("#mkwEnergyInlineStatus")) return img;
    if (!root.closest(".page-character .topbar")) return img;
    return root;
  }

  function syncBadges() {
    ensureStyles();

    const header = document.querySelector(".page-character .brand-with-portrait");
    if (!header) return;

    let row = header.querySelector(`.${ROW_CLASS}`);
    if (!row) {
      row = document.createElement("div");
      row.className = ROW_CLASS;
      row.setAttribute("aria-label", "Badges Coup Unique");
      header.appendChild(row);
    }

    const roots = [];
    document.querySelectorAll(".page-character .topbar img").forEach(img => {
      if (!isTopbarBadgeImage(img)) return;
      const root = getBadgeRoot(img);
      if (!roots.includes(root)) roots.push(root);
    });

    roots.slice(0, 3).forEach(root => {
      if (root.parentElement !== row) row.appendChild(root);
    });

    row.style.display = roots.length ? "flex" : "none";
  }

  function scheduleSync() {
    clearTimeout(scheduleSync.timer);
    scheduleSync.timer = setTimeout(syncBadges, 30);
  }

  function init() {
    syncBadges();
    [80, 180, 350, 700, 1200, 2200].forEach(delay => setTimeout(syncBadges, delay));

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "src"] });

    window.addEventListener("resize", scheduleSync);
    window.addEventListener("pageshow", scheduleSync);
    window.addEventListener("mechkawaii:ultimate-cancelled", scheduleSync);
    window.addEventListener("mechkawaii:ultimate-energy-finalized", scheduleSync);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleSync);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
