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
  }

  function renderTooltip(step) {
    const isLast = currentStep === STEPS.length - 1;

    tooltip.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <img src="${SHEEPARD_SRC}" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:2px solid rgba(255,255,255,.2);background:#000;">
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:900;color:#ffd24d;text-transform:uppercase;">Général Sheepard</div>
          <div style="font-weight:900;margin-top:4px;">${step.title}</div>
          <div style="margin-top:6px;line-height:1.4;">${step.text}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;">
        <button id="prev">←</button>
        <button id="next">${isLast ? "Terminer" : "Suivant"}</button>
      </div>
    `;

    document.getElementById("prev")?.addEventListener("click", () => { currentStep--; showStep(); });
    document.getElementById("next")?.addEventListener("click", () => {
      currentStep++;
      if (currentStep >= STEPS.length) overlay.remove();
      else showStep();
    });
  }

  function showStep() {
    const step = STEPS[currentStep];
    const target = document.querySelector(step.target);
    if (!target) return;

    activeTarget = target;
    target.scrollIntoView({ block: "center" });

    renderTooltip(step);

    updateOverlayPosition();
  }

  function startTutorial() {
    currentStep = 0;

    overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:3000;transition:clip-path .25s ease";
    document.body.appendChild(overlay);

    highlight = document.createElement("div");
    highlight.style.cssText = "position:fixed;border:2px solid #ff4dfc;border-radius:12px;z-index:3001";
    document.body.appendChild(highlight);

    tooltip = document.createElement("div");
    tooltip.style.cssText = "position:fixed;bottom:20px;left:20px;right:20px;background:#111;color:#fff;padding:16px;border-radius:12px;z-index:3002";
    document.body.appendChild(tooltip);

    showStep();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.textContent = "ⓘ";
    btn.style.cssText = "position:fixed;top:80px;right:10px;z-index:9999";
    btn.onclick = startTutorial;
    document.body.appendChild(btn);
  });
})();