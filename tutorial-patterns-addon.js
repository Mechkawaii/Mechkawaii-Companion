(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const SHEEPARD_SRC = "./assets/sheepard.svg";
  let active = false;
  let resumeButton = null;
  let alreadyInsertedForCurrentRun = false;
  let customIndex = 0;
  let customOverlay = null;
  let customHighlight = null;
  let customTooltip = null;

  const I18N = {
    fr: {
      sheepard: "Général Sheepard",
      prev: "←",
      next: "Suivant",
      backToTutorial: "Reprendre",
      movementTitle: "Déplacement",
      movementText: "En Mode Normal, toutes les unités utilisent les mêmes schémas de déplacement et d’attaque. En Mode Expert, chaque unité possède ses propres schémas. Sur le schéma de déplacement, le point de couleur indique la position de l’unité. Les croix indiquent les cases où elle peut se déplacer. Les routes peuvent modifier le déplacement : suis le tracé des routes connectées et applique les règles indiquées par le jeu.",
      attackTitle: "Attaque",
      attackText: "Sur le schéma d’attaque, les symboles cible indiquent les tirs à distance. Pour tirer à distance, la ligne de mire doit être dégagée. Le symbole poing indique l’attaque au corps à corps : si elle réussit, la cible recule d’une case si possible."
    },
    en: {
      sheepard: "General Sheepard",
      prev: "←",
      next: "Next",
      backToTutorial: "Resume",
      movementTitle: "Movement",
      movementText: "In Normal Mode, all units use the same movement and attack patterns. In Expert Mode, each unit has its own patterns. On the movement diagram, the colored dot shows the unit’s position. The crosses show the spaces it may move to. Roads can modify movement: follow connected roads and apply the rules shown by the game.",
      attackTitle: "Attack",
      attackText: "On the attack diagram, target icons show ranged attacks. To shoot at range, line of sight must be clear. The fist icon shows melee attacks: if successful, the target is pushed back one space if possible."
    }
  };

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || document.querySelector("#lang")?.value || "fr";
  }

  function tr(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  function isMobile() {
    return window.innerWidth <= 700;
  }

  function getTargetForStep(step) {
    if (step === "movement") return document.querySelector("#movementImg")?.closest(".card") || document.querySelector("#movementImg");
    if (step === "attack") return document.querySelector("#attackImg")?.closest(".card") || document.querySelector("#attackImg");
    return null;
  }

  function scrollPageBy(delta) {
    const root = document.scrollingElement || document.documentElement;
    root.scrollTop += delta;
  }

  function getTabsSafeTop() {
    const tabs = document.querySelector("#unitTabsContainer");
    return tabs ? tabs.getBoundingClientRect().top : window.innerHeight;
  }

  function positionTarget(target) {
    if (!target) return;
    const desiredTop = isMobile() ? 104 : 150;
    target.scrollIntoView({ behavior: "auto", block: isMobile() ? "nearest" : "center", inline: "center" });
    let rect = target.getBoundingClientRect();
    if (isMobile()) {
      const firstDelta = rect.top - desiredTop;
      if (Math.abs(firstDelta) > 6) scrollPageBy(firstDelta);
      rect = target.getBoundingClientRect();
      const safeBottom = getTabsSafeTop() - 24;
      if (rect.bottom > safeBottom) scrollPageBy(rect.bottom - safeBottom);
    }
  }

  function ensureDom() {
    if (!customOverlay) {
      customOverlay = document.createElement("div");
      customOverlay.id = "mkwPatternTutorialOverlay";
      document.body.appendChild(customOverlay);
    }
    if (!customHighlight) {
      customHighlight = document.createElement("div");
      customHighlight.id = "mkwPatternTutorialHighlight";
      document.body.appendChild(customHighlight);
    }
    if (!customTooltip) {
      customTooltip = document.createElement("div");
      customTooltip.id = "mkwPatternTutorialTooltip";
      document.body.appendChild(customTooltip);
    }
  }

  function injectStyles() {
    if (document.querySelector("#mkwPatternTutorialStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwPatternTutorialStyles";
    style.textContent = `
      #mkwPatternTutorialOverlay { position: fixed; inset: 0; z-index: 100500; background: rgba(0,0,0,.72); pointer-events: auto; }
      #mkwPatternTutorialHighlight { position: fixed; z-index: 100501; border: 3px solid #ff4bd8; border-radius: 18px; box-shadow: 0 0 22px rgba(255,75,216,.72), inset 0 0 18px rgba(255,75,216,.22); pointer-events: none; }
      #mkwPatternTutorialTooltip { position: fixed; z-index: 100502; width: min(420px, calc(100vw - 28px)); background: #111217; color: #fff; border: 1px solid rgba(255,255,255,.12); border-radius: 20px; padding: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.55); }
      .mkw-pattern-tuto-content { display: flex; gap: 14px; align-items: flex-start; }
      .mkw-pattern-tuto-portrait { width: clamp(58px, 16vw, 76px); height: clamp(58px, 16vw, 76px); border-radius: 999px; object-fit: contain; flex: 0 0 auto; background: rgba(255,255,255,.08); box-shadow: 0 0 18px rgba(255,210,77,.25); }
      .mkw-pattern-tuto-speaker { color: #ffd24d; font-size: 12px; font-weight: 1000; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
      .mkw-pattern-tuto-title { font-size: 17px; font-weight: 1000; margin-bottom: 8px; }
      .mkw-pattern-tuto-text { font-size: 14px; line-height: 1.42; }
      .mkw-pattern-tuto-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 16px; }
      .mkw-pattern-tuto-actions button { min-width: 48px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); color: #fff; font-weight: 900; }
      .mkw-pattern-tuto-actions button:last-child { background: linear-gradient(135deg, #ff4bd8, #ffd24d); color: #111; border: 0; }
      .mkw-pattern-tuto-actions button:disabled { opacity: .35; }
    `;
    document.head.appendChild(style);
  }

  function placeTooltip(rect) {
    const pad = 14;
    const tooltipRect = customTooltip.getBoundingClientRect();
    const safeBottom = getTabsSafeTop() - pad;
    const safeTop = 14;
    const maxLeft = window.innerWidth - tooltipRect.width - pad;
    const left = Math.max(pad, Math.min(rect.left, maxLeft));
    let top = rect.bottom + 18;
    if (top + tooltipRect.height > safeBottom) top = rect.top - tooltipRect.height - 18;
    if (top < safeTop) top = Math.max(safeTop, safeBottom - tooltipRect.height);
    customTooltip.style.left = left + "px";
    customTooltip.style.top = top + "px";
  }

  function updatePosition(target) {
    if (!target) return;
    const pad = 12;
    const rect = target.getBoundingClientRect();
    const top = Math.max(10, rect.top - pad);
    const left = Math.max(10, rect.left - pad);
    const right = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottom = Math.min(getTabsSafeTop() - 10, rect.bottom + pad, window.innerHeight - 10);

    customOverlay.style.clipPath = `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,${left}px 100%,100% 100%,100% 0%)`;
    customHighlight.style.top = top + "px";
    customHighlight.style.left = left + "px";
    customHighlight.style.width = Math.max(0, right - left) + "px";
    customHighlight.style.height = Math.max(0, bottom - top) + "px";
    placeTooltip({ top, left, right, bottom });
  }

  function removeCustomTutorial() {
    active = false;
    customOverlay?.remove();
    customHighlight?.remove();
    customTooltip?.remove();
    customOverlay = null;
    customHighlight = null;
    customTooltip = null;
  }

  function resumeOriginalTutorial() {
    const btn = resumeButton;
    removeCustomTutorial();
    if (btn) {
      window.__mkwPatternTutorialResume = true;
      setTimeout(() => {
        btn.click();
        window.__mkwPatternTutorialResume = false;
      }, 30);
    }
  }

  function renderCustomStep() {
    injectStyles();
    ensureDom();
    const stepKey = customIndex === 0 ? "movement" : "attack";
    const target = getTargetForStep(stepKey);
    if (!target) return resumeOriginalTutorial();

    positionTarget(target);

    const title = customIndex === 0 ? tr("movementTitle") : tr("attackTitle");
    const text = customIndex === 0 ? tr("movementText") : tr("attackText");

    customTooltip.innerHTML = `
      <div class="mkw-pattern-tuto-content">
        <img class="mkw-pattern-tuto-portrait" src="${SHEEPARD_SRC}" alt="">
        <div>
          <div class="mkw-pattern-tuto-speaker">${tr("sheepard")}</div>
          <div class="mkw-pattern-tuto-title">${title}</div>
          <div class="mkw-pattern-tuto-text">${text}</div>
        </div>
      </div>
      <div class="mkw-pattern-tuto-actions">
        <button type="button" data-pattern-prev ${customIndex === 0 ? "disabled" : ""}>${tr("prev")}</button>
        <button type="button" data-pattern-next>${customIndex === 1 ? tr("backToTutorial") : tr("next")}</button>
      </div>
    `;

    customTooltip.querySelector("[data-pattern-prev]")?.addEventListener("click", () => {
      if (customIndex > 0) {
        customIndex -= 1;
        renderCustomStep();
      }
    });
    customTooltip.querySelector("[data-pattern-next]")?.addEventListener("click", () => {
      if (customIndex < 1) {
        customIndex += 1;
        renderCustomStep();
      } else {
        resumeOriginalTutorial();
      }
    });

    requestAnimationFrame(() => updatePosition(target));
    setTimeout(() => updatePosition(target), 100);
  }

  function isActionClassStep() {
    const title = document.querySelector(".mkw-tutorial-title")?.textContent?.trim() || "";
    return title === "Action de classe" || title === "Class Action";
  }

  function init() {
    document.addEventListener("click", event => {
      if (window.__mkwPatternTutorialResume) return;
      const next = event.target.closest?.("#next");
      if (!next || active || alreadyInsertedForCurrentRun === true) return;
      if (!document.querySelector(".mkw-tutorial-tooltip")) {
        alreadyInsertedForCurrentRun = false;
        return;
      }
      if (!isActionClassStep()) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      active = true;
      alreadyInsertedForCurrentRun = true;
      resumeButton = next;
      customIndex = 0;
      renderCustomStep();
    }, true);

    const observer = new MutationObserver(() => {
      if (!document.querySelector(".mkw-tutorial-tooltip") && !active) {
        alreadyInsertedForCurrentRun = false;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
