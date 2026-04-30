(function () {
  "use strict";

  let raf = null;

  function isMobile() {
    return window.innerWidth <= 700;
  }

  function isClassActionStep() {
    const title = document.querySelector(".mkw-tutorial-title")?.textContent?.trim() || "";
    return title === "Action de classe" || title === "Class Action";
  }

  function getClassActionCard() {
    return document.querySelector("#classActionTitle")?.closest(".card") || null;
  }

  function getTabsTop() {
    const tabs = document.querySelector("#unitTabsContainer");
    return tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
  }

  function scrollByAmount(amount) {
    const root = document.scrollingElement || document.documentElement;
    root.scrollTop += amount;
  }

  function placeCardAboveTabs(card) {
    if (!card || !isMobile()) return;

    const desiredTop = 104;
    const safeBottom = getTabsTop() - 28;

    let rect = card.getBoundingClientRect();
    if (rect.top !== desiredTop) {
      scrollByAmount(rect.top - desiredTop);
    }

    rect = card.getBoundingClientRect();
    if (rect.bottom > safeBottom) {
      scrollByAmount(rect.bottom - safeBottom);
    }

    rect = card.getBoundingClientRect();
    if (rect.top < 76) {
      scrollByAmount(rect.top - 76);
    }
  }

  function repositionTutorialBox(card) {
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

    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 14;
    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    const tooltipLeft = Math.max(margin, Math.min(left, maxLeft));
    const spaceAbove = top - margin;
    const spaceBelow = getTabsTop() - bottom - margin;
    let tooltipTop = bottom + 18;

    if (spaceBelow < tooltipRect.height + 18 && spaceAbove > spaceBelow) {
      tooltipTop = top - tooltipRect.height - 18;
    }
    if (tooltipTop < margin) tooltipTop = margin;
    if (tooltipTop + tooltipRect.height > getTabsTop() - margin) {
      tooltipTop = Math.max(margin, getTabsTop() - tooltipRect.height - margin);
    }

    tooltip.style.left = tooltipLeft + "px";
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top = tooltipTop + "px";
  }

  function fixClassActionStep() {
    if (!isMobile() || !isClassActionStep()) return;
    const card = getClassActionCard();
    if (!card) return;

    placeCardAboveTabs(card);
    requestAnimationFrame(() => {
      placeCardAboveTabs(card);
      repositionTutorialBox(card);
    });
    setTimeout(() => {
      placeCardAboveTabs(card);
      repositionTutorialBox(card);
    }, 90);
    setTimeout(() => {
      placeCardAboveTabs(card);
      repositionTutorialBox(card);
    }, 220);
  }

  function scheduleFix() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fixClassActionStep);
  }

  function init() {
    const observer = new MutationObserver(scheduleFix);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", scheduleFix);
    window.addEventListener("orientationchange", scheduleFix);
    document.addEventListener("click", event => {
      if (event.target.closest?.("#next,#prev")) setTimeout(scheduleFix, 50);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
