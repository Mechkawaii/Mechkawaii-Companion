(function () {
  "use strict";

  if (window.__mkwExpertEventsLoaded) return;
  window.__mkwExpertEventsLoaded = true;

  const PREFIX = "mechkawaii:";
  const SETUP_KEY = PREFIX + "setup";
  const FLOW_KEY = PREFIX + "game-flow";
  const TRIGGERED_KEY = PREFIX + "expert-event-triggered-rounds";

  const EVENTS = {
    genematrice: {
      id: "genematrice",
      label: "Génématrice",
      image: "./assets/events/event_genematrice.png",
      description: "La génématrice imprime des ressources qui modifient le champ de bataille.",
      scenarios: [
        {
          id: "reparation_express",
          label: "Réparation express",
          image: "./assets/events/event_blank.png",
          intro: "La génématrice imprime des clés réparations.",
          effect: "Faites 2 lancers de dés de terrain. Les terrains désignés donnent +1 PV aux unités adjacentes et remettent en service les unités HS avec 1 PV. Si aucune unité n’est dans cette zone, le bonus est perdu."
        },
        {
          id: "surproduction",
          label: "Surproduction",
          image: "./assets/events/event_blank.png",
          intro: "La génématrice imprime en excès des pièces d’armure.",
          effect: "Faites 2 lancers de dés de terrain. Les terrains désignés donnent 1 bouclier aux unités adjacentes. Si aucune unité n’est dans ces zones, le bonus est perdu."
        }
      ]
    },
    generateur_electrique: {
      id: "generateur_electrique",
      label: "Générateur électrique",
      image: "./assets/events/event_generateur_electrique.png",
      description: "Le générateur électrique libère une énergie instable tous les 5 rounds.",
      scenarios: [
        {
          id: "boost_energetique",
          label: "Boost énergétique",
          image: "./assets/events/event_blank.png",
          intro: "Une surtension se produit dans le générateur électrique.",
          effect: "Faites 2 lancers de dés de terrain. Les terrains désignés offrent 1 cellule d’énergie supplémentaire aux unités adjacentes au prochain tour."
        },
        {
          id: "ondes_electromagnetiques",
          label: "Ondes électromagnétiques",
          image: "./assets/events/event_blank.png",
          intro: "Le générateur électrique est instable et doit effectuer un lâcher d’ondes électromagnétiques.",
          effect: "Faites 2 lancers de dés de terrain. Les terrains désignés suppriment le coup unique des unités adjacentes jusqu’à un réamorçage."
        }
      ]
    }
  };

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

  function getSetup() {
    return readJson(SETUP_KEY, null);
  }

  function getFlow() {
    return readJson(FLOW_KEY, null);
  }

  function getScenario(buildingId, scenarioId) {
    const building = EVENTS[buildingId];
    if (!building) return null;
    const scenario = building.scenarios.find(item => item.id === scenarioId);
    if (!scenario) return null;
    return { building, scenario };
  }

  function injectStyles() {
    if (document.getElementById("mkwExpertEventsStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwExpertEventsStyles";
    style.textContent = `
      .mkw-expert-events-pick { margin-top: 18px; border-top: 1px solid rgba(255,255,255,.1); padding-top: 16px; }
      .mkw-expert-step-help { color: var(--muted); font-size: 13px; margin: 0 0 14px; line-height: 1.45; }
      .mkw-event-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
      .mkw-event-building-card { position: relative; width: 100%; aspect-ratio: 1 / 1; border: 1px solid rgba(255,255,255,.15); border-radius: 18px; padding: 0; overflow: hidden; background: #05060a; color: inherit; cursor: pointer; box-shadow: 0 16px 34px rgba(0,0,0,.28); -webkit-tap-highlight-color: transparent; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
      .mkw-event-building-card:hover { transform: translateY(-2px); border-color: rgba(255,210,77,.55); box-shadow: 0 20px 40px rgba(0,0,0,.34); }
      .mkw-event-building-card:active { transform: scale(.985); }
      .mkw-event-building-card img { width: 100%; height: 100%; object-fit: contain; display: block; background: #05060a; }
      .mkw-event-building-label { position: absolute; left: 12px; right: 12px; bottom: 12px; border-radius: 14px; padding: 10px 12px; background: rgba(5,6,10,.9); border: 1px solid rgba(255,255,255,.13); font-weight: 900; text-transform: uppercase; letter-spacing: .04em; text-align: center; }
      .mkw-event-building-hint { display:block; margin-top:4px; font-size: 10px; color: rgba(255,255,255,.68); text-transform:none; letter-spacing:0; font-weight:700; }
      .mkw-event-flip-card { width: 100%; aspect-ratio: 1 / 1; perspective: 1100px; border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; -webkit-tap-highlight-color: transparent; }
      .mkw-event-flip-inner { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .45s ease; }
      .mkw-event-flip-card.is-flipped .mkw-event-flip-inner { transform: rotateY(180deg); }
      .mkw-event-face { position: absolute; inset: 0; -webkit-backface-visibility: hidden; backface-visibility: hidden; border: 1px solid rgba(255,255,255,.15); border-radius: 18px; overflow: hidden; background: #111217; box-shadow: 0 16px 34px rgba(0,0,0,.28); transform: rotateY(0deg) translateZ(1px); }
      .mkw-event-front { z-index: 2; }
      .mkw-event-back { z-index: 1; transform: rotateY(180deg) translateZ(2px); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; background: #111217; }
      .mkw-event-flip-card.is-flipped .mkw-event-front { pointer-events: none; }
      .mkw-event-img { width: 100%; height: 100%; object-fit: contain; display: block; background: #05060a; }
      .mkw-event-front-label { position: absolute; left: 12px; right: 12px; bottom: 12px; border-radius: 14px; padding: 10px 12px; background: rgba(5,6,10,.88); border: 1px solid rgba(255,255,255,.13); font-weight: 900; text-transform: uppercase; letter-spacing: .04em; text-align: center; }
      .mkw-event-card-title { display:block; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 8px; }
      .mkw-event-card-text { display:block; font-size: 13px; line-height: 1.45; color: var(--text); margin: 0; }
      .mkw-event-card-intro { display:block; font-weight: 800; color: #fff; margin: 0 0 8px; line-height: 1.35; }
      .mkw-event-choose { display:block; width: 100%; margin-top: auto; text-align:center; border-radius: 14px; padding: 10px 12px; }
      .mkw-event-back-button { margin-bottom: 12px; }
      .mkw-scenario-front { padding: 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; text-align: center; background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #05060a; }
      .mkw-scenario-front::before { content: ""; position: absolute; inset: 0; background: rgba(5,6,10,.18); }
      .mkw-scenario-front > * { position: relative; z-index: 1; }
      .mkw-scenario-kicker { display:block; font-size: 11px; font-weight: 900; opacity: .75; text-transform: uppercase; letter-spacing: .1em; }
      .mkw-scenario-title { display:block; font-size: 20px; line-height: 1.05; font-weight: 1000; text-transform: uppercase; }
      #mkwExpertEventHud { margin: 12px 0 0; border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 10px; display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(255,120,180,.12), rgba(255,255,255,.04)); }
      #mkwExpertEventHud img { width: 58px; height: 58px; border-radius: 12px; object-fit: contain; background:#05060a; flex: 0 0 auto; }
      .mkw-expert-hud-title { font-weight: 900; text-transform: uppercase; letter-spacing: .04em; font-size: 13px; }
      .mkw-expert-hud-sub { color: var(--muted); font-size: 12px; line-height: 1.35; margin-top: 3px; }
      #mkwExpertEventBackdrop { position: fixed; inset: 0; background: rgba(0,0,0,.76); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 18px; }
      #mkwExpertEventPanel { width: min(560px, 100%); border-radius: 24px; border: 1px solid rgba(255,255,255,.16); background: #111217; box-shadow: 0 30px 80px rgba(0,0,0,.55); overflow: hidden; }
      .mkw-expert-modal-visual { width: 100%; aspect-ratio: 1 / 1; max-height: 360px; object-fit: contain; display: block; background: #05060a; }
      .mkw-expert-modal-body { padding: 18px; background: #111217; }
      .mkw-expert-modal-kicker { font-size: 12px; color: var(--muted); font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
      .mkw-expert-modal-title { font-size: 24px; font-weight: 1000; text-transform: uppercase; line-height: 1.05; margin: 6px 0 10px; }
      .mkw-expert-modal-intro { font-weight: 800; margin: 0 0 10px; }
      .mkw-expert-modal-effect { color: var(--text); line-height: 1.45; margin: 0 0 16px; }
      .mkw-expert-modal-close { width: 100%; }
      @media (max-width: 680px) { .mkw-event-grid { grid-template-columns: 1fr; } .mkw-event-card-title { font-size: 16px; } .mkw-event-card-text { font-size: 12px; } .mkw-expert-modal-visual { max-height: 300px; } }
    `;
    document.head.appendChild(style);
  }

  function createBuildingCard(building) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mkw-event-building-card";
    card.innerHTML = `
      <img src="${building.image}" alt="">
      <span class="mkw-event-building-label">
        ${building.label}
        <span class="mkw-event-building-hint">Voir les scénarios</span>
      </span>
    `;
    card.addEventListener("click", event => {
      event.preventDefault();
      renderScenarioStep(building.id);
    });
    return card;
  }

  function createFlipCard({ image, title, kicker, intro, effect, buttonLabel, onChoose, scenario }) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mkw-event-flip-card";
    card.innerHTML = `
      <span class="mkw-event-flip-inner">
        <span class="mkw-event-face mkw-event-front ${scenario ? "mkw-scenario-front" : ""}" ${scenario ? `style="background-image:url('${image}')"` : ""}>
          ${scenario ? `<span class="mkw-scenario-kicker">${kicker || "Scénario"}</span><span class="mkw-scenario-title">${title}</span>` : `<img class="mkw-event-img" src="${image}" alt=""><span class="mkw-event-front-label">${title}</span>`}
        </span>
        <span class="mkw-event-face mkw-event-back">
          <span>
            <span class="mkw-event-card-title">${title}</span>
            ${intro ? `<span class="mkw-event-card-intro">${intro}</span>` : ""}
            <span class="mkw-event-card-text">${effect || "Touchez pour choisir."}</span>
          </span>
          <span class="mkw-event-choose btn-accent">${buttonLabel || "Choisir"}</span>
        </span>
      </span>
    `;
    card.addEventListener("click", event => {
      event.preventDefault();
      if (card.classList.contains("is-flipped")) {
        onChoose?.();
      } else {
        document.querySelectorAll(".mkw-event-flip-card.is-flipped").forEach(other => {
          if (other !== card) other.classList.remove("is-flipped");
        });
        card.classList.add("is-flipped");
      }
    });
    return card;
  }

  function getSetupChoicesFromDom() {
    const mode = document.getElementById("modeSingle")?.classList.contains("btn-accent") ? "single" :
      document.getElementById("modeMulti")?.classList.contains("btn-accent") ? "multi" : null;
    const camp = document.getElementById("campMech")?.classList.contains("btn-accent") ? "mechkawaii" :
      document.getElementById("campProd")?.classList.contains("btn-accent") ? "prodrome" : null;
    return { mode, camp: mode === "multi" ? camp : null };
  }

  function clearTriggeredRounds() {
    localStorage.removeItem(TRIGGERED_KEY);
  }

  function saveExpertSetup(buildingId, scenarioId) {
    const choices = getSetupChoicesFromDom();
    if (!choices.mode) return;
    writeJson(SETUP_KEY, {
      mode: choices.mode,
      camp: choices.camp,
      difficulty: "expert",
      expertEvent: { building: buildingId, scenario: scenarioId, triggerEveryRounds: 5 }
    });
    clearTriggeredRounds();
    location.reload();
  }

  function ensureSetupPicker() {
    let wrap = document.getElementById("expertEventsPick");
    if (wrap) return wrap;
    const difficultyPick = document.getElementById("difficultyPick");
    if (!difficultyPick) return null;
    wrap = document.createElement("div");
    wrap.id = "expertEventsPick";
    wrap.className = "rule mkw-expert-events-pick";
    wrap.style.display = "none";
    difficultyPick.insertAdjacentElement("afterend", wrap);
    return wrap;
  }

  function renderBuildingStep() {
    const wrap = ensureSetupPicker();
    if (!wrap) return;
    wrap.style.display = "block";
    wrap.innerHTML = `
      <h3>4) Choisis l’événement Expert</h3>
      <p class="mkw-expert-step-help">Choisis le bâtiment qui déclenchera un événement au round 5, puis tous les 5 rounds.</p>
      <div class="mkw-event-grid" id="mkwEventBuildingGrid"></div>
    `;
    const grid = wrap.querySelector("#mkwEventBuildingGrid");
    Object.values(EVENTS).forEach(building => {
      grid.appendChild(createBuildingCard(building));
    });
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderScenarioStep(buildingId) {
    const building = EVENTS[buildingId];
    const wrap = ensureSetupPicker();
    if (!building || !wrap) return;
    wrap.innerHTML = `
      <button type="button" class="mkw-event-back-button">← Revenir aux bâtiments</button>
      <h3>${building.label}</h3>
      <p class="mkw-expert-step-help">Choisis le scénario qui sera déclenché au round 5, puis tous les 5 rounds.</p>
      <div class="mkw-event-grid" id="mkwEventScenarioGrid"></div>
    `;
    wrap.querySelector(".mkw-event-back-button")?.addEventListener("click", renderBuildingStep);
    const grid = wrap.querySelector("#mkwEventScenarioGrid");
    building.scenarios.forEach(scenario => {
      grid.appendChild(createFlipCard({ image: scenario.image, title: scenario.label, kicker: building.label, intro: scenario.intro, effect: scenario.effect, buttonLabel: "Choisir ce scénario", scenario: true, onChoose: () => saveExpertSetup(building.id, scenario.id) }));
    });
  }

  function onSetupClickCapture(event) {
    const expertBtn = event.target.closest?.("#diffExpert");
    const normalBtn = event.target.closest?.("#diffNormal");
    if (normalBtn) clearTriggeredRounds();
    if (!expertBtn || !document.body.classList.contains("page-index")) return;
    const choices = getSetupChoicesFromDom();
    if (!choices.mode || (choices.mode === "multi" && !choices.camp)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    document.querySelectorAll("#diffNormal, #diffExpert").forEach(btn => btn.classList.remove("btn-accent"));
    expertBtn.classList.add("btn-accent");
    renderBuildingStep();
  }

  function initSetupPicker() {
    if (!document.body.classList.contains("page-index") || getSetup()) return;
    injectStyles();
    document.addEventListener("click", onSetupClickCapture, true);
  }

  function nextEventText(roundNumber) {
    const round = Number(roundNumber || 1);
    if (round > 0 && round % 5 === 0) return "Événement actif ce round";
    const next = Math.ceil(round / 5) * 5;
    return `Prochain événement : round ${next}`;
  }

  function renderExpertHud() {
    const setup = getSetup();
    if (!setup || setup.difficulty !== "expert" || !setup.expertEvent) return;
    const data = getScenario(setup.expertEvent.building, setup.expertEvent.scenario);
    const banner = document.getElementById("mkwTurnBanner");
    if (!data || !banner) return;
    let hud = document.getElementById("mkwExpertEventHud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "mkwExpertEventHud";
      banner.insertAdjacentElement("afterend", hud);
    }
    const flow = getFlow() || {};
    hud.innerHTML = `<img src="${data.building.image}" alt=""><div><div class="mkw-expert-hud-title">${data.building.label} — ${data.scenario.label}</div><div class="mkw-expert-hud-sub">${nextEventText(flow.roundNumber)} · déclenchement tous les 5 rounds.</div></div>`;
  }

  function hasTriggered(round) {
    const list = readJson(TRIGGERED_KEY, []);
    return Array.isArray(list) && list.includes(round);
  }

  function markTriggered(round) {
    const list = readJson(TRIGGERED_KEY, []);
    const next = Array.isArray(list) ? list : [];
    if (!next.includes(round)) next.push(round);
    writeJson(TRIGGERED_KEY, next);
  }

  function closeEventModal() {
    document.getElementById("mkwExpertEventBackdrop")?.remove();
  }

  function showEventModal(roundNumber) {
    const setup = getSetup();
    if (!setup || setup.difficulty !== "expert" || !setup.expertEvent) return;
    const data = getScenario(setup.expertEvent.building, setup.expertEvent.scenario);
    if (!data) return;
    closeEventModal();
    const backdrop = document.createElement("div");
    backdrop.id = "mkwExpertEventBackdrop";
    backdrop.innerHTML = `<div id="mkwExpertEventPanel" role="dialog" aria-modal="true"><img class="mkw-expert-modal-visual" src="${data.building.image}" alt=""><div class="mkw-expert-modal-body"><div class="mkw-expert-modal-kicker">Round ${roundNumber} · ${data.building.label}</div><div class="mkw-expert-modal-title">${data.scenario.label}</div><p class="mkw-expert-modal-intro">${data.scenario.intro}</p><p class="mkw-expert-modal-effect">${data.scenario.effect}</p><button type="button" class="mkw-expert-modal-close btn-accent">Compris</button></div></div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector(".mkw-expert-modal-close")?.addEventListener("click", closeEventModal);
  }

  function maybeTriggerRoundEvent(state) {
    const setup = getSetup();
    if (!setup || setup.difficulty !== "expert" || !setup.expertEvent) return;
    const round = Number(state?.roundNumber || getFlow()?.roundNumber || 1);
    if (round < 5 || round % 5 !== 0 || hasTriggered(round)) return;
    markTriggered(round);
    setTimeout(() => showEventModal(round), 220);
  }

  function initTurnEvents() {
    if (!document.body.classList.contains("page-character")) return;
    injectStyles();
    setTimeout(renderExpertHud, 80);
    setTimeout(renderExpertHud, 350);
    window.addEventListener("mechkawaii:game-flow-updated", event => { renderExpertHud(); maybeTriggerRoundEvent(event.detail); });
    window.addEventListener("mechkawaii:turn-start", event => { renderExpertHud(); maybeTriggerRoundEvent(event.detail); });
    document.addEventListener("click", event => { if (event.target.closest?.(".mkw-reset-flow")) clearTriggeredRounds(); }, true);
  }

  function init() {
    initSetupPicker();
    initTurnEvents();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
