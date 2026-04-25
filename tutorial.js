(function () {
  "use strict";

  const SHEEPARD_SRC = "./assets/sheepard.svg";

  const STEPS = [
    {
      target: ".hp-section",
      title: "Points de vie",
      kicker: "Fonctionnement des PV",
      text: "Les PV indiquent l’état de ton unité. S’ils tombent à 0, l’unité devient Hors Service (HS). Une unité ne peut jamais dépasser le nombre de PV indiqué sur sa carte.",
      pad: 12,
      mobileTop: 118
    },
    {
      target: ".shields-section",
      title: "Se protéger",
      kicker: "Boucliers",
      text: "Un bouclier absorbe 1 PV de dégâts. Il disparaît au début de ton prochain tour ou s’il est détruit par une attaque. Une fois utilisé, le jeton bouclier est retiré de la partie.",
      pad: 16,
      mobileTop: 110
    },
    {
      target: ".repair-section",
      title: "Réparer",
      kicker: "Clés de réparation",
      text: "Chaque unité dispose de 2 clés de réparation en début de partie. Une clé permet de redonner 1 PV ou de relever une unité alliée HS avec 1 PV. Une fois utilisée, elle est retirée de la partie.",
      pad: 16,
      mobileTop: 110
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

  function isMobile(){ return window.innerWidth <= 700; }

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
    if (tooltip && tooltip.contains(event.target)) return;
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

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function positionTargetForMobile(target, step) {
    if (!isMobile() || !target) return;

    const desiredTop = Number(step?.mobileTop ?? 105);
    const rect = target.getBoundingClientRect();
    const delta = rect.top - desiredTop;

    if (Math.abs(delta) > 6) {
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    }
  }

  function placeTooltip(rect) {
    if (!tooltip) return;

    const pad = isMobile() ? 18 : 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    const tabsContainer = document.querySelector("#unitTabsContainer");
    const tabsRect = tabsContainer ? tabsContainer.getBoundingClientRect() : null;
    const safeBottom = tabsRect ? Math.max(0, tabsRect.top - pad) : window.innerHeight - pad;
    const safeTop = isMobile() ? 22 : pad;
    const maxLeft = window.innerWidth - tooltipRect.width - pad;
    const centeredLeft = Math.max(pad, Math.min((window.innerWidth - tooltipRect.width) / 2, maxLeft));
    const targetLeft = Math.max(pad, Math.min(rect.left, maxLeft));

    const mobileBelowGap = isMobile() ? 22 : pad;
    const mobileAboveGap = isMobile() ? 22 : pad;

    const candidates = [
      { top: rect.bottom + mobileBelowGap, left: targetLeft },
      { top: rect.top - tooltipRect.height - mobileAboveGap, left: targetLeft },
      { top: safeTop, left: centeredLeft },
      { top: safeBottom - tooltipRect.height, left: centeredLeft }
    ];

    let chosen = candidates.find(pos => {
      const candidateRect = {
        top: pos.top,
        left: pos.left,
        right: pos.left + tooltipRect.width,
        bottom: pos.top + tooltipRect.height
      };
      return pos.top >= safeTop && candidateRect.bottom <= safeBottom && !rectsOverlap(candidateRect, rect);
    });

    if (!chosen) {
      const spaceAbove = rect.top - safeTop;
      const spaceBelow = safeBottom - rect.bottom;
      chosen = spaceAbove >= spaceBelow
        ? { top: safeTop, left: centeredLeft }
        : { top: Math.max(safeTop, safeBottom - tooltipRect.height), left: centeredLeft };
    }

    tooltip.style.left = Math.max(pad, Math.min(chosen.left, maxLeft)) + "px";
    tooltip.style.right = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top = Math.max(safeTop, Math.min(chosen.top, safeBottom - tooltipRect.height)) + "px";
  }

  function updateOverlayPosition() {
    if (!activeTarget || !highlight || !tooltip || !overlay) return;

    const rect = activeTarget.getBoundingClientRect();
    const pad = Number(activeStep?.pad ?? 12);
    const mobileExtraTop = isMobile() && activeStep?.target === ".hp-section" ? 2 : 0;
    const mobileExtraBottom = isMobile() && activeStep?.target === ".hp-section" ? 8 : 0;
    const top = Math.max(10, rect.top - pad - mobileExtraTop);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottom = Math.min(window.innerHeight - 10, rect.bottom + pad + mobileExtraBottom);

    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;

    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = (right - left) + "px";
    highlight.style.height = (bottom - top) + "px";

    placeTooltip({ top, left, right, bottom, width: right - left, height: bottom - top });
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;
    const portraitSize = isMobile() ? "clamp(58px,16vw,76px)" : "clamp(96px,9vw,128px)";
    const textSize = isMobile() ? "14px" : "16px";
    const titleSize = isMobile() ? "17px" : "17px";

    tooltip.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <img src="${SHEEPARD_SRC}" style="width:${portraitSize};height:${portraitSize};border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.3);background:#000;flex:0 0 auto;box-shadow:0 0 16px rgba(255,210,77,.45);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:900;color:#ffd24d;text-transform:uppercase;">Général Sheepard</div>
          <div style="font-weight:900;margin-top:4px;font-size:${titleSize};">${step.title}</div>
          <div style="margin-top:6px;line-height:1.35;font-size:${textSize};">${step.text}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;gap:10px;">
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

    if (isMobile()) {
      target.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
      positionTargetForMobile(target, step);
    } else {
      target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
    }

    renderTooltip(step);

    requestAnimationFrame(() => {
      positionTargetForMobile(target, step);
      updateOverlayPosition();
      setTimeout(() => { positionTargetForMobile(target, step); updateOverlayPosition(); }, 80);
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
    tooltip.style.cssText = "position:fixed;width:min(520px,calc(100vw - 28px));max-height:42vh;overflow:auto;background:#111;color:#fff;padding:16px;border-radius:14px;z-index:3002;box-shadow:0 18px 40px rgba(0,0,0,.55);pointer-events:auto;-webkit-overflow-scrolling:touch";
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