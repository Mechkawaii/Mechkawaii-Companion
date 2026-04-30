/* =============================================================
   MECHKAWAII — Tutorial Mobile (consolidated)
   Remplace : tutorial-class-scroll-fix.js
              tutorial-tuning-fix.js
              tutorial-patterns-addon.js
   ============================================================= */
(function () {
  "use strict";

  const PREFIX      = "mechkawaii:";
  const SHEEPARD    = "./assets/sheepard.svg";
  const MOBILE_MAX  = 700;

  /* ----------------------------------------------------------
     State
  ---------------------------------------------------------- */
  let raf            = null;
  let patternActive  = false;
  let patternIndex   = 0;
  let patternResume  = null;
  let lastStepKey    = "";

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  function isMobile() { return window.innerWidth <= MOBILE_MAX; }
  function getLang()  { return localStorage.getItem(PREFIX + "lang") || "fr"; }

  function tabsTop() {
    const t = document.querySelector("#unitTabsContainer");
    const fromTabs = t ? t.getBoundingClientRect().top : window.innerHeight;
    const fromBottom = window.innerHeight - 130;
    return Math.min(fromTabs, fromBottom);
  }

  function qs(sel, root = document) { return root.querySelector(sel); }

  /* ----------------------------------------------------------
     Scroll sans bloquer le touch-action
     On retire temporairement overflow:hidden sur body/html
  ---------------------------------------------------------- */
  function scrollTo(y) {
    const root = document.scrollingElement || document.documentElement;
    const body = document.body;
    const html = document.documentElement;

    // Bypass overflow:hidden posé par tutorial.js lockPage()
    body.style.setProperty("overflow", "auto", "important");
    html.style.setProperty("overflow", "auto", "important");

    const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
    root.scrollTop = Math.max(0, Math.min(y, maxY));

    // Remettre hidden si tutorial.js avait locké
    requestAnimationFrame(() => {
      if (document.querySelector(".mkw-tutorial-overlay, #mkwPatternTutorialOverlay")) {
        body.style.setProperty("overflow", "hidden", "important");
        html.style.setProperty("overflow", "hidden", "important");
      }
    });
  }

  /* ----------------------------------------------------------
     Centre une card dans la zone visible (topbar → tabs)
  ---------------------------------------------------------- */
  function cameraTo(card) {
    if (!card || !isMobile()) return;
    const root    = document.scrollingElement || document.documentElement;
    const safeTop = 90;
    const safeBtm = tabsTop() - 40;
    const avail   = Math.max(100, safeBtm - safeTop);
    const rect    = card.getBoundingClientRect();
    const curY    = root.scrollTop;

    let desiredTop = safeTop;
    if (rect.height < avail) desiredTop = safeTop + (avail - rect.height) / 2;

    let nextY = curY + rect.top - desiredTop;
    const projectedBottom = desiredTop + rect.height;
    if (projectedBottom > safeBtm) nextY += projectedBottom - safeBtm;

    if (Math.abs(nextY - curY) < 2) return;
    scrollTo(nextY);
  }

  /* ----------------------------------------------------------
     Dessine overlay + highlight + positionne tooltip
  ---------------------------------------------------------- */
  function drawHighlight({ overlay, highlight, tooltip, card, pad = 16 }) {
    if (!overlay || !highlight || !card) return;
    const rect   = card.getBoundingClientRect();
    const top    = Math.max(10, rect.top - pad);
    const left   = Math.max(10, rect.left - pad);
    const right  = Math.min(window.innerWidth - 10, rect.right + pad);
    const bottom = Math.min(tabsTop() - 8, rect.bottom + pad, window.innerHeight - 10);

    overlay.style.clipPath =
      `polygon(0% 0%,0% 100%,${left}px 100%,${left}px ${top}px,` +
      `${right}px ${top}px,${right}px ${bottom}px,${left}px ${bottom}px,` +
      `${left}px 100%,100% 100%,100% 0%)`;

    if (highlight) {
      highlight.style.top    = top + "px";
      highlight.style.left   = left + "px";
      highlight.style.width  = Math.max(0, right - left) + "px";
      highlight.style.height = Math.max(0, bottom - top) + "px";
    }

    if (tooltip) placeTooltip(tooltip, top, left, right, bottom);
  }

  function placeTooltip(tooltip, top, left, right, bottom) {
    const margin  = 14;
    const tRect   = tooltip.getBoundingClientRect();
    const safeBtm = tabsTop() - margin;
    const maxLeft = window.innerWidth - tRect.width - margin;
    const tleft   = Math.max(margin, Math.min(left, maxLeft));
    const spBelow = safeBtm - bottom;
    const spAbove = top - margin;
    let ttop = bottom + 18;
    if (spBelow < tRect.height + 18 && spAbove > spBelow)
      ttop = top - tRect.height - 18;
    if (ttop < margin) ttop = margin;
    if (ttop + tRect.height > safeBtm) ttop = Math.max(margin, safeBtm - tRect.height);
    tooltip.style.left   = tleft + "px";
    tooltip.style.right  = "auto";
    tooltip.style.bottom = "auto";
    tooltip.style.top    = ttop + "px";
  }

  /* ----------------------------------------------------------
     Visibilité du tutorial principal (masqué pendant patterns)
  ---------------------------------------------------------- */
  function setMainVisible(visible) {
    [".mkw-tutorial-tooltip", ".mkw-tutorial-highlight", ".mkw-tutorial-overlay"]
      .map(s => qs(s))
      .forEach(el => {
        if (!el) return;
        el.style.visibility    = visible ? "" : "hidden";
        el.style.pointerEvents = visible ? "" : "none";
      });
  }

  /* ----------------------------------------------------------
     Détection de l'étape courante
  ---------------------------------------------------------- */
  function mainTitle()    { return qs(".mkw-tutorial-title")?.textContent?.trim() || ""; }
  function patternTitle() { return qs(".mkw-pattern-tuto-title")?.textContent?.trim() || ""; }
  function isMainOpen()   { return !!qs(".mkw-tutorial-tooltip"); }
  function isPatternOpen(){ return !!qs("#mkwPatternTutorialTooltip"); }

  function cardForMainStep() {
    const t = mainTitle();
    if (t === "Action de classe" || t === "Class Action")
      return qs("#classActionTitle")?.closest(".card") || null;
    if (t === "Coup Unique" || t === "Ultimate Ability")
      return qs("#ultTitle")?.closest(".card") || null;
    return null;
  }

  function cardForPatternStep() {
    const t = patternTitle();
    if (t === "Déplacement" || t === "Movement")
      return qs("#movementImg")?.closest(".card") || null;
    if (t === "Attaquer" || t === "Attack")
      return qs("#attackImg")?.closest(".card") || null;
    return null;
  }

  /* ----------------------------------------------------------
     Sync principal (appelé à chaque mutation)
     — anti-flash : on ne redessine que si l'étape change
  ---------------------------------------------------------- */
  function syncTutorial() {
    if (!isMobile()) return;

    // --- Patterns addon ouvert ---
    if (isPatternOpen()) {
      const card = cardForPatternStep();
      const key  = "pattern:" + patternTitle();
      setMainVisible(false);

      if (key !== lastStepKey) {
        lastStepKey = key;
        cameraTo(card);
      }
      requestAnimationFrame(() => {
        drawHighlight({
          overlay:   qs("#mkwPatternTutorialOverlay"),
          highlight: qs("#mkwPatternTutorialHighlight"),
          tooltip:   qs("#mkwPatternTutorialTooltip"),
          card, pad: 16
        });
      });
      setTimeout(() => drawHighlight({
        overlay:   qs("#mkwPatternTutorialOverlay"),
        highlight: qs("#mkwPatternTutorialHighlight"),
        tooltip:   qs("#mkwPatternTutorialTooltip"),
        card, pad: 16
      }), 120);
      return;
    }

    // --- Tutorial principal ---
    if (isMainOpen()) {
      setMainVisible(true);
      const card = cardForMainStep();
      const key  = "main:" + mainTitle();

      if (key !== lastStepKey) {
        lastStepKey = key;
        if (card) cameraTo(card);
      }
      if (card) {
        requestAnimationFrame(() => drawHighlight({
          overlay:   qs(".mkw-tutorial-overlay"),
          highlight: qs(".mkw-tutorial-highlight"),
          tooltip:   qs(".mkw-tutorial-tooltip"),
          card, pad: 18
        }));
        setTimeout(() => drawHighlight({
          overlay:   qs(".mkw-tutorial-overlay"),
          highlight: qs(".mkw-tutorial-highlight"),
          tooltip:   qs(".mkw-tutorial-tooltip"),
          card, pad: 18
        }), 120);
        setTimeout(() => drawHighlight({
          overlay:   qs(".mkw-tutorial-overlay"),
          highlight: qs(".mkw-tutorial-highlight"),
          tooltip:   qs(".mkw-tutorial-tooltip"),
          card, pad: 18
        }), 300);
      }
      return;
    }

    // Tutorial fermé
    lastStepKey = "";
    setMainVisible(true);
  }

  function scheduleSync() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(syncTutorial);
  }

  /* ----------------------------------------------------------
     Patterns addon (Déplacement + Attaquer)
     Inséré entre "Action de classe" et "Coup Unique"
  ---------------------------------------------------------- */
  const I18N = {
    fr: {
      speaker:       "Général Sheepard",
      prev:          "←",
      next:          "Suivant",
      movementTitle: "Déplacement",
      movementText:  "En Mode Normal, toutes les unités utilisent les mêmes schémas de déplacement et d'attaque. En Mode Expert, chaque unité possède ses propres schémas. Sur le schéma de déplacement, le point de couleur indique la position de l'unité. Les croix indiquent les cases où elle peut se déplacer. Les routes peuvent modifier le déplacement : suis le tracé des routes connectées et applique les règles indiquées par le jeu.",
      attackTitle:   "Attaquer",
      attackText:    "Sur le schéma d'attaque, les symboles cible indiquent les tirs à distance. Pour tirer à distance, la ligne de mire doit être dégagée. Le symbole poing indique l'attaque au corps à corps : si elle réussit, la cible recule d'une case si possible.",
    },
    en: {
      speaker:       "General Sheepard",
      prev:          "←",
      next:          "Next",
      movementTitle: "Movement",
      movementText:  "In Normal Mode, all units use the same movement and attack patterns. In Expert Mode, each unit has its own patterns. On the movement diagram, the colored dot shows the unit's position. The crosses show the spaces it may move to. Roads can modify movement: follow connected roads and apply the rules shown by the game.",
      attackTitle:   "Attack",
      attackText:    "On the attack diagram, target icons show ranged attacks. To shoot at range, line of sight must be clear. The fist icon shows melee attacks: if successful, the target is pushed back one space if possible.",
    }
  };
  function tr(k) { const l = getLang(); return (I18N[l]?.[k] ?? I18N.fr[k] ?? k); }

  function ensurePatternStyles() {
    if (qs("#mkwPatternTutoStyles")) return;
    const s = document.createElement("style");
    s.id = "mkwPatternTutoStyles";
    s.textContent = `
      #mkwPatternTutorialOverlay {
        position:fixed; inset:0; z-index:100500;
        background:rgba(0,0,0,.72); pointer-events:auto;
      }
      #mkwPatternTutorialHighlight {
        position:fixed; z-index:100501;
        border:3px solid #ff4bd8; border-radius:18px;
        box-shadow:0 0 22px rgba(255,75,216,.72),inset 0 0 18px rgba(255,75,216,.22);
        pointer-events:none;
      }
      #mkwPatternTutorialTooltip {
        position:fixed; z-index:100502;
        width:min(420px,calc(100vw - 28px));
        background:#111217; color:#fff;
        border:1px solid rgba(255,255,255,.12);
        border-radius:20px; padding:16px;
        box-shadow:0 24px 60px rgba(0,0,0,.55);
      }
      .mkw-pt-content { display:flex; gap:14px; align-items:flex-start; }
      .mkw-pt-portrait {
        width:clamp(52px,14vw,68px); height:clamp(52px,14vw,68px);
        border-radius:999px; object-fit:contain; flex:0 0 auto;
        background:rgba(255,255,255,.08);
        box-shadow:0 0 18px rgba(255,210,77,.25);
      }
      .mkw-pt-speaker { color:#ffd24d; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
      .mkw-pt-title   { font-size:17px; font-weight:900; margin-bottom:6px; }
      .mkw-pt-text    { font-size:14px; line-height:1.42; }
      .mkw-pt-actions { display:flex; justify-content:space-between; gap:10px; margin-top:14px; }
      .mkw-pt-actions button {
        min-width:48px; padding:11px 14px; border-radius:14px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.06); color:#fff; font-weight:900;
      }
      .mkw-pt-actions button:disabled { opacity:.35; cursor:default; }
    `;
    document.head.appendChild(s);
  }

  function removePattern() {
    patternActive = false;
    qs("#mkwPatternTutorialOverlay")?.remove();
    qs("#mkwPatternTutorialHighlight")?.remove();
    qs("#mkwPatternTutorialTooltip")?.remove();
    lastStepKey = "";
    scheduleSync();
  }

  function resumeMain() {
    const btn = patternResume;
    removePattern();
    if (btn) {
      window.__mkwPatternTutorialResume = true;
      setTimeout(() => {
        btn.click();
        window.__mkwPatternTutorialResume = false;
      }, 30);
    }
  }

  function renderPattern() {
    ensurePatternStyles();

    // Créer ou réutiliser les éléments DOM
    let overlay   = qs("#mkwPatternTutorialOverlay");
    let highlight = qs("#mkwPatternTutorialHighlight");
    let tooltip   = qs("#mkwPatternTutorialTooltip");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mkwPatternTutorialOverlay";
      document.body.appendChild(overlay);
    }
    if (!highlight) {
      highlight = document.createElement("div");
      highlight.id = "mkwPatternTutorialHighlight";
      document.body.appendChild(highlight);
    }
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "mkwPatternTutorialTooltip";
      document.body.appendChild(tooltip);
    }

    const isMove  = patternIndex === 0;
    const title   = isMove ? tr("movementTitle") : tr("attackTitle");
    const text    = isMove ? tr("movementText")  : tr("attackText");
    const card    = isMove
      ? qs("#movementImg")?.closest(".card") || qs("#movementImg")
      : qs("#attackImg")?.closest(".card")   || qs("#attackImg");

    tooltip.innerHTML = `
      <div class="mkw-pt-content">
        <img class="mkw-pt-portrait" src="${SHEEPARD}" alt="">
        <div>
          <div class="mkw-pt-speaker">${tr("speaker")}</div>
          <div class="mkw-pt-title">${title}</div>
          <div class="mkw-pt-text">${text}</div>
        </div>
      </div>
      <div class="mkw-pt-actions">
        <button type="button" data-pt-prev ${patternIndex === 0 ? "disabled" : ""}>${tr("prev")}</button>
        <button type="button" data-pt-next>${tr("next")}</button>
      </div>
    `;

    qs("[data-pt-prev]", tooltip)?.addEventListener("click", () => {
      if (patternIndex > 0) { patternIndex--; renderPattern(); }
    });
    qs("[data-pt-next]", tooltip)?.addEventListener("click", () => {
      if (patternIndex < 1) { patternIndex++; renderPattern(); }
      else resumeMain();
    });

    lastStepKey = ""; // Force le recalcul
    setMainVisible(false);

    if (card) cameraTo(card);

    requestAnimationFrame(() => {
      drawHighlight({ overlay, highlight, tooltip, card, pad: 16 });
    });
    setTimeout(() => {
      drawHighlight({ overlay, highlight, tooltip, card, pad: 16 });
    }, 150);
  }

  /* ----------------------------------------------------------
     Interception du clic "Suivant" sur l'étape Action de classe
  ---------------------------------------------------------- */
  let alreadyInserted = false;

  document.addEventListener("click", event => {
    if (window.__mkwPatternTutorialResume) return;
    const next = event.target.closest?.("#next");
    if (!next || patternActive || alreadyInserted) return;
    if (!isMainOpen()) { alreadyInserted = false; return; }
    const t = mainTitle();
    if (t !== "Action de classe" && t !== "Class Action") return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    patternActive   = true;
    alreadyInserted = true;
    patternResume   = next;
    patternIndex    = 0;
    renderPattern();
  }, true);

  // Reset alreadyInserted quand le tutorial se ferme
  new MutationObserver(() => {
    if (!isMainOpen() && !isPatternOpen()) alreadyInserted = false;
  }).observe(document.body, { childList: true, subtree: true });

  /* ----------------------------------------------------------
     Observer global (anti-flash : debounce 16ms)
  ---------------------------------------------------------- */
  let debounce = null;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(scheduleSync, 16);
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ["class", "style"]
  });

  window.addEventListener("resize",            () => { lastStepKey = ""; scheduleSync(); });
  window.addEventListener("orientationchange", () => { lastStepKey = ""; scheduleSync(); });
  document.addEventListener("click", event => {
    if (event.target.closest?.("#next,#prev,[data-pt-next],[data-pt-prev]")) {
      setTimeout(scheduleSync, 60);
      setTimeout(scheduleSync, 200);
    }
  }, true);

  /* ----------------------------------------------------------
     Init
  ---------------------------------------------------------- */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleSync);
  else scheduleSync();
})();
