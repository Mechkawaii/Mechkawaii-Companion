const STEPS = [
  {
    target: "#hpCard",
    text: "Ici tu gères les points de vie de ton unité ❤️",
  },
  {
    target: "#shieldsDisplay",
    text: "Les boucliers sont partagés entre tes unités 🛡️",
  },
  {
    target: "#repairKeysDisplay",
    text: "Les clés permettent de réparer 🔧",
  },
  {
    target: "#unitTabs",
    text: "Navigue entre tes unités ici 👇",
  }
];

let currentStep = 0;
let overlay, tooltip;

function startTutorial() {
  currentStep = 0;
  createOverlay();
  showStep();
}

function createOverlay() {
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.7)";
  overlay.style.zIndex = "2000";
  document.body.appendChild(overlay);

  tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "#111";
  tooltip.style.color = "white";
  tooltip.style.padding = "12px";
  tooltip.style.borderRadius = "10px";
  tooltip.style.maxWidth = "250px";
  tooltip.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
  overlay.appendChild(tooltip);
}

function showStep() {
  const step = STEPS[currentStep];
  const el = document.querySelector(step.target);
  if (!el) return;

  const rect = el.getBoundingClientRect();

  tooltip.innerHTML = `
    <div>${step.text}</div>
    <button id="nextStepBtn" style="margin-top:10px">Suivant</button>
  `;

  tooltip.style.top = rect.bottom + 10 + "px";
  tooltip.style.left = rect.left + "px";

  document.getElementById("nextStepBtn").onclick = () => {
    currentStep++;
    if (currentStep >= STEPS.length) endTutorial();
    else showStep();
  };
}

function endTutorial() {
  overlay.remove();
}
