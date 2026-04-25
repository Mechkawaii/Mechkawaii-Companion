(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwEnergySystemStyles";
  const ENERGY_DATA_URL = "./data/energy-costs.json";
  let energyData = null;

  const I18N = {
    fr: {
      roadToggle: "Commence sur une route",
      roadHelp: "Si l’unité commence son tour sur une route, son déplacement est gratuit.",
      notEnough: "Pas assez d’énergie.",
      alreadyUsed: "Cette action a déjà été utilisée ce tour.",
      actionUsed: "Action utilisée : {action}.",
      energyRestored: "Énergie restaurée pour le tour.",
      move: "Se déplacer",
      attack: "Attaque effectuée",
      classAction: "Action de classe effectuée",
      unavailable: "Action indisponible"
    },
    en: {
      roadToggle: "Starts on a road",
      roadHelp: "If this unit starts its turn on a road, its movement is free.",
      notEnough: "Not enough energy.",
      alreadyUsed: "This action has already been used this turn.",
      actionUsed: "Action used: {action}",
      energyRestored: "Energy restored for this turn.",
      move: "Move",
      attack: "Attack done",
      classAction: "Class action done",
      unavailable: "Unavailable action"
    }
  };

  function getLang(){ return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key, vars = {}){ const lang = getLang(); let text = (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; Object.keys(vars).forEach(k => text = text.replaceAll("{" + k + "}", String(vars[k]))); return text; }
  function readJson(key, fallback){ try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function currentId(){ return new URL(location.href).searchParams.get("id") || ""; }
  function normalize(value){ return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ""); }
  function getEnergyKey(id){ return PREFIX + "energy:" + id; }
  function getActionKey(id){ return PREFIX + "turn-actions:" + id; }
  function getRoadKey(id){ return PREFIX + "road-start:" + id; }
  function getFlow(){ return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null); }
  function getRoundToken(){ const f = getFlow(); return f ? `${f.roundNumber}:${f.currentCamp}` : "free"; }
  function getCharCamp(){ return window.__currentCharacter?.camp || null; }
  function isCurrentCampTurn(){ const f = getFlow(); const camp = getCharCamp(); return !f?.started || !camp || f.currentCamp === camp; }

  async function loadEnergyData(){ if(energyData) return energyData; const res = await fetch(ENERGY_DATA_URL, { cache:"no-store" }); energyData = await res.json(); return energyData; }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #mkwEnergyCard { display:none !important; }
      .mkw-energy-inline-status { display:inline-flex; align-items:center; gap:8px; margin-left:10px; vertical-align:middle; }
      .mkw-energy-inline-status img { width:86px; max-width:32vw; height:auto; display:block; }
      .mkw-energy-cost-row { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:10px; width:100%; }
      .mkw-energy-cost-row img { width:96px; max-width:42vw; height:auto; display:block; flex:0 0 auto; }
      .mkw-energy-cost-row.is-energy-disabled img,
      .mkw-energy-action-line.is-energy-disabled img { opacity:.38; filter:grayscale(.75); }
      .mkw-energy-action-line { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); }
      .mkw-energy-action-left { display:flex; flex-direction:column; gap:8px; min-width:0; }
      .mkw-energy-action-left img { width:96px; max-width:42vw; height:auto; display:block; }
      .mkw-energy-header-action { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; }
      .mkw-energy-header-action .section-title { margin:0; }
      .mkw-header-energy-tools { display:flex; align-items:center; gap:10px; flex:0 0 auto; }
      .mkw-header-energy-tools img { width:86px; max-width:34vw; height:auto; display:block; }
      .mkw-energy-switch { position:relative; display:inline-flex; align-items:center; gap:10px; cursor:pointer; user-select:none; font-weight:900; color:var(--text,#fff); flex:0 0 auto; }
      .mkw-energy-switch input { position:absolute; opacity:0; pointer-events:none; }
      .mkw-energy-slider { width:52px; height:30px; border-radius:999px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.09); box-shadow:inset 0 0 0 1px rgba(0,0,0,.12); position:relative; transition:.18s ease; }
      .mkw-energy-slider::after { content:""; position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.86); left:3px; top:3px; transition:.18s ease; box-shadow:0 4px 10px rgba(0,0,0,.35); }
      .mkw-energy-switch input:checked + .mkw-energy-slider { background:rgba(255,210,77,.9); border-color:rgba(255,210,77,.95); box-shadow:0 0 18px rgba(255,210,77,.22); }
      .mkw-energy-switch input:checked + .mkw-energy-slider::after { transform:translateX(22px); background:#111; }
      .mkw-energy-switch.is-disabled { opacity:.42; cursor:not-allowed; filter:grayscale(.35); }
      .mkw-energy-switch.is-disabled .mkw-energy-slider { background:rgba(255,255,255,.035); }
      .mkw-energy-switch-label { font-size:12px; color:var(--muted); font-weight:850; }
      .mkw-road-toggle-inline { margin-top:12px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); }
      .mkw-road-toggle-text { min-width:0; }
      .mkw-road-title-inline { font-weight:900; color:var(--text,#fff); }
      .mkw-road-help-inline { color:var(--muted); font-size:12px; line-height:1.3; margin-top:3px; }
      .mkw-energy-disabled-action { opacity:.38 !important; filter:grayscale(.75) !important; cursor:not-allowed !important; pointer-events:none !important; }
      @media (max-width:560px){ .mkw-energy-inline-status { display:flex; margin-left:0; margin-top:8px; } .mkw-energy-inline-status img { width:92px; } .mkw-energy-cost-row img, .mkw-energy-action-left img { width:92px; } .mkw-header-energy-tools img { width:76px; } .mkw-energy-switch-label{ display:none; } }
    `;
    document.head.appendChild(style);
  }

  function getCurrentEnergy(id){ const max = Number(energyData?.maxEnergy || 3); const state = readJson(getEnergyKey(id), null); if(!state || typeof state.current !== "number") return max; return Math.max(0, Math.min(max, Number(state.current))); }
  function setCurrentEnergy(id, current){ const max = Number(energyData?.maxEnergy || 3); const next = Math.max(0, Math.min(max, Number(current))); writeJson(getEnergyKey(id), { current: next, max }); window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail:{ charId:id, current:next, max } })); }
  function resetEnergy(id){ setCurrentEnergy(id, Number(energyData?.maxEnergy || 3)); writeJson(getActionKey(id), { token:getRoundToken(), used:{} }); }
  function getActionState(id){ const token = getRoundToken(); const state = readJson(getActionKey(id), { token, used:{} }); if(state.token !== token) return { token, used:{} }; return state; }
  function saveActionState(id, state){ writeJson(getActionKey(id), state); }
  function getCostsForId(id){ const data = energyData || {}; const key = normalize(id); const alias = data.aliases?.[key]; return data.costs?.[key] || data.costs?.[alias] || data.costs?.[normalize(alias)] || null; }
  function getActionCost(id, action){ return Number(getCostsForId(id)?.[action] || 0); }
  function getActionName(action){ const lang = getLang(); return energyData?.actions?.[action]?.[lang] || energyData?.actions?.[action]?.fr || action; }
  function getAssetFor(value){ const n = Math.max(0, Math.min(Number(energyData?.maxEnergy || 3), Number(value || 0))); return energyData?.assets?.[String(n)] || energyData?.assets?.[String(energyData?.maxEnergy || 3)] || ""; }
  function maxUsesForAction(id, action){ const defaults = energyData?.defaultRules?.maxUsesPerTurnByAction || {}; const exception = energyData?.exceptions?.[normalize(id)]?.maxUsesPerTurnByAction || {}; return Number(exception[action] ?? defaults[action] ?? 1); }

  function roadMoveIsFree(id){
    const road = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false });
    return road.token === getRoundToken() && !!road.enabled && !road.used;
  }

  function markRoadMoveUsed(id){
    const road = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false });
    if(road.token === getRoundToken() && road.enabled && !road.used){
      writeJson(getRoadKey(id), { token:getRoundToken(), enabled:true, used:true });
    }
  }

  function getActionCostForUse(id, action){
    const base = getActionCost(id, action);
    if(action === "move" && roadMoveIsFree(id)) return 0;
    return base;
  }

  function canUseAction(id, action, cost){
    cost = Number(cost || 0);
    const actionState = getActionState(id);
    const usedCount = Number(actionState.used?.[action] || 0);
    const maxUses = maxUsesForAction(id, action);
    if(usedCount >= maxUses) return { ok:false, reason:"used" };
    if(getCurrentEnergy(id) < cost) return { ok:false, reason:"energy" };
    if(!isCurrentCampTurn()) return { ok:false, reason:"turn" };
    return { ok:true };
  }

  function notify(message){ const root = document.querySelector("#mkwToastRoot"); if(root){ const el = document.createElement("div"); el.className = "mkw-toast"; el.textContent = message; root.appendChild(el); setTimeout(() => el.remove(), 2700); } }

  function spendAction(id, action, cost, options = {}){
    cost = Number(cost || 0);
    const check = canUseAction(id, action, cost);
    if(!check.ok){ notify(check.reason === "energy" ? tr("notEnough") : check.reason === "used" ? tr("alreadyUsed") : tr("unavailable")); return false; }

    const actionState = getActionState(id);
    actionState.used[action] = Number(actionState.used?.[action] || 0) + 1;
    saveActionState(id, actionState);

    if(action === "move" && cost === 0) markRoadMoveUsed(id);
    setCurrentEnergy(id, getCurrentEnergy(id) - cost);
    updateEnergyStatus();
    if(!options.silent) notify(tr("actionUsed", { action:getActionName(action) }));
    render();
    return true;
  }

  function unspendAction(id, action, cost){ cost = Number(cost || 0); const actionState = getActionState(id); const current = Number(actionState.used?.[action] || 0); if(current <= 0) return; actionState.used[action] = current - 1; if(actionState.used[action] <= 0) delete actionState.used[action]; saveActionState(id, actionState); setCurrentEnergy(id, getCurrentEnergy(id) + cost); updateEnergyStatus(); render(); }

  function spendValidatedAction(action){
    const id = currentId();
    return spendAction(id, action, getActionCostForUse(id, action), { silent:true });
  }

  function canSpendValidatedAction(action){
    const id = currentId();
    return canUseAction(id, action, getActionCostForUse(id, action)).ok;
  }

  function ensureEnergyStatusNearName(){ const title = document.querySelector("#charName"); if(!title) return null; let wrap = document.querySelector("#mkwEnergyInlineStatus"); if(!wrap){ wrap = document.createElement("span"); wrap.id = "mkwEnergyInlineStatus"; wrap.className = "mkw-energy-inline-status"; title.insertAdjacentElement("afterend", wrap); } return wrap; }
  function updateEnergyStatus(){ const id = currentId(); const wrap = ensureEnergyStatusNearName(); if(!id || !wrap || !energyData) return; const energy = getCurrentEnergy(id); const max = Number(energyData?.maxEnergy || 3); const src = getAssetFor(energy); wrap.innerHTML = src ? `<img src="${src}" alt="${energy}/${max}" data-energy-current="${energy}">` : `${energy}/${max}`; }
  function clearOldInline(){ document.querySelectorAll(".mkw-energy-cost-row, .mkw-energy-action-line, .mkw-road-toggle-inline, .mkw-energy-header-action").forEach(el => { if(el.classList.contains("mkw-energy-header-action")){ const title = el.querySelector(".section-title"); if(title) el.replaceWith(title); else el.remove(); } else el.remove(); }); const oldCard = document.querySelector("#mkwEnergyCard"); if(oldCard) oldCard.remove(); }

  function makeSwitch(id, action, displayCost, labelText){
    const useCost = getActionCostForUse(id, action);
    const used = Number(getActionState(id).used?.[action] || 0) > 0;
    const check = canUseAction(id, action, useCost);
    const disabled = !used && !check.ok;
    const label = document.createElement("label");
    label.className = "mkw-energy-switch";
    label.classList.toggle("is-disabled", disabled);
    label.innerHTML = `<input type="checkbox" ${used ? "checked" : ""} ${disabled ? "disabled" : ""}><span class="mkw-energy-slider"></span>${labelText ? `<span class="mkw-energy-switch-label">${labelText}</span>` : ""}`;
    const input = label.querySelector("input");
    input.addEventListener("change", event => {
      if(event.target.checked){ const ok = spendAction(id, action, useCost); if(!ok) event.target.checked = false; }
      else { unspendAction(id, action, useCost); }
    });
    return label;
  }

  function costRow(action, cost, opts = {}){
    const row = document.createElement("div");
    const useCost = getActionCostForUse(currentId(), action);
    const disabled = Number(useCost || 0) > getCurrentEnergy(currentId()) && Number(useCost || 0) > 0;
    row.className = opts.toggle ? "mkw-energy-action-line" : "mkw-energy-cost-row";
    if(opts.className) row.classList.add(opts.className);
    row.classList.toggle("is-energy-disabled", disabled);
    row.dataset.energyAction = action;
    const left = document.createElement("div"); left.className = opts.toggle ? "mkw-energy-action-left" : "";
    const src = getAssetFor(cost); if(src){ const img = document.createElement("img"); img.src = src; img.alt = `${cost}`; left.appendChild(img); }
    row.appendChild(left);
    if(opts.toggle && Number(cost || 0) > 0) row.appendChild(makeSwitch(currentId(), action, cost, opts.label || tr("actionUsed")));
    return row;
  }

  function appendCost(selector, action){ const id = currentId(); const costs = getCostsForId(id); if(!costs) return; const cost = Number(costs[action] ?? 0); const container = document.querySelector(selector); if(!container) return; container.appendChild(costRow(action, cost)); }
  function getMovementCard(){ return Array.from(document.querySelectorAll(".card")).find(c => c.querySelector("#movementDesc") || c.querySelector("#movementImg")); }
  function getAttackCard(){ return Array.from(document.querySelectorAll(".card")).find(c => c.querySelector("#attackDesc") || c.querySelector("#attackImg")); }

  function addEnergyCostToCardHeader(card, action, cost, includeToggle, titleText){
    const header = card?.querySelector(".card-h");
    const title = header?.querySelector(".section-title");
    if(!header || !title) return;
    if(titleText) title.textContent = titleText;

    const wrap = document.createElement("div");
    wrap.className = "mkw-energy-header-action";
    title.replaceWith(wrap);
    wrap.appendChild(title);

    const tools = document.createElement("div");
    tools.className = "mkw-header-energy-tools";
    const src = getAssetFor(cost);
    if(src){
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${cost}`;
      tools.appendChild(img);
    }
    if(includeToggle && Number(cost || 0) > 0) tools.appendChild(makeSwitch(currentId(), action, Number(cost || 0), ""));
    wrap.appendChild(tools);
  }

  function addEnergyCostToHeader(titleSelector, action, cost, includeToggle){
    const title = document.querySelector(titleSelector);
    const header = title?.closest(".card-h");
    if(!header || !title) return;

    const wrap = document.createElement("div");
    wrap.className = "mkw-energy-header-action";
    title.replaceWith(wrap);
    wrap.appendChild(title);

    const tools = document.createElement("div");
    tools.className = "mkw-header-energy-tools";
    const src = getAssetFor(cost);
    if(src){
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${cost}`;
      tools.appendChild(img);
    }
    if(includeToggle && Number(cost || 0) > 0) tools.appendChild(makeSwitch(currentId(), action, Number(cost || 0), ""));
    wrap.appendChild(tools);
  }

  function addMoveCostToHeader(cost){ addEnergyCostToCardHeader(getMovementCard(), "move", cost, true, tr("move")); }
  function addAttackCostToHeader(cost){ addEnergyCostToCardHeader(getAttackCard(), "ranged_attack", cost, true, null); }
  function addClassActionCostToHeader(cost){ addEnergyCostToHeader("#classActionTitle", "class_action", cost, true); }
  function addUltimateCostToHeader(cost){ addEnergyCostToHeader("#ultTitle", "ultimate", cost, false); }

  function addRoadToggle(){ const card = getMovementCard(); const body = card?.querySelector(".card-b"); if(!body) return; const id = currentId(); const roadState = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false }); const isActive = roadState.token === getRoundToken() && !!roadState.enabled; const wrap = document.createElement("div"); wrap.className = "mkw-road-toggle-inline"; wrap.innerHTML = `<div class="mkw-road-toggle-text"><div class="mkw-road-title-inline">${tr("roadToggle")}</div><div class="mkw-road-help-inline">${tr("roadHelp")}</div></div>`; const sw = document.createElement("label"); sw.className = "mkw-energy-switch"; sw.innerHTML = `<input type="checkbox" ${isActive ? "checked" : ""}><span class="mkw-energy-slider"></span>`; sw.querySelector("input")?.addEventListener("change", event => { writeJson(getRoadKey(id), { token:getRoundToken(), enabled:!!event.target.checked, used:false }); render(); }); wrap.appendChild(sw); body.appendChild(wrap); }

  function setButtonAvailability(btn, action, cost){
    const text = (btn.textContent || "").toLowerCase();
    if(text.includes("retirer") || text.includes("remove")) return;
    const useCost = getActionCostForUse(currentId(), action);
    const check = canUseAction(currentId(), action, useCost);
    const disabled = Number(useCost || 0) > 0 && !check.ok;
    btn.classList.toggle("mkw-energy-disabled-action", disabled);
    btn.toggleAttribute("aria-disabled", disabled);
  }

  function applyActionAvailability(){
    const id = currentId(); const costs = getCostsForId(id); if(!costs) return;
    document.querySelectorAll("#repairKeysDisplay button, #repairKeysDisplay .key-button").forEach(btn => setButtonAvailability(btn, "repair", costs.repair));
    document.querySelectorAll("#shieldsDisplay button, #shieldsDisplay .shield-button, #shieldsDisplay .key-button").forEach(btn => setButtonAvailability(btn, "protect", costs.protect));
    document.querySelectorAll("#ultToggleContainer button, #ultToggleContainer [role='button']").forEach(btn => setButtonAvailability(btn, "ultimate", costs.ultimate));
  }

  function bindExistingButtons(){
    const id = currentId(); const costs = getCostsForId(id); if(!costs) return;
    document.querySelectorAll("#ultToggleContainer button, #ultToggleContainer [role='button']").forEach(btn => { if(btn.dataset.energyBound === "1") return; btn.dataset.energyBound = "1"; btn.addEventListener("click", event => { const pressed = btn.getAttribute("aria-pressed") === "true" || btn.classList.contains("used") || btn.classList.contains("is-used"); if(pressed) return; if(!spendAction(id, "ultimate", getActionCostForUse(id, "ultimate"), { silent:true })){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); } }, true); });
  }

  function exposeEnergyApi(){
    window.mkwCanSpendEnergyAction = function(action){ return canSpendValidatedAction(action); };
    window.mkwSpendEnergyAction = function(action){ return spendValidatedAction(action); };
    window.mkwGetEnergyActionCost = function(action){ return getActionCostForUse(currentId(), action); };
  }

  function render(){ if(!energyData) return; const id = currentId(); if(!id) return; clearOldInline(); updateEnergyStatus(); appendCost(".shields-section", "protect"); appendCost(".repair-section", "repair"); const costs = getCostsForId(id) || {}; addMoveCostToHeader(Number(costs.move || 0)); addRoadToggle(); addAttackCostToHeader(Number(costs.ranged_attack || 0)); addClassActionCostToHeader(Number(costs.class_action || 0)); addUltimateCostToHeader(Number(costs.ultimate || 0)); bindExistingButtons(); applyActionAvailability(); exposeEnergyApi(); }

  async function init(){ ensureStyles(); await loadEnergyData(); const id = currentId(); if(id && !readJson(getEnergyKey(id), null)) resetEnergy(id); exposeEnergyApi(); render(); window.addEventListener("mechkawaii:turn-start", event => { const camp = event?.detail?.currentCamp; if(!camp || camp === getCharCamp()){ resetEnergy(currentId()); notify(tr("energyRestored")); } render(); }); window.addEventListener("mechkawaii:game-flow-updated", render); window.addEventListener("mechkawaii:energy-updated", event => { if(event?.detail?.charId === currentId()){ updateEnergyStatus(); setTimeout(render, 0); } }); window.addEventListener("mechkawaii:energy-action-validated", event => { const action = event?.detail?.action; const charId = event?.detail?.charId || currentId(); if(charId !== currentId() || !action) return; spendValidatedAction(action); }); window.addEventListener("mechkawaii:shield-updated", () => setTimeout(render, 80)); window.addEventListener("pageshow", render); setTimeout(render, 300); setTimeout(render, 900); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();