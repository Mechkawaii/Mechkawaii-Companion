(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STATE_PREFIX = PREFIX + "state:";
  const DRAFT_KEY = PREFIX + "draft";
  const OPP_DRAFT_KEY = PREFIX + "opp-draft";
  const FLOW_KEY = PREFIX + "game-flow";
  const SUDDEN_KEY = PREFIX + "sudden-death";

  const CAMP_LABELS = {
    mechkawaii: "Mechkawaii",
    prodrome: "Prodromes"
  };

  const END_TEXTS = {
    mechkawaii: {
      title: "Victoire des Prodromes",
      text: "Les Mechkawaii sont hors combat. Les Prodromes prennent le contrôle du champ de bataille. Même les unités les plus kawaii ont parfois besoin d’un reboot."
    },
    prodrome: {
      title: "Victoire des Mechkawaii",
      text: "Les Prodromes sont neutralisés. Les Mechkawaii tiennent bon et repoussent l’invasion. Le champ de bataille peut respirer… pour l’instant."
    }
  };

  let characters = [];
  let lastSnapshot = "";
  let checkTimer = null;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getFlow() {
    return readJson(FLOW_KEY, null);
  }

  function getSuddenState() {
    const state = readJson(SUDDEN_KEY, null);
    return state && typeof state === "object" ? state : { camps: {}, gameOver: null };
  }

  function saveSuddenState(state) {
    writeJson(SUDDEN_KEY, state);
  }

  function campLabel(camp) {
    return CAMP_LABELS[camp] || camp;
  }

  function opponent(camp) {
    return camp === "mechkawaii" ? "prodrome" : "mechkawaii";
  }

  function getPlayedIds() {
    const draft = readJson(DRAFT_KEY, null);
    const oppDraft = readJson(OPP_DRAFT_KEY, null);
    return Array.from(new Set([
      ...(Array.isArray(draft?.activeIds) ? draft.activeIds : []),
      ...(Array.isArray(oppDraft?.activeIds) ? oppDraft.activeIds : [])
    ].filter(Boolean)));
  }

  function getCharById(id) {
    return characters.find(char => char.id === id) || null;
  }

  function getHpMax(char) {
    return Number(char?.hp?.max ?? char?.hpMax ?? char?.maxHp ?? 0) || 0;
  }

  function getHpCurrent(char) {
    const state = readJson(STATE_PREFIX + char.id, null);
    const max = getHpMax(char);
    if (!state || typeof state !== "object") return max;

    const candidates = [
      state.hpCur,
      state.hpCurrent,
      state.currentHp,
      state.currentHP,
      state.hp,
      state.pv,
      state.pvCur,
      state.currentPv,
      state.currentPV,
      state?.hpState?.current,
      state?.hp?.current,
      state?.hp?.cur
    ];

    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n)) return Math.max(0, n);
    }

    return max;
  }

  function getCampStatus() {
    const ids = getPlayedIds();
    const byCamp = {
      mechkawaii: { camp: "mechkawaii", units: [], ko: [] },
      prodrome: { camp: "prodrome", units: [], ko: [] }
    };

    ids.forEach(id => {
      const char = getCharById(id);
      if (!char) return;
      const camp = char.camp || "mechkawaii";
      if (!byCamp[camp]) byCamp[camp] = { camp, units: [], ko: [] };
      const hp = getHpCurrent(char);
      const unit = { id, char, hp };
      byCamp[camp].units.push(unit);
      if (hp <= 0) byCamp[camp].ko.push(unit);
    });

    return byCamp;
  }

  function currentTurnKey() {
    const flow = getFlow();
    if (!flow?.started) return "no-flow";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "none"}`;
  }

  function removeElement(id) {
    document.getElementById(id)?.remove();
  }

  function injectStyles() {
    if (document.getElementById("mkwSuddenDeathStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwSuddenDeathStyles";
    style.textContent = `
      #mkwSuddenDeathHud { margin: 12px 0 0; border: 1px solid rgba(255, 76, 76, .45); border-radius: 16px; padding: 12px; background: linear-gradient(135deg, rgba(255, 42, 80, .18), rgba(255, 255, 255, .04)); box-shadow: 0 14px 34px rgba(0,0,0,.24); }
      .mkw-sd-title { font-weight: 1000; text-transform: uppercase; letter-spacing: .05em; font-size: 13px; color: #fff; }
      .mkw-sd-text { margin-top: 4px; color: var(--text); font-size: 12px; line-height: 1.4; }
      .mkw-sd-count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; margin: 0 2px; border-radius: 999px; background: rgba(255, 210, 77, .18); border: 1px solid rgba(255, 210, 77, .55); color: #fff; font-weight: 1000; }
      #mkwSuddenWarningBackdrop, #mkwGameOverBackdrop { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0, 0, 0, .78); }
      #mkwSuddenWarningPanel, #mkwGameOverPanel { width: min(560px, 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,.16); background: #111217; box-shadow: 0 30px 80px rgba(0,0,0,.58); overflow: hidden; }
      .mkw-sd-panel-head { padding: 18px; background: linear-gradient(135deg, rgba(255, 42, 80, .34), rgba(255,255,255,.05)); border-bottom: 1px solid rgba(255,255,255,.12); }
      .mkw-sd-kicker { font-size: 12px; color: rgba(255,255,255,.72); font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
      .mkw-sd-panel-title { margin-top: 6px; font-size: 26px; line-height: 1.05; font-weight: 1000; text-transform: uppercase; }
      .mkw-sd-panel-body { padding: 18px; }
      .mkw-sd-panel-body p { margin: 0 0 12px; line-height: 1.45; }
      .mkw-sd-ko-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px; }
      .mkw-sd-ko-chip { border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 7px 10px; background: rgba(255,255,255,.06); font-size: 12px; font-weight: 800; }
      .mkw-sd-actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; }
      .mkw-sd-btn { width: 100%; }
      #mkwGameOverPanel { text-align: center; }
      #mkwGameOverPanel .mkw-sd-panel-title { font-size: clamp(28px, 7vw, 46px); }
      .mkw-game-over-mark { font-size: 48px; line-height: 1; margin-bottom: 8px; }
    `;
    document.head.appendChild(style);
  }

  function unitName(unit) {
    return unit?.char?.name?.fr || unit?.char?.name?.en || unit?.char?.name || unit?.id || "Unité";
  }

  function showWarning(camp, status, remaining) {
    removeElement("mkwSuddenWarningBackdrop");
    const backdrop = document.createElement("div");
    backdrop.id = "mkwSuddenWarningBackdrop";
    backdrop.innerHTML = `
      <div id="mkwSuddenWarningPanel" role="dialog" aria-modal="true">
        <div class="mkw-sd-panel-head">
          <div class="mkw-sd-kicker">Mort subite</div>
          <div class="mkw-sd-panel-title">${campLabel(camp)} en danger</div>
        </div>
        <div class="mkw-sd-panel-body">
          <p><strong>Deux unités sont HS.</strong> ${campLabel(camp)} dispose de <span class="mkw-sd-count">${remaining}</span> tours pour réparer une unité alliée avec au moins 1 PV.</p>
          <p>Si aucune unité n’est remise en service avant la fin du compte à rebours, la partie est perdue.</p>
          <div class="mkw-sd-ko-list">
            ${status.ko.map(unit => `<span class="mkw-sd-ko-chip">${unitName(unit)}</span>`).join("")}
          </div>
          <button type="button" class="mkw-sd-btn btn-accent">Compris</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector("button")?.addEventListener("click", () => removeElement("mkwSuddenWarningBackdrop"));
  }

  function showGameOver(losingCamp, reason) {
    const sd = getSuddenState();
    if (sd.gameOver?.camp === losingCamp) return;
    sd.gameOver = { camp: losingCamp, reason, at: Date.now() };
    saveSuddenState(sd);

    removeElement("mkwGameOverBackdrop");
    removeElement("mkwSuddenWarningBackdrop");

    const winner = opponent(losingCamp);
    const texts = END_TEXTS[losingCamp] || {
      title: `Victoire des ${campLabel(winner)}`,
      text: `${campLabel(losingCamp)} n’a plus d’unités opérationnelles.`
    };

    const backdrop = document.createElement("div");
    backdrop.id = "mkwGameOverBackdrop";
    backdrop.innerHTML = `
      <div id="mkwGameOverPanel" role="dialog" aria-modal="true">
        <div class="mkw-sd-panel-head">
          <div class="mkw-game-over-mark">☠️</div>
          <div class="mkw-sd-kicker">Fin de partie</div>
          <div class="mkw-sd-panel-title">${texts.title}</div>
        </div>
        <div class="mkw-sd-panel-body">
          <p>${texts.text}</p>
          <p>${reason === "timer" ? "Le délai de mort subite est écoulé." : "Les 3 unités du camp sont HS."}</p>
          <div class="mkw-sd-actions">
            <button type="button" class="mkw-sd-btn btn-accent" data-action="title">Retour à l’écran titre</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector("[data-action='title']")?.addEventListener("click", () => {
      try {
        if (window.mkwClearStorage) {
          window.mkwClearStorage({ setup: true, draft: true, oppDraft: true, shared: true, cu: true, states: true, splash: true });
        } else {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(PREFIX)) localStorage.removeItem(key);
          });
        }
      } catch (error) {}
      location.href = "index.html";
    });
  }

  function renderHud(statuses, suddenState) {
    const banner = document.getElementById("mkwTurnBanner");
    if (!banner) return;

    const activeEntries = Object.entries(suddenState.camps || {}).filter(([camp, data]) => {
      const status = statuses[camp];
      return data?.active && status && status.ko.length === 2;
    });

    if (!activeEntries.length) {
      removeElement("mkwSuddenDeathHud");
      return;
    }

    let hud = document.getElementById("mkwSuddenDeathHud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "mkwSuddenDeathHud";
      const expertHud = document.getElementById("mkwExpertEventHud");
      if (expertHud?.parentNode) expertHud.insertAdjacentElement("afterend", hud);
      else banner.insertAdjacentElement("afterend", hud);
    }

    hud.innerHTML = activeEntries.map(([camp, data]) => {
      return `
        <div class="mkw-sd-title">Mort subite — ${campLabel(camp)}</div>
        <div class="mkw-sd-text">2 unités HS. Il reste <span class="mkw-sd-count">${data.remaining}</span> tours pour réparer une unité alliée avec au moins 1 PV.</div>
      `;
    }).join("");
  }

  function syncSuddenState({ showNewWarnings = true } = {}) {
    if (!characters.length || !document.body.classList.contains("page-character")) return;

    const statuses = getCampStatus();
    const suddenState = getSuddenState();
    suddenState.camps = suddenState.camps || {};

    Object.entries(statuses).forEach(([camp, status]) => {
      if (!status.units.length) return;

      if (status.ko.length >= 3) {
        showGameOver(camp, "three-ko");
        return;
      }

      if (status.ko.length < 2) {
        if (suddenState.camps[camp]?.active) delete suddenState.camps[camp];
        return;
      }

      if (status.ko.length === 2 && !suddenState.camps[camp]?.active) {
        suddenState.camps[camp] = {
          active: true,
          remaining: 3,
          startedAt: currentTurnKey(),
          warned: false
        };
        if (showNewWarnings) {
          suddenState.camps[camp].warned = true;
          showWarning(camp, status, 3);
        }
      }
    });

    saveSuddenState(suddenState);
    renderHud(statuses, suddenState);
  }

  function processEndTurnBeforeAdvance() {
    if (!characters.length || !document.body.classList.contains("page-character")) return;
    const flow = getFlow();
    if (!flow?.started || !flow.currentCamp) return;

    syncSuddenState({ showNewWarnings: true });

    const camp = flow.currentCamp;
    const statuses = getCampStatus();
    const status = statuses[camp];
    const suddenState = getSuddenState();
    const data = suddenState.camps?.[camp];
    if (!data?.active || !status || status.ko.length < 2) return;

    data.remaining = Math.max(0, Number(data.remaining || 0) - 1);
    suddenState.camps[camp] = data;
    saveSuddenState(suddenState);
    renderHud(statuses, suddenState);

    if (data.remaining <= 0 && status.ko.length >= 2) {
      setTimeout(() => showGameOver(camp, "timer"), 80);
    }
  }

  function buildSnapshot() {
    const statuses = getCampStatus();
    return Object.values(statuses).map(status => `${status.camp}:${status.ko.map(unit => unit.id).sort().join(",")}`).join("|");
  }

  function scheduleCheck() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => {
      const snapshot = buildSnapshot();
      if (snapshot !== lastSnapshot) {
        lastSnapshot = snapshot;
        syncSuddenState({ showNewWarnings: true });
      } else {
        syncSuddenState({ showNewWarnings: false });
      }
    }, 120);
  }

  async function init() {
    if (!document.body.classList.contains("page-character")) return;
    injectStyles();
    try {
      const res = await fetch("./data/characters.json", { cache: "no-store" });
      characters = await res.json();
    } catch (error) {
      characters = [];
    }

    lastSnapshot = buildSnapshot();
    syncSuddenState({ showNewWarnings: true });

    document.addEventListener("click", event => {
      if (event.target.closest?.(".mkw-end-turn, .mkw-turn-transition-button")) {
        processEndTurnBeforeAdvance();
      }
      if (event.target.closest?.("#hpMinus, #hpPlus, #resetBtn, .key-button, .switch")) {
        scheduleCheck();
      }
    }, true);

    window.addEventListener("mechkawaii:game-flow-updated", () => scheduleCheck());
    window.addEventListener("mechkawaii:turn-start", () => scheduleCheck());
    window.addEventListener("storage", () => scheduleCheck());
    setInterval(scheduleCheck, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
