(function () {
  "use strict";

  let raf = null;

  function isMobile() {
    return window.innerWidth <= 700;
  }

  function getTabsTop() {
    const tabs = document.querySelector("#unitTabsContainer");
    return tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
  }

  function scrollByAmount(amount) {
    const root = document.scrollingElement || document.documentElement;
    root.scrollTop += amount;
  }

  function currentMainTitle() {
    return document.querySelector(".mkw-tutorial-title")?.textContent?.trim() || "";
  }

  function currentPatternTitle() {
    return document.querySelector(".mkw-pattern-tuto-title")?.textContent?.trim() || "";
  }

  function getMainTargetCard() {
    const title = currentMainTitle();
    if (title === "Action de classe" || title === "Class Action") {
      return document.querySelector("#classActionTitle")?.closest(".card") || null;
    }
    if (title === "Coup Unique" || title === "Ultimate Ability") {
      return document.querySelector("#ultTitle")?.closest(".card") || null;
    }
    return null;
  }

  function getPatternTargetCard() {
    const title = currentPatternTitle();
    if (title === "Déplacement" || title === "Movement") {
      return document.querySelector("#movementImg")?.closest(".card") || null;
    }
    if (title === "Attaque" || title === "Attack") {
      return document.querySelector("#attackImg")?.closest(".card") || null;
    }
    return null;
  }

  function placeAboveTabs(target, desiredTop) {
    if (!target || !isMobile()) return;

    const safeBottom = getTabsTop() - 30;
    let rect = target.getBoundingClientRect();

    if (Math.abs(rect.top - desiredTop) > 6) {
      scrollByAmount(rect.top - desiredTop);
    }

    rect = target.getBoundingClientRect();
    if (rect.bottom > safeBottom) {
      scrollByAmount(rect.bottom - safeBottom);
    }

    rect = target.getBoundingClientRect();
    if (rect.top < 74) {
      scrollByAmount(rect.top - 74);
    }
  }

  function placeTooltip(tooltip, rect) {
    if (!tooltip) return;

    const margin = 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    const safeTop = margin;
    const safeBottom = getTabsTop() - margin;
    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    const left = Math.max(margin, Math.min(rect.left, maxLeft));

    const spaceBelow = safeBottom - rect.bottom;
    const spaceAbove = rect.top - safeTop;
    let top = rect.bottom + 18;

    if (spaceBelow < tooltipRect.height + 18 && spaceAbove > spaceBelow) {
      top = rect.top - tooltipRect.height - 18;
    }

    if (top < safeTop) top = safeTop;
    if (top + tooltipRect.height > safeBottom) {
      top = Math.max(safeTop, safeBottom - tooltipRect.height);
    }

    tooltip.style.left = left + "px";
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top = top + "px";
  }

  function drawMainHighlight(card) {
    const overlay = document.querySelector(".mkw-tutorial-overlay");
    const highlight = document.querySelector(".mkw-tutorial-highlight");
    const tooltip = document.querySelector(".mkw-tutorial-tooltip");
    if (!overlay || !highlight || !tooltip || !card) return;

    const pad = 18;
    const rect = card.getBoundingClientRect();
    const top = Math.max(10, rect.top - pad);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottom = Math.min(getTabsTop() - 12, rect.bottom + pad, window.innerHeight - 10);

    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;
    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = Math.max(0, right - left) + "px";
    highlight.style.height = Math.max(0, bottom - top) + "px";
    placeTooltip(tooltip, { top, left, right, bottom });
  }

  function drawPatternHighlight(card) {
    const overlay = document.querySelector("#mkwPatternTutorialOverlay");
    const highlight = document.querySelector("#mkwPatternTutorialHighlight");
    const tooltip = document.querySelector("#mkwPatternTutorialTooltip");
    if (!overlay || !highlight || !tooltip || !card) return;

    const pad = 14;
    const rect = card.getBoundingClientRect();
    const top = Math.max(10, rect.top - pad);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottom = Math.min(getTabsTop() - 12, rect.bottom + pad, window.innerHeight - 10);

    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;
    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = Math.max(0, right - left) + "px";
    highlight.style.height = Math.max(0, bottom - top) + "px";
    placeTooltip(tooltip, { top, left, right, bottom });
  }

  function normalizePatternButtons() {
    const tooltip = document.querySelector("#mkwPatternTutorialTooltip");
    if (!tooltip) return;

    tooltip.querySelectorAll(".mkw-pattern-tuto-actions button").forEach(button => {
      button.style.background = "rgba(255,255,255,.06)";
      button.style.color = "#fff";
      button.style.border = "1px solid rgba(255,255,255,.14)";
      button.style.boxShadow = "none";
    });

    const prev = tooltip.querySelector("[data-pattern-prev]");
    const title = currentPatternTitle();
    if (prev && (title === "Déplacement" || title === "Movement")) {
      prev.disabled = false;
      prev.removeAttribute("disabled");
      prev.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        document.querySelector("#mkwPatternTutorialOverlay")?.remove();
        document.querySelector("#mkwPatternTutorialHighlight")?.remove();
        document.querySelector("#mkwPatternTutorialTooltip")?.remove();
        const card = getMainTargetCard();
        if (card) {
          placeAboveTabs(card, 104);
          setTimeout(() => drawMainHighlight(card), 40);
        }
      };
    }
  }

  function applyFixes() {
    normalizePatternButtons();

    const mainCard = getMainTargetCard();
    if (mainCard) {
      placeAboveTabs(mainCard, 104);
      requestAnimationFrame(() => {
        placeAboveTabs(mainCard, 104);
        drawMainHighlight(mainCard);
      });
      setTimeout(() => drawMainHighlight(mainCard), 120);
    }

    const patternCard = getPatternTargetCard();
    if (patternCard) {
      placeAboveTabs(patternCard, 104);
      requestAnimationFrame(() => {
        placeAboveTabs(patternCard, 104);
        drawPatternHighlight(patternCard);
      });
      setTimeout(() => drawPatternHighlight(patternCard), 120);
    }
  }

  function scheduleFix() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(applyFixes);
  }

  function injectStyleOverride() {
    if (document.getElementById("mkwTutorialTuningFixStyle")) return;
    const style = document.createElement("style");
    style.id = "mkwTutorialTuningFixStyle";
    style.textContent = `
      #mkwPatternTutorialTooltip .mkw-pattern-tuto-actions button,
      #mkwPatternTutorialTooltip .mkw-pattern-tuto-actions button:last-child {
        background: rgba(255,255,255,.06) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        box-shadow: none !important;
      }
      #mkwPatternTutorialTooltip .mkw-pattern-tuto-actions button:disabled {
        opacity: .35 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyleOverride();
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    window.addEventListener("resize", scheduleFix);
    window.addEventListener("orientationchange", scheduleFix);
    document.addEventListener("click", event => {
      if (event.target.closest?.("#next,#prev,[data-pattern-next],[data-pattern-prev]")) {
        setTimeout(scheduleFix, 40);
        setTimeout(scheduleFix, 140);
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
