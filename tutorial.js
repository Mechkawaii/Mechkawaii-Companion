(function () {
  "use strict";

  const SHEEPARD_SRC = "./assets/sheepard.svg";

  const STEPS = [
    { target: "#hpCard", title: "Centre de commandement", kicker: "PV · Boucliers · Réparation", text: "Soldat, ici tu surveilles l’état complet de ton unité." },
    { target: "#shieldsDisplay", title: "Réserve de boucliers", kicker: "Défense partagée", text: "Attribue les boucliers intelligemment. Chaque décision compte." },
    { target: "#repairKeysDisplay", title: "Clés de réparation", kicker: "Ressource limitée", text: "Les réparations ne sont pas infinies. Utilise-les avec stratégie." },
    { target: "#unitTabs", title: "Escouade active", kicker: "Navigation rapide", text: "Change d’unité rapidement pour garder l’avantage." },
    { target: "#resetBtn", title: "Réinitialisation", kicker: "Sans panique", text: "Tu peux réinitialiser cette unité sans impacter le reste." }
  ];

  let currentStep = 0;
  let overlay = null;
  let highlight = null;
  let tooltip = null;
  let activeTarget = null;
  let tutorialButton = null;

  function cleanupTutorial() {
    overlay?.remove();
    highlight?.remove();
    tooltip?.remove();
    overlay = null;
    highlight = null;
    tooltip = null;
    activeTarget = null;
    if (tutorialButton) tutorialButton.style.display = "block";
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

    if (top + tooltipRect.height > safeBottom) {
      top = rect.top - tooltipRect.height - pad;
    }

    if (top < pad) {
      top = Math.max(pad, safeBottom - tooltipRect.height - pad);
    }

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

    overlay.style.clipPath = `
      polygon(
        0% 0%,
        0% 100%,
        ${left}px 100%,
        ${left}px ${top}px,
        ${right}px ${top}px,
        ${right}px ${bottom}px,
        ${left}px ${bottom}px,
        ${left}px 100%,
        100% 100%,
        100% 0%
      )
    `;

    highlight.style.top = rect.top + "px";
    highlight.style.left = rect.left + "px";
    highlight.style.width = rect.width + "px";
    highlight.style.height = rect.height + "px";

    placeTooltip(rect);
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;

    tooltip.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <img src="${SHEEPARD_SRC}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:2px solid rgba(255,255,255,.2);background:#000;flex:0 0 auto;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:900;color:#ffd24d;text-transform:uppercase;">Général Sheepard</div>
          <div style="font-weight:900;margin-top:4px;">${step.title}</div>
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
      if (isLast) {
        cleanupTutorial();
        return;
      }
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
    if (tutorialButton) tutorialButton.style.display = "none";

    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:3000;transition:clip-path .25s ease";
    overlay.addEventListener("click", cleanupTutorial);
    document.body.appendChild(overlay);

    highlight = document.createElement("div");
    highlight.style.cssText = "position:fixed;border:2px solid #ff4dfc;border-radius:12px;z-index:3001;pointer-events:none;box-shadow:0 0 18px rgba(255,77,252,.7)";
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    tooltip.style.cssText = "position:fixed;width:min(360px,calc(100vw - 28px));background:#111;color:#fff;padding:16px;border-radius:12px;z-index:3002;box-shadow:0 18px 40px rgba(0,0,0,.55)";
    tooltip.addEventListener("click", (event) => event.stopPropagation());
    document.body.appendChild(tooltip);

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