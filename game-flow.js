(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const FLOW_KEY = PREFIX + "game-flow";

  const I18N = {
    fr: {
      chooseFirst: "Début de partie",
      chooseFirstHelp: "Choisissez uniquement le camp qui commence. Ton camp est déjà défini par le choix des unités.",
      firstCampTitle: "Quel camp commence ?",
      officialRule: "Règle officielle : le joueur qui a caressé un animal en dernier commence.",
      mechStarts: "Les Mechkawaii commencent",
      prodStarts: "Les Prodromes commencent",
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
      chooseFirstHelp: "Choose only which camp starts. Your camp is already defined by unit selection.",
      firstCampTitle: "Which camp starts?",
      officialRule: "Official rule: the player who last petted an animal starts the game.",
      mechStarts: "Mechkawaii start",
      prodStarts: "Prodromes start",
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
  function getPlayerCamp(fallbackCamp){ const setup = getSetup(); return setup?.mode === "multi" ? (setup.camp || fallbackCamp) : (setup.camp || fallbackCamp); }
  function getState(){ return readJson(FLOW_KEY, null); }
  function setState(state){ writeJson(FLOW_KEY, state); window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: state })); }
  function isPlayerTurn(state){ return !state?.playerCamp || state.currentCamp === state.playerCamp; }
  function needsStartConfig(state){ return !state?.started || !state.firstCamp; }

  function createState(firstCamp){
    const setup = getSetup();
    const playerCamp = getPlayerCamp(firstCamp);
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

  function startWith(firstCamp){
    const state = createState(firstCamp);
    setState(state);
    closeStarter();
    closeTurnTransition();
    renderBanner();
    window.dispatchEvent(new CustomEvent("mechkawaii:turn-start", { detail: state }));
    if(state.currentCamp !== state.playerCamp) showTurnTransition(state);
  }

  function closeStarter(){ document.querySelector("#mkwFirstPlayerBackdrop")?.remove(); }
  function closeTurnTransition(){ document.querySelector("#mkwTurnTransitionBackdrop")?.remove(); }

  function showStarter(){
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

        <button type="button" class="mkw-first-start" disabled>${tr("startGame")}</button>
      </div>
    `;
    document.body.appendChild(backdrop);

    let firstCamp = null;
    const startBtn = backdrop.querySelector(".mkw-first-start");

    function refresh(){
      backdrop.querySelectorAll("[data-choice='first']").forEach(btn => btn.classList.toggle("is-selected", btn.dataset.camp === firstCamp));
      startBtn.disabled = !firstCamp;
    }

    backdrop.querySelectorAll("[data-choice='first']").forEach(btn => btn.addEventListener("click", () => {
      firstCamp = btn.dataset.camp;
      refresh();
    }));

    startBtn.addEventListener("click", () => {
      if(!firstCamp) return;
      startWith(firstCamp);
    });
  }

  function turnDoneLabel(camp){
    if(getLang() === "en") return `${tr("turnFinishedPrefix")} ${campLabel(camp)} ${tr("turnFinishedSuffix")}`;
    return `${tr("turnFinishedPrefix")} ${campLabel(camp)} ${tr("turnFinishedSuffix")}`;
  }

  function advanceCurrentCampTurn(){
    const state = getState();
    if(!state?.started) return null;

    if(!state.playerCamp) state.playerCamp = getPlayerCamp(state.firstCamp);

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
    let banner = document.querySelector("#mkwTurnBanner");
    if(!banner){
      banner = document.createElement("div");
      banner.id = "mkwTurnBanner";
      const topbar = document.querySelector(".topbar");
      if(topbar?.parentNode) topbar.parentNode.insertBefore(banner, topbar.nextSibling);
      else document.querySelector(".container")?.prepend(banner);
    }
    const state = getState();
    if(needsStartConfig(state)){
      banner.innerHTML = `<div class="mkw-turn-main"><div class="mkw-turn-title">${tr("chooseFirst")}</div><div class="mkw-turn-sub">${tr("chooseFirstHelp")}</div></div><div class="mkw-turn-actions"><button type="button" class="mkw-end-turn">${tr("chooseFirst")}</button></div>`;
      banner.querySelector("button")?.addEventListener("click", showStarter);
      return;
    }
    if(!state.playerCamp) {
      state.playerCamp = getPlayerCamp(state.firstCamp);
      setState(state);
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
    const state = getState();
    renderBanner();
    if(needsStartConfig(state)) setTimeout(showStarter, 250);
    window.mkwGetGameFlowState = getState;
    window.mkwResetGameFlow = resetFlow;
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();