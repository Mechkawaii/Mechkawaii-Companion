const STORAGE_PREFIX = "mechkawaii:";

/* ------------------------------
   Helpers
------------------------------ */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

function getLang(){
  return localStorage.getItem(STORAGE_PREFIX + "lang") || "fr";
}
function setLang(lang){
  localStorage.setItem(STORAGE_PREFIX + "lang", lang);
}

/** Active button helper (UI selection) */
function setActiveButton(groupButtons, activeBtn, activeClass = "btn-accent") {
  groupButtons.forEach(b => b.classList.remove(activeClass));
  if (activeBtn) activeBtn.classList.add(activeClass);
}

/* ------------------------------
   KO / Mort Subite (Option A)
------------------------------ */
// ✅ Fichier KO
const KO_TOKEN_SRC = "./assets/jeton-mort-subite.svg";

function ensureKoOverlay(el){
  if(!el) return null;

  // le parent doit permettre un overlay au-dessus
  const cs = getComputedStyle(el);
  if(cs.position === "static") el.style.position = "relative";
  if(!el.style.overflow) el.style.overflow = "hidden";

  let ov = el.querySelector(".ko-overlay");
  if(!ov){
    ov = document.createElement("div");
    ov.className = "ko-overlay";

    // overlay au-dessus
    ov.style.position = "absolute";
    ov.style.inset = "0";
    ov.style.display = "flex";
    ov.style.alignItems = "center";
    ov.style.justifyContent = "center";
    ov.style.pointerEvents = "none";
    ov.style.zIndex = "50";

    // ✅ caché par défaut (IMPORTANT)
    ov.style.opacity = "0";
    ov.style.visibility = "hidden";
    ov.style.transform = "scale(0.95)";
    ov.style.transition = "opacity .18s ease, transform .18s ease, visibility .18s ease";

    const img = document.createElement("img");
    img.src = KO_TOKEN_SRC;
    img.alt = "KO";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.display = "block";

    ov.appendChild(img);
  }

  // ✅ toujours le remettre en dernier -> toujours au-dessus
  el.appendChild(ov);
  return ov;
}

function setKoStateForEl(el, isKo, pop = false){
  if(!el) return;

  const ov = ensureKoOverlay(el);
  const ko = !!isKo;

  el.classList.toggle("is-ko", ko);

  // ✅ show / hide overlay (le vrai fix)
  if(ov){
    ov.style.opacity = ko ? "1" : "0";
    ov.style.visibility = ko ? "visible" : "hidden";
    ov.style.transform = ko ? "scale(1)" : "scale(0.95)";
  }

  if(pop && ko){
    el.classList.remove("ko-pop");
    void el.offsetWidth; // relance anim
    el.classList.add("ko-pop");
    setTimeout(()=>el.classList.remove("ko-pop"), 420);
  } else if(!ko){
    el.classList.remove("ko-pop");
  }
}

/* ------------------------------
   I18N (UI statique)
------------------------------ */
const I18N = {
  fr: {
    splash_play: "JOUER",
    splash_site: "SITE",
    splash_instagram: "INSTAGRAM",

    index_subtitle: "Choisis ton mode et ton camp.",

    setup_title: "Configuration de la partie",
    setup_q_devices: "1) Combien d'appareil ?",
    setup_q_devices_desc: "Si un seul appareil sert à tout le monde, tu verras tous les persos. Sinon, chaque joueur choisit son camp.",
    setup_mode_single: "Un seul appareil pour la table",
    setup_mode_multi: "Chaque joueur à son appareil",

    setup_q_camp: "2) Choisis ton camp",
    camp_mech: "Mechkawaii",
    camp_prod: "Prodrome",

    setup_q_difficulty: "3) Choisis la difficulté",
    setup_difficulty_desc: "<strong>Mode Normal :</strong> Patterns de déplacement et d'attaque standard.<br><strong>Mode Expert :</strong> Patterns avancés pour plus de challenge.",
    diff_normal: "⭐ Normal",
    diff_expert: "💀 Expert",

    reset_all: "Tout réinitialiser",

    draft_title: "Sélection des unités",
    draft_subtitle: "Choisis les unités jouées",
    draft_desc: "Sélectionne uniquement les unités réellement jouées. Les autres ne s’afficheront pas.",
    draft_confirm: "Valider les {n} unités",
    draft_show_all: "Afficher tout (pour l’instant)",

    back_to_title: "Écran titre",
    change_mode: "Changer mode",
    change_units: "Changer unités",

    char_hp_card: "Points de Vie / Boucliers / Clés de Réparation",
    char_hp: "Points de Vie",
    char_shields: "Boucliers (Réserve partagée)",
    char_keys: "Clés de réparation",
    char_movement: "Modèle de déplacement",
    char_attack: "Modèle d'attaque",
    reset_char: "Réinitialiser",
    back_list: "← Retour à la liste",

    shield_remove: "Retirer le bouclier",
    shield_assign: "Assigner le bouclier",
    cancel: "Annuler",
  },
  en: {
    splash_play: "PLAY",
    splash_site: "WEBSITE",
    splash_instagram: "INSTAGRAM",

    index_subtitle: "Choose your mode and your camp.",

    setup_title: "Game setup",
    setup_q_devices: "1) How many devices?",
    setup_q_devices_desc: "If one device is used for the table, you’ll see every unit. Otherwise, each player picks a camp.",
    setup_mode_single: "One device for the table",
    setup_mode_multi: "Each player has a device",

    setup_q_camp: "2) Pick your camp",
    camp_mech: "Mechkawaii",
    camp_prod: "Prodrome",

    setup_q_difficulty: "3) Pick difficulty",
    setup_difficulty_desc: "<strong>Normal:</strong> Standard movement/attack patterns.<br><strong>Expert:</strong> Advanced patterns for more challenge.",
    diff_normal: "⭐ Normal",
    diff_expert: "💀 Expert",

    reset_all: "Reset everything",

    draft_title: "Unit selection",
    draft_subtitle: "Pick the units played",
    draft_desc: "Select only the units actually played. The others won’t be shown.",
    draft_confirm: "Confirm {n} units",
    draft_show_all: "Show all (for now)",

    back_to_title: "Title screen",
    change_mode: "Change mode",
    change_units: "Change units",

    char_hp_card: "HP / Shields / Repair Keys",
    char_hp: "Hit Points",
    char_shields: "Shields (shared pool)",
    char_keys: "Repair keys",
    char_movement: "Movement pattern",
    char_attack: "Attack pattern",
    reset_char: "Reset",
    back_list: "← Back to list",

    shield_remove: "Remove shield",
    shield_assign: "Assign shield",
    cancel: "Cancel",
  }
};

function tr(key, vars = null){
  const lang = getLang();
  let s = (I18N[lang] && I18N[lang][key]) || (I18N.fr[key]) || key;
  if(vars){
    Object.keys(vars).forEach(k => {
      s = s.replaceAll(`{${k}}`, String(vars[k]));
    });
  }
  return s;
}

function applyI18n(){
  const lang = getLang();
  qsa("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    const val = (I18N[lang] && I18N[lang][key]) || (I18N.fr[key]);
    if(!val) return;

    const isHtml = el.getAttribute("data-i18n-html") === "1";
    if(isHtml) el.innerHTML = val;
    else el.textContent = val;
  });
}

function bindTopbar(){
  const sel = qs("#lang");
  if(sel){
    sel.value = getLang();
    sel.disabled = true;
    sel.style.display = "none";
    const pill = sel.closest(".pill");
    if(pill) pill.style.display = "none";
  }
}

function initSplashLang(){
  const wrap = qs("#splashLang");
  if(!wrap) return;

  const current = getLang();
  wrap.querySelectorAll("[data-lang]").forEach(btn=>{
    const v = btn.getAttribute("data-lang");
    btn.classList.toggle("active", v === current);

    btn.addEventListener("click", ()=>{
      setLang(v);
      wrap.querySelectorAll("[data-lang]").forEach(b=>b.classList.toggle("active", b.getAttribute("data-lang") === v));
      applyI18n();
    });
  });
}

/* ------------------------------
   Storage / State
------------------------------ */
function heartIcon(filled){
  const src = filled ? "./assets/pv.svg" : "./assets/pv_off.svg";
  return `<img src="${src}" class="heart" alt="HP" />`;
}

function getState(charId){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "state:" + charId);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function setState(charId, state){
  localStorage.setItem(STORAGE_PREFIX + "state:" + charId, JSON.stringify(state));
}

function getSharedShields(){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "shields");
    return raw ? JSON.parse(raw) : [true,true,true];
  }catch(e){ return [true,true,true]; }
}
function setSharedShields(shields){
  localStorage.setItem(STORAGE_PREFIX + "shields", JSON.stringify(shields));
}

function getShieldAssignments(){
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "shield-assignments");
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
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
  return obj[lang] || obj.fr || "";
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function renderHP(container, hpCur, hpMax){
  if(!container) return;
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

/* ------------------------------
   Visual keys renderer
------------------------------ */
function renderToggleRow(root, toggle, isOn, lang, onChange, sharedShields = null){
  if(!root) return;

  if (toggle.type === 'visual_keys') {
    const keysContainer = document.createElement('div');
    keysContainer.className = 'toggle-visual-keys';

    const label = document.createElement('label');
    label.style.cssText = `flex: 1; font-weight: 600; font-size: 14px; min-width: 150px;`;
    label.textContent = t(toggle.label, lang);

    if (toggle.id === 'repair_keys' || toggle.id === 'shield') label.style.display = 'none';

    const keysDisplay = document.createElement('div');
    keysDisplay.className = 'keys-display';

    const maxKeys = toggle.maxKeys || 2;
    const isShield = toggle.id === 'shield';

    const currentState = isShield
      ? (Array.isArray(sharedShields) ? sharedShields : (Array.isArray(isOn) ? isOn : [true,true,true]))
      : (Array.isArray(isOn) ? isOn : [isOn, isOn]);

    for (let i = 0; i < maxKeys; i++) {
      const key = document.createElement('button');
      key.className = 'key-button';
      key.type = 'button';

      // ✅ FIX GLOW : les boucliers doivent avoir la classe .shield-button
      if(isShield) key.classList.add('shield-button');

      const keyState = currentState[i] !== undefined ? currentState[i] : true;
      key.dataset.keyIndex = i;
      key.dataset.toggleId = toggle.id;
      key.dataset.active = keyState ? 'true' : 'false';

      // ✅ utile si tu ajoutes un glow via .shield-button.is-on
      if(isShield) key.classList.toggle('is-on', !!keyState);

      key.style.backgroundImage = `url('./assets/icons/${isShield ? 'shield' : 'key'}_${keyState ? 'on' : 'off'}.svg')`;

      key.addEventListener('click', function(e) {
        e.preventDefault();

        this.dataset.active = (this.dataset.active === 'true') ? 'false' : 'true';
        const nowOn = (this.dataset.active === 'true');

        this.style.backgroundImage = `url('./assets/icons/${isShield ? 'shield' : 'key'}_${nowOn ? 'on' : 'off'}.svg')`;

        // ✅ FIX GLOW : sync classe .is-on
        if(isShield) this.classList.toggle('is-on', nowOn);

        const keysState = [];
        keysDisplay.querySelectorAll('.key-button').forEach(kb => keysState.push(kb.dataset.active === 'true'));
        onChange(keysState);
      });

      keysDisplay.appendChild(key);
    }

    keysContainer.appendChild(label);
    keysContainer.appendChild(keysDisplay);
    root.appendChild(keysContainer);
    return;
  }

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
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); }
  });

  row.appendChild(left);
  row.appendChild(sw);
  root.appendChild(row);
}

function urlParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

/* ------------------------------
   INDEX
------------------------------ */
async function initIndex(){
  const lang = getLang();
  bindTopbar();
  applyI18n();

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
  window.__cachedChars = chars;

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;

  function saveSetup(obj){
    localStorage.setItem(STORAGE_PREFIX + "setup", JSON.stringify(obj));
  }

  function clearSetup(){
    localStorage.removeItem(STORAGE_PREFIX + "setup");
    localStorage.removeItem(STORAGE_PREFIX + "draft");
    localStorage.removeItem(STORAGE_PREFIX + "shields");
    localStorage.removeItem(STORAGE_PREFIX + "shield-assignments");
    location.reload();
  }

  if(changeSetupBtn){
    changeSetupBtn.addEventListener("click", ()=>{
      localStorage.removeItem(STORAGE_PREFIX + "setup");
      localStorage.removeItem(STORAGE_PREFIX + "shields");
      localStorage.removeItem(STORAGE_PREFIX + "shield-assignments");
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

    const modeBtns = [qs("#modeSingle"), qs("#modeMulti")].filter(Boolean);
    const campBtns = [qs("#campMech"), qs("#campProd")].filter(Boolean);
    const diffBtns = [qs("#diffNormal"), qs("#diffExpert")].filter(Boolean);

    function showDifficultyPick(){
      const diffPick = qs("#difficultyPick");
      if(diffPick) diffPick.style.display = "block";
    }

    qs("#modeSingle")?.addEventListener("click", (e)=>{
      mode = "single";
      setActiveButton(modeBtns, e.currentTarget);

      if(campPick) campPick.style.display = "none";
      setActiveButton(campBtns, null);

      showDifficultyPick();
    });

    qs("#modeMulti")?.addEventListener("click", (e)=>{
      mode = "multi";
      setActiveButton(modeBtns, e.currentTarget);
      if(campPick) campPick.style.display = "block";
      setActiveButton(campBtns, null);
    });

    qs("#campMech")?.addEventListener("click", (e)=>{
      camp = "mechkawaii";
      setActiveButton(campBtns, e.currentTarget);
      showDifficultyPick();
    });

    qs("#campProd")?.addEventListener("click", (e)=>{
      camp = "prodrome";
      setActiveButton(campBtns, e.currentTarget);
      showDifficultyPick();
    });

    qs("#diffNormal")?.addEventListener("click", (e)=>{
      difficulty = "normal";
      setActiveButton(diffBtns, e.currentTarget);
      saveSetup({mode, camp, difficulty});
      location.reload();
    });

    qs("#diffExpert")?.addEventListener("click", (e)=>{
      difficulty = "expert";
      setActiveButton(diffBtns, e.currentTarget);
      saveSetup({mode, camp, difficulty});
      location.reload();
    });

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

  const confirmBtn = qs("#confirmDraft");
  if(confirmBtn){
    confirmBtn.textContent = tr("draft_confirm", { n: maxPick });
  }

  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  let draft = draftRaw ? JSON.parse(draftRaw) : null;

  function saveDraft(obj){
    localStorage.setItem(STORAGE_PREFIX + "draft", JSON.stringify(obj));
  }

  if(!draft){
    if(draftCard) draftCard.style.display = "block";
    if(setupCard) setupCard.style.display = "none";
    list.innerHTML = "";

    if(draftList) draftList.innerHTML = "";
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
            if(draftError) draftError.textContent = (lang === "fr")
              ? `Tu as déjà ${maxPick} unités sélectionnées.`
              : `You already selected ${maxPick} units.`;
            return;
          }
          selected.add(c.id);
        }
        if(draftError) draftError.textContent = "";
        refresh();
      }

      sw.addEventListener("click", flip);
      sw.addEventListener("keydown",(e)=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); flip(); }
      });

      row.appendChild(left);
      row.appendChild(sw);
      if(draftList) draftList.appendChild(row);
      refresh();
    });

    qs("#confirmDraft")?.addEventListener("click", ()=>{
      if(selected.size !== maxPick){
        if(draftError) draftError.textContent = (lang === "fr")
          ? `Sélectionne exactement ${maxPick} unités.`
          : `Select exactly ${maxPick} units.`;
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
}

/* ------------------------------
   CHARACTER
------------------------------ */
async function initCharacter(){
  const lang = getLang();
  bindTopbar();
  applyI18n();

  const id = urlParam("id");
  if(!id){
    const err = qs("#error");
    if(err) err.textContent = "Missing character id.";
    return;
  }

  const chars = await loadCharacters();
  window.__cachedChars = chars;

  const c = chars.find(x=>x.id === id);
  if(!c){
    const err = qs("#error");
    if(err) err.textContent = "Character not found.";
    return;
  }

  const saved = getState(c.id);

  const defaultToggles = {};
  (c.toggles || []).forEach(tg => {
    if (tg.type === 'visual_keys') {
      const maxKeys = tg.maxKeys || 2;
      defaultToggles[tg.id] = Array.from({length: maxKeys}, ()=>true);
    } else {
      defaultToggles[tg.id] = false;
    }
  });

  const state = saved || { hp: c.hp?.max ?? 0, toggles: {} };
  if (state.hp == null) state.hp = c.hp?.max ?? 0;
  if (!state.toggles) state.toggles = {};
  Object.keys(defaultToggles).forEach((k) => {
    if (state.toggles[k] === undefined) state.toggles[k] = defaultToggles[k];
  });
  setState(c.id, state);

  const charName = qs("#charName");
  const charClass = qs("#charClass");
  const hpMaxLabel = qs("#hpMaxLabel");

  if(charName) charName.textContent = t(c.name, lang);
  if(charClass) charClass.textContent = t(c.class, lang);
  if(hpMaxLabel) hpMaxLabel.textContent = `/${c.hp?.max ?? 0}`;

  const charPortrait = qs("#charPortrait");
  if (charPortrait) {
    charPortrait.innerHTML = '';
    const charImage = c.images?.portrait || c.images?.character;

    if (charImage) {
      const img = document.createElement('img');
      img.src = charImage;
      img.alt = t(c.name, lang);
      img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
      img.onerror = function(){
        charPortrait.innerHTML = `<div style="font-size:36px;font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(c.name, lang).charAt(0)}</div>`;
        // ✅ remet l’overlay KO au-dessus si besoin
        setKoStateForEl(charPortrait, state.hp <= 0, false);
      };
      charPortrait.appendChild(img);
    } else {
      charPortrait.innerHTML = `<div style="font-size:36px;font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(c.name, lang).charAt(0)}</div>`;
    }
  }

  const hpCurEl = qs("#hpCur");
  const hpHeartsEl = qs("#hpHearts");

  function refreshHP(){
    if(hpCurEl) hpCurEl.textContent = String(state.hp);
    renderHP(hpHeartsEl, state.hp, c.hp?.max ?? 0);

    const isKo = state.hp <= 0;

    // ✅ overlay + KO sur le portrait (au-dessus)
    setKoStateForEl(charPortrait, isKo, false);

    // ✅ contour rouge sur toute la fiche (CSS via body.is-ko)
    document.body.classList.toggle("is-ko", isKo);

    // ✅ tabs bas
    updateTabKO(c.id, isKo);
  }

  qs("#hpMinus")?.addEventListener("click", ()=>{
    const wasKo = state.hp <= 0;

    state.hp = clamp(state.hp - 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);

    const isKoNow = state.hp <= 0;
    if(!wasKo && isKoNow){
      // KO = pop
      setKoStateForEl(qs("#charPortrait"), true, true);
    }

    refreshHP();
    updateTabHP(c.id, state.hp);
  });

  qs("#hpPlus")?.addEventListener("click", ()=>{
    state.hp = clamp(state.hp + 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);

    // ✅ si on repasse à 1 PV, retour normal direct
    refreshHP();
    updateTabHP(c.id, state.hp);
  });

  refreshHP();

  const classActionTitle = qs("#classActionTitle");
  const classActionBody = qs("#classActionBody");
  const ultTitle = qs("#ultTitle");
  const ultBody = qs("#ultBody");
  const movementDesc = qs("#movementDesc");
  const attackDesc = qs("#attackDesc");

  if(classActionTitle) classActionTitle.textContent = t(c.texts?.class_action_title, lang);
  if(classActionBody) classActionBody.textContent = t(c.texts?.class_action_body, lang);
  if(ultTitle) ultTitle.textContent = t(c.texts?.ultimate_title, lang);
  if(ultBody) ultBody.textContent = t(c.texts?.ultimate_body, lang);

  if(movementDesc) movementDesc.textContent = t(c.texts?.movement_desc, lang) || "";
  if(attackDesc) attackDesc.textContent = t(c.texts?.attack_desc, lang) || "";

  // Shields
  const shieldsDisplay = qs('#shieldsDisplay');
  if (shieldsDisplay) {
    shieldsDisplay.innerHTML = '';

    const shieldToggle = (c.toggles || []).find(tg => tg.id === 'shield');
    if (shieldToggle) {
      const freshShields = getSharedShields();
      const freshAssignments = getShieldAssignments();

      // ✅ SHIELD FX (glow bleu) : applique la classe quand CE perso a un bouclier assigné
      // (CSS cible .card.has-shield et on le met sur #hpCard ; on le met aussi sur le portrait si tu veux un petit effet)
      const hasShieldForThisChar = freshAssignments[c.id] !== undefined;
      qs('#hpCard')?.classList.toggle('has-shield', hasShieldForThisChar);
      qs('#charPortrait')?.classList.toggle('has-shield', hasShieldForThisChar);

      renderToggleRow(shieldsDisplay, shieldToggle, freshShields, lang, (v) => setSharedShields(v), freshShields);

      const keyButtons = shieldsDisplay.querySelectorAll('.key-button');
      keyButtons.forEach((btn, i) => {
        // ✅ s’assure que le style “shield-button” est bien appliqué
        btn.classList.add('shield-button');

        if (!freshShields[i]) {
          btn.style.display = 'none';
          return;
        }

        // ces boutons deviennent des “tokens” à assigner (pas du on/off)
        btn.dataset.active = 'true';
        btn.classList.add('is-on');
        btn.style.backgroundImage = `url('./assets/icons/shield_on.svg')`;

        btn.onclick = (e) => {
          e.preventDefault();
          showShieldAssignmentModal(i, c.id, lang, chars);
        };
      });

      if (freshAssignments[c.id] !== undefined) {
        const removeShield = document.createElement('button');
        removeShield.className = 'shield-remove-btn';
        removeShield.textContent = tr("shield_remove");

        removeShield.addEventListener('click', (e) => {
          e.preventDefault();
          const currentAssignments = getShieldAssignments();
          delete currentAssignments[c.id];
          setShieldAssignments(currentAssignments);
          location.reload();
        });

        shieldsDisplay.appendChild(removeShield);
      }
    }
  }

  // Repair keys
  const repairKeysDisplay = qs('#repairKeysDisplay');
  if (repairKeysDisplay) {
    repairKeysDisplay.innerHTML = '';
    const repairToggle = (c.toggles || []).find(tg => tg.id === 'repair_keys');
    if (repairToggle) {
      const keysState = state.toggles[repairToggle.id] || [true, true];
      renderToggleRow(repairKeysDisplay, repairToggle, keysState, lang, (v) => {
        state.toggles[repairToggle.id] = v;
        setState(c.id, state);
      });
    }
  }

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const difficulty = setup?.difficulty || "normal";

  const movImg = qs("#movementImg");
  const atkImg = qs("#attackImg");

  if(movImg && atkImg){
    if(difficulty === "expert"){
      movImg.src = c.images?.movement_expert || c.images?.movement || "";
      atkImg.src = c.images?.attack_expert || c.images?.attack || "";
    } else {
      movImg.src = c.images?.movement || "";
      atkImg.src = c.images?.attack || "";
    }
  }

  qs("#resetBtn")?.addEventListener("click", ()=>{
    const fresh = { hp: c.hp?.max ?? 0, toggles: {...defaultToggles} };
    setState(c.id, fresh);
    setSharedShields([true, true, true]);
    setShieldAssignments({});
    location.reload();
  });

  qs("#backBtn")?.addEventListener("click", ()=>{ location.href = "./index.html"; });

  initUnitTabs(id, chars, lang);
}

/* ------------------------------
   MODAL SHIELD
------------------------------ */
function showShieldAssignmentModal(shieldIndex, currentCharId, lang, allChars){
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;`;

  const content = document.createElement('div');
  content.style.cssText = `background:white;border-radius:8px;padding:20px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto;color:black;`;

  const title = document.createElement('h2');
  title.textContent = tr("shield_assign");
  title.style.marginTop = '0';
  content.appendChild(title);

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

  const teamChars = allChars.filter(c => {
    if (setup?.mode === 'single') return draft?.activeIds?.includes(c.id);
    const currentChar = allChars.find(ch => ch.id === currentCharId);
    return draft?.activeIds?.includes(c.id) && (c.camp || "mechkawaii") === (currentChar?.camp || "mechkawaii");
  });

  teamChars.forEach(char => {
    const btn = document.createElement('button');
    btn.textContent = t(char.name, lang);
    btn.style.cssText = `width:100%;padding:10px;margin:8px 0;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white;color:black;transition:all .2s ease;`;

    btn.addEventListener('mouseover', ()=>{ btn.style.borderColor='#3b82f6'; btn.style.background='#eff6ff'; });
    btn.addEventListener('mouseout', ()=>{ btn.style.borderColor='#ddd'; btn.style.background='white'; });

    btn.addEventListener('click', ()=>{
      const currentAssignments = getShieldAssignments();
      const currentShields = getSharedShields();

      currentAssignments[char.id] = shieldIndex;
      currentShields[shieldIndex] = false;

      setShieldAssignments(currentAssignments);
      setSharedShields(currentShields);

      document.body.removeChild(modal);
      setTimeout(()=>location.reload(), 150);
    });

    content.appendChild(btn);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = tr("cancel");
  closeBtn.style.cssText = `width:100%;padding:10px;margin-top:16px;border:2px solid #999;border-radius:6px;cursor:pointer;background:#f5f5f5;color:black;`;
  closeBtn.addEventListener('click', ()=>document.body.removeChild(modal));
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

/* ------------------------------
   BOOT
------------------------------ */
document.addEventListener("DOMContentLoaded", async ()=>{
  bindTopbar();
  initSplashLang();
  applyI18n();

  const SPLASH_KEY = STORAGE_PREFIX + "splashDismissed";
  const splashDismissed = localStorage.getItem(SPLASH_KEY) === "1";

  function hideSplash(){
    const splash = document.getElementById("splash");
    if(splash){ splash.remove(); }
    document.body.classList.remove("has-splash");
  }

  const playBtn = document.getElementById("playBtn");
  if(playBtn){
    playBtn.addEventListener("click", ()=>{
      localStorage.setItem(SPLASH_KEY, "1");
      document.body.classList.remove('has-splash');
      hideSplash();
    });
  }

  const backToSplash = document.getElementById("backToSplash");
  if(backToSplash){
    backToSplash.addEventListener("click", async ()=>{
      localStorage.removeItem(STORAGE_PREFIX + "setup");
      localStorage.removeItem(STORAGE_PREFIX + "draft");
      localStorage.removeItem(STORAGE_PREFIX + "shields");
      localStorage.removeItem(STORAGE_PREFIX + "shield-assignments");

      const chars = await loadCharacters();
      window.__cachedChars = chars;
      chars.forEach(c => localStorage.removeItem(STORAGE_PREFIX + "state:" + c.id));

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
    if(err) err.textContent = (getLang()==="fr")
      ? "Erreur de chargement. Vérifie que le site est servi via un lien web."
      : "Loading error. Make sure the site is served from a web URL.";
  }
});

/* ------------------------------
   TABS
------------------------------ */
function initUnitTabs(currentCharId, allChars, lang){
  const tabsContainer = qs("#unitTabs");
  const unitTabsWrapper = qs(".unit-tabs-container");
  if(!tabsContainer || !unitTabsWrapper) return;

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  if(!setupRaw || !draftRaw) return;

  const setup = JSON.parse(setupRaw);
  const draft = JSON.parse(draftRaw);

  let tabCharacters = [];
  if(setup.mode === "single"){
    if(Array.isArray(draft.activeIds) && draft.activeIds.length){
      tabCharacters = allChars.filter(c => draft.activeIds.includes(c.id) && c.id !== currentCharId);
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
  tabCharacters.forEach(char => tabsContainer.appendChild(createCharacterTab(char, lang)));

  // ✅ après insertion : on peut marquer l’onglet “actif” si tu veux
  const activeTab = tabsContainer.querySelector(`.unit-tab[data-char-id="${currentCharId}"]`);
  if(activeTab) activeTab.classList.add("active");
}

function createCharacterTab(char, lang){
  const tab = document.createElement('div');
  tab.className = 'unit-tab';
  tab.dataset.charId = char.id; // => data-char-id

  const saved = getState(char.id);
  const hp = saved?.hp ?? (char.hp?.max ?? 0);
  const maxHp = char.hp?.max ?? 0;

  const isKo = hp <= 0;

  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  const hpClass = hpPercentage <= 33 ? 'low' : '';

  const assignments = getShieldAssignments();
  const hasShield = assignments[char.id] !== undefined;

  const visualEl = document.createElement('div');
  visualEl.className = 'unit-tab-visual';
  if (hasShield) visualEl.classList.add('has-shield');

  const charImage = char.images?.portrait || char.images?.character;
  if(charImage){
    const img = document.createElement('img');
    img.src = charImage;
    img.alt = t(char.name, lang);
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));';
    img.onerror = function(){
      visualEl.innerHTML = `<div style="width:70%;height:70%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px,8vw,36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
      // ✅ remet KO overlay au-dessus
      setKoStateForEl(visualEl, isKo, false);
    };
    visualEl.appendChild(img);
  }else{
    visualEl.innerHTML = `<div style="width:70%;height:70%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px,8vw,36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
  }

  const hpBadge = document.createElement('div');
  hpBadge.className = `unit-tab-hp ${hpClass}`;
  hpBadge.innerHTML = `<span>❤️</span><span>${hp}/${maxHp}</span>`;
  visualEl.appendChild(hpBadge);

  // ✅ KO overlay APRES avoir tout ajouté => overlay en dernier => AU-DESSUS
  setKoStateForEl(visualEl, isKo, false);

  const infoEl = document.createElement('div');
  infoEl.className = 'unit-tab-info';
  infoEl.innerHTML = `
    <div class="unit-tab-name">${t(char.name, lang)}</div>
    <div class="unit-tab-role">${t(char.class, lang)}</div>
  `;

  tab.appendChild(visualEl);
  tab.appendChild(infoEl);

  if (hasShield) tab.classList.add('has-shield');

  // ✅ KO sur l’onglet entier (contour rouge / glow rouge via CSS .unit-tab.is-ko)
  tab.classList.toggle("is-ko", isKo);
if (hasShield) tab.classList.add('has-shield');

  tab.addEventListener('click', () => {
    location.href = `character.html?id=${encodeURIComponent(char.id)}`;
  });

  return tab;
}

function updateTabKO(charId, isKo){
  const tab = document.querySelector(`.unit-tab[data-char-id="${charId}"]`);
  if(!tab) return;

  const visual = tab.querySelector(".unit-tab-visual");
  setKoStateForEl(visual, isKo, false);
  tab.classList.toggle("is-ko", !!isKo);
}

function updateTabHP(charId, newHp){
  const tab = document.querySelector(`.unit-tab[data-char-id="${charId}"]`);
  if(!tab) return;

  const hpBadge = tab.querySelector('.unit-tab-hp');
  if(!hpBadge) return;

  const allChars = window.__cachedChars;
  if(allChars){
    const char = allChars.find(c => c.id === charId);
    const maxHp = char?.hp?.max ?? 0;

    const hpPercentage = maxHp > 0 ? (newHp / maxHp) * 100 : 100;
    hpBadge.className = 'unit-tab-hp' + (hpPercentage <= 33 ? ' low' : '');
    hpBadge.querySelector('span:last-child').textContent = `${newHp}/${maxHp}`;

    tab.style.animation = 'none';
    setTimeout(() => { tab.style.animation = 'heartShake 0.3s ease'; }, 10);
  }

  // ✅ KO sync (tabs + overlay)
  updateTabKO(charId, newHp <= 0);
}
