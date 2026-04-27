(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwEnergySystemStyles";
  const ENERGY_DATA_URL = "./data/energy-costs.json";
  let energyData = null;

  const I18N = {
    fr: {
      roadToggle: "Commence sur une route",
      roadHelp: "Si l’unité commence son tour sur une route, elle gagne un déplacement gratuit. Ce bonus ne compte pas comme son action Se déplacer.",
      notEnough: "Pas assez d’énergie.",
      alreadyUsed: "Cette action a déjà été utilisée ce tour.",
      actionUsed: "Action utilisée : {action}.",
      energyRestored: "Énergie restaurée pour le tour.",
      move: "Se déplacer",
      attackTitle: "Tir et corps à corps",
      attack: "Tir et corps à corps effectué",
      classAction: "Action de classe effectuée",
      unavailable: "Action indisponible",
      protectTitle: "Se protéger",
      protectText: "Pose un bouclier sur une unité alliée ou sur soi-même. Le bouclier absorbe 1 PV, puis est défaussé.",
      repairTitle: "Réparer",
      repairText: "Rend 1 PV à une unité alliée adjacente ou à soi-même. Peut relever une unité HS avec 1 PV."
    },
    en: {
      roadToggle: "Starts on a road",
      roadHelp: "If this unit starts its turn on a road, it gains one free move. This bonus does not count as its Move action.",
      notEnough: "Not enough energy.",
      alreadyUsed: "This action has already been used this turn.",
      actionUsed: "Action used: {action}",
      energyRestored: "Energy restored for this turn.",
      move: "Move",
      attackTitle: "Ranged & Melee",
      attack: "Ranged & melee done",
      classAction: "Class action done",
      unavailable: "Unavailable action",
      protectTitle: "Protect",
      protectText: "Place a shield on an allied unit or on itself. The shield absorbs 1 HP, then is discarded.",
      repairTitle: "Repair",
      repairText: "Restore 1 HP to an adjacent allied unit or itself. Can revive a KO unit with 1 HP."
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
      .mkw-energy-header-action { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; min-width:0; }
      .mkw-energy-header-action .section-title { margin:0; min-width:0; flex:1 1 auto; line-height:1.15; }
      .mkw-header-energy-tools { display:flex; align-items:center; gap:10px; flex:0 0 auto; min-width:max-content; }
      .mkw-header-energy-tools img { width:86px; max-width:34vw; height:auto; display:block; }

      .shields-section, .repair-section { min-height:178px !important; }
      .mkw-resource-action-head { display:flex !important; flex-direction:column !important; align-items:flex-start !important; gap:6px !important; margin:0 0 12px 0 !important; min-height:110px !important; }
      .mkw-resource-action-title { font-weight:950 !important; color:var(--text,#fff) !important; line-height:1.1 !important; margin:0 !important; }
      .mkw-resource-energy-cost { margin:0 !important; display:flex !important; align-items:center !important; justify-content:flex-start !important; gap:8px; width:86px !important; min-width:86px !important; height:24px !important; min-height:24px !important; flex:0 0 24px !important; }
      .mkw-resource-energy-cost img { width:86px !important; max-width:34vw !important; height:24px !important; object-fit:contain !important; object-position:left center !important; display:block !important; }
      .mkw-resource-energy-cost.is-energy-disabled img { opacity:.38; filter:grayscale(.75); }
      .mkw-resource-action-desc { margin:0 !important; color:var(--muted,rgba(255,255,255,.72)) !important; font-size:13px !important; line-height:1.35 !important; max-width:34rem !important; min-height:calc(13px * 1.35 * 3) !important; }
      .mkw-resource-title-wrap { display:none !important; }

      .mkw-energy-switch { position:relative; display:inline-flex; align-items:center; gap:10px; cursor:pointer; user-select:none; font-weight:900; color:var(--text,#fff); flex:0 0 auto; }
      .mkw-energy-switch input { position:absolute; opacity:0; pointer-events:none; }
      .mkw-energy-slider { width:52px; height:30px; border-radius:999px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.09); box-shadow:inset 0 0 0 1px rgba(0,0,0,.12); position:relative; transition:.18s ease; flex:0 0 auto; }
      .mkw-energy-slider::after { content:""; position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.86); left:3px; top:3px; transition:.18s ease; box-shadow:0 4px 10px rgba(0,0,0,.35); }
      .mkw-energy-switch input:checked + .mkw-energy-slider { background:rgba(255,210,77,.9); border-color:rgba(255,210,77,.95); box-shadow:0 0 18px rgba(255,210,77,.22); }
      .mkw-energy-switch input:checked + .mkw-energy-slider::after { transform:translateX(22px); background:#111; }
      .mkw-energy-switch.is-disabled { opacity:.42; cursor:not-allowed; filter:grayscale(.35); }
      .mkw-energy-switch-label { font-size:12px; color:var(--muted); font-weight:850; }
      .mkw-road-toggle-inline { margin-top:12px; display:flex; align-items:center; justify-content:space-between; gap:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); }
      .mkw-road-toggle-text { min-width:0; }
      .mkw-road-title-inline { font-weight:900; color:var(--text,#fff); }
      .mkw-road-help-inline { color:var(--muted); font-size:12px; line-height:1.3; margin-top:3px; }
      .mkw-energy-disabled-action { opacity:.38 !important; filter:grayscale(.75) !important; cursor:not-allowed !important; }
      @media (max-width:560px){
        .mkw-energy-inline-status { display:flex; margin-left:0; margin-top:8px; }
        .mkw-energy-inline-status img { width:92px; }
        .mkw-energy-header-action { gap:8px; }
        .mkw-energy-header-action .section-title { font-size:15px; }
        .mkw-header-energy-tools { gap:6px; }
        .mkw-header-energy-tools img { width:58px; max-width:18vw; }
        .shields-section, .repair-section { min-height:170px !important; }
        .mkw-resource-action-head { min-height:104px !important; }
        .mkw-resource-energy-cost { width:72px !important; min-width:72px !important; height:22px !important; min-height:22px !important; flex-basis:22px !important; }
        .mkw-resource-energy-cost img { width:72px !important; max-width:30vw !important; height:22px !important; }
        .mkw-resource-action-desc { font-size:12px !important; min-height:calc(12px * 1.35 * 3) !important; }
        .mkw-energy-slider { width:44px; height:26px; }
        .mkw-energy-slider::after { width:18px; height:18px; left:3px; top:3px; }
        .mkw-energy-switch input:checked + .mkw-energy-slider::after { transform:translateX(18px); }
        .mkw-energy-switch-label{ display:none; }
      }
    `;
    document.head.appendChild(style);
  }

  function preloadEnergyImages(){ ["./assets/energy_0.png","./assets/energy_1.png","./assets/energy_2.png","./assets/energy_3.png"].forEach(src => { const img = new Image(); img.src = src; }); }
  function getCurrentEnergy(id){ const max = Number(energyData?.maxEnergy || 3); const state = readJson(getEnergyKey(id), null); if(!state || typeof state.current !== "number") return max; return Math.max(0, Math.min(max, Number(state.current))); }
  function setCurrentEnergy(id, current){ const max = Number(energyData?.maxEnergy || 3); const next = Math.max(0, Math.min(max, Number(current))); writeJson(getEnergyKey(id), { current: next, max }); window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail:{ charId:id, current:next, max } })); }
  function resetEnergy(id){ setCurrentEnergy(id, Number(energyData?.maxEnergy || 3)); writeJson(getActionKey(id), { token:getRoundToken(), used:{} }); }
  function getActionState(id){ const token = getRoundToken(); const state = readJson(getActionKey(id), { token, used:{} }); if(state.token !== token) return { token, used:{} }; return state; }
  function saveActionState(id, state){ writeJson(getActionKey(id), state); }
  function getCostsForId(id){ const data = energyData || {}; const key = normalize(id); const alias = data.aliases?.[key]; return data.costs?.[key] || data.costs?.[alias] || data.costs?.[normalize(alias)] || null; }
  function getActionCost(id, action){ return Number(getCostsForId(id)?.[action] || 0); }
  function getAssetFor(value){ const n = Math.max(0, Math.min(Number(energyData?.maxEnergy || 3), Number(value || 0))); return energyData?.assets?.[String(n)] || energyData?.assets?.[String(energyData?.maxEnergy || 3)] || ""; }
  function maxUsesForAction(id, action){ const defaults = energyData?.defaultRules?.maxUsesPerTurnByAction || {}; const exception = energyData?.exceptions?.[normalize(id)]?.maxUsesPerTurnByAction || {}; return Number(exception[action] ?? defaults[action] ?? 1); }
  function roadMoveIsFree(id){ const road = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false }); return road.token === getRoundToken() && !!road.enabled && !road.used; }
  function markRoadMoveUsed(id){ const road = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false }); if(road.token === getRoundToken() && road.enabled && !road.used) writeJson(getRoadKey(id), { token:getRoundToken(), enabled:true, used:true }); }
  function getActionCostForUse(id, action){ return getActionCost(id, action); }

  function canUseAction(id, action, cost){
    cost = Number(cost || 0);
    const state = getActionState(id);
    const usedCount = Number(state.used?.[action] || 0);
    if(usedCount >= maxUsesForAction(id, action)) return { ok:false, reason:"used" };
    if(getCurrentEnergy(id) < cost) return { ok:false, reason:"energy" };
    if(!isCurrentCampTurn()) return { ok:false, reason:"turn" };
    return { ok:true };
  }

  function canUseMove(id){
    if(roadMoveIsFree(id)) return { ok:true, reason:"road_bonus" };
    return canUseAction(id, "move", getActionCost(id, "move"));
  }

  function notify(message){ const root = document.querySelector("#mkwToastRoot"); if(root){ const el = document.createElement("div"); el.className = "mkw-toast"; el.textContent = message; root.appendChild(el); setTimeout(() => el.remove(), 2700); } }
  function messageForReason(reason){ return reason === "energy" ? tr("notEnough") : reason === "used" ? tr("alreadyUsed") : tr("unavailable"); }

  function spendAction(id, action, cost, options = {}){
    if(action === "move" && roadMoveIsFree(id)){
      markRoadMoveUsed(id);
      updateEnergyStatus();
      render();
      return true;
    }

    cost = Number(cost || 0);
    const check = canUseAction(id, action, cost);
    if(!check.ok){ notify(messageForReason(check.reason)); return false; }
    const state = getActionState(id);
    state.used[action] = Number(state.used?.[action] || 0) + 1;
    saveActionState(id, state);
    setCurrentEnergy(id, getCurrentEnergy(id) - cost);
    updateEnergyStatus();
    render();
    return true;
  }

  function unspendAction(id, action, cost){
    cost = Number(cost || 0);
    const state = getActionState(id);
    const current = Number(state.used?.[action] || 0);
    if(current <= 0) return;
    state.used[action] = current - 1;
    if(state.used[action] <= 0) delete state.used[action];
    saveActionState(id, state);
    setCurrentEnergy(id, getCurrentEnergy(id) + cost);
    updateEnergyStatus();
    render();
  }

  function spendValidatedAction(action){ return spendAction(currentId(), action, getActionCostForUse(currentId(), action), { silent:true }); }
  function canSpendValidatedAction(action){ if(action === "move") return canUseMove(currentId()).ok; return canUseAction(currentId(), action, getActionCostForUse(currentId(), action)).ok; }
  function blockIfCannotSpend(event, action){
    const check = action === "move" ? canUseMove(currentId()) : canUseAction(currentId(), action, getActionCostForUse(currentId(), action));
    if(check.ok) return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    notify(messageForReason(check.reason));
    return true;
  }

  function ensureEnergyStatusNearName(){ const title = document.querySelector("#charName"); if(!title) return null; let wrap = document.querySelector("#mkwEnergyInlineStatus"); if(!wrap){ wrap = document.createElement("span"); wrap.id = "mkwEnergyInlineStatus"; wrap.className = "mkw-energy-inline-status"; title.insertAdjacentElement("afterend", wrap); } return wrap; }
  function updateEnergyStatus(){ const id = currentId(); const wrap = ensureEnergyStatusNearName(); if(!id || !wrap || !energyData) return; const energy = getCurrentEnergy(id); const src = getAssetFor(energy); wrap.innerHTML = src ? `<img src="${src}" alt="${energy}/3" data-energy-current="${energy}" width="86" height="24">` : `${energy}/3`; }
  function clearOldInline(){ document.querySelectorAll(".mkw-energy-header-action, .mkw-road-toggle-inline, .mkw-resource-action-head, .mkw-resource-title-wrap, .mkw-resource-energy-cost").forEach(el => { if(el.classList.contains("mkw-energy-header-action")){ const title = el.querySelector(".section-title"); if(title) el.replaceWith(title); else el.remove(); } else el.remove(); }); const oldCard = document.querySelector("#mkwEnergyCard"); if(oldCard) oldCard.remove(); }

  function makeSwitch(id, action, displayCost, labelText){
    const cost = getActionCostForUse(id, action);
    const used = Number(getActionState(id).used?.[action] || 0) > 0;
    const check = action === "move" ? canUseMove(id) : canUseAction(id, action, cost);
    const disabled = !used && !check.ok;
    const label = document.createElement("label");
    label.className = "mkw-energy-switch";
    label.classList.toggle("is-disabled", disabled);
    label.innerHTML = `<input type="checkbox" ${used ? "checked" : ""} ${disabled ? "disabled" : ""}><span class="mkw-energy-slider"></span>${labelText ? `<span class="mkw-energy-switch-label">${labelText}</span>` : ""}`;
    const input = label.querySelector("input");
    input.addEventListener("change", event => { if(event.target.checked){ const ok = spendAction(id, action, cost); if(!ok) event.target.checked = false; } else unspendAction(id, action, cost); });
    return label;
  }

  function getMovementCard(){ return Array.from(document.querySelectorAll(".card")).find(c => c.querySelector("#movementDesc") || c.querySelector("#movementImg")); }
  function getAttackCard(){ return Array.from(document.querySelectorAll(".card")).find(c => c.querySelector("#attackDesc") || c.querySelector("#attackImg")); }

  function createResourceEnergyRow(action){
    const id = currentId();
    const cost = getActionCost(id, action);
    const row = document.createElement("div");
    row.className = "mkw-resource-energy-cost";
    row.dataset.energyAction = action;
    const check = canUseAction(id, action, cost);
    row.classList.toggle("is-energy-disabled", !check.ok);
    const src = getAssetFor(cost);
    if(src){ const img = document.createElement("img"); img.src = src; img.alt = `${cost}`; img.width = 86; img.height = 24; row.appendChild(img); }
    else row.textContent = `${cost}/3`;
    return row;
  }

  function findResourceTitle(container){
    return Array.from(container.children).find(el => el.tagName === "DIV" && !el.id && !el.classList.contains("mkw-resource-action-head"));
  }

  function addResourceCost(selector, action, titleText, descText){
    const container = document.querySelector(selector);
    if(!container) return;

    const legacyTitle = findResourceTitle(container);
    if(legacyTitle) legacyTitle.remove();

    const head = document.createElement("div");
    head.className = "mkw-resource-action-head";

    const title = document.createElement("div");
    title.className = "mkw-resource-action-title";
    title.textContent = titleText;
    head.appendChild(title);

    head.appendChild(createResourceEnergyRow(action));

    const desc = document.createElement("p");
    desc.className = "mkw-resource-action-desc";
    desc.textContent = descText;
    head.appendChild(desc);

    container.insertBefore(head, container.firstChild);
  }

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
    if(src){ const img = document.createElement("img"); img.src = src; img.alt = `${cost}`; tools.appendChild(img); }
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
    if(src){ const img = document.createElement("img"); img.src = src; img.alt = `${cost}`; tools.appendChild(img); }
    if(includeToggle && Number(cost || 0) > 0) tools.appendChild(makeSwitch(currentId(), action, Number(cost || 0), ""));
    wrap.appendChild(tools);
  }

  function addRoadToggle(){
    const body = getMovementCard()?.querySelector(".card-b");
    if(!body) return;
    const id = currentId();
    const roadState = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false });
    const active = roadState.token === getRoundToken() && !!roadState.enabled;
    const wrap = document.createElement("div");
    wrap.className = "mkw-road-toggle-inline";
    wrap.innerHTML = `<div class="mkw-road-toggle-text"><div class="mkw-road-title-inline">${tr("roadToggle")}</div><div class="mkw-road-help-inline">${tr("roadHelp")}</div></div>`;
    const sw = document.createElement("label");
    sw.className = "mkw-energy-switch";
    sw.innerHTML = `<input type="checkbox" ${active ? "checked" : ""}><span class="mkw-energy-slider"></span>`;
    sw.querySelector("input")?.addEventListener("change", event => { writeJson(getRoadKey(id), { token:getRoundToken(), enabled:!!event.target.checked, used:false }); render(); });
    wrap.appendChild(sw);
    body.appendChild(wrap);
  }

  function setButtonAvailability(btn, action){
    const text = (btn.textContent || "").toLowerCase();
    if(text.includes("retirer") || text.includes("remove")) return;
    const check = action === "move" ? canUseMove(currentId()) : canUseAction(currentId(), action, getActionCostForUse(currentId(), action));
    const disabled = !check.ok;
    btn.classList.toggle("mkw-energy-disabled-action", disabled);
    btn.toggleAttribute("aria-disabled", disabled);
  }

  function applyActionAvailability(){
    document.querySelectorAll("#repairKeysDisplay button, #repairKeysDisplay .key-button").forEach(btn => setButtonAvailability(btn, "repair"));
    document.querySelectorAll("#shieldsDisplay button, #shieldsDisplay .shield-button, #shieldsDisplay .key-button").forEach(btn => setButtonAvailability(btn, "protect"));
    document.querySelectorAll("#ultToggleContainer button, #ultToggleContainer [role='button']").forEach(btn => setButtonAvailability(btn, "ultimate"));
  }

  function bindExistingButtons(){
    document.querySelectorAll("#ultToggleContainer button, #ultToggleContainer [role='button']").forEach(btn => {
      if(btn.dataset.energyBound === "1") return;
      btn.dataset.energyBound = "1";
      btn.addEventListener("click", event => {
        const pressed = btn.getAttribute("aria-pressed") === "true" || btn.classList.contains("used") || btn.classList.contains("is-used");
        if(pressed) return;
        blockIfCannotSpend(event, "ultimate");
      }, true);
    });
  }

  function exposeEnergyApi(){
    window.mkwCanSpendEnergyAction = action => canSpendValidatedAction(action);
    window.mkwSpendEnergyAction = action => spendValidatedAction(action);
    window.mkwGetEnergyActionCost = action => getActionCostForUse(currentId(), action);
    window.mkwValidateUltimateEnergy = () => spendValidatedAction("ultimate");
  }

  function render(){
    if(!energyData) return;
    const id = currentId(); if(!id) return;
    clearOldInline();
    updateEnergyStatus();
    const costs = getCostsForId(id) || {};
    addResourceCost(".shields-section", "protect", tr("protectTitle"), tr("protectText"));
    addResourceCost(".repair-section", "repair", tr("repairTitle"), tr("repairText"));
    addEnergyCostToCardHeader(getMovementCard(), "move", Number(costs.move || 0), true, tr("move"));
    addRoadToggle();
    addEnergyCostToCardHeader(getAttackCard(), "ranged_attack", Number(costs.ranged_attack || 0), true, tr("attackTitle"));
    addEnergyCostToHeader("#classActionTitle", "class_action", Number(costs.class_action || 0), true);
    addEnergyCostToHeader("#ultTitle", "ultimate", Number(costs.ultimate || 0), false);
    bindExistingButtons();
    applyActionAvailability();
    exposeEnergyApi();
  }

  async function init(){
    ensureStyles();
    preloadEnergyImages();
    await loadEnergyData();
    const id = currentId();
    if(id && !readJson(getEnergyKey(id), null)) resetEnergy(id);
    exposeEnergyApi();
    render();
    window.addEventListener("mechkawaii:turn-start", event => { const camp = event?.detail?.currentCamp; if(!camp || camp === getCharCamp()) resetEnergy(currentId()); render(); });
    window.addEventListener("mechkawaii:game-flow-updated", render);
    window.addEventListener("mechkawaii:energy-updated", event => { if(event?.detail?.charId === currentId()){ updateEnergyStatus(); setTimeout(render, 0); } });
    window.addEventListener("mechkawaii:energy-action-validated", event => { const action = event?.detail?.action; const charId = event?.detail?.charId || currentId(); if(charId !== currentId() || !action) return; spendValidatedAction(action); });
    window.addEventListener("mechkawaii:shield-updated", () => setTimeout(render, 80));
    window.addEventListener("pageshow", render);
    setTimeout(render, 300);
    setTimeout(render, 900);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();