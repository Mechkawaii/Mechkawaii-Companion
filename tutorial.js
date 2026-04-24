(function () {
  "use strict";

  const STEPS = [
    {
      target: "#hpCard",
      title: "Vie, boucliers et réparation",
      text: "Ici tu suis les PV, les boucliers partagés et les clés de réparation de l’unité."
    },
    {
      target: "#shieldsDisplay",
      title: "Boucliers partagés",
      text: "Clique sur un bouclier pour l’attribuer à une unité ou le retirer. La réserve est commune à l’équipe."
    },
    {
      target: "#repairKeysDisplay",
      title: "Clés de réparation",
      text: "Les clés permettent de suivre les réparations dépensées pendant la partie."
    },
    {
      target: "#unitTabs",
      title: "Changer d’unité",
      text: "Les onglets du bas permettent de passer rapidement d’un personnage à l’autre."
    },
    {
      target: "#resetBtn",
      title: "Réinitialiser une fiche",
      text: "Ce bouton remet à zéro uniquement le personnage affiché."
    }
  ];

  let currentStep = 0;
  let overlay = null;
  let highlight = null;
  let tooltip = null;

  function removeTutorial() {
    overlay?.remove();
    highlight?.remove();
    tooltip?.remove();
    overlay = null;
    highlight = null;
    tooltip = null;
  }

  function createTutorialUI() {
    removeTutorial();

    overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(5, 8, 18, 0.62)";
    overlay.style.zIndex = "3000";
    overlay.addEventListener("click", removeTutorial);
    document.body.appendChild(overlay);

    highlight = document.createElement("div");
    highlight.style.position = "fixed";
    highlight.style.border = "2px solid #ff4dfc";
    highlight.style.borderRadius = "16px";
    highlight.style.boxShadow = "0 0 20px rgba(255,77,252,.55)";
    highlight.style.background = "rgba(255,77,252,.08)";
    highlight.style.pointerEvents = "none";
    highlight.style.zIndex = "3001";
    highlight.style.transition = "all .18s ease";
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    tooltip.style.position = "fixed";
    tooltip.style.maxWidth = "320px";
    tooltip.style.padding = "16px";
    tooltip.style.borderRadius = "16px";
    tooltip.style.border = "1px solid rgba(255,255,255,.12)";
    tooltip.style.background = "linear-gradient(180deg, rgba(24,24,32,.98), rgba(14,14,20,.98))";
    tooltip.style.color = "#fff";
    tooltip.style.boxShadow = "0 18px 36px rgba(0,0,0,.45)";
    tooltip.style.zIndex = "3002";
    tooltip.addEventListener("click", (e) => e.stopPropagation());
    document.body.appendChild(tooltip);
  }

  function placeTooltip(rect) {
    const pad = 14;
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = rect.bottom + pad;
    let left = rect.left;

    if (top + tooltipRect.height > window.innerHeight - pad) {
      top = rect.top - tooltipRect.height - pad;
    }
    if (left + tooltipRect.width > window.innerWidth - pad) {
      left = window.innerWidth - tooltipRect.width - pad;
    }
    if (left < pad) left = pad;
    if (top < pad) top = pad;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function showStep() {
    const step = STEPS[currentStep];
    if (!step) return removeTutorial();

    const target = document.querySelector(step.target);
    if (!target) {
      currentStep += 1;
      return showStep();
    }

    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      highlight.style.top = `${rect.top - 8}px`;
      highlight.style.left = `${rect.left - 8}px`;
      highlight.style.width = `${rect.width + 16}px`;
      highlight.style.height = `${rect.height + 16}px`;

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

      placeTooltip(rect);

      document.getElementById("tutorialPrev")?.addEventListener("click", () => {
        currentStep = Math.max(0, currentStep - 1);
        showStep();
      });
      document.getElementById("tutorialClose")?.addEventListener("click", removeTutorial);
      document.getElementById("tutorialNext")?.addEventListener("click", () => {
        currentStep += 1;
        if (currentStep >= STEPS.length) removeTutorial();
        else showStep();
      });
    });
  }

  function startTutorial() {
    if (!document.body.classList.contains("page-character")) return;
    currentStep = 0;
    createTutorialUI();
    showStep();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("tutorialBtn");
    if (btn) btn.addEventListener("click", startTutorial);
  });

  window.startTutorial = startTutorial;
})();
