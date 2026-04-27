(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";
  const STYLE_ID = "mkwGameFlowStyles";

  const I18N = {
    fr: {
      chooseFirst: "Début de partie",
      chooseFirstHelp: "Choisissez le camp qui commence, puis le camp que vous incarnez dans l’application.",
      firstCampTitle: "Quel camp commence ?",
      playerCampTitle: "Quel camp joues-tu ?",
      officialRule: "Règle officielle : le joueur qui a caressé un animal en dernier commence.",
      mechStarts: "Les Mechkawaii commencent",
      prodStarts: "Les Prodromes commencent",
      playMech: "Je joue les Mechkawaii",
      playProd: "Je joue les Prodromes",
      startGame: "Commencer la partie",
      round: "Tour",
      turnOf: "Tour des",
      endTurn: "Fin de tour",
      resetFlow: "Réinitialiser le tour",
      currentTurn: "C’est à ton camp de jouer.",
      opponentTurn: "C’est au tour de l’adversaire.",
      expert: "Mode Expert",
      normal: "Mode Normal",
      turnScreenPrefix: "Tour des",
      turnScreenHelp: "C’est au tour de l’adversaire. Cliquez sur le bouton dès qu’il a terminé son tour.",
      turnFinishedPrefix: "Le tour des",
      turnFinishedSuffix: "est terminé"
    },
    en: {
      chooseFirst: "Game start",
      chooseFirstHelp: "Choose which camp starts, then the camp you play in the app.",
      firstCampTitle: "Which camp starts?",
      playerCampTitle: "Which camp do you play?",
      officialRule: "Official rule: the player who last petted an animal starts the game.",
      mechStarts: "Mechkawaii start",
      prodStarts: "Prodromes start",
      playMech: "I play Mechkawaii",
      playProd: "I play Prodromes",
      startGame: "Start game",
      round: "Round",
      turnOf: "Turn of",
      endTurn: "End turn",
      resetFlow: "Reset turn flow",
      currentTurn: "Your camp is active.",
      opponentTurn: "It’s your opponent’s turn.",
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
  function isPlayerTurn(state){ return !state?.playerCamp || state.currentCamp === state.playerCamp; }

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
      #mkwFirstPlayerPanel { width:min(520px,100%); background:linear-gradient(180deg,#1a1a24,#101018); color:#fff; border:1px solid rgba(255,255,255,.15); border-radius:22px; box-shadow:0 24px 60px rgba(0,0,0,.55); padding:18px; }
      .mkw-first-title { font-weight:950; font-size:20px; margin-bottom:6px; }
      .mkw-first-help { color:rgba(255,255,255,.7); line-height:1.35; margin-bottom:12px; font-size:14px; }
      .mkw-first-block-title { margin-top:14px; margin-bottom:8px; font-size:13px; font-weight:950; color:rgba(255,255,255,.82); text-transform:uppercase; letter-spacing:.05em; }
      .mkw-first-choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .mkw-first-choice { width:100%; padding:13px; border-radius:16px; border:1px solid rgba(255,255,255,.15); background:rgba(255,255,255,.07); color:#fff; font-weight:950; cursor:pointer; }
      .mkw-first-choice:hover { border-color:rgba(255,210,77,.55); background:rgba(255,210,77,.12); }
      .mkw-first-choice.is-selected { border-color:rgba(255,210,77,.86); background:rgba(255,210,77,.18); box-shadow:0 0 22px rgba(255,210,77,.13); }
      .mkw-first-start { width:100%; margin-top:16px; padding:14px; border-radius:17px; border:1px solid rgba(255,210,77,.62); background:rgba(255,210,77,.16); color:#fff; font-weight:950; cursor:pointer; }
      .mkw-first-start:disabled { opacity:.38; filter:grayscale(.8); cursor:not-allowed; }

      #mkwTurnTransitionBackdrop { position:fixed; inset:0; z-index:9350; display:flex; align-items:center; justify-content:center; padding:22px; background:rgba(0,0,0,.62); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); }
      #mkwTurnTransitionPanel { width:min(620px,100%); text-align:center; color:#fff; background:linear-gradient(180deg, rgba(26,26,36,.96), rgba(10,10,18,.98)); border:1px solid rgba(255,255,255,.16); border-radius:28px; box-shadow:0 28px 80px rgba(0,0,0,.62); padding:28px 20px; }
      .mkw-turn-transition-round { color:rgba(255,255,255,.62); font-size:13px; font-weight:950; text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px; }
      .mkw-turn-transition-title { font-size:clamp(34px, 9vw, 72px); line-height:.95; font-weight:1000; text-transform:uppercase; letter-spacing:.02em; text-shadow:0 0 26px rgba(255,77,252,.22); }
      .mkw-turn-transition-help { margin:14px auto 20px; max-width:420px; color:rgba(255,255,255,.72); font-size:14px; line-height:1.35; }
      .mkw-turn-transition-button { width:min(360px,100%); border:1px solid rgba(255,210,77,.62); background:rgba(255,210,77,.16); color:#fff; border-radius:18px; padding:14px 16px; font-weight:950; cursor:pointer; box-shadow:0 0 24px rgba(255,210,77,.13); }
      .mkw-turn-transition-button:hover { background:rgba(255,210,77,.22); }
      @media (max-width:560px){ #mkwTurnBanner{ align-items:stretch; flex-direction:column; } .mkw-turn-actions button{ width:100%; } #mkwTurnTransitionPanel{ padding:24px 16px; } .mkw-first-choice-grid{ grid-template-columns:1fr; } }
    `;
    document.head.appendChild(style);
  }

  function createState(firstCamp, playerCamp){
    const setup = getSetup();
    return {
      started: true,
      firstCamp,
      playerCamp,
      currentCamp: firstCamp,
      roundNumber: 1,
      difficulty: setup.difficulty || "normal",
      playedThisRound: { mechkawaii: false, prodrome: false }
    };
  }

  function startWith(firstCamp, playerCamp){
    const state = createState(firstCamp, playerCamp);
    setState(state);
    closeStarter();
    closeTurnTransition();
    renderBanner();
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
    if(firstCamp !== playerCamp) showTurnTransition(state);
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
        <div class="mkw-first-help">${tr("officialRule")}</div>

        <div class="mkw-first-block-title">${tr("firstCampTitle")}</div>
        <div class="mkw-first-choice-grid">
          <button class="mkw-first-choice" type="button" data-choice="first" data-camp="mechkawaii">${tr("mechStarts")}</button>
          <button class="mkw-first-choice" type="button" data-choice="first" data-camp="prodrome">${tr("prodStarts")}</button>
        </div>

        <div class="mkw-first-block-title">${tr("playerCampTitle")}</div>
        <div class="mkw-first-choice-grid">
          <button class="mkw-first-choice" type="button" data-choice="player" data-camp="mechkawaii">${tr("playMech")}</button>
          <button class="mkw-first-choice" type="button" data-choice="player" data-camp="prodrome">${tr("playProd")}</button>
        </div>

        <button type="button" class="mkw-first-start" disabled>${tr("startGame")}</button>
      </div>
    `;
    document.body.appendChild(backdrop);

    let firstCamp = null;
    let playerCamp = null;
    const startBtn = backdrop.querySelector(".mkw-first-start");

    function refresh(){
      backdrop.querySelectorAll("[data-choice='first']").forEach(btn => btn.classList.toggle("is-selected", btn.dataset.camp === firstCamp));
      backdrop.querySelectorAll("[data-choice='player']").forEach(btn => btn.classList.toggle("is-selected", btn.dataset.camp === playerCamp));
      startBtn.disabled = !(firstCamp && playerCamp);
    }

    backdrop.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => {
      if(btn.dataset.choice === "first") firstCamp = btn.dataset.camp;
      if(btn.dataset.choice === "player") playerCamp = btn.dataset.camp;
      refresh();
    }));

    startBtn.addEventListener("click", () => {
      if(!firstCamp || !playerCamp) return;
      startWith(firstCamp, playerCamp);
    });
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
      if(nextState && !isPlayerTurn(nextState)) showTurnTransition(nextState);
    });
  }

  function endTurn(){
    const nextState = advanceCurrentCampTurn();
    if(!nextState) return showStarter();
    renderBanner();
    if(!isPlayerTurn(nextState)) showTurnTransition(nextState);
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
    const sub = isPlayerTurn(state) ? tr("currentTurn") : tr("opponentTurn");
    banner.innerHTML = `
      <div class="mkw-turn-main">
        <div class="mkw-turn-title">${tr("round")} ${state.roundNumber} — ${tr("turnOf")} ${campLabel(state.currentCamp)}</div>
        <div class="mkw-turn-sub">${mode} · ${sub}</div>
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