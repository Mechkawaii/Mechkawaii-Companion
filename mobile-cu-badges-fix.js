(function () {
  "use strict";

  const STYLE_ID = "mkwMobileCuBadgesHardFixStyles";
  const ROW_CLASS = "mkw-mobile-cu-badges-row";
  const HEADER_CLASS = "mkw-mobile-cu-header-host";
  const BADGE_CLASS = "mkw-mobile-cu-badge-force";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 560px) {
        .topbar {
          overflow: hidden !important;
        }

        .topbar .brand-with-portrait {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          max-width: calc(100% - 104px) !important;
        }

        .topbar .controls {
          flex: 0 0 104px !important;
          width: 104px !important;
          max-width: 104px !important;
          min-width: 104px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 5px !important;
          overflow: visible !important;
        }

        .topbar .controls .pill:has(#lang),
        .topbar .controls select,
        .topbar .controls #lang {
          display: none !important;
        }

        .topbar .controls > *:not(.pill),
        .topbar .controls img,
        .topbar .controls svg,
        .topbar .controls canvas,
        .topbar .controls button:not(#mkwCompanionMenuButton) {
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          min-height: 30px !important;
          max-width: 30px !important;
          max-height: 30px !important;
          flex: 0 0 30px !important;
          margin: 0 !important;
          padding: 0 !important;
          object-fit: contain !important;
          object-position: center !important;
          background-size: contain !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          overflow: visible !important;
          transform: none !important;
          clip-path: none !important;
          -webkit-clip-path: none !important;
        }

        .${HEADER_CLASS} {
          position: relative !important;
          overflow: visible !important;
          padding-right: 112px !important;
        }

        .${HEADER_CLASS} * {
          min-width: 0;
        }

        .${HEADER_CLASS} #charName,
        .${HEADER_CLASS} #charClass,
        .${HEADER_CLASS} [data-char-name],
        .${HEADER_CLASS} [data-char-class] {
          max-width: calc(100vw - 210px) !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        .${ROW_CLASS} {
          position: absolute !important;
          z-index: 9999 !important;
          top: 50% !important;
          right: 8px !important;
          transform: translateY(-50%) !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 5px !important;
          width: 104px !important;
          max-width: 104px !important;
          height: 36px !important;
          max-height: 36px !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }

        .${BADGE_CLASS},
        .${BADGE_CLASS} * {
          box-sizing: border-box !important;
          position: relative !important;
          inset: auto !important;
          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          left: auto !important;
          transform: none !important;
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          min-height: 30px !important;
          max-width: 30px !important;
          max-height: 30px !important;
          flex: 0 0 30px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          object-fit: contain !important;
          object-position: center !important;
          background-size: contain !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          border-radius: 0 !important;
          clip-path: none !important;
          -webkit-clip-path: none !important;
        }

        .${BADGE_CLASS} img,
        .${BADGE_CLASS} svg,
        .${BADGE_CLASS} canvas {
          display: block !important;
          width: 30px !important;
          height: 30px !important;
          min-width: 30px !important;
          min-height: 30px !important;
          max-width: 30px !important;
          max-height: 30px !important;
          object-fit: contain !important;
        }
      }

      @media (max-width: 390px) {
        .topbar .brand-with-portrait {
          max-width: calc(100% - 92px) !important;
        }

        .topbar .controls {
          flex-basis: 92px !important;
          width: 92px !important;
          max-width: 92px !important;
          min-width: 92px !important;
          gap: 4px !important;
        }

        .topbar .controls > *:not(.pill),
        .topbar .controls img,
        .topbar .controls svg,
        .topbar .controls canvas,
        .topbar .controls button:not(#mkwCompanionMenuButton) {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
          max-width: 28px !important;
          max-height: 28px !important;
          flex-basis: 28px !important;
        }

        .${HEADER_CLASS} {
          padding-right: 100px !important;
        }

        .${HEADER_CLASS} #charName,
        .${HEADER_CLASS} #charClass,
        .${HEADER_CLASS} [data-char-name],
        .${HEADER_CLASS} [data-char-class] {
          max-width: calc(100vw - 198px) !important;
        }

        .${ROW_CLASS} {
          width: 92px !important;
          max-width: 92px !important;
          height: 32px !important;
          max-height: 32px !important;
          gap: 4px !important;
          right: 6px !important;
        }

        .${BADGE_CLASS},
        .${BADGE_CLASS} *,
        .${BADGE_CLASS} img,
        .${BADGE_CLASS} svg,
        .${BADGE_CLASS} canvas {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
          max-width: 28px !important;
          max-height: 28px !important;
          flex-basis: 28px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 560px)").matches;
  }

  function getNameEl() {
    return document.querySelector("#charName, [data-char-name]") ||
      Array.from(document.querySelectorAll(".title, h1, h2")).find(el => {
        const text = String(el.textContent || "").trim();
        return text.length > 1 && text.length < 28 && !text.toLowerCase().includes("companion");
      });
  }

  function getHeaderHost() {
    const name = getNameEl();
    if (!name) return null;

    return name.closest(".topbar, .card, [class*='header'], [class*='Header'], [class*='hero'], [class*='Hero'], [class*='banner'], [class*='Banner'], [class*='unit'], [class*='Unit']") ||
      name.parentElement?.parentElement ||
      document.querySelector(".container > *:first-child");
  }

  function hasVisualBackground(el) {
    if (!(el instanceof Element)) return false;
    const bg = getComputedStyle(el).backgroundImage || "";
    return bg !== "none" && bg.includes("url(");
  }

  function isExcluded(el) {
    return !!el.closest("#charPortrait, #mkwEnergyInlineStatus, #charName, #charClass, [data-char-name], [data-char-class], #hpCard, #unitTabsContainer, .unit-tabs-container, .pill, select, .breadcrumb, nav, .mkw-companion-menu, .mkw-theme-toggle, .theme-toggle");
  }

  function looksLikeCuBadge(el, hostRect) {
    if (!(el instanceof Element)) return false;
    if (el.classList.contains(ROW_CLASS)) return false;
    if (el.classList.contains(BADGE_CLASS)) return true;
    if (isExcluded(el)) return false;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (rect.bottom < hostRect.top || rect.top > hostRect.bottom) return false;

    const roughlySquare = Math.abs(rect.width - rect.height) <= Math.max(28, Math.min(rect.width, rect.height) * 0.55);
    const usableSize = rect.width >= 38 && rect.height >= 38 && rect.width <= 180 && rect.height <= 180;
    const onRight = rect.left > window.innerWidth * 0.42;
    const visual = ["IMG", "SVG", "CANVAS", "PICTURE", "BUTTON", "A"].includes(el.tagName) || hasVisualBackground(el) || !!el.querySelector("img, svg, canvas");

    const text = String(el.textContent || "").trim();
    const mostlyIcon = text.length <= 10;

    return roughlySquare && usableSize && onRight && visual && mostlyIcon;
  }

  function bestRoot(el, host) {
    const root = el.closest("button, a, [role='button'], [class*='badge'], [class*='Badge'], [class*='ult'], [class*='Ult'], [class*='unique'], [class*='Unique'], [class*='cu'], [class*='CU']");
    if (root && host.contains(root) && !isExcluded(root)) return root;
    return el;
  }

  function syncBadges() {
    ensureStyles();
    if (!isMobile()) return;

    const host = getHeaderHost();
    if (!host) return;

    host.classList.add(HEADER_CLASS);
    host.style.overflow = "visible";

    let row = host.querySelector(`.${ROW_CLASS}`);
    if (!row) {
      row = document.createElement("div");
      row.className = ROW_CLASS;
      row.setAttribute("aria-label", "Badges Coup Unique");
      host.appendChild(row);
    }

    const hostRect = host.getBoundingClientRect();
    const found = [];

    Array.from(host.querySelectorAll("img, svg, canvas, button, a, [role='button'], div, span")).forEach(el => {
      if (!looksLikeCuBadge(el, hostRect)) return;
      const root = bestRoot(el, host);
      if (!found.includes(root) && !root.classList.contains(ROW_CLASS)) found.push(root);
    });

    found
      .filter(el => el !== row && !row.contains(el))
      .slice(0, 3)
      .forEach(el => {
        el.classList.add(BADGE_CLASS);
        row.appendChild(el);
      });

    Array.from(row.children).forEach(child => child.classList.add(BADGE_CLASS));
    row.style.display = row.children.length ? "flex" : "none";
  }

  function scheduleSync() {
    clearTimeout(scheduleSync.timer);
    scheduleSync.timer = setTimeout(syncBadges, 40);
  }

  function init() {
    ensureStyles();
    syncBadges();
    [80, 160, 320, 700, 1200, 2200, 3500].forEach(delay => setTimeout(syncBadges, delay));

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
