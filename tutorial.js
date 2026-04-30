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
      turnText: "Cette zone indique le round en cours et le camp qui joue. À ton tour, tu choisis les actions de chacune de tes 3 unités dans l’ordre de ton choix. Une fois terminé, passe la main à l’adversaire.",

      eventTitle: "Événements Expert",
      eventKicker: "Piste événement",
      eventText: "En mode Expert, le jeton événement avance quand les deux joueurs ont chacun réalisé leur phase d’action. Lorsqu’il atteint la 5e case, les joueurs sont inactifs : l’événement est résolu, puis le jeton revient sur la case 1.",

      hpTitle: "Points de vie",
      hpKicker: "Fonctionnement des PV",
      hpText: "Les PV indiquent l’état de ton unité. Une unité ne peut jamais dépasser ses PV maximum. À 0 PV, elle devient Hors Service (HS), ne bloque plus les déplacements ni les lignes de mire, mais conserve ses bonus et son Coup Unique.",

      shieldTitle: "Se protéger",
      shieldKicker: "Boucliers",
      shieldText: "Un bouclier absorbe 1 PV de dégâts. Chaque camp dispose de 3 boucliers communs pour la partie. Le bouclier disparaît au début de ton prochain tour ou s’il est détruit par une attaque.",

      repairTitle: "Réparer",
      repairKicker: "Clés de réparation",
      repairText: "Chaque unité commence avec 2 clés de réparation. Une clé peut redonner 1 PV à l’unité qui l’utilise. Elle peut aussi relever une unité alliée HS avec 1 PV, à condition que cette unité soit sur une case adjacente. Une fois utilisée, la clé est retirée de la partie.",

      classActionTitle: "Action de classe",
      classActionKicker: "Capacité spéciale",
      classActionText: "Chaque classe possède une capacité propre. Elle peut être active, à déclencher au bon moment, ou passive, avec un effet qui s’applique automatiquement selon la situation. Pense à lire la fiche de l’unité pour savoir comment l’utiliser.",

      ultimateTitle: "Coup Unique",
      ultimateKicker: "Pouvoir décisif",
      ultimateText: "Le Coup Unique s’active selon les conditions indiquées sur la fiche. Une fois utilisé, il n’est plus disponible jusqu’à un éventuel réamorçage. Pour le réamorcer, ton unité doit arriver sur une case de la ligne d’atterrissage adverse et jouer immédiatement le Coup Unique réamorcé. Attention, certaines unités possèdent un Coup Unique non réamorçable.",

      cuBadgeTitle: "Badges de Coup Unique",
      cuBadgeKicker: "Effets permanents",
      cuBadgeText: "Cette zone affiche les effets de Coups Uniques appliqués à l’unité. Ils permettent de garder en mémoire les bonus, malus ou effets qui restent actifs pendant la partie.",

      suddenTitle: "Mort subite",
      suddenKicker: "Attention au compte à rebours",
      suddenText: "Si un camp n’a plus qu’une seule unité debout, il entre en mort subite : il dispose de 3 tours pour relever une autre unité. Si les 3 unités sont HS, l’adversaire remporte immédiatement la partie.",

      tabsTitle: "Tes 3 unités",
      tabsKicker: "Navigation rapide",
      tabsText: "Les onglets permettent de passer rapidement entre tes unités jouées. Tu peux gérer les PV, boucliers, clés, actions, énergie et Coups Uniques de chaque unité depuis sa fiche."
    },
    en: {
      sheepard: "General Sheepard",
      prev: "←",
      next: "Next",
      finish: "Finish",

      turnTitle: "Turn Tracker",
      turnKicker: "Round and active side",
      turnText: "This area shows the current round and active side. On your turn, choose actions for each of your 3 units in any order. When you are done, pass the turn to your opponent.",

      eventTitle: "Expert Events",
      eventKicker: "Event track",
      eventText: "In Expert Mode, the event token advances after both players have completed their action phase. When it reaches the 5th space, players are inactive: the event is resolved, then the token returns to space 1.",

      hpTitle: "Health Points",
      hpKicker: "HP basics",
      hpText: "HP shows your unit’s condition. A unit can never exceed its maximum HP. At 0 HP, it becomes Out of Action (KO), no longer blocks movement or line of sight, but keeps its bonuses and Ultimate Ability.",

      shieldTitle: "Protect",
      shieldKicker: "Shields",
      shieldText: "A shield absorbs 1 HP of damage. Each side has 3 shared shields for the game. A shield disappears at the start of your next turn or when destroyed by an attack.",

      repairTitle: "Repair",
      repairKicker: "Repair Keys",
      repairText: "Each unit starts with 2 Repair Keys. A key may restore 1 HP to the unit using it. It may also bring an allied KO unit back with 1 HP, as long as that ally is on an adjacent space. Once used, the key is removed from the game.",

      classActionTitle: "Class Action",
      classActionKicker: "Special ability",
      classActionText: "Each class has its own ability. It may be active, triggered at the right moment, or passive, applying automatically when the situation calls for it. Check the unit sheet to know how to use it.",

      ultimateTitle: "Ultimate Ability",
      ultimateKicker: "Decisive power",
      ultimateText: "An Ultimate Ability activates according to the conditions on the sheet. Once used, it is unavailable until a possible recharge. To recharge it, your unit must reach a space on the enemy landing row and immediately use the recharged Ultimate Ability. Some units have Ultimate Abilities that cannot be recharged.",

      cuBadgeTitle: "Ultimate Badges",
      cuBadgeKicker: "Ongoing effects",
      cuBadgeText: "This area shows Ultimate effects currently applied to the unit. It helps track bonuses, penalties, or effects that remain active during the game.",

      suddenTitle: "Sudden Death",
      suddenKicker: "Countdown warning",
      suddenText: "If a side has only one standing unit left, Sudden Death begins: it has 3 turns to bring another unit back. If all 3 units are KO, the opponent immediately wins.",

      tabsTitle: "Your 3 units",
      tabsKicker: "Quick navigation",
      tabsText: "Tabs let you quickly switch between your played units. You can manage HP, shields, repair keys, actions, energy, and Ultimate Abilities from each unit sheet."
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
    { target: "#classActionTitle", titleKey: "classActionTitle", kickerKey: "classActionKicker", textKey: "classActionText", pad: 18, mobileTop: 118, fullCard: true },
    { target: "#ultTitle,#ultToggleContainer", titleKey: "ultimateTitle", kickerKey: "ultimateKicker", textKey: "ultimateText", pad: 18, mobileTop: 118, fullCard: true },
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
    const el = candidates.find(isVisibleTarget) || null;
    if (!el) return null;
    // Si fullCard, on remonte à la card parente pour encadrer toute la section
    if (step.fullCard) {
      const card = el.closest(".card") || el.parentElement;
      return (card && isVisibleTarget(card)) ? card : el;
    }
    return el;
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

  function scrollPageBy(delta) {
    if (Math.abs(delta) < 2) return;
    const root = document.scrollingElement || document.documentElement;
    const body = document.body;
    const html = document.documentElement;
    // Débloquer temporairement overflow pour que le scroll JS fonctionne
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.setProperty("overflow", "auto", "important");
    html.style.setProperty("overflow", "auto", "important");
    root.scrollTop += delta;
    // Restaurer après le frame
    requestAnimationFrame(() => {
      if (scrollLocked) {
        body.style.setProperty("overflow", "hidden", "important");
        html.style.setProperty("overflow", "hidden", "important");
      } else {
        body.style.overflow = prevBody;
        html.style.overflow = prevHtml;
      }
    });
  }

  function positionTargetForMobile(target, step) {
    if (!isMobile() || !target) return;
    if (step?.target === "#unitTabs") return;

    const safeTop    = 88;   // sous la topbar + breadcrumb
    const tabsTop    = getTabsSafeTop();
    const safeBottom = tabsTop - 36;
    const available  = Math.max(80, safeBottom - safeTop);
    const root       = document.scrollingElement || document.documentElement;
    const curY       = root.scrollTop;

    let rect = target.getBoundingClientRect();

    // Centrer la card dans la zone disponible
    let desiredTop = safeTop;
    if (rect.height < available) {
      desiredTop = safeTop + Math.max(0, (available - rect.height) / 2);
    }

    let nextY = curY + (rect.top - desiredTop);

    // Si la card dépasse en bas, ajuster
    const projectedBottom = desiredTop + rect.height;
    if (projectedBottom > safeBottom) {
      nextY += projectedBottom - safeBottom;
    }

    const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
    nextY = Math.max(0, Math.min(nextY, maxY));

    if (Math.abs(nextY - curY) > 2) scrollPageBy(nextY - curY);
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
    if (isMobile()) positionTargetForMobile(activeTarget, activeStep);
    const rect = activeTarget.getBoundingClientRect();
    const pad = Number(activeStep?.pad ?? 12);
    const mobileExtraTop = isMobile() && activeStep?.target === ".hp-section" ? 2 : 0;
    const mobileExtraBottom = isMobile() && activeStep?.target === ".hp-section" ? 8 : 0;
    const top = Math.max(10, rect.top - pad - mobileExtraTop);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottomLimit = activeStep?.allowTabsOverlap ? window.innerHeight - 10 : getTabsSafeTop() - 10;
    const bottom = Math.min(bottomLimit, rect.bottom + pad + mobileExtraBottom, window.innerHeight - 10);
    if (bottom <= top + 6 && isMobile()) {
      scrollPageBy(bottom - top + 70);
      return requestAnimationFrame(updateOverlayPosition);
    }
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
