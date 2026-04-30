(function () {
  "use strict";

  let raf = null;
  let lastMode = "none";

  function isMobile() { return window.innerWidth <= 700; }

  function getTabsTop() {
    const tabs = document.querySelector("#unitTabsContainer");
    return tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
  }

  function getScrollRoot() {
    return document.scrollingElement || document.documentElement;
  }

  function temporarilyUnlockScroll(callback) {
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      bodyTouchAction: body.style.touchAction,
      htmlTouchAction: html.style.touchAction
    };

    body.style.setProperty("overflow", "auto", "important");
    html.style.setProperty("overflow", "auto", "important");
    body.style.setProperty("touch-action", "none", "important");
    html.style.setProperty("touch-action", "none", "important");

    try { callback(); }
    finally {
      requestAnimationFrame(() => {
        body.style.setProperty("overflow", prev.bodyOverflow || "hidden", "important");
        html.style.setProperty("overflow", prev.htmlOverflow || "hidden", "important");
        if (prev.bodyTouchAction) body.style.touchAction = prev.bodyTouchAction;
        else body.style.removeProperty("touch-action");
        if (prev.htmlTouchAction) html.style.touchAction = prev.htmlTouchAction;
        else html.style.removeProperty("touch-action");
      });
    }
  }

  function currentMainTitle() {
    return document.querySelector(".mkw-tutorial-title")?.textContent?.trim() || "";
  }

  function currentPatternTitle() {
    return document.querySelector(".mkw-pattern-tuto-title")?.textContent?.trim() || "";
  }

  function patternIsOpen() { return !!document.querySelector("#mkwPatternTutorialTooltip"); }

  function getMainTargetCard() {
    const title = currentMainTitle();
    if (title === "Action de classe" || title === "Class Action") return document.querySelector("#classActionTitle")?.closest(".card") || null;
    if (title === "Coup Unique" || title === "Ultimate Ability") return document.querySelector("#ultTitle")?.closest(".card") || null;
    return null;
  }

  function getPatternTargetCard() {
    const title = currentPatternTitle();
    if (title === "Déplacement" || title === "Movement") return document.querySelector("#movementImg")?.closest(".card") || null;
    if (title === "Attaquer" || title === "Attack") return document.querySelector("#attackImg")?.closest(".card") || null;
    return null;
  }

  function cleanupBadPinnedState() {
    document.querySelectorAll(".mkw-tutorial-pinned-card").forEach(card => {
      card.classList.remove("mkw-tutorial-pinned-card");
      card.removeAttribute("style");
    });
    document.querySelectorAll(".mkw-tutorial-pin-placeholder").forEach(el => el.remove());
  }

  function cameraToCard(card, mode) {
    if (!card || !isMobile()) return;
    const root = getScrollRoot();
    const rect = card.getBoundingClientRect();
    const currentY = root.scrollTop || window.scrollY || 0;
    const tabsTop = getTabsTop();
    const safeTop = mode === "main" ? 86 : 92;
    const safeBottom = tabsTop - 42;
    const availableHeight = Math.max(150, safeBottom - safeTop);

    let desiredTop = safeTop;
    if (rect.height < availableHeight) {
      desiredTop = safeTop + Math.max(0, (availableHeight - rect.height) / 2);
    }

    let nextY = currentY + rect.top - desiredTop;
    const projectedBottom = desiredTop + rect.height;
    if (projectedBottom > safeBottom) {
      nextY += projectedBottom - safeBottom;
    }

    const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
    nextY = Math.max(0, Math.min(maxY, nextY));

    if (Math.abs(nextY - currentY) < 2) return;

    temporarilyUnlockScroll(() => {
      root.scrollTop = nextY;
      window.scrollTo(0, nextY);
    });
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
    if (spaceBelow < tooltipRect.height + 18 && spaceAbove > spaceBelow) top = rect.top - tooltipRect.height - 18;
    if (top < safeTop) top = safeTop;
    if (top + tooltipRect.height > safeBottom) top = Math.max(safeTop, safeBottom - tooltipRect.height);
    tooltip.style.left = left + "px";
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top = top + "px";
  }

  function setMainTutorialHidden(hidden) {
    [document.querySelector(".mkw-tutorial-tooltip"), document.querySelector(".mkw-tutorial-highlight"), document.querySelector(".mkw-tutorial-overlay")].forEach(el => {
      if (!el) return;
      el.style.visibility = hidden ? "hidden" : "";
      el.style.pointerEvents = hidden ? "none" : "";
    });
  }

  function drawHighlight({ card, overlay, highlight, tooltip, pad = 18, allowFull = false }) {
    if (!overlay || !highlight || !tooltip || !card) return;
    const rect = card.getBoundingClientRect();
    const top = Math.max(10, rect.top - pad);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const naturalBottom = Math.min(window.innerHeight - 10, rect.bottom + pad);
    const limitedBottom = Math.min(getTabsTop() - 12, naturalBottom);
    const bottom = allowFull ? naturalBottom : limitedBottom;
    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;
    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = Math.max(0, right - left) + "px";
    highlight.style.height = Math.max(0, bottom - top) + "px";
    placeTooltip(tooltip, { top, left, right, bottom });
  }

  function drawMainHighlight(card) {
    if (patternIsOpen()) return;
    drawHighlight({
      card,
      overlay: document.querySelector(".mkw-tutorial-overlay"),
      highlight: document.querySelector(".mkw-tutorial-highlight"),
      tooltip: document.querySelector(".mkw-tutorial-tooltip"),
      pad: 18,
      allowFull: true
    });
  }

  function drawPatternHighlight(card) {
    drawHighlight({
      card,
      overlay: document.querySelector("#mkwPatternTutorialOverlay"),
      highlight: document.querySelector("#mkwPatternTutorialHighlight"),
      tooltip: document.querySelector("#mkwPatternTutorialTooltip"),
      pad: 16,
      allowFull: true
    });
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
  }

  function applyFixes() {
    cleanupBadPinnedState();
    normalizePatternButtons();

    const patternCard = getPatternTargetCard();
    if (patternCard) {
      setMainTutorialHidden(true);
      if (lastMode !== "pattern:" + currentPatternTitle()) {
        cameraToCard(patternCard, "pattern");
        lastMode = "pattern:" + currentPatternTitle();
      }
      requestAnimationFrame(() => {
        cameraToCard(patternCard, "pattern");
        drawPatternHighlight(patternCard);
      });
      setTimeout(() => drawPatternHighlight(patternCard), 90);
      return;
    }

    setMainTutorialHidden(false);

    const mainCard = getMainTargetCard();
    if (mainCard) {
      if (lastMode !== "main:" + currentMainTitle()) {
        cameraToCard(mainCard, "main");
        lastMode = "main:" + currentMainTitle();
      }
      requestAnimationFrame(() => drawMainHighlight(mainCard));
      setTimeout(() => drawMainHighlight(mainCard), 90);
      return;
    }

    lastMode = "none";
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
      #mkwPatternTutorialTooltip .mkw-pattern-tuto-actions button:disabled { opacity: .35 !important; }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyleOverride();
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", () => { lastMode = "resize"; scheduleFix(); });
    window.addEventListener("orientationchange", () => { lastMode = "orientation"; scheduleFix(); });
    document.addEventListener("click", event => {
      if (event.target.closest?.("#next,#prev,[data-pattern-next],[data-pattern-prev]")) {
        lastMode = "click";
        setTimeout(scheduleFix, 50);
        setTimeout(scheduleFix, 160);
      }
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
