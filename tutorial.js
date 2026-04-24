(function () {
  "use strict";

  const STEPS = [
    { target: "#hpCard", title: "Vie, boucliers et réparation", text: "Ici tu suis les PV, les boucliers partagés et les clés de réparation de l’unité." },
    { target: "#shieldsDisplay", title: "Boucliers partagés", text: "Clique sur un bouclier pour l’attribuer à une unité ou le retirer. La réserve est commune à l’équipe." },
    { target: "#repairKeysDisplay", title: "Clés de réparation", text: "Les clés permettent de suivre les réparations dépensées pendant la partie." },
    { target: "#unitTabs", title: "Changer d’unité", text: "Les onglets du bas permettent de passer rapidement d’un personnage à l’autre." },
    { target: "#resetBtn", title: "Réinitialiser une fiche", text: "Ce bouton remet à zéro uniquement le personnage affiché." }
  ];

  let currentStep = 0;
  let overlay = null;
  let highlight = null;
  let tooltip = null;
  let activeTarget = null;
  let scrollYBeforeTutorial = 0;
  let lockApplied = false;

  function isCharacterPage() {
    return document.body && document.body.classList.contains("page-character");
  }

  function forceStyle(el, prop, value) {
    el.style.setProperty(prop, value, "important");
  }

  function applyButtonStyles(btn) {
    forceStyle(btn, "position", "fixed");
    forceStyle(btn, "top", "76px");
    forceStyle(btn, "right", "14px");
    forceStyle(btn, "left", "auto");
    forceStyle(btn, "bottom", "auto");
    forceStyle(btn, "width", "48px");
    forceStyle(btn, "height", "48px");
    forceStyle(btn, "min-width", "48px");
    forceStyle(btn, "min-height", "48px");
    forceStyle(btn, "border-radius", "50%");
    forceStyle(btn, "border", "3px solid #ffffff");
    forceStyle(btn, "background", "#ff4dfc");
    forceStyle(btn, "color", "#111111");
    forceStyle(btn, "font-weight", "900");
    forceStyle(btn, "font-size", "24px");
    forceStyle(btn, "line-height", "1");
    forceStyle(btn, "display", "flex");
    forceStyle(btn, "align-items", "center");
    forceStyle(btn, "justify-content", "center");
    forceStyle(btn, "visibility", "visible");
    forceStyle(btn, "opacity", "1");
    forceStyle(btn, "pointer-events", "auto");
    forceStyle(btn, "cursor", "pointer");
    forceStyle(btn, "box-shadow", "0 0 0 4px rgba(0,0,0,.45), 0 0 22px rgba(255,77,252,.9)");
    forceStyle(btn, "padding", "0");
    forceStyle(btn, "margin", "0");
    forceStyle(btn, "z-index", "2147483647");
    forceStyle(btn, "transform", "none");
  }

  function injectTutorialButton() {
    if (!isCharacterPage()) return;

    let btn = document.getElementById("tutorialBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "tutorialBtn";
      btn.type = "button";
      document.body.appendChild(btn);
    }

    btn.textContent = "ⓘ";
    btn.setAttribute("aria-label", "Tutoriel");
    btn.title = "Tutoriel";
    applyButtonStyles(btn);

    if (btn.dataset.tutorialBound !== "1") {
      btn.dataset.tutorialBound = "1";
      btn.addEventListener("click", startTutorial);
    }
  }

  function lockScroll() {
    if (lockApplied) return;
    scrollYBeforeTutorial = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.tutorialPreviousOverflow = document.body.style.overflow || "";
    document.documentElement.dataset.tutorialPreviousOverflow = document.documentElement.style.overflow || "";
    forceStyle(document.body, "overflow", "hidden");
    forceStyle(document.documentElement, "overflow", "hidden");
    lockApplied = true;
  }

  function unlockScroll() {
    if (!lockApplied) return;
    document.body.style.overflow = document.body.dataset.tutorialPreviousOverflow || "";
    document.documentElement.style.overflow = document.documentElement.dataset.tutorialPreviousOverflow || "";
    delete document.body.dataset.tutorialPreviousOverflow;
    delete document.documentElement.dataset.tutorialPreviousOverflow;
    lockApplied = false;
  }

  function preventManualScroll(e) {
    if (!overlay) return;
    const target = e.target;
    if (tooltip && tooltip.contains(target)) return;
    e.preventDefault();
  }

  function removeTutorial() {
    overlay?.remove();
    highlight?.remove();
    tooltip?.remove();
    overlay = null;
    highlight = null;
    tooltip = null;
    activeTarget = null;
    unlockScroll();
    window.removeEventListener("resize", updateOverlayPosition);
    window.removeEventListener("orientationchange", updateOverlayPosition);
    window.removeEventListener("wheel", preventManualScroll, { passive: false });
    window.removeEventListener("touchmove", preventManualScroll, { passive: false });
  }

  function createTutorialUI() {
    removeTutorial();
    lockScroll();

    overlay = document.createElement("div");
    Object.assign(overlay.style, { position: "fixed", inset: "0", background: "rgba(5, 8, 18, 0.62)", zIndex: "3000", touchAction: "none" });
    overlay.addEventListener("click", removeTutorial);
    document.body.appendChild(overlay);

    highlight = document.createElement("div");
    Object.assign(highlight.style, {
      position: "fixed", border: "2px solid #ff4dfc", borderRadius: "16px",
      boxShadow: "0 0 20px rgba(255,77,252,.55)", background: "rgba(255,77,252,.08)",
      pointerEvents: "none", zIndex: "3001", transition: "all .18s ease"
    });
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
      position: "fixed", maxWidth: "min(320px, calc(100vw - 28px))", padding: "16px", borderRadius: "16px",
      border: "1px solid rgba(255,255,255,.12)",
      background: "linear-gradient(180deg, rgba(24,24,32,.98), rgba(14,14,20,.98))",
      color: "#fff", boxShadow: "0 18px 36px rgba(0,0,0,.45)", zIndex: "3002"
    });
    tooltip.addEventListener("click", (e) => e.stopPropagation());
    document.body.appendChild(tooltip);

    window.addEventListener("resize", updateOverlayPosition);
    window.addEventListener("orientationchange", updateOverlayPosition);
    window.addEventListener("wheel", preventManualScroll, { passive: false });
    window.addEventListener("touchmove", preventManualScroll, { passive: false });
  }

  function placeTooltip(rect) {
    const pad = 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = rect.bottom + pad;
    let left = rect.left;

    if (top + tooltipRect.height > window.innerHeight - pad) top = rect.top - tooltipRect.height - pad;
    if (left + tooltipRect.width > window.innerWidth - pad) left = window.innerWidth - tooltipRect.width - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function updateOverlayPosition() {
    if (!activeTarget || !highlight || !tooltip) return;
    const rect = activeTarget.getBoundingClientRect();

    highlight.style.top = `${rect.top - 8}px`;
    highlight.style.left = `${rect.left - 8}px`;
    highlight.style.width = `${rect.width + 16}px`;
    highlight.style.height = `${rect.height + 16}px`;

    placeTooltip(rect);
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;
    tooltip.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px;">
        <strong style="color:#ffd24d;">Tutoriel</strong>
        <span style="font-size:12px;color:rgba(255,255,255,.65);">${currentStep + 1} / ${STEPS.length}</span>
      </div>
      <div style="font-weight:800;margin-bottom:8px;">${step.title}</div>
      <div style="line-height:1.45;color:rgba(255,255,255,.9);">${step.text}</div>
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:14px;">
        <button id="tutorialPrev" ${currentStep === 0 ? "disabled" : ""}>⬅</button>
        <div style="display:flex;gap:8px;">
          <button id="tutorialClose">Fermer</button>
          <button id="tutorialNext" class="btn-accent">${isLast ? "Terminer" : "Suivant"}</button>
        </div>
      </div>
    `;

    document.getElementById("tutorialPrev")?.addEventListener("click", () => { currentStep = Math.max(0, currentStep - 1); showStep(); });
    document.getElementById("tutorialClose")?.addEventListener("click", removeTutorial);
    document.getElementById("tutorialNext")?.addEventListener("click", () => { currentStep += 1; if (currentStep >= STEPS.length) removeTutorial(); else showStep(); });
  }

  function showStep() {
    const step = STEPS[currentStep];
    if (!step) return removeTutorial();

    const target = document.querySelector(step.target);
    if (!target) {
      currentStep += 1;
      return showStep();
    }

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
    if (!isCharacterPage()) return;
    currentStep = 0;
    createTutorialUI();
    showStep();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectTutorialButton);
  else injectTutorialButton();

  setTimeout(injectTutorialButton, 250);
  setTimeout(injectTutorialButton, 1000);
  setInterval(injectTutorialButton, 2000);

  window.startTutorial = startTutorial;
})();
