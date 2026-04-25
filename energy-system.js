(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwEnergySystemStyles";
  const ENERGY_DATA_URL = "./data/energy-costs.json";
  let energyData = null;

  const I18N = {
    fr: {
      title: "Cellules d’énergie",
      subtitle: "3 cellules par tour",
      actions: "Actions du tour",
      use: "Utiliser",
      freeRoadMove: "Déplacement gratuit route",
      roadToggle: "Commence sur une route",
      roadHelp: "Active si l’unité commence son tour sur une route : elle gagne un déplacement gratuit.",
      notEnough: "Pas assez d’énergie.",
      alreadyUsed: "Cette action a déjà été utilisée ce tour.",
      actionUsed: "Action utilisée : {action}.",
      energyRestored: "Énergie restaurée pour le tour.",
      freeMoveUsed: "Déplacement gratuit utilisé.",
      noCost: "0 cellule",
      cost: "{n} cellule(s)"
    },
    en: {
      title: "Energy Cells",
      subtitle: "3 cells per turn",
      actions: "Turn actions",
      use: "Use",
      freeRoadMove: "Free road move",
      roadToggle: "Starts on a road",
      roadHelp: "Enable if this unit starts its turn on a road: it gains one free move.",
      notEnough: "Not enough energy.",
      alreadyUsed: "This action has already been used this turn.",
      actionUsed: "Action used: {action}.",
      energyRestored: "Energy restored for this turn.",
      freeMoveUsed: "Free move used.",
      noCost: "0 cell",
      cost: "{n} cell(s)"
    }
  };

  function getLang(){ return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key, vars = {}){
    const lang = getLang();
    let text = (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
    Object.keys(vars).forEach(k => text = text.replaceAll("{" + k + "}", String(vars[k])));
    return text;
  }
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

  async function loadEnergyData(){
    if(energyData) return energyData;
    const res = await fetch(ENERGY_DATA_URL, { cache:"no-store" });
    energyData = await res.json();
    return energyData;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #mkwEnergyCard { margin-top:16px; }
      .mkw-energy-head { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .mkw-energy-title { font-weight:950; font-size:16px; }
      .mkw-energy-subtitle { color:var(--muted); font-size:12px; font-weight:750; }
      .mkw-energy-main { display:grid; grid-template-columns:minmax(140px,220px) 1fr; gap:14px; align-items:start; }
      .mkw-energy-bar-wrap { display:flex; flex-direction:column; gap:8px; }
      .mkw-energy-bar { width:100%; min-height:44px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.08); padding:8px; }
      .mkw-energy-bar img { max-width:100%; height:38px; object-fit:contain; display:block; image-rendering:auto; }
      .mkw-energy-value { font-weight:950; text-align:center; font-size:13px; color:var(--muted); }
      .mkw-road-toggle { display:flex; align-items:center; gap:8px; margin-top:4px; font-size:12px; color:var(--muted); font-weight:800; }
      .mkw-road-toggle input { width:18px; height:18px; }
      .mkw-road-help { font-size:11px; line-height:1.3; color:var(--muted); opacity:.82; }
      .mkw-energy-actions-title { font-weight:950; margin-bottom:8px; }
      .mkw-energy-actions { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px; }
      .mkw-energy-action { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-radius:15px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.055); color:var(--text,#fff); cursor:pointer; text-align:left; }
      .mkw-energy-action:hover { border-color:rgba(255,210,77,.45); background:rgba(255,210,77,.1); }
      .mkw-energy-action.is-used { opacity:.55; }
      .mkw-energy-action.is-disabled { opacity:.38; cursor:not-allowed; filter:grayscale(.4); }
      .mkw-energy-action-name { font-weight:950; line-height:1.2; }
      .mkw-energy-action-cost { font-size:11px; color:var(--muted); margin-top:3px; font-weight:800; }
      .mkw-energy-use { flex:0 0 auto; font-size:11px; font-weight:950; border-radius:999px; padding:6px 8px; background:rgba(255,255,255,.08); }
      @media (max-width:680px){ .mkw-energy-main{ grid-template-columns:1fr; } .mkw-energy-bar img{ height:34px; } }
    `;
    document.head.appendChild(style);
  }

  function getCurrentEnergy(id){
    const max = Number(energyData?.maxEnergy || 3);
    const state = readJson(getEnergyKey(id), null);
    if(!state || typeof state.current !== "number") return max;
    return Math.max(0, Math.min(max, Number(state.current)));
  }

  function setCurrentEnergy(id, current){
    const max = Number(energyData?.maxEnergy || 3);
    writeJson(getEnergyKey(id), { current: Math.max(0, Math.min(max, Number(current))), max });
  }

  function resetEnergy(id){
    setCurrentEnergy(id, Number(energyData?.maxEnergy || 3));
    writeJson(getActionKey(id), { token:getRoundToken(), used:{} });
  }

  function getActionState(id){
    const token = getRoundToken();
    const state = readJson(getActionKey(id), { token, used:{} });
    if(state.token !== token) return { token, used:{} };
    return state;
  }

  function saveActionState(id, state){ writeJson(getActionKey(id), state); }

  function getCostsForId(id){
    const data = energyData || {};
    const key = normalize(id);
    const alias = data.aliases?.[key];
    return data.costs?.[key] || data.costs?.[alias] || data.costs?.[normalize(alias)] || null;
  }

  function getActionName(action){
    const lang = getLang();
    return energyData?.actions?.[action]?.[lang] || energyData?.actions?.[action]?.fr || action;
  }

  function maxUsesForAction(id, action){
    const defaults = energyData?.defaultRules?.maxUsesPerTurnByAction || {};
    const exception = energyData?.exceptions?.[normalize(id)]?.maxUsesPerTurnByAction || {};
    return Number(exception[action] ?? defaults[action] ?? 1);
  }

  function canUseAction(id, action, cost){
    const actionState = getActionState(id);
    const usedCount = Number(actionState.used?.[action] || 0);
    const maxUses = maxUsesForAction(id, action);
    if(usedCount >= maxUses) return { ok:false, reason:"used" };
    if(getCurrentEnergy(id) < cost) return { ok:false, reason:"energy" };
    return { ok:true };
  }

  function useAction(id, action, cost){
    const check = canUseAction(id, action, cost);
    if(!check.ok){
      notify(check.reason === "energy" ? tr("notEnough") : tr("alreadyUsed"));
      return false;
    }
    const actionState = getActionState(id);
    actionState.used[action] = Number(actionState.used?.[action] || 0) + 1;
    saveActionState(id, actionState);
    setCurrentEnergy(id, getCurrentEnergy(id) - Number(cost || 0));
    notify(tr("actionUsed", { action:getActionName(action) }));
    render();
    return true;
  }

  function notify(message){
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-feedback", { detail:{ message } }));
    const root = document.querySelector("#mkwToastRoot");
    if(root){
      const el = document.createElement("div");
      el.className = "mkw-toast";
      el.textContent = message;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2700);
    }
  }

  function makeCard(){
    if(document.querySelector("#mkwEnergyCard")) return;
    const card = document.createElement("div");
    card.className = "card";
    card.id = "mkwEnergyCard";
    card.innerHTML = `
      <div class="card-h"><div class="mkw-energy-head"><div><div class="mkw-energy-title"></div><div class="mkw-energy-subtitle"></div></div></div></div>
      <div class="card-b"><div class="mkw-energy-main"><div class="mkw-energy-bar-wrap"><div class="mkw-energy-bar"></div><div class="mkw-energy-value"></div><label class="mkw-road-toggle"><input type="checkbox" id="mkwRoadStartToggle"><span></span></label><div class="mkw-road-help"></div></div><div><div class="mkw-energy-actions-title"></div><div class="mkw-energy-actions"></div></div></div></div>
    `;
    const hpCard = document.querySelector("#hpCard");
    if(hpCard?.parentNode) hpCard.parentNode.insertBefore(card, hpCard.nextSibling);
    else document.querySelector(".container")?.appendChild(card);
    card.querySelector("#mkwRoadStartToggle")?.addEventListener("change", event => {
      writeJson(getRoadKey(currentId()), { token:getRoundToken(), enabled:!!event.target.checked, used:false });
      render();
    });
  }

  function render(){
    if(!energyData) return;
    const id = currentId();
    if(!id) return;
    makeCard();
    const card = document.querySelector("#mkwEnergyCard");
    if(!card) return;
    const energy = getCurrentEnergy(id);
    const max = Number(energyData.maxEnergy || 3);
    card.querySelector(".mkw-energy-title").textContent = tr("title");
    card.querySelector(".mkw-energy-subtitle").textContent = tr("subtitle");
    card.querySelector(".mkw-energy-actions-title").textContent = tr("actions");
    const imgSrc = energyData.assets?.[String(energy)] || energyData.assets?.[String(max)];
    card.querySelector(".mkw-energy-bar").innerHTML = imgSrc ? `<img src="${imgSrc}" alt="${energy}/${max}">` : "";
    card.querySelector(".mkw-energy-value").textContent = `${energy} / ${max}`;
    card.querySelector(".mkw-road-toggle span").textContent = tr("roadToggle");
    card.querySelector(".mkw-road-help").textContent = tr("roadHelp");
    const roadState = readJson(getRoadKey(id), { token:getRoundToken(), enabled:false, used:false });
    const roadToggle = card.querySelector("#mkwRoadStartToggle");
    if(roadToggle) roadToggle.checked = roadState.token === getRoundToken() && !!roadState.enabled;

    const costs = getCostsForId(id);
    const actions = card.querySelector(".mkw-energy-actions");
    actions.innerHTML = "";

    if(roadToggle?.checked && !roadState.used){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mkw-energy-action";
      btn.innerHTML = `<div><div class="mkw-energy-action-name">${tr("freeRoadMove")}</div><div class="mkw-energy-action-cost">${tr("noCost")}</div></div><span class="mkw-energy-use">${tr("use")}</span>`;
      btn.addEventListener("click", () => {
        writeJson(getRoadKey(id), { token:getRoundToken(), enabled:true, used:true });
        notify(tr("freeMoveUsed"));
        render();
      });
      actions.appendChild(btn);
    }

    if(!costs) return;
    Object.keys(energyData.actions || {}).forEach(action => {
      const cost = Number(costs[action] ?? 0);
      const check = canUseAction(id, action, cost);
      const usedCount = Number(getActionState(id).used?.[action] || 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mkw-energy-action";
      btn.classList.toggle("is-used", usedCount > 0);
      btn.classList.toggle("is-disabled", !check.ok || !isCurrentCampTurn());
      btn.innerHTML = `<div><div class="mkw-energy-action-name">${getActionName(action)}</div><div class="mkw-energy-action-cost">${cost === 0 ? tr("noCost") : tr("cost", { n:cost })}</div></div><span class="mkw-energy-use">${tr("use")}</span>`;
      btn.addEventListener("click", () => {
        if(!isCurrentCampTurn()) return notify(tr("alreadyUsed"));
        useAction(id, action, cost);
      });
      actions.appendChild(btn);
    });
  }

  async function init(){
    ensureStyles();
    await loadEnergyData();
    const id = currentId();
    if(id && !readJson(getEnergyKey(id), null)) resetEnergy(id);
    render();
    window.addEventListener("mechkawaii:turn-start", event => {
      const camp = event?.detail?.currentCamp;
      if(!camp || camp === getCharCamp()){
        resetEnergy(currentId());
        notify(tr("energyRestored"));
      }
      render();
    });
    window.addEventListener("mechkawaii:game-flow-updated", render);
    window.addEventListener("pageshow", render);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
