(function () {
  "use strict";

  const STEPS = [
    {
      target: "#hpCard",
      title: "Centre de commandement",
      kicker: "PV · Boucliers · Réparation",
      text: "Ici tu suis l’état complet de l’unité : ses points de vie, ses boucliers actifs et ses clés de réparation."
    },
    {
      target: "#shieldsDisplay",
      title: "Réserve de boucliers",
      kicker: "Défense partagée",
      text: "Clique sur un bouclier pour l’attribuer à une unité ou le retirer. La réserve est commune à toute l’équipe."
    },
    {
      target: "#repairKeysDisplay",
      title: "Clés de réparation",
      kicker: "Ressource limitée",
      text: "Ces clés permettent de suivre les réparations déjà consommées pendant la partie. Une clé dépensée, c’est une petite larme de mécano."
    },
    {
      target: "#unitTabs",
      title: "Escouade active",
      kicker: "Navigation rapide",
      text: "Les onglets du bas permettent de passer rapidement d’un personnage à l’autre sans revenir à la liste."
    },
    {
      target: "#resetBtn",
      title: "Réinitialisation locale",
      kicker: "Sans panique",
      text: "Ce bouton remet uniquement à zéro la fiche du personnage affiché. Le reste de la partie n’est pas touché."
    }
  ];

  let currentStep = 0;
  let overlay = null;
  let highlight = null;
  let spotlight = null;
  let tooltip = null;
  let activeTarget = null;
  let lockApplied = false;
  let savedOverflowBody = "";
  let savedOverflowHtml = "";
  let keyHandler = null;

  function isCharacterPage() {
    return document.body && document.body.classList.contains("page-character");
  }

  function forceStyle(el, prop, value) {
    el.style.setProperty(prop, value, "important");
  }

  function addGlobalStyles() {
    if (document.getElementById("mkwTutorialStyles")) return;

    const style = document.createElement("style");
    style.id = "mkwTutorialStyles";
    style.textContent = `
      @keyframes mkwTutorialPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 4px rgba(0,0,0,.45), 0 0 22px rgba(255,77,252,.85); }
        50% { transform: scale(1.055); box-shadow: 0 0 0 5px rgba(0,0,0,.45), 0 0 32px rgba(255,77,252,1); }
      }
      @keyframes mkwTutorialPop {
        from { opacity: 0; transform: translateY(8px) scale(.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes mkwTutorialScan {
        0% { transform: translateX(-110%); opacity: 0; }
        20% { opacity: .55; }
        100% { transform: translateX(110%); opacity: 0; }
      }
      .mkw-tutorial-btn {
        animation: mkwTutorialPulse 2.8s ease-in-out infinite !important;
      }
      .mkw-tutorial-tooltip {
        animation: mkwTutorialPop .2s ease-out both !important;
      }
      .mkw-tutorial-tooltip::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255,77,252,.95), rgba(255,210,77,.65), rgba(80,150,255,.45));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      .mkw-tutorial-scanline {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }
      .mkw-tutorial-scanline::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
        animation: mkwTutorialScan 2.6s ease-in-out infinite;
      }
      .mkw-tutorial-step-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgba(255,255,255,.22);
      }
      .mkw-tutorial-step-dot.active {
        background: #ffd24d;
        box-shadow: 0 0 10px rgba(255,210,77,.85);
      }
      .mkw-tutorial-button {
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 12px;
        background: rgba(255,255,255,.06);
        color: #fff;
        padding: 9px 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .mkw-tutorial-button:hover:not(:disabled) {
        background: rgba(255,255,255,.12);
      }
      .mkw-tutorial-button:disabled {
        opacity: .35;
        cursor: not-allowed;
      }
      .mkw-tutorial-button.primary {
        color: #111;
        border-color: rgba(255,210,77,.65);
        background: linear-gradient(180deg, #ffe16f, #ffbf2e);
        box-shadow: 0 0 14px rgba(255,210,77,.28);
      }
      .mkw-tutorial-button.primary:hover {
        filter: brightness(1.06);
      }
    `;
    document.head.appendChild(style);
  }

  function applyButtonStyles(btn) {
    btn.classList.add("mkw-tutorial-btn");
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
    forceStyle(btn, "background", "radial-gradient(circle at 30% 20%, #ffd24d 0%, #ff4dfc 42%, #12121a 100%)");
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
    forceStyle(btn, "padding", "0");
    forceStyle(btn, "margin", "0");
    forceStyle(btn, "z-index", "2147483647");
  }

  function injectTutorialButton() {
    if (!isCharacterPage()) return;
    addGlobalStyles();

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
    savedOverflowBody = document.body.style.overflow || "";
    savedOverflowHtml = document.documentElement.style.overflow || "";
    forceStyle(document.body, "overflow", "hidden");
    forceStyle(document.documentElement, "overflow", "hidden");
    lockApplied = true;
  }

  function unlockScroll() {
    if (!lockApplied) return;
    document.body.style.overflow = savedOverflowBody;
    document.documentElement.style.overflow = savedOverflowHtml;
    lockApplied = false;
  }

  function preventManualScroll(e) {
    if (!overlay) return;
    if (tooltip && tooltip.contains(e.target)) return;
    e.preventDefault();
  }

  function removeTutorial() {
    overlay?.remove();
    highlight?.remove();
    spotlight?.remove();
    tooltip?.remove();
    overlay = null;
    highlight = null;
    spotlight = null;
    tooltip = null;
    activeTarget = null;
    unlockScroll();
    window.removeEventListener("resize", updateOverlayPosition);
    window.removeEventListener("orientationchange", updateOverlayPosition);
    window.removeEventListener("wheel", preventManualScroll, { passive: false });
    window.removeEventListener("touchmove", preventManualScroll, { passive: false });
    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
  }

  function createTutorialUI() {
    removeTutorial();
    lockScroll();
    addGlobalStyles();

    overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "radial-gradient(circle at center, rgba(255,77,252,.10), transparent 36%), rgba(4,6,14,.72)",
      backdropFilter: "blur(2px)",
      zIndex: "3000",
      touchAction: "none"
    });
    overlay.addEventListener("click", removeTutorial);
    document.body.appendChild(overlay);

    spotlight = document.createElement("div");
    Object.assign(spotlight.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "3001",
      borderRadius: "22px",
      boxShadow: "0 0 0 9999px rgba(0,0,0,.24)",
      transition: "all .2s ease"
    });
    document.body.appendChild(spotlight);

    highlight = document.createElement("div");
    Object.assign(highlight.style, {
      position: "fixed",
      border: "2px solid #ff4dfc",
      borderRadius: "22px",
      boxShadow: "0 0 0 1px rgba(255,255,255,.22), 0 0 28px rgba(255,77,252,.72), inset 0 0 18px rgba(255,77,252,.16)",
      background: "rgba(255,77,252,.07)",
      pointerEvents: "none",
      zIndex: "3002",
      transition: "all .2s ease"
    });
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    tooltip.className = "mkw-tutorial-tooltip";
    Object.assign(tooltip.style, {
      position: "fixed",
      width: "min(360px, calc(100vw - 28px))",
      padding: "16px",
      borderRadius: "18px",
      background: "linear-gradient(180deg, rgba(25,25,36,.98), rgba(11,11,18,.98))",
      color: "#fff",
      boxShadow: "0 22px 48px rgba(0,0,0,.56), 0 0 28px rgba(255,77,252,.18)",
      zIndex: "3003",
      overflow: "hidden"
    });
    tooltip.addEventListener("click", (e) => e.stopPropagation());
    document.body.appendChild(tooltip);

    keyHandler = (e) => {
      if (e.key === "Escape") removeTutorial();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrevious();
    };
    window.addEventListener("keydown", keyHandler);
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
    if (!activeTarget || !highlight || !tooltip || !spotlight) return;
    const rect = activeTarget.getBoundingClientRect();
    const top = Math.max(8, rect.top - 8);
    const left = Math.max(8, rect.left - 8);
    const width = Math.min(window.innerWidth - left - 8, rect.width + 16);
    const height = Math.min(window.innerHeight - top - 8, rect.height + 16);

    [highlight, spotlight].forEach((el) => {
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
    });

    placeTooltip({ top, left, width, height, bottom: top + height, right: left + width });
  }

  function dotsHtml() {
    return STEPS.map((_, i) => `<span class="mkw-tutorial-step-dot ${i === currentStep ? "active" : ""}"></span>`).join("");
  }

  function goPrevious() {
    if (currentStep <= 0) return;
    currentStep -= 1;
    showStep();
  }

  function goNext() {
    currentStep += 1;
    if (currentStep >= STEPS.length) removeTutorial();
    else showStep();
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;
    tooltip.innerHTML = `
      <div class="mkw-tutorial-scanline"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;position:relative;">
        <div>
          <div style="font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#ffd24d;">${step.kicker || "Tutoriel"}</div>
          <div style="font-weight:950;font-size:18px;line-height:1.15;margin-top:4px;">${step.title}</div>
        </div>
        <button id="tutorialClose" aria-label="Fermer" class="mkw-tutorial-button" style="padding:7px 10px;line-height:1;">×</button>
      </div>
      <div style="line-height:1.5;color:rgba(255,255,255,.9);font-size:14px;position:relative;">${step.text}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;position:relative;">
        <div style="display:flex;gap:6px;align-items:center;">${dotsHtml()}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button id="tutorialPrev" class="mkw-tutorial-button" ${currentStep === 0 ? "disabled" : ""}>←</button>
          <button id="tutorialNext" class="mkw-tutorial-button primary">${isLast ? "Terminer" : "Suivant"}</button>
        </div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.42);margin-top:10px;position:relative;">Échap pour fermer · flèches ← → pour naviguer</div>
    `;

    document.getElementById("tutorialPrev")?.addEventListener("click", goPrevious);
    document.getElementById("tutorialClose")?.addEventListener("click", removeTutorial);
    document.getElementById("tutorialNext")?.addEventListener("click", goNext);
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
      setTimeout(updateOverlayPosition, 320);
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
