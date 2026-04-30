(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CURRENT_ID = () => new URL(location.href).searchParams.get("id") || "";
  const STATE_KEY = id => PREFIX + "state:" + id;
  const SHIELDS_KEY = PREFIX + "shields";
  const SHIELD_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const SHIELD_META_KEY = PREFIX + "shield-expiry-meta";
  const FLOW_KEY = PREFIX + "game-flow";

  let cachedChars = null;
  let modalOpen = false;

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

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function textOf(value) {
    const lang = getLang();
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.fr || value.en || "";
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    window.__cachedChars = cachedChars;
    return cachedChars;
  }

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentTeam(chars) {
    const current = chars.find(char => char.id === CURRENT_ID());
    if (!current) return [];
    const camp = current.camp || "mechkawaii";
    const draftIds = getDraftIds();
    return chars.filter(char => {
      if ((char.camp || "mechkawaii") !== camp) return false;
      if (draftIds && !draftIds.includes(char.id)) return false;
      return true;
    }).slice(0, 3);
  }

  function getState(id) {
    return readJson(STATE_KEY(id), null);
  }

  function setState(id, state) {
    writeJson(STATE_KEY(id), state);
  }

  function getHpMax(char) {
    return Number(char?.hp?.max ?? 0) || 0;
  }

  function getHpCur(char) {
    const max = getHpMax(char);
    const state = getState(char.id);
    if (!state) return max;
    if (typeof state.hp === "number") return Math.max(0, Math.min(Number(state.hp), max));
    if (state.hp && typeof state.hp === "object") return Math.max(0, Math.min(Number(state.hp.cur ?? max), max));
    return max;
  }

  function setHpCur(char, hpCur) {
    const max = getHpMax(char);
    const state = getState(char.id) || { hp: max, toggles: {} };
    state.hp = Math.max(0, Math.min(Number(hpCur), max));
    state.toggles = state.toggles || {};
    setState(char.id, state);
    window.dispatchEvent(new CustomEvent("mechkawaii:hp-updated", { detail: { charId: char.id, hp: state.hp } }));
  }

  function getRepairKeys(char) {
    const state = getState(char.id) || {};
    const keys = state?.toggles?.repair_keys;
    if (Array.isArray(keys)) return keys.slice(0, 2).concat([true, true]).slice(0, 2);
    return [true, true];
  }

  function canReceiveRepairKey(char) {
    return getRepairKeys(char).some(value => value === false);
  }

  function giveRepairKey(char) {
    const max = getHpMax(char);
    const state = getState(char.id) || { hp: max, toggles: {} };
    state.toggles = state.toggles || {};
    const keys = getRepairKeys(char);
    const index = keys.findIndex(value => value === false);
    if (index < 0) return false;
    keys[index] = true;
    state.toggles.repair_keys = keys;
    if (typeof state.hp !== "number") state.hp = getHpCur(char);
    setState(char.id, state);
    window.dispatchEvent(new CustomEvent("mechkawaii:repair-key-updated", { detail: { charId: char.id } }));
    return true;
  }

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(FLOW_KEY, null);
  }

  function getToken(flow = getFlow()) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function getCamp(flow = getFlow()) {
    return flow?.currentCamp || "mechkawaii";
  }

  function getSharedShields() {
    const shields = readJson(SHIELDS_KEY, [true, true, true]);
    return Array.isArray(shields) ? shields.slice(0, 3).concat([true, true, true]).slice(0, 3) : [true, true, true];
  }

  function getShieldAssignments() {
    return readJson(SHIELD_ASSIGNMENTS_KEY, {});
  }

  function isShielded(charId) {
    const assignments = getShieldAssignments();
    return Object.values(assignments).includes(charId);
  }

  function canReceiveShield(char) {
    return getSharedShields().some(Boolean) && !isShielded(char.id);
  }

  function giveShield(char) {
    if (isShielded(char.id)) return false;
    const shields = getSharedShields();
    const index = shields.findIndex(Boolean);
    if (index < 0) return false;

    const assignments = getShieldAssignments();
    const meta = readJson(SHIELD_META_KEY, {});
    const flow = getFlow();

    shields[index] = false;
    assignments[index] = char.id;
    meta[String(index)] = {
      targetId: char.id,
      placedToken: getToken(flow),
      expireOnCamp: getCamp(flow)
    };

    writeJson(SHIELDS_KEY, shields);
    writeJson(SHIELD_ASSIGNMENTS_KEY, assignments);
    writeJson(SHIELD_META_KEY, meta);

    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId: char.id, type: "supply_drop" } }));
    return true;
  }

  function canReceiveHp(char) {
    return getHpCur(char) < getHpMax(char);
  }

  function getPortrait(char) {
    return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png";
  }

  function unitName(char) {
    return textOf(char?.name) || char?.id || "Unité";
  }

  function unitClass(char) {
    return textOf(char?.class) || "";
  }

  function injectStyles() {
    if (document.getElementById("mkwRasmusSupplyDropStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwRasmusSupplyDropStyles";
    style.textContent = `
      #mkwRasmusSupplyBackdrop { position: fixed; inset: 0; z-index: 100200; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0,0,0,.76); }
      #mkwRasmusSupplyPanel { width: min(520px, 100%); max-height: 86vh; overflow: auto; border-radius: 24px; border: 1px solid rgba(255,255,255,.16); background: #111217; box-shadow: 0 30px 80px rgba(0,0,0,.58); color: #fff; }
      .mkw-rs-head { padding: 18px; border-bottom: 1px solid rgba(255,255,255,.12); background: linear-gradient(135deg, rgba(255,120,180,.28), rgba(255,255,255,.05)); }
      .mkw-rs-kicker { font-size: 12px; color: rgba(255,255,255,.72); font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
      .mkw-rs-title { margin-top: 6px; font-size: 24px; line-height: 1.05; font-weight: 1000; text-transform: uppercase; }
      .mkw-rs-body { padding: 16px; }
      .mkw-rs-help { margin: 0 0 14px; color: rgba(255,255,255,.76); font-size: 13px; line-height: 1.42; }
      .mkw-rs-progress { display: flex; gap: 8px; margin-bottom: 14px; }
      .mkw-rs-dot { flex: 1; height: 7px; border-radius: 999px; background: rgba(255,255,255,.12); overflow: hidden; }
      .mkw-rs-dot.is-done, .mkw-rs-dot.is-active { background: rgba(255,210,77,.8); box-shadow: 0 0 12px rgba(255,210,77,.25); }
      .mkw-rs-target { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; padding: 11px; margin: 8px 0; border-radius: 15px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.065); color: #fff; cursor: pointer; }
      .mkw-rs-target:not(:disabled):hover { background: rgba(255,255,255,.1); border-color: rgba(255,210,77,.45); }
      .mkw-rs-target:disabled { opacity: .42; filter: grayscale(.75); cursor: not-allowed; }
      .mkw-rs-portrait { width: 48px; height: 48px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,.08); flex: 0 0 auto; }
      .mkw-rs-info { flex: 1; min-width: 0; }
      .mkw-rs-name { font-weight: 950; }
      .mkw-rs-class { font-size: 12px; color: rgba(255,255,255,.62); margin-top: 2px; }
      .mkw-rs-value { font-weight: 950; color: #ffd24d; white-space: nowrap; }
      .mkw-rs-badge { font-size: 10px; font-weight: 950; color: #111; background: #cfd3d8; border-radius: 999px; padding: 3px 7px; white-space: nowrap; margin-top: 5px; }
      .mkw-rs-actions { display: grid; gap: 10px; margin-top: 14px; }
      .mkw-rs-skip, .mkw-rs-cancel, .mkw-rs-finish { width: 100%; border-radius: 15px; padding: 12px; font-weight: 900; cursor: pointer; }
      .mkw-rs-skip, .mkw-rs-cancel { border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #fff; }
      .mkw-rs-summary { display: grid; gap: 8px; margin: 10px 0 14px; }
      .mkw-rs-summary-line { border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 10px; background: rgba(255,255,255,.05); font-size: 13px; }
    `;
    document.head.appendChild(style);
  }

  function getBonusSteps() {
    return [
      {
        id: "hp",
        title: "+1 PV",
        help: "Choisis une unité alliée qui gagne +1 PV. Si toutes les unités sont déjà au maximum, le bonus est perdu.",
        canApply: canReceiveHp,
        unavailable: "PV max",
        value: char => `${getHpCur(char)}/${getHpMax(char)}`,
        apply: char => setHpCur(char, getHpCur(char) + 1),
        done: char => `+1 PV → ${unitName(char)}`
      },
      {
        id: "shield",
        title: "Bouclier",
        help: "Choisis une deuxième unité alliée distincte qui reçoit un bouclier. Si aucun bouclier n’est disponible, le bonus est perdu.",
        canApply: canReceiveShield,
        unavailable: "Impossible",
        value: char => isShielded(char.id) ? "Protégé" : "OK",
        apply: giveShield,
        done: char => `Bouclier → ${unitName(char)}`
      },
      {
        id: "repair_key",
        title: "Clé de réparation",
        help: "Choisis une troisième unité alliée distincte qui récupère une clé de réparation utilisée. Si toutes ses clés sont déjà disponibles, le bonus est perdu.",
        canApply: canReceiveRepairKey,
        unavailable: "Clés max",
        value: char => `${getRepairKeys(char).filter(Boolean).length}/2`,
        apply: giveRepairKey,
        done: char => `Clé de réparation → ${unitName(char)}`
      }
    ];
  }

  function closeModal() {
    modalOpen = false;
    document.getElementById("mkwRasmusSupplyBackdrop")?.remove();
  }

  function refreshAfterApply() {
    window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: {} }));
    window.dispatchEvent(new CustomEvent("mechkawaii:supply-drop-updated", { detail: { source: "rasmus" } }));
  }

  function renderStep(ctx) {
    const step = ctx.steps[ctx.index];
    const panel = ctx.panel;
    const selected = new Set(ctx.selectedIds);
    const validTargets = ctx.team.filter(char => !selected.has(char.id) && step.canApply(char));

    panel.querySelector(".mkw-rs-body").innerHTML = `
      <div class="mkw-rs-progress">
        ${ctx.steps.map((_, i) => `<span class="mkw-rs-dot ${i < ctx.index ? "is-done" : i === ctx.index ? "is-active" : ""}"></span>`).join("")}
      </div>
      <p class="mkw-rs-help"><strong>${step.title}</strong><br>${step.help}</p>
      <div class="mkw-rs-targets"></div>
      <div class="mkw-rs-actions">
        <button type="button" class="mkw-rs-skip">${validTargets.length ? "Passer ce bonus" : "Bonus perdu — continuer"}</button>
        <button type="button" class="mkw-rs-cancel">Fermer</button>
      </div>
    `;

    const list = panel.querySelector(".mkw-rs-targets");
    ctx.team.forEach(char => {
      const alreadySelected = selected.has(char.id);
      const canApply = !alreadySelected && step.canApply(char);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mkw-rs-target";
      row.disabled = !canApply;
      row.innerHTML = `
        <img class="mkw-rs-portrait" src="${getPortrait(char)}" alt="">
        <div class="mkw-rs-info">
          <div class="mkw-rs-name">${unitName(char)}</div>
          <div class="mkw-rs-class">${unitClass(char)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <div class="mkw-rs-value">${step.value(char)}</div>
          ${alreadySelected ? `<div class="mkw-rs-badge">Déjà choisi</div>` : !canApply ? `<div class="mkw-rs-badge">${step.unavailable}</div>` : ""}
        </div>
      `;
      row.addEventListener("click", () => {
        if (!canApply) return;
        const ok = step.apply(char);
        if (ok === false) {
          nextStep(ctx, null, `${step.title} perdu`);
          return;
        }
        ctx.selectedIds.push(char.id);
        nextStep(ctx, char, step.done(char));
      });
      list.appendChild(row);
    });

    panel.querySelector(".mkw-rs-skip")?.addEventListener("click", () => nextStep(ctx, null, `${step.title} perdu`));
    panel.querySelector(".mkw-rs-cancel")?.addEventListener("click", closeModal);
  }

  function nextStep(ctx, char, summaryLine) {
    ctx.summary.push(summaryLine || (char ? unitName(char) : "Bonus perdu"));
    refreshAfterApply();
    ctx.index += 1;
    if (ctx.index >= ctx.steps.length) renderSummary(ctx);
    else renderStep(ctx);
  }

  function renderSummary(ctx) {
    const body = ctx.panel.querySelector(".mkw-rs-body");
    body.innerHTML = `
      <div class="mkw-rs-progress">
        ${ctx.steps.map(() => `<span class="mkw-rs-dot is-done"></span>`).join("")}
      </div>
      <p class="mkw-rs-help"><strong>Largage terminé.</strong><br>Les équipements disponibles ont été distribués.</p>
      <div class="mkw-rs-summary">
        ${ctx.summary.map(line => `<div class="mkw-rs-summary-line">${line}</div>`).join("")}
      </div>
      <button type="button" class="mkw-rs-finish btn-accent">Terminer</button>
    `;
    body.querySelector(".mkw-rs-finish")?.addEventListener("click", () => {
      closeModal();
      setTimeout(() => location.reload(), 120);
    });
  }

  async function openSupplyDropModal() {
    if (modalOpen || CURRENT_ID() !== "rasmus") return;
    modalOpen = true;
    injectStyles();

    const chars = await loadChars();
    const team = getCurrentTeam(chars);
    if (!team.length) {
      modalOpen = false;
      return;
    }

    const backdrop = document.createElement("div");
    backdrop.id = "mkwRasmusSupplyBackdrop";
    backdrop.innerHTML = `
      <div id="mkwRasmusSupplyPanel" role="dialog" aria-modal="true">
        <div class="mkw-rs-head">
          <div class="mkw-rs-kicker">Coup Unique</div>
          <div class="mkw-rs-title">Largage de ravitaillement</div>
        </div>
        <div class="mkw-rs-body"></div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeModal();
    });

    const ctx = {
      panel: backdrop.querySelector("#mkwRasmusSupplyPanel"),
      team,
      steps: getBonusSteps(),
      index: 0,
      selectedIds: [],
      summary: []
    };
    renderStep(ctx);
  }

  function isUltimateTrigger(target) {
    return !!target?.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch");
  }

  function isAlreadyUsedBeforeClick() {
    const trigger = document.querySelector("#ultToggleContainer .switch, #ultToggleContainer button, #ultToggleContainer [role='button']");
    if (!trigger) return false;
    return trigger.classList.contains("on") || trigger.classList.contains("used") || trigger.getAttribute("aria-pressed") === "true" || trigger.getAttribute("aria-checked") === "true";
  }

  function init() {
    if (!document.body.classList.contains("page-character") || CURRENT_ID() !== "rasmus") return;
    injectStyles();

    document.addEventListener("click", event => {
      if (!isUltimateTrigger(event.target)) return;
      const wasUsed = isAlreadyUsedBeforeClick();
      if (wasUsed) return;
      if (typeof window.mkwCanSpendEnergyAction === "function" && !window.mkwCanSpendEnergyAction("ultimate")) return;
      setTimeout(openSupplyDropModal, 60);
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
