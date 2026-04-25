(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const STYLE_ID = "mkwGameFlowStyles";

  const I18N = {
    fr: {
      chooseFirst: "Qui commence ?",
      chooseFirstHelp: "Dans les règles officielles, le joueur qui a caressé un animal en dernier commence la partie.",
      mechStarts: "Mechkawaii commence",
      prodStarts: "Prodrome commence",
      round: "Round",
      turnOf: "Tour des",
      endTurn: "Fin de tour",
      resetFlow: "Réinitialiser le tour",
      currentTurn: "C’est à ce camp de jouer.",
      expert: "Mode Expert",
      normal: "Mode Normal"
    },
    en: {
      chooseFirst: "Who starts?",
      chooseFirstHelp: "Official rule: the player who last petted an animal starts the game.",
      mechStarts: "Mechkawaii starts",
      prodStarts: "Prodrome starts",
      round: "Round",
      turnOf: "Turn of",
      endTurn: "End turn",
      resetFlow: "Reset turn flow",
      currentTurn: "This camp is active.",
      expert: "Expert Mode",
      normal: "Normal Mode"
    }
  };

  function getLang(){ return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key){ const lang = getLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }
  function readJson(key, fallback){ try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function opponent(camp){ return camp === "mechkawaii" ? "prodrome" : "mechkawaii"; }
  function campLabel(camp){ return camp === "mechkawaii" ? "Mechkawaii" : "Prodrome"; }
  function getSetup(){ return readJson(PREFIX + "setup", {}); }
  function getState(){ return readJson(FLOW_KEY, null); }
  function setState(state){ writeJson(FLOW_KEY, state); window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: state })); }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #mkwTurnBanner { margin: 12px 0 16px; padding: 13px 14px; border-radius: 18px; border: 1px solid rgba(255,255,255,.14); background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.035)); box-shadow: 0 14px 32px rgba(0,0,0,.22); display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .mkw-turn-main { min-width:0; }
      .mkw-turn-title { font-weight:950; font-size:16px; }
      .mkw-turn-sub { margin-top:3px; color:var(--muted); font-size:12px; font-weight:750; }
      .mkw-turn-actions { display:flex; gap:8px; flex:0 0 auto; }
      .mkw-turn-actions button { border-radius:13px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); color:var(--text,#fff); font-weight:900; padding:10px 12px; cursor:pointer; }
      .mkw-turn-actions .mkw-end-turn { background: rgba(255,210,77,.16); border-color: rgba(255,210,77,.55); }
      #mkwFirstPlayerBackdrop { position:fixed; inset:0; z-index:9300; background:rgba(0,0,0,.68); display:flex; align-items:center; justify-content:center; padding:18px; }
      #mkwFirstPlayerPanel { width:min(460px,100%); background:linear-gradient(180deg,#1a1a24,#101018); color:#fff; border:1px solid rgba(255,255,255,.15); border-radius:22px; box-shadow:0 24px 60px rgba(0,0,0,.55); padding:18px; }
      .mkw-first-title { font-weight:950; font-size:20px; margin-bottom:6px; }
      .mkw-first-help { color:rgba(255,255,255,.7); line-height:1.35; margin-bottom:14px; font-size:14px; }
      .mkw-first-choice { width:100%; margin-top:8px; padding:13px; border-radius:16px; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:#fff; font-weight:950; cursor:pointer; }
      .mkw-first-choice:hover { border-color:rgba(255,210,77,.55); background:rgba(255,210,77,.12); }
      @media (max-width:560px){ #mkwTurnBanner{ align-items:stretch; flex-direction:column; } .mkw-turn-actions button{ width:100%; } }
    `;
    document.head.appendChild(style);
  }

  function createState(firstCamp){
    const setup = getSetup();
    return {
      started: true,
      firstCamp,
      currentCamp: firstCamp,
      roundNumber: 1,
      difficulty: setup.difficulty || "normal",
      playedThisRound: { mechkawaii: false, prodrome: false }
    };
  }

  function startWith(firstCamp){
    const state = createState(firstCamp);
    setState(state);
    closeStarter();
    renderBanner();
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
  }

  function closeStarter(){ document.querySelector("#mkwFirstPlayerBackdrop")?.remove(); }

  function showStarter(){
    if(getState()?.started) return;
    closeStarter();
    const backdrop = document.createElement("div");
    backdrop.id = "mkwFirstPlayerBackdrop";
    backdrop.innerHTML = `
      <div id="mkwFirstPlayerPanel" role="dialog" aria-modal="true">
        <div class="mkw-first-title">${tr("chooseFirst")}</div>
        <div class="mkw-first-help">${tr("chooseFirstHelp")}</div>
        <button class="mkw-first-choice" type="button" data-camp="mechkawaii">${tr("mechStarts")}</button>
        <button class="mkw-first-choice" type="button" data-camp="prodrome">${tr("prodStarts")}</button>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelectorAll("[data-camp]").forEach(btn => btn.addEventListener("click", () => startWith(btn.dataset.camp)));
  }

  function endTurn(){
    const state = getState();
    if(!state?.started) return showStarter();
    const current = state.currentCamp;
    state.playedThisRound = state.playedThisRound || { mechkawaii:false, prodrome:false };
    state.playedThisRound[current] = true;
    const other = opponent(current);
    if(state.playedThisRound[other]){
      state.roundNumber = Number(state.roundNumber || 1) + 1;
      state.playedThisRound = { mechkawaii:false, prodrome:false };
      state.currentCamp = state.firstCamp || "mechkawaii";
    } else {
      state.currentCamp = other;
    }
    setState(state);
    renderBanner();
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
  }

  function resetFlow(){ localStorage.removeItem(FLOW_KEY); renderBanner(); showStarter(); }

  function renderBanner(){
    ensureStyles();
    let banner = document.querySelector("#mkwTurnBanner");
    if(!banner){
      banner = document.createElement("div");
      banner.id = "mkwTurnBanner";
      const topbar = document.querySelector(".topbar");
      if(topbar?.parentNode) topbar.parentNode.insertBefore(banner, topbar.nextSibling);
      else document.querySelector(".container")?.prepend(banner);
    }
    const state = getState();
    if(!state?.started){
      banner.innerHTML = `<div class="mkw-turn-main"><div class="mkw-turn-title">${tr("chooseFirst")}</div><div class="mkw-turn-sub">${tr("chooseFirstHelp")}</div></div><div class="mkw-turn-actions"><button type="button" class="mkw-end-turn">${tr("chooseFirst")}</button></div>`;
      banner.querySelector("button")?.addEventListener("click", showStarter);
      return;
    }
    const mode = state.difficulty === "expert" ? tr("expert") : tr("normal");
    banner.innerHTML = `
      <div class="mkw-turn-main">
        <div class="mkw-turn-title">${tr("round")} ${state.roundNumber} — ${tr("turnOf")} ${campLabel(state.currentCamp)}</div>
        <div class="mkw-turn-sub">${mode} · ${tr("currentTurn")}</div>
      </div>
      <div class="mkw-turn-actions">
        <button type="button" class="mkw-reset-flow">${tr("resetFlow")}</button>
        <button type="button" class="mkw-end-turn">${tr("endTurn")}</button>
      </div>
    `;
    banner.querySelector(".mkw-end-turn")?.addEventListener("click", endTurn);
    banner.querySelector(".mkw-reset-flow")?.addEventListener("click", resetFlow);
  }

  function init(){
    ensureStyles();
    renderBanner();
    if(!getState()?.started) setTimeout(showStarter, 250);
    else setTimeout(() => window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: getState() })), 120);
    window.mkwGetGameFlowState = getState;
    window.mkwResetGameFlow = resetFlow;
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
