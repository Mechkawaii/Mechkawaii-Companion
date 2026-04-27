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
      round: "Tour",
      turnOf: "Tour des",
      endTurn: "Fin de tour",
      resetFlow: "Réinitialiser le tour",
      currentTurn: "C’est à ce camp de jouer.",
      expert: "Mode Expert",
      normal: "Mode Normal",
      turnScreenPrefix: "Tour des",
      turnScreenHelp: "C’est au tour de l’adversaire. Cliquez sur le bouton dès qu’il a terminé son tour.",
      turnFinishedPrefix: "Le tour des",
      turnFinishedSuffix: "est terminé"
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
      normal: "Normal Mode",
      turnScreenPrefix: "Turn of",
      turnScreenHelp: "It’s your opponent’s turn. Tap the button once they have finished their turn.",
      turnFinishedPrefix: "The",
      turnFinishedSuffix: "turn is finished"
    }
  };

  function getLang(){ return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key){ const lang = getLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }
  function readJson(key, fallback){ try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function opponent(camp){ return camp === "mechkawaii" ? "prodrome" : "mechkawaii"; }
  function campLabel(camp){ return camp === "mechkawaii" ? "Mechkawaii" : "Prodromes"; }
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

      #mkwTurnTransitionBackdrop { position:fixed; inset:0; z-index:9350; display:flex; align-items:center; justify-content:center; padding:22px; background:rgba(0,0,0,.62); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }
      #mkwTurnTransitionPanel { width:min(620px,100%); text-align:center; color:#fff; background:linear-gradient(180deg, rgba(26,26,36,.96), rgba(10,10,18,.98)); border:1px solid rgba(255,255,255,.16); border-radius:28px; box-shadow:0 28px 80px rgba(0,0,0,.62); padding:28px 20px; }
      .mkw-turn-transition-round { color:rgba(255,255,255,.62); font-size:13px; font-weight:950; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
      .mkw-turn-transition-title { font-size:clamp(34px, 9vw, 72px); line-height:.95; font-weight:1000; text-transform:uppercase; letter-spacing:.02em; text-shadow:0 0 26px rgba(255,77,252,.22); }
      .mkw-turn-transition-help { margin:14px auto 20px; max-width:420px; color:rgba(255,255,255,.72); font-size:14px; line-height:1.35; }
      .mkw-turn-transition-button { width:min(360px,100%); border:1px solid rgba(255,210,77,.62); background:rgba(255,210,77,.16); color:#fff; border-radius:18px; padding:14px 16px; font-weight:950; cursor:pointer; box-shadow:0 0 24px rgba(255,210,77,.13); }
      .mkw-turn-transition-button:hover { background:rgba(255,210,77,.22); }
      @media (max-width:560px){ #mkwTurnBanner{ align-items:stretch; flex-direction:column; } .mkw-turn-actions button{ width:100%; } #mkwTurnTransitionPanel{ padding:24px 16px; } }
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
    closeTurnTransition();
    renderBanner();
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
  }

  function closeStarter(){ document.querySelector("#mkwFirstPlayerBackdrop")?.remove(); }
  function closeTurnTransition(){ document.querySelector("#mkwTurnTransitionBackdrop")?.remove(); }

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

  function turnDoneLabel(camp){
    if(getLang() === "en") return `${tr("turnFinishedPrefix")} ${campLabel(camp)} ${tr("turnFinishedSuffix")}`;
    return `${tr("turnFinishedPrefix")} ${campLabel(camp)} ${tr("turnFinishedSuffix")}`;
  }

  function advanceCurrentCampTurn(){
    const state = getState();
    if(!state?.started) return null;

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
    return state;
  }

  function showTurnTransition(state){
    if(!state?.started) return;
    closeTurnTransition();
    const backdrop = document.createElement("div");
    backdrop.id = "mkwTurnTransitionBackdrop";
    backdrop.innerHTML = `
      <div id="mkwTurnTransitionPanel" role="dialog" aria-modal="true">
        <div class="mkw-turn-transition-round">${tr("round")} ${state.roundNumber}</div>
        <div class="mkw-turn-transition-title">${tr("turnScreenPrefix")} ${campLabel(state.currentCamp)}</div>
        <div class="mkw-turn-transition-help">${tr("turnScreenHelp")}</div>
        <button type="button" class="mkw-turn-transition-button">${turnDoneLabel(state.currentCamp)}</button>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector(".mkw-turn-transition-button")?.addEventListener("click", () => {
      closeTurnTransition();
      const nextState = advanceCurrentCampTurn();
      renderBanner();
      if(nextState) window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: nextState }));
    });
  }

  function endTurn(){
    const nextState = advanceCurrentCampTurn();
    if(!nextState) return showStarter();
    renderBanner();
    showTurnTransition(nextState);
  }

  function resetFlow(){ localStorage.removeItem(FLOW_KEY); closeTurnTransition(); renderBanner(); showStarter(); }

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
    window.mkwGetGameFlowState = getState;
    window.mkwResetGameFlow = resetFlow;
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();