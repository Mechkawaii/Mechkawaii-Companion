/* =========================================================
   MECHKAWAII — Fil d'ariane (breadcrumb.js)
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  /* -------------------------------------------------------
     Détecter l'étape courante depuis le localStorage
     C'est plus fiable que lire les styles du DOM
  ------------------------------------------------------- */
  function detectStep() {
    const splash = document.getElementById("splash");
    // Si le splash est encore visible dans le DOM → step 0
    if (splash && getComputedStyle(splash).display !== "none") return 0;

    const hasSetup = !!localStorage.getItem(PREFIX + "setup");
    const hasDraft = !!localStorage.getItem(PREFIX + "draft");

    if (!hasSetup) return 1; // config
    if (!hasDraft) return 2; // sélection unités
    return 3;                // gestion / partie
  }

  /* -------------------------------------------------------
     Étapes
  ------------------------------------------------------- */
  const STEPS = [
    { label_fr: "Configuration", label_en: "Setup",   step: 1 },
    { label_fr: "Unités",        label_en: "Units",   step: 2 },
    { label_fr: "Gestion",       label_en: "Game",    step: 3 },
  ];

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  function renderBreadcrumb(currentStep) {
    if (currentStep === 0) {
      const bc = document.getElementById("mkw-breadcrumb");
      if (bc) bc.style.display = "none";
      return;
    }

    let bc = document.getElementById("mkw-breadcrumb");
    if (!bc) {
      bc = document.createElement("nav");
      bc.id = "mkw-breadcrumb";
      bc.setAttribute("aria-label", "Navigation");
      // Insérer juste après la topbar
      const container = document.querySelector(".page-index .container, .container");
      const topbar = container?.querySelector(".topbar");
      if (topbar?.nextSibling) {
        container.insertBefore(bc, topbar.nextSibling);
      } else if (container) {
        container.prepend(bc);
      }
    }

    bc.style.display = "flex";
    bc.innerHTML = "";

    const lang = getLang();

    STEPS.forEach((s, i) => {
      // Séparateur sauf avant le premier
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "bc-sep";
        sep.textContent = ">";
        bc.appendChild(sep);
      }

      const label = lang === "en" ? s.label_en : s.label_fr;
      const btn = document.createElement("button");
      btn.className = "bc-step";
      btn.textContent = label;

      if (s.step < currentStep) {
        btn.classList.add("bc-done");
        btn.addEventListener("click", () => goToStep(s.step));
      } else if (s.step === currentStep) {
        btn.classList.add("bc-current");
        btn.disabled = true;
      } else {
        btn.classList.add("bc-future");
        btn.disabled = true;
      }

      bc.appendChild(btn);
    });
  }

  function goToStep(step) {
    if (step === 1) {
      localStorage.removeItem(PREFIX + "setup");
      localStorage.removeItem(PREFIX + "draft");
    } else if (step === 2) {
      localStorage.removeItem(PREFIX + "draft");
    }
    location.reload();
  }

  function hideOldNavButtons() {
    ["backToSplash", "changeSetupBtn", "changeDraftBtn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    // Masquer le bloc .controls qui ne contient que ces boutons
    document.querySelectorAll(".controls").forEach(ctrl => {
      const visible = [...ctrl.children].filter(c => c.style.display !== "none");
      if (visible.length === 0) ctrl.style.display = "none";
    });
  }

  function init() {
    if (!document.getElementById("charList")) return;

    let lastStep = -1;
    function update() {
      const step = detectStep();
      if (step !== lastStep) {
        lastStep = step;
        renderBreadcrumb(step);
        hideOldNavButtons();
      }
    }

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: true,
      childList: true,
    });

    update();
    setTimeout(update, 200);
    setTimeout(update, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
