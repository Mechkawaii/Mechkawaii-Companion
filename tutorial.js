(function () {
  "use strict";

  const SHEEPARD_SRC = "./assets/sheepard.svg";

  const STEPS = [
    {
      target: ".hp-section",
      title: "Points de vie",
      kicker: "Fonctionnement des PV",
      text: "Les PV indiquent l’état de ton unité. S’ils tombent à 0, l’unité devient Hors Service (HS). Une unité ne peut jamais dépasser le nombre de PV indiqué sur sa carte.",
      pad: 18
    },
    {
      target: ".shields-section",
      title: "Se protéger",
      kicker: "Boucliers",
      text: "Un bouclier absorbe 1 PV de dégâts. Il disparaît au début de ton prochain tour ou s’il est détruit par une attaque. Une fois utilisé, le jeton bouclier est retiré de la partie.",
      pad: 16
    },
    {
      target: ".repair-section",
      title: "Réparer",
      kicker: "Clés de réparation",
      text: "Chaque unité dispose de 2 clés de réparation en début de partie. Une clé permet de redonner 1 PV ou de relever une unité alliée HS avec 1 PV. Une fois utilisée, elle est retirée de la partie.",
      pad: 16
    },
    {
      target: "#unitTabs",
      title: "Tes 3 unités",
      kicker: "Phase de combat",
      text: "À ton tour, tu choisis les actions de chacune de tes 3 unités, dans l’ordre de ton choix : se déplacer, attaquer, réparer, se protéger ou utiliser une action spéciale.",
      pad: 12
    },
    {
      target: "#resetBtn",
      title: "Réinitialisation",
      kicker: "Outil Companion",
      text: "Ce bouton remet cette fiche dans son état de départ pour recommencer proprement une partie ou corriger une erreur de manipulation.",
      pad: 12
    }
  ];

  let currentStep = 0;
  let overlay = null;
  let blocker = null;
  let highlight = null;
  let tooltip = null;
  let activeTarget = null;
  let activeStep = null;
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
    activeStep = null;
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
    const pad = Number(activeStep?.pad ?? 12);
    const top = Math.max(4, rect.top - pad);
    const left = Math.max(4, rect.left - pad);
    const right = Math.min(window.innerWidth - 4, rect.right + pad);
    const bottom = Math.min(window.innerHeight - 4, rect.bottom + pad);

    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;

    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = (right - left) + "px";
    highlight.style.height = (bottom - top) + "px";

    placeTooltip({ top, left, right, bottom, width: right - left, height: bottom - top });
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;

    tooltip.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <img src="${SHEEPARD_SRC}" style="width:clamp(96px,9vw,128px);height:clamp(96px,9vw,128px);border-radius:18px;object-fit:cover;border:3px solid rgba(255,255,255,.3);background:#000;flex:0 0 auto;box-shadow:0 0 16px rgba(255,210,77,.45);">
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
    activeStep = step;
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
    tooltip.style.cssText = "position:fixed;width:min(520px,calc(100vw - 28px));background:#111;color:#fff;padding:16px;border-radius:14px;z-index:3002;box-shadow:0 18px 40px rgba(0,0,0,.55);pointer-events:auto";
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