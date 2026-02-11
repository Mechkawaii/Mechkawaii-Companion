
const STORAGE_PREFIX = "mechkawaii:";

function playPressStart(){
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);

    const now = ctx.currentTime;

    // Little "arcade" two-tone blip
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "square";
    osc2.type = "triangle";

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, now);
    g2.gain.setValueAtTime(0.0001, now);

    osc1.frequency.setValueAtTime(660, now);
    osc1.frequency.exponentialRampToValueAtTime(990, now + 0.06);

    osc2.frequency.setValueAtTime(330, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    g1.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    g2.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc1.connect(g1); g1.connect(master);
    osc2.connect(g2); g2.connect(master);

    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.14);

    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 250);
  }catch(e){}
}


function heartIcon(filled){
  const src = filled
    ? "./assets/pv.svg"
    : "./assets/pv_off.svg";

  return `
    <img
      src="${src}"
      class="heart"
      alt="PV"
    />
  `;
}


function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

function getLang(){
  const saved = localStorage.getItem(STORAGE_PREFIX + "lang");
  return saved || "fr";
}
function setLang(lang){
  localStorage.setItem(STORAGE_PREFIX + "lang", lang);
}

function getState(charId){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "state:" + charId);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){
    return null;
  }
}
function setState(charId, state){
  localStorage.setItem(STORAGE_PREFIX + "state:" + charId, JSON.stringify(state));
}

function heartSvg(filled){
  const fill = filled ? "var(--accent)" : "rgba(255,255,255,.14)";
  const stroke = filled ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.20)";
  return `
  <svg class="heart" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-10-9.4C.3 8.2 2.2 5.2 5.4 4.5c1.9-.4 3.8.3 5 1.7 1.2-1.4 3.1-2.1 5-1.7 3.2.7 5.1 3.7 3.4 7.1C19.5 16.4 12 21 12 21z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.2" />
  </svg>`;
}

async function loadCharacters(){
  const res = await fetch("./data/characters.json", {cache:"no-store"});
  if(!res.ok) throw new Error("Cannot load characters.json");
  return await res.json();
}

function t(obj, lang){
  if(obj == null) return "";
  if(typeof obj === "string") return obj;
  return obj[lang] || obj["fr"] || "";
}

function setLangUI(lang){
  const sel = qs("#lang");
  if(sel) sel.value = lang;
  qsa("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    const dict = window.__i18n || {};
    el.textContent = (dict[key] && (dict[key][lang] || dict[key]["fr"])) || el.textContent;
  });
}

function bindTopbar(lang){
  const sel = qs("#lang");
  if(sel){
    sel.value = lang;
    sel.addEventListener("change", ()=>{
      const v = sel.value;
      setLang(v);
      location.reload();
    });
  }
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function renderHP(container, hpCur, hpMax){
  container.innerHTML = "";
  const hearts = document.createElement("div");
  hearts.className = "hearts";
  for(let i=1;i<=hpMax;i++){
    const span = document.createElement("span");
    span.innerHTML = heartIcon(i<=hpCur);
    hearts.appendChild(span.firstElementChild);
  }
  container.appendChild(hearts);
}

function renderToggleRow(root, toggle, isOn, lang, onChange){
  const row = document.createElement("div");
  row.className = "toggle";
  const left = document.createElement("div");
  left.className = "lbl";
  const title = document.createElement("div");
  title.className = "t";
  title.textContent = t(toggle.label, lang);
  const desc = document.createElement("div");
  desc.className = "d";
  desc.textContent = toggle.hint ? t(toggle.hint, lang) : "";
  left.appendChild(title);
  left.appendChild(desc);

  const sw = document.createElement("div");
  sw.className = "switch" + (isOn ? " on" : "");
  sw.setAttribute("role","switch");
  sw.setAttribute("tabindex","0");
  sw.setAttribute("aria-checked", isOn ? "true" : "false");

  function flip(){
    isOn = !isOn;
    sw.className = "switch" + (isOn ? " on" : "");
    sw.setAttribute("aria-checked", isOn ? "true" : "false");
    onChange(isOn);
  }

  sw.addEventListener("click", flip);
  sw.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      flip();
    }
  });

  row.appendChild(left);
  row.appendChild(sw);
  root.appendChild(row);
}

function urlParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

async function initIndex(){
  const lang = getLang();
  bindTopbar(lang);

  const list = qs("#charList");
  if(!list) return;

  const setupCard = qs("#setupCard");
  const draftCard = qs("#draftCard");
  const campPick = qs("#campPick");
  const draftList = qs("#draftList");
  const draftError = qs("#draftError");

  const changeSetupBtn = qs("#changeSetupBtn");
  const changeDraftBtn = qs("#changeDraftBtn");

  const chars = await loadCharacters();

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;

  function saveSetup(obj){
    localStorage.setItem(STORAGE_PREFIX + "setup", JSON.stringify(obj));
  }
  function clearSetup(){
    localStorage.removeItem(STORAGE_PREFIX + "setup");
    localStorage.removeItem(STORAGE_PREFIX + "draft");
    location.reload();
  }

  if(changeSetupBtn){
    changeSetupBtn.addEventListener("click", ()=>{
      localStorage.removeItem(STORAGE_PREFIX + "setup");
      location.reload();
    });
  }
  if(changeDraftBtn){
    changeDraftBtn.addEventListener("click", ()=>{
      localStorage.removeItem(STORAGE_PREFIX + "draft");
      location.reload();
    });
  }

  if(!setup){
    if(setupCard) setupCard.style.display = "block";
    if(draftCard) draftCard.style.display = "none";
    if(changeSetupBtn) changeSetupBtn.style.display = "none";
    if(changeDraftBtn) changeDraftBtn.style.display = "none";
    list.innerHTML = "";

    let mode = null;
    let camp = null;
    let difficulty = null;

    qs("#modeSingle")?.addEventListener("click", ()=>{
      mode = "single";
      showDifficultyPick();
    });
    qs("#modeMulti")?.addEventListener("click", ()=>{
      mode = "multi";
      if(campPick) campPick.style.display = "block";
    });

    qs("#campMech")?.addEventListener("click", ()=>{
      camp = "mechkawaii";
      showDifficultyPick();
    });
    qs("#campProd")?.addEventListener("click", ()=>{
      camp = "prodrome";
      showDifficultyPick();
    });

    qs("#diffNormal")?.addEventListener("click", ()=>{
      difficulty = "normal";
      saveSetup({mode, camp, difficulty});
      location.reload();
    });
    qs("#diffExpert")?.addEventListener("click", ()=>{
      difficulty = "expert";
      saveSetup({mode, camp, difficulty});
      location.reload();
    });

    function showDifficultyPick(){
      const diffPick = qs("#difficultyPick");
      if(diffPick) diffPick.style.display = "block";
    }

    qs("#resetSetupBtn")?.addEventListener("click", clearSetup);

    return;
  }

  if(changeSetupBtn) changeSetupBtn.style.display = "inline-block";
  if(changeDraftBtn) changeDraftBtn.style.display = "inline-block";

  let available = chars;
  if(setup.mode === "multi"){
    available = chars.filter(c => (c.camp || "mechkawaii") === (setup.camp || "mechkawaii"));
  }

  const maxPick = (setup.mode === "single") ? 6 : 3;
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  let draft = draftRaw ? JSON.parse(draftRaw) : null;

  function saveDraft(obj){
    localStorage.setItem(STORAGE_PREFIX + "draft", JSON.stringify(obj));
  }

  if(!draft){
    if(draftCard) draftCard.style.display = "block";
    if(setupCard) setupCard.style.display = "none";
    list.innerHTML = "";

    draftList.innerHTML = "";
    const selected = new Set();

    available.forEach(c=>{
      const row = document.createElement("div");
      row.className = "toggle";

      const left = document.createElement("div");
      left.className = "lbl";
      left.innerHTML = `<div class="t">${t(c.name, lang)}</div><div class="d">${t(c.class, lang)} — HP ${c.hp?.max ?? "?"}</div>`;

      const sw = document.createElement("div");
      sw.className = "switch";
      sw.setAttribute("role","switch");
      sw.setAttribute("tabindex","0");
      sw.setAttribute("aria-checked","false");

      function refresh(){
        const on = selected.has(c.id);
        sw.className = "switch" + (on ? " on" : "");
        sw.setAttribute("aria-checked", on ? "true" : "false");
      }
      function flip(){
        if(selected.has(c.id)){
          selected.delete(c.id);
        }else{
          if(selected.size >= maxPick){
            draftError.textContent = (lang === "fr") ? `Tu as déjà ${maxPick} persos sélectionnés.` : `You already selected ${maxPick} characters.`;
            return;
          }
          selected.add(c.id);
        }
        draftError.textContent = "";
        refresh();
      }
      sw.addEventListener("click", flip);
      sw.addEventListener("keydown",(e)=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); flip(); }
      });

      row.appendChild(left);
      row.appendChild(sw);
      draftList.appendChild(row);
      refresh();
    });

    qs("#confirmDraft")?.addEventListener("click", ()=>{
      if(selected.size !== maxPick){
        draftError.textContent = (lang === "fr") ? `Sélectionne exactement ${maxPick} persos.` : `Select exactly ${maxPick} characters.`;
        return;
      }
      saveDraft({activeIds:[...selected]});
      location.reload();
    });

    qs("#skipDraft")?.addEventListener("click", ()=>{
      saveDraft({activeIds: null});
      location.reload();
    });

    return;
  }

  let toShow = available;
  if(Array.isArray(draft.activeIds) && draft.activeIds.length){
    toShow = available.filter(c => draft.activeIds.includes(c.id));
  }

  list.innerHTML = "";
  toShow.forEach(c=>{
    const a = document.createElement("a");
    a.className = "char";
    a.href = `character.html?id=${encodeURIComponent(c.id)}`;
    a.innerHTML = `
      <div class="n">${t(c.name, lang)}</div>
      <div class="m">
        <span class="badge">${t(c.class, lang)}</span>
        <span class="badge">HP ${c.hp?.max ?? "?"}</span>
      </div>
    `;
    list.appendChild(a);
  });

  if(toShow.length === 0){
    const msg = document.createElement("div");
    msg.className = "footer-note";
    msg.style.color = "var(--muted)";
    msg.textContent = (lang === "fr")
      ? "Aucun perso disponible pour ce camp (pour l'instant). Change de camp via "Changer config"."
      : "No characters available for this camp (yet). Change camp via "Change setup".";
    list.appendChild(msg);
  }
}

async function initCharacter(){
  const lang = getLang();
  bindTopbar(lang);

  const id = urlParam("id");
  if(!id){
    qs("#error").textContent = "Missing character id.";
    return;
  }
  const chars = await loadCharacters();
  const c = chars.find(x=>x.id === id);
  if(!c){
    qs("#error").textContent = "Character not found.";
    return;
  }

  const saved = getState(c.id);
  const state = saved || {
    hp: c.hp?.max ?? 0,
    toggles: Object.fromEntries((c.toggles||[]).map(tg => [tg.id, false]))
  };

  qs("#charName").textContent = t(c.name, lang);
  qs("#charClass").textContent = t(c.class, lang);
  qs("#hpMaxLabel").textContent = `/${c.hp?.max ?? 0}`;

  const hpCurEl = qs("#hpCur");
  const hpHeartsEl = qs("#hpHearts");

  function refreshHP(){
    hpCurEl.textContent = String(state.hp);
    renderHP(hpHeartsEl, state.hp, c.hp?.max ?? 0);
  }

  qs("#hpMinus").addEventListener("click", ()=>{
    state.hp = clamp(state.hp - 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);
    refreshHP();
    updateTabHP(c.id, state.hp);
  });
  qs("#hpPlus").addEventListener("click", ()=>{
    state.hp = clamp(state.hp + 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);
    refreshHP();
    updateTabHP(c.id, state.hp);
  });

  refreshHP();

  // Text blocks
  qs("#classActionTitle").textContent = t(c.texts?.class_action_title, lang);
  qs("#classActionBody").textContent  = t(c.texts?.class_action_body, lang);
  qs("#ultTitle").textContent         = t(c.texts?.ultimate_title, lang);
  qs("#ultBody").textContent          = t(c.texts?.ultimate_body, lang);

  // NOUVEAU: Descriptions des patterns
  qs("#movementDesc").textContent = t(c.texts?.movement_desc, lang) || "";
  qs("#attackDesc").textContent = t(c.texts?.attack_desc, lang) || "";

  // Toggles
  const togglesRoot = qs("#toggles");
  togglesRoot.innerHTML = "";
  (c.toggles || []).forEach(tg=>{
    const isOn = !!state.toggles[tg.id];
    renderToggleRow(togglesRoot, tg, isOn, lang, (v)=>{
      state.toggles[tg.id] = v;
      setState(c.id, state);
    });
  });

  // Images - selon la difficulté
  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const difficulty = setup?.difficulty || "normal";
  
  const movImg = qs("#movementImg");
  const atkImg = qs("#attackImg");
  
  if(difficulty === "expert"){
    movImg.src = c.images?.movement_expert || c.images?.movement || "";
    atkImg.src = c.images?.attack_expert || c.images?.attack || "";
  } else {
    movImg.src = c.images?.movement || "";
    atkImg.src = c.images?.attack || "";
  }

  // Reset
  qs("#resetBtn").addEventListener("click", ()=>{
    const fresh = {
      hp: c.hp?.max ?? 0,
      toggles: Object.fromEntries((c.toggles||[]).map(tg => [tg.id, false]))
    };
    setState(c.id, fresh);
    location.reload();
  });

  // Back
  qs("#backBtn").addEventListener("click", ()=>{ location.href = "./index.html"; });

  initUnitTabs(id, chars, lang);
}

document.addEventListener("DOMContentLoaded", async ()=>{

  const SPLASH_KEY = STORAGE_PREFIX + "splashDismissed";
  const splashDismissed = localStorage.getItem(SPLASH_KEY) === "1";

  function showSplash(){
    const splash = document.getElementById("splash");
    if(splash){ splash.style.display = "block"; }
  }
  function hideSplash(){
    const splash = document.getElementById("splash");
    if(splash){ splash.remove(); }
    document.body.classList.remove("has-splash");
  }

  const playBtn = document.getElementById("playBtn");
  if(playBtn){
    playBtn.addEventListener("click", ()=>{
      playPressStart();
      localStorage.setItem(SPLASH_KEY, "1");
      document.body.classList.remove('has-splash');
      hideSplash();
      });
  }

  const backToSplash = document.getElementById("backToSplash");
  if(backToSplash){
    backToSplash.addEventListener("click", ()=>{
      localStorage.removeItem(SPLASH_KEY);
      location.reload();
    });
  }

  if(splashDismissed){
    document.body.classList.remove('has-splash');
    hideSplash();
  }

  try{
    if(document.body.classList.contains("page-index")) await initIndex();
    if(document.body.classList.contains("page-character")) await initCharacter();
  }catch(e){
    console.error(e);
    const err = qs("#error");
    if(err) err.textContent = "Erreur de chargement. Vérifie que le site est servi via un lien web (pas en ouvrant le fichier localement).";
  }
});

// SYSTÈME D'ONGLETS DES UNITÉS
function initUnitTabs(currentCharId, allChars, lang){
  const tabsContainer = qs("#unitTabs");
  const unitTabsWrapper = qs(".unit-tabs-container");
  
  if(!tabsContainer || !unitTabsWrapper) {
    console.warn('Containers de tabs non trouvés');
    return;
  }

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  
  if(!setupRaw || !draftRaw) return;
  
  const setup = JSON.parse(setupRaw);
  const draft = JSON.parse(draftRaw);
  
  let tabCharacters = [];
  
  if(setup.mode === "single"){
    if(Array.isArray(draft.activeIds) && draft.activeIds.length){
      tabCharacters = allChars.filter(c => 
        draft.activeIds.includes(c.id) && c.id !== currentCharId
      );
    }
  } else {
    const currentCamp = setup.camp || "mechkawaii";
    if(Array.isArray(draft.activeIds) && draft.activeIds.length){
      tabCharacters = allChars.filter(c => 
        draft.activeIds.includes(c.id) && 
        c.id !== currentCharId &&
        (c.camp || "mechkawaii") === currentCamp
      );
    }
  }

  if(tabCharacters.length === 0){
    unitTabsWrapper.classList.remove('visible');
    document.body.classList.remove('tabs-visible');
    return;
  }

  unitTabsWrapper.classList.add('visible');
  document.body.classList.add('tabs-visible');

  tabsContainer.innerHTML = '';
  tabCharacters.forEach(char => {
    const tab = createCharacterTab(char, lang);
    tabsContainer.appendChild(tab);
  });
}

function createCharacterTab(char, lang){
  const tab = document.createElement('div');
  tab.className = 'unit-tab';
  tab.dataset.charId = char.id;

  const saved = getState(char.id);
  const hp = saved?.hp ?? (char.hp?.max ?? 0);
  const maxHp = char.hp?.max ?? 0;

  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  const hpClass = hpPercentage <= 33 ? 'low' : '';

  // Charger l'image ou afficher placeholder avec initiale
  const charImage = char.images?.portrait || char.images?.character;
  const visualHtml = charImage 
    ? `<img src="${charImage}" alt="${t(char.name, lang)}" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));" />`
    : `<div style="width:70%;height:70%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px, 8vw, 36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">
        ${t(char.name, lang).charAt(0)}
      </div>`;

  tab.innerHTML = `
    <div class="unit-tab-visual">
      ${visualHtml}
      <div class="unit-tab-hp ${hpClass}">
        <span>❤️</span>
        <span>${hp}/${maxHp}</span>
      </div>
    </div>
    <div class="unit-tab-info">
      <div class="unit-tab-name">${t(char.name, lang)}</div>
      <div class="unit-tab-role">${t(char.class, lang)}</div>
    </div>
  `;

  tab.addEventListener('click', () => {
    location.href = `character.html?id=${encodeURIComponent(char.id)}`;
  });

  return tab;
}

function updateTabHP(charId, newHp){
  const tab = document.querySelector(`.unit-tab[data-char-id="${charId}"]`);
  if(!tab) return;

  const hpBadge = tab.querySelector('.unit-tab-hp');
  if(!hpBadge) return;

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  
  if(!setupRaw || !draftRaw) return;
  
  const setup = JSON.parse(setupRaw);
  const draft = JSON.parse(draftRaw);
  
  // Récupérer les chars depuis le storage ou relancer la requête
  // Pour simplifier, on peut chercher via les activeIds
  if(Array.isArray(draft.activeIds)){
    const charData = draft.activeIds;
    // On récupère juste le maxHP du state sauvegardé
    const allState = localStorage.getItem(STORAGE_PREFIX + "state:" + charId);
    if(allState){
      const charState = JSON.parse(allState);
      // Récalculer depuis les données sauvegardées
      const saved = getState(charId);
      const maxHp = saved?.maxHp ?? 0;
      
      const hpPercentage = maxHp > 0 ? (newHp / maxHp) * 100 : 100;
      hpBadge.className = 'unit-tab-hp' + (hpPercentage <= 33 ? ' low' : '');
      hpBadge.querySelector('span:last-child').textContent = `${newHp}/${maxHp}`;

      tab.style.animation = 'none';
      setTimeout(() => {
        tab.style.animation = 'heartShake 0.3s ease';
      }, 10);
    }
  }
}
