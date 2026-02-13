
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
  const src = filled ? "./assets/pv.svg" : "./assets/pv_off.svg";
  return `<img src="${src}" class="heart" alt="PV" />`;
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

function getSharedShields(){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "shields");
    if(!raw) return [true, true, true];
    return JSON.parse(raw);
  }catch(e){
    return [true, true, true];
  }
}

function setSharedShields(shields){
  localStorage.setItem(STORAGE_PREFIX + "shields", JSON.stringify(shields));
}

function getShieldAssignments(){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "shield-assignments");
    if(!raw) return {};
    return JSON.parse(raw);
  }catch(e){
    return {};
  }
}

function setShieldAssignments(assignments){
  localStorage.setItem(STORAGE_PREFIX + "shield-assignments", JSON.stringify(assignments));
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

function renderToggleRow(root, toggle, isOn, lang, onChange, sharedShields = null){
  if (toggle.type === 'visual_keys') {
    const keysContainer = document.createElement('div');
    keysContainer.className = 'toggle-visual-keys';
    keysContainer.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px;
      background: rgba(0,0,0,0.05);
      border-radius: 8px;
      margin-bottom: 8px;
    `;

    const label = document.createElement('label');
    label.style.cssText = `
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      min-width: 150px;
    `;
    label.textContent = t(toggle.label, lang);

    const keysDisplay = document.createElement('div');
    keysDisplay.className = 'keys-display';
    keysDisplay.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const maxKeys = toggle.maxKeys || 2;
    const isShield = toggle.id === 'shield';
    
    const currentState = isShield ? sharedShields : (Array.isArray(isOn) ? isOn : [isOn, isOn]);

    for (let i = 0; i < maxKeys; i++) {
      const key = document.createElement('button');
      key.className = 'key-button';
      key.type = 'button';
      const keyState = currentState[i] !== undefined ? currentState[i] : true;
      key.style.cssText = `
        width: 40px;
        height: 40px;
        border: 2px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
        background-image: url('./assets/icons/${isShield ? 'shield' : 'key'}_${keyState ? 'on' : 'off'}.svg');
        background-size: 70%;
        background-position: center;
        background-repeat: no-repeat;
      `;
      
      key.dataset.keyIndex = i;
      key.dataset.toggleId = toggle.id;
      key.dataset.active = keyState ? 'true' : 'false';

      key.addEventListener('click', function(e) {
        e.preventDefault();
        this.dataset.active = this.dataset.active === 'true' ? 'false' : 'true';
        this.style.backgroundImage = `url('./assets/icons/${isShield ? 'shield' : 'key'}_${this.dataset.active === 'true' ? 'on' : 'off'}.svg')`;
        
        const keysState = [];
        keysDisplay.querySelectorAll('.key-button').forEach(kb => {
          keysState.push(kb.dataset.active === 'true');
        });
        onChange(keysState);
      });

      keysDisplay.appendChild(key);
    }

    keysContainer.appendChild(label);
    keysContainer.appendChild(keysDisplay);
    root.appendChild(keysContainer);

  } else {
    const row = document.createElement('div');
    row.className = 'toggle';
    const left = document.createElement('div');
    left.className = 'lbl';
    const title = document.createElement('div');
    title.className = 't';
    title.textContent = t(toggle.label, lang);
    const desc = document.createElement('div');
    desc.className = 'd';
    desc.textContent = toggle.hint ? t(toggle.hint, lang) : '';
    left.appendChild(title);
    left.appendChild(desc);

    const sw = document.createElement('div');
    sw.className = 'switch' + (isOn ? ' on' : '');
    sw.setAttribute('role', 'switch');
    sw.setAttribute('tabindex', '0');
    sw.setAttribute('aria-checked', isOn ? 'true' : 'false');

    function flip(){
      isOn = !isOn;
      sw.className = 'switch' + (isOn ? ' on' : '');
      sw.setAttribute('aria-checked', isOn ? 'true' : 'false');
      onChange(isOn);
    }

    sw.addEventListener('click', flip);
    sw.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        flip();
      }
    });

    row.appendChild(left);
    row.appendChild(sw);
    root.appendChild(row);
  }
}

function renderInlineToggle(container, toggle, isOn, lang, onChange){
  const label = document.createElement('label');
  label.textContent = t(toggle.label, lang);

  const sw = document.createElement('div');
  sw.className = 'switch' + (isOn ? ' on' : '');
  sw.setAttribute('role', 'switch');
  sw.setAttribute('tabindex', '0');
  sw.setAttribute('aria-checked', isOn ? 'true' : 'false');

  function flip(){
    isOn = !isOn;
    sw.className = 'switch' + (isOn ? ' on' : '');
    sw.setAttribute('aria-checked', isOn ? 'true' : 'false');
    onChange(isOn);
  }

  sw.addEventListener('click', flip);
  sw.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      flip();
    }
  });

  container.appendChild(label);
  container.appendChild(sw);
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

  const chars = await loadCharacters();
  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;

  if(!setup){
    list.innerHTML = "";
    return;
  }

  let available = chars;
  if(setup.mode === "multi"){
    available = chars.filter(c => (c.camp || "mechkawaii") === (setup.camp || "mechkawaii"));
  }

  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  let draft = draftRaw ? JSON.parse(draftRaw) : null;

  let toShow = available;
  if(draft && Array.isArray(draft.activeIds) && draft.activeIds.length){
    toShow = available.filter(c => draft.activeIds.includes(c.id));
  }

  list.innerHTML = "";
  toShow.forEach(c=>{
    const a = document.createElement("a");
    a.className = "char";
    a.href = `character.html?id=${encodeURIComponent(c.id)}`;
    
    // Get class name - handle both string and object
    const className = typeof c.class === 'string' ? c.class : (c.class.fr || c.class.en || c.id);
    const classImage = `./assets/characters/classe_${className}.png`;
    
    a.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <img src="${classImage}" alt="${t(c.class, lang)}" style="width: 24px; height: 24px; object-fit: contain;" onerror="this.style.display='none'">
        <div class="n">${t(c.name, lang)}</div>
      </div>
      <div class="m">
        <span class="badge">${t(c.class, lang)}</span>
        <span class="badge">HP ${c.hp?.max ?? "?"}</span>
      </div>
    `;
    list.appendChild(a);
  });
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
  
  const defaultToggles = {};
  (c.toggles || []).forEach(tg => {
    if (tg.type === 'visual_keys') {
      defaultToggles[tg.id] = [true, true];
    } else {
      defaultToggles[tg.id] = false;
    }
  });
  
  const state = saved || {
    hp: c.hp?.max ?? 0,
    toggles: defaultToggles
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

  qs("#classActionTitle").textContent = t(c.texts?.class_action_title, lang);
  qs("#classActionBody").textContent = t(c.texts?.class_action_body, lang);
  qs("#ultTitle").textContent = t(c.texts?.ultimate_title, lang);
  qs("#ultBody").textContent = t(c.texts?.ultimate_body, lang);

  qs("#movementDesc").textContent = t(c.texts?.movement_desc, lang) || "";
  qs("#attackDesc").textContent = t(c.texts?.attack_desc, lang) || "";

  const movImg = qs("#movementImg");
  const atkImg = qs("#attackImg");
  
  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const difficulty = setup?.difficulty || "normal";
  
  movImg.src = `./assets/patterns/${c.id}_movement_${difficulty}.png`;
  atkImg.src = `./assets/patterns/${c.id}_attack_${difficulty}.png`;

  const togglesRoot = qs('#toggles');
  const ultToggleContainer = qs('#ultToggleContainer');
  togglesRoot.innerHTML = '';
  
  (c.toggles || []).forEach(tg=>{
    if (tg.id === 'shield') return;
    
    if (tg.id === 'Coup unique' || tg.id === 'coup-unique') {
      if (ultToggleContainer) {
        const isOn = !!state.toggles[tg.id];
        renderInlineToggle(ultToggleContainer, tg, isOn, lang, (v)=>{
          state.toggles[tg.id] = v;
          setState(c.id, state);
        });
      }
    } else if (tg.type === 'visual_keys') {
      const keysState = state.toggles[tg.id];
      const sharedShields = getSharedShields();
      renderToggleRow(togglesRoot, tg, keysState, lang, (v)=>{
        state.toggles[tg.id] = v;
        setState(c.id, state);
      }, sharedShields);
    } else {
      const isOn = !!state.toggles[tg.id];
      renderToggleRow(togglesRoot, tg, isOn, lang, (v)=>{
        state.toggles[tg.id] = v;
        setState(c.id, state);
      });
    }
  });

  qs("#resetBtn").addEventListener("click", ()=>{
    const fresh = {
      hp: c.hp?.max ?? 0,
      toggles: {...defaultToggles}
    };
    setState(c.id, fresh);
    setSharedShields([true, true, true]);
    setShieldAssignments({});
    location.reload();
  });

  qs("#backBtn").addEventListener("click", ()=>{ location.href = "./index.html"; });

  initUnitTabs(id, chars, lang);
}

function initUnitTabs(currentCharId, allChars, lang){
  const tabsContainer = qs("#unitTabs");
  const unitTabsWrapper = qs(".unit-tabs-container");
  
  if(!tabsContainer || !unitTabsWrapper) {
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

  const assignments = getShieldAssignments();
  const hasShield = assignments[char.id] !== undefined ? true : false;

  const visualEl = document.createElement('div');
  visualEl.className = 'unit-tab-visual';
  if (hasShield) {
    visualEl.classList.add('has-shield');
  }
  
  const charImage = char.images?.portrait || char.images?.character;
  
  if(charImage){
    const img = document.createElement('img');
    img.src = charImage;
    img.alt = t(char.name, lang);
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));';
    
    img.onerror = function(){
      visualEl.innerHTML = `<div style="width:70%;height:70%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px, 8vw, 36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
    };
    visualEl.appendChild(img);
  } else {
    visualEl.innerHTML = `<div style="width:70%;height:70%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px, 8vw, 36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
  }

  const hpBadge = document.createElement('div');
  hpBadge.className = `unit-tab-hp ${hpClass}`;
  hpBadge.innerHTML = `<span>❤️</span><span>${hp}/${maxHp}</span>`;
  visualEl.appendChild(hpBadge);

  const infoEl = document.createElement('div');
  infoEl.className = 'unit-tab-info';
  infoEl.innerHTML = `
    <div class="unit-tab-name">${t(char.name, lang)}</div>
    <div class="unit-tab-role">${t(char.class, lang)}</div>
  `;

  tab.appendChild(visualEl);
  tab.appendChild(infoEl);

  if (hasShield) {
    tab.classList.add('has-shield');
  }

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

  loadCharacters().then(allChars => {
    const char = allChars.find(c => c.id === charId);
    const maxHp = char?.hp?.max ?? 0;
    
    const hpPercentage = maxHp > 0 ? (newHp / maxHp) * 100 : 100;
    hpBadge.className = 'unit-tab-hp' + (hpPercentage <= 33 ? ' low' : '');
    hpBadge.querySelector('span:last-child').textContent = `${newHp}/${maxHp}`;

    tab.style.animation = 'none';
    setTimeout(() => {
      tab.style.animation = 'heartShake 0.3s ease';
    }, 10);
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    if(document.body.classList.contains("page-index")) await initIndex();
    if(document.body.classList.contains("page-character")) await initCharacter();
  }catch(e){
    console.error(e);
    const err = qs("#error");
    if(err) err.textContent = "Erreur de chargement.";
  }
});
