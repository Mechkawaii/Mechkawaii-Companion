(function () {
  "use strict";

  const SHEEPARD_SRC = "./assets/sheepard.svg";

  const STEPS = [
    { target: ".hp-section", title: "Centre de commandement", kicker: "PV · Boucliers · Réparation", text: "Soldat, ici tu surveilles l’état complet de ton unité." },
    { target: "#shieldsDisplay", title: "Réserve de boucliers", kicker: "Défense partagée", text: "Attribue les boucliers intelligemment. Chaque décision compte." },
    { target: "#repairKeysDisplay", title: "Clés de réparation", kicker: "Ressource limitée", text: "Les réparations ne sont pas infinies. Utilise-les avec stratégie." },
    { target: "#unitTabs", title: "Escouade active", kicker: "Navigation rapide", text: "Change d’unité rapidement pour garder l’avantage." },
    { target: "#resetBtn", title: "Réinitialisation", kicker: "Sans panique", text: "Tu peux réinitialiser cette unité sans impacter le reste." }
  ];

  let currentStep = 0;
  let overlay = null;
  let blocker = null;
  let highlight = null;
  let tooltip = null;
  let activeTarget = null;
  let tutorialButton = null;
  let previousBodyOverflow = "";
  let previousHtmlOverflow = "";
  let scrollLocked = false;

  function lockPage() {
    if (scrollLocked) return;
    previousBodyOverflow = document.body.style.overflow || "";
    previousHtmlOverflow = document.documentElement.style.overflow || "";
    document.body.style.setProperty("overflow", "hidden", "important");
    document.documentElement.style.setProperty("overflow", "hidden", "important");
    scrollLocked = true;
  }

  function unlockPage() {
    if (!scrollLocked) return;
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
    scrollLocked = false;
  }

  function blockScroll(event) {
    if (!overlay) return;
    event.preventDefault();
  }

  function cleanupTutorial() {
    window.removeEventListener("wheel", blockScroll, { passive: false });
    window.removeEventListener("touchmove", blockScroll, { passive: false });
    window.removeEventListener("keydown", blockKeyboardScroll);

    overlay?.remove();
    blocker?.remove();
    highlight?.remove();
    tooltip?.remove();
    overlay = null;
    blocker = null;
    highlight = null;
    tooltip = null;
    activeTarget = null;
    unlockPage();
    if (tutorialButton) tutorialButton.style.display = "block";
  }

  function blockKeyboardScroll(event) {
    if (!overlay) return;
    const blockedKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
    if (blockedKeys.includes(event.key)) event.preventDefault();
  }

  function placeTooltip(rect) {
    if (!tooltip) return;

    const pad = 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    const tabsContainer = document.querySelector("#unitTabsContainer");
    const tabsRect = tabsContainer ? tabsContainer.getBoundingClientRect() : null;
    const safeBottom = tabsRect ? Math.max(0, tabsRect.top - pad) : window.innerHeight - pad;

    let left = Math.max(pad, Math.min(rect.left, window.innerWidth - tooltipRect.width - pad));
    let top = rect.bottom + pad;

    if (top + tooltipRect.height > safeBottom) top = rect.top - tooltipRect.height - pad;
    if (top < pad) top = Math.max(pad, safeBottom - tooltipRect.height - pad);

    tooltip.style.left = left + "px";
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top = top + "px";
  }

  function updateOverlayPosition() {
    if (!activeTarget || !highlight || !tooltip || !overlay) return;

    const rect = activeTarget.getBoundingClientRect();
    const pad = 10;
    const top = rect.top - pad;
    const left = rect.left - pad;
    const right = rect.right + pad;
    const bottom = rect.bottom + pad;

    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;

    highlight.style.top = rect.top + "px";
    highlight.style.left = rect.left + "px";
    highlight.style.width = rect.width + "px";
    highlight.style.height = rect.height + "px";

    placeTooltip(rect);
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;

    tooltip.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <img src="${SHEEPARD_SRC}" style="width:clamp(64px,18vw,80px);height:clamp(64px,18vw,80px);border-radius:16px;object-fit:cover;border:3px solid rgba(255,255,255,.3);background:#000;flex:0 0 auto;box-shadow:0 0 12px rgba(255,210,77,.4);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:900;color:#ffd24d;text-transform:uppercase;">Général Sheepard</div>
          <div style="font-weight:900;margin-top:4px;font-size:17px;">${step.title}</div>
          <div style="margin-top:6px;line-height:1.4;">${step.text}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;gap:10px;">
        <button id="prev" ${currentStep === 0 ? "disabled" : ""}>←</button>
        <button id="next">${isLast ? "Terminer" : "Suivant"}</button>
      </div>
    `;

    document.getElementById("prev")?.addEventListener("click", () => {
      if (currentStep <= 0) return;
      currentStep--;
      showStep();
    });

    document.getElementById("next")?.addEventListener("click", () => {
      if (isLast) return cleanupTutorial();
      currentStep++;
      showStep();
    });
  }

  function showStep() {
    const step = STEPS[currentStep];
    const target = document.querySelector(step?.target);
    if (!target) return;

    activeTarget = target;
    target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
    renderTooltip(step);

    requestAnimationFrame(() => {
      updateOverlayPosition();
      setTimeout(updateOverlayPosition, 80);
      setTimeout(updateOverlayPosition, 180);
    });
  }

  function startTutorial() {
    cleanupTutorial();
    currentStep = 0;
    lockPage();
    if (tutorialButton) tutorialButton.style.display = "none";

    blocker = document.createElement("div");
    blocker.style.cssText = "position:fixed;inset:0;z-index:2999;background:transparent;touch-action:none;";
    blocker.addEventListener("click", (event) => event.preventDefault());
    document.body.appendChild(blocker);

    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:3000;transition:clip-path .25s ease;pointer-events:none;touch-action:none";
    document.body.appendChild(overlay);

    highlight = document.createElement("div");
    highlight.style.cssText = "position:fixed;border:2px solid #ff4dfc;border-radius:12px;z-index:3001;pointer-events:none;box-shadow:0 0 18px rgba(255,77,252,.7)";
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    tooltip.style.cssText = "position:fixed;width:min(380px,calc(100vw - 28px));background:#111;color:#fff;padding:16px;border-radius:14px;z-index:3002;box-shadow:0 18px 40px rgba(0,0,0,.55);pointer-events:auto";
    tooltip.addEventListener("click", (event) => event.stopPropagation());
    document.body.appendChild(tooltip);

    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
    window.addEventListener("keydown", blockKeyboardScroll);

    showStep();
  }

  document.addEventListener("DOMContentLoaded", () => {
    tutorialButton = document.createElement("button");
    tutorialButton.textContent = "ⓘ";
    tutorialButton.style.cssText = "position:fixed;top:80px;right:10px;z-index:9999";
    tutorialButton.onclick = startTutorial;
    document.body.appendChild(tutorialButton);
  });
})();