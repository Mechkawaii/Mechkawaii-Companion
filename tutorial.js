(function () {
  "use strict";

  const SHEEPARD_SRC = "./assets/sheepard.svg";
  const STORAGE_PREFIX = "mechkawaii:";

  const I18N = {
    fr: {
      sheepard: "Général Sheepard",
      prev: "←",
      next: "Suivant",
      finish: "Terminer",

      turnTitle: "Tour de jeu",
      turnKicker: "Round et camp actif",
      turnText: "Cette zone indique le round en cours et le camp qui joue. Une fois tes actions terminées, utilise le bouton de fin de tour pour passer la main. Quand les deux camps ont joué, on passe au round suivant.",

      eventTitle: "Événements Expert",
      eventKicker: "Piste événement",
      eventText: "En mode Expert, le jeton avance d’une case à chaque round. Lorsqu’il atteint la 5e case, personne ne joue : un événement se déclenche, puis la partie reprend directement au round suivant.",

      hpTitle: "Points de vie",
      hpKicker: "Fonctionnement des PV",
      hpText: "Les PV indiquent l’état de ton unité. S’ils tombent à 0, l’unité devient Hors Service (HS). Une unité HS peut revenir en jeu si elle récupère au moins 1 PV.",

      shieldTitle: "Se protéger",
      shieldKicker: "Boucliers",
      shieldText: "Un bouclier absorbe 1 PV de dégâts. Les boucliers de la réserve commune sont limités. Certains effets, comme le Technicien ou le drone de Rasmus, peuvent donner des boucliers bonus temporaires indépendants.",

      repairTitle: "Réparer",
      repairKicker: "Clés de réparation",
      repairText: "Chaque unité dispose de 2 clés de réparation en début de partie. Une clé redonne 1 PV à une unité alliée ou relève une unité HS avec 1 PV. Certaines capacités peuvent rendre une clé utilisée.",

      classActionTitle: "Action de classe",
      classActionKicker: "Capacité spéciale",
      classActionText: "Chaque classe possède une action spéciale. Certaines se jouent pendant ton tour, d’autres réagissent à une situation précise. Pense à vérifier si l’action consomme une cellule d’énergie.",

      ultimateTitle: "Coup Unique",
      ultimateKicker: "Pouvoir décisif",
      ultimateText: "Le Coup Unique est une capacité forte, souvent utilisable une seule fois ou à réamorcer selon l’unité. Certains Coups Uniques ouvrent une modale pour choisir des cibles ou distribuer des bonus.",

      cuBadgeTitle: "Badges de Coup Unique",
      cuBadgeKicker: "Effets permanents",
      cuBadgeText: "Cette zone affiche les effets de Coups Uniques appliqués à l’unité. Si un effet ennemi ou allié est actif, tu peux le voir ici pour ne pas l’oublier pendant la partie.",

      suddenTitle: "Mort subite",
      suddenKicker: "Attention au compte à rebours",
      suddenText: "Si un camp a 2 unités HS, il entre en mort subite : il dispose de 3 tours pour réparer une unité alliée avec au moins 1 PV. Si les 3 unités sont HS, la partie est perdue immédiatement.",

      tabsTitle: "Tes 3 unités",
      tabsKicker: "Navigation rapide",
      tabsText: "Les onglets permettent de passer rapidement entre tes unités jouées. Tu peux gérer les PV, boucliers, clés, actions et Coups Uniques de chaque unité depuis sa fiche."
    },
    en: {
      sheepard: "General Sheepard",
      prev: "←",
      next: "Next",
      finish: "Finish",

      turnTitle: "Turn Tracker",
      turnKicker: "Round and active side",
      turnText: "This area shows the current round and which side is playing. When you are done, use the end turn button. Once both sides have played, the next round begins.",

      eventTitle: "Expert Events",
      eventKicker: "Event track",
      eventText: "In Expert Mode, the token moves one space each round. When it reaches the 5th space, no one plays: an event triggers, then the game immediately continues to the next round.",

      hpTitle: "Health Points",
      hpKicker: "HP basics",
      hpText: "HP shows your unit’s condition. If it drops to 0, the unit becomes Out of Action (KO). A KO unit can return if it recovers at least 1 HP.",

      shieldTitle: "Protect",
      shieldKicker: "Shields",
      shieldText: "A shield absorbs 1 HP of damage. Shared shield tokens are limited. Some effects, like the Technician or Rasmus’ drone, may grant independent temporary bonus shields.",

      repairTitle: "Repair",
      repairKicker: "Repair Keys",
      repairText: "Each unit starts with 2 Repair Keys. A key restores 1 HP to an allied unit or brings a KO allied unit back with 1 HP. Some abilities can restore a spent key.",

      classActionTitle: "Class Action",
      classActionKicker: "Special ability",
      classActionText: "Each class has a special action. Some are used during your turn, while others react to a specific situation. Check whether the action spends an energy cell.",

      ultimateTitle: "Ultimate Ability",
      ultimateKicker: "Decisive power",
      ultimateText: "An Ultimate Ability is a powerful effect, often one-use or requiring a recharge depending on the unit. Some Ultimates open a modal to choose targets or distribute bonuses.",

      cuBadgeTitle: "Ultimate Badges",
      cuBadgeKicker: "Ongoing effects",
      cuBadgeText: "This area shows Ultimate effects currently applied to the unit. If an allied or enemy effect is active, you can track it here during the game.",

      suddenTitle: "Sudden Death",
      suddenKicker: "Countdown warning",
      suddenText: "If a side has 2 KO units, Sudden Death begins: it has 3 turns to repair an allied unit back to at least 1 HP. If all 3 units are KO, that side immediately loses.",

      tabsTitle: "Your 3 units",
      tabsKicker: "Quick navigation",
      tabsText: "Tabs let you quickly switch between your played units. You can manage HP, shields, repair keys, actions, and Ultimate Abilities from each unit sheet."
    }
  };

  function getLang(){ return localStorage.getItem(STORAGE_PREFIX + "lang") || "fr"; }
  function tr(key){
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  const STEPS = [
    { target: "#mkwTurnBanner,.mkw-turn-banner", titleKey: "turnTitle", kickerKey: "turnKicker", textKey: "turnText", pad: 14, mobileTop: 92 },
    { target: "#mkwExpertEventHud,.mkw-event-track", titleKey: "eventTitle", kickerKey: "eventKicker", textKey: "eventText", pad: 14, mobileTop: 94, optional: true },
    { target: ".hp-section", titleKey: "hpTitle", kickerKey: "hpKicker", textKey: "hpText", pad: 12, mobileTop: 118 },
    { target: ".shields-section", titleKey: "shieldTitle", kickerKey: "shieldKicker", textKey: "shieldText", pad: 16, mobileTop: 110 },
    { target: ".repair-section", titleKey: "repairTitle", kickerKey: "repairKicker", textKey: "repairText", pad: 16, mobileTop: 110 },
    { target: "#classActionTitle", titleKey: "classActionTitle", kickerKey: "classActionKicker", textKey: "classActionText", pad: 18, mobileTop: 106 },
    { target: "#ultTitle,#ultToggleContainer", titleKey: "ultimateTitle", kickerKey: "ultimateKicker", textKey: "ultimateText", pad: 18, mobileTop: 106 },
    { target: ".cu-badges,#cuBadges,.cu-badge-zone,.cu-badge,.copied-cu,[data-cu-badges],[data-cu-badge],.topbar .controls", titleKey: "cuBadgeTitle", kickerKey: "cuBadgeKicker", textKey: "cuBadgeText", pad: 14, mobileTop: 96, optional: true },
    { target: "#mkwSuddenDeathHud", titleKey: "suddenTitle", kickerKey: "suddenKicker", textKey: "suddenText", pad: 14, mobileTop: 100, optional: true },
    { target: "#unitTabs", titleKey: "tabsTitle", kickerKey: "tabsKicker", textKey: "tabsText", pad: 12, allowTabsOverlap: true }
  ];

  let currentStep = 0;
  let overlay = null;
  let blocker = null;
  let highlight = null;
  let tooltip = null;
  let activeTarget = null;
  let activeStep = null;
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
  }

  function blockKeyboardScroll(event) {
    if (!overlay) return;
    const blockedKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
    if (blockedKeys.includes(event.key)) event.preventDefault();
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function getTabsSafeTop() {
    const tabsContainer = document.querySelector("#unitTabsContainer");
    const tabsRect = tabsContainer ? tabsContainer.getBoundingClientRect() : null;
    return tabsRect ? tabsRect.top : window.innerHeight;
  }

  function isVisibleTarget(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
  }

  function findTarget(step) {
    if (!step?.target) return null;
    const candidates = Array.from(document.querySelectorAll(step.target));
    return candidates.find(isVisibleTarget) || null;
  }

  function findNextAvailableStep(direction = 1) {
    let index = currentStep;
    while (index >= 0 && index < STEPS.length) {
      const step = STEPS[index];
      if (findTarget(step)) return index;
      index += direction;
    }
    return -1;
  }

  function goToStep(direction) {
    const nextIndex = currentStep + direction;
    currentStep = nextIndex;
    const available = findNextAvailableStep(direction);
    if (available < 0) {
      cleanupTutorial();
      return;
    }
    currentStep = available;
    showStep();
  }

  function positionTargetForMobile(target, step) {
    if (!isMobile() || !target) return;
    if (step?.target === "#unitTabs") return;
    const desiredTop = Number(step?.mobileTop ?? 105);
    const rect = target.getBoundingClientRect();
    const delta = rect.top - desiredTop;
    if (Math.abs(delta) > 6) window.scrollBy({ top: delta, left: 0, behavior: "auto" });
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
      const candidateRect = { top: pos.top, left: pos.left, right: pos.left + tooltipRect.width, bottom: pos.top + tooltipRect.height };
      return pos.top >= safeTop && candidateRect.bottom <= safeBottom && !rectsOverlap(candidateRect, rect);
    });
    if (!chosen) {
      const spaceAbove = rect.top - safeTop;
      const spaceBelow = safeBottom - rect.bottom;
      chosen = spaceAbove >= spaceBelow ? { top: safeTop, left: centeredLeft } : { top: Math.max(safeTop, safeBottom - tooltipRect.height), left: centeredLeft };
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
    const bottomLimit = activeStep?.allowTabsOverlap ? window.innerHeight - 10 : getTabsSafeTop() - 10;
    const bottom = Math.min(bottomLimit, rect.bottom + pad + mobileExtraBottom, window.innerHeight - 10);
    overlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;
    highlight.style.top = top + "px";
    highlight.style.left = left + "px";
    highlight.style.width = (right - left) + "px";
    highlight.style.height = Math.max(0, bottom - top) + "px";
    placeTooltip({ top, left, right, bottom, width: right - left, height: bottom - top });
  }

  function isLastVisibleStep() {
    const original = currentStep;
    let index = currentStep + 1;
    while (index < STEPS.length) {
      currentStep = index;
      if (findTarget(STEPS[index])) {
        currentStep = original;
        return false;
      }
      index++;
    }
    currentStep = original;
    return true;
  }

  function renderTooltip(step) {
    const isLast = isLastVisibleStep();
    const portraitSize = isMobile() ? "clamp(58px,16vw,76px)" : "clamp(96px,9vw,128px)";
    const textSize = isMobile() ? "14px" : "16px";
    const titleSize = isMobile() ? "17px" : "17px";
    tooltip.innerHTML = `
      <div class="mkw-tutorial-content">
        <img class="mkw-tutorial-portrait" src="${SHEEPARD_SRC}" style="width:${portraitSize};height:${portraitSize};" alt="">
        <div class="mkw-tutorial-body">
          <div class="mkw-tutorial-speaker">${tr("sheepard")}</div>
          <div class="mkw-tutorial-title" style="font-size:${titleSize};">${tr(step.titleKey)}</div>
          <div class="mkw-tutorial-text" style="font-size:${textSize};">${tr(step.textKey)}</div>
        </div>
      </div>
      <div class="mkw-tutorial-actions">
        <button id="prev" ${currentStep === findNextAvailableStep(1) ? "disabled" : ""}>${tr("prev")}</button>
        <button id="next">${isLast ? tr("finish") : tr("next")}</button>
      </div>`;
    document.getElementById("prev")?.addEventListener("click", () => {
      if (currentStep <= 0) return;
      goToStep(-1);
    });
    document.getElementById("next")?.addEventListener("click", () => {
      if (isLast) return cleanupTutorial();
      goToStep(1);
    });
  }

  function showStep() {
    const step = STEPS[currentStep];
    const target = findTarget(step);
    if (!target) {
      const available = findNextAvailableStep(1);
      if (available < 0) return cleanupTutorial();
      currentStep = available;
      return showStep();
    }
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
    const first = findNextAvailableStep(1);
    if (first < 0) return;
    currentStep = first;
    lockPage();
    blocker = document.createElement("div");
    blocker.className = "mkw-tutorial-blocker";
    blocker.addEventListener("click", (event) => event.preventDefault());
    document.body.appendChild(blocker);
    overlay = document.createElement("div");
    overlay.className = "mkw-tutorial-overlay";
    document.body.appendChild(overlay);
    highlight = document.createElement("div");
    highlight.className = "mkw-tutorial-highlight";
    document.body.appendChild(highlight);
    tooltip = document.createElement("div");
    tooltip.className = "mkw-tutorial-tooltip";
    tooltip.addEventListener("click", (event) => event.stopPropagation());
    document.body.appendChild(tooltip);
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });
    window.addEventListener("keydown", blockKeyboardScroll);
    showStep();
  }

  window.mkwStartCharacterTutorial = startTutorial;
})();
