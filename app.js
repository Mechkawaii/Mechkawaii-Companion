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
    diff_expert: "⭐⭐ Expert",

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
    char_movement: "Déplacement",
    char_attack: "Attaque",
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
    diff_expert: "⭐⭐ Expert",

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
    char_hp: "Health Points",
    char_shields: "Shields (shared pool)",
    char_keys: "Repair keys",
    char_movement: "Movement",
    char_attack: "Attack",
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
function getBlueShieldByTech(){
  // { [technicianId]: targetCharId }
  try{
    const raw = localStorage.getItem(STORAGE_PREFIX + "blue-shield-by-tech");
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function setBlueShieldByTech(map){
  localStorage.setItem(STORAGE_PREFIX + "blue-shield-by-tech", JSON.stringify(map));
}

// Pour le rendu (glow, tabs, etc) on aime aussi une vue "par cible"
function getBlueShieldAssignments(){
  // { [targetCharId]: technicianId }
  const byTech = getBlueShieldByTech();
  const byTarget = {};
  Object.keys(byTech).forEach(techId=>{
    const targetId = byTech[techId];
    if(targetId) byTarget[targetId] = techId;
  });
  return byTarget;
}
function removeBlueShieldForTarget(targetCharId){
  const byTech = getBlueShieldByTech();
  let changed = false;
  Object.keys(byTech).forEach(techId=>{
    if(byTech[techId] === targetCharId){
      delete byTech[techId];
      changed = true;
    }
  });
  if(changed) setBlueShieldByTech(byTech);
}

function isTechnicianChar(c){
  const fr = (c.class?.fr || "").toLowerCase().trim();
  const en = (c.class?.en || "").toLowerCase().trim();
  // IMPORTANT: use word-boundary matching so "Pyrotechnicien/Pyrotechnician" does NOT match.
  return (/\btechnicien\b/.test(fr)) || (/\btechnician\b/.test(en));
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
      localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");
    localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");
    location.reload();
  }

  if(changeSetupBtn){
    changeSetupBtn.addEventListener("click", ()=>{
      localStorage.removeItem(STORAGE_PREFIX + "setup");
      localStorage.removeItem(STORAGE_PREFIX + "shields");
      localStorage.removeItem(STORAGE_PREFIX + "shield-assignments");
      localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");
    localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");
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



// Camp sur le body (pour styliser le header du perso)
document.body.classList.remove("camp-mechkawaii","camp-prodrome");
const pageCamp = (c.camp || "mechkawaii").toLowerCase();
document.body.classList.add(pageCamp === "prodrome" ? "camp-prodrome" : "camp-mechkawaii");

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
   
   // --- Coup Unique : toggle "ultimate_used" dans la section Coup Unique ---
const ultToggleContainer = qs("#ultToggleContainer");
if (ultToggleContainer) {
  ultToggleContainer.innerHTML = "";

  const ultToggle = (c.toggles || []).find(tg => tg.id === "ultimate_used");

  if (ultToggle) {
    const isOn = !!state.toggles[ultToggle.id];

    renderToggleRow(ultToggleContainer, ultToggle, isOn, lang, (v) => {
      state.toggles[ultToggle.id] = v;
      setState(c.id, state);
    });
  }
}

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
   // --- TECHNICIEN : bouton bouclier bleu illimité dans "Action de classe"
// --- TECHNICIEN : bouton bouclier bleu illimité dans "Action de classe"
if (isTechnicianChar(c)) {
  const classCardBody = qs("#classActionBody")?.closest(".card")?.querySelector(".card-b");
  if (classCardBody) {
    // évite doublons si reload
    let techWrap = qs("#techShieldWrap");
    if (!techWrap) {
      techWrap = document.createElement("div");
      techWrap.id = "techShieldWrap";
      techWrap.style.cssText = "margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;";
      classCardBody.appendChild(techWrap);
    } else {
      techWrap.innerHTML = "";
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.cssText = "display:inline-flex; align-items:center; gap:10px;";
    btn.innerHTML = `
      <img src="./assets/icons/shield_blue_on.svg" alt="Bouclier" style="width:26px;height:26px;display:block;" />      
    `;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showBlueShieldAssignmentModal(c.id, lang, chars);
    });

    techWrap.appendChild(btn);
  }
}

  if(ultTitle) ultTitle.textContent = t(c.texts?.ultimate_title, lang);
  if(ultBody) ultBody.textContent = t(c.texts?.ultimate_body, lang);
  
  // Shields
const shieldsDisplay = qs('#shieldsDisplay');
if (shieldsDisplay) {
  shieldsDisplay.innerHTML = '';

  const shieldToggle = (c.toggles || []).find(tg => tg.id === 'shield');
  if (shieldToggle) {
    const freshShields = getSharedShields();
    const freshAssignments = getShieldAssignments();
    const blueAssignments = getBlueShieldAssignments();

    // ✅ Glow bouclier sur la carte HP: si ce perso a un bouclier (orange OU bleu)
    const hpCard = qs("#hpCard");
    if (hpCard) {
      const hasAssignedShield =
        (freshAssignments[c.id] !== undefined) || (blueAssignments[c.id] !== undefined);
      hpCard.classList.toggle("has-shield", hasAssignedShield);
    }

    renderToggleRow(
      shieldsDisplay,
      shieldToggle,
      freshShields,
      lang,
      (v) => setSharedShields(v),
      freshShields
    );

    const keyButtons = shieldsDisplay.querySelectorAll('.key-button');
    keyButtons.forEach((btn, i) => {
      btn.classList.add('shield-button');

      if (!freshShields[i]) {
        btn.style.display = 'none';
        return;
      }

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
        const assignedIndex = currentAssignments[c.id];

        // libère le bouclier dans la réserve partagée
        if (assignedIndex !== undefined) {
          delete currentAssignments[c.id];
          const currentShields = getSharedShields();
          if (currentShields[assignedIndex] === false) currentShields[assignedIndex] = true;
          setSharedShields(currentShields);
        }

        setShieldAssignments(currentAssignments);
        location.reload();
      });

      shieldsDisplay.appendChild(removeShield);
    }

    // Bouclier bleu (Technicien) : retrait (illimité)
    if (blueAssignments && blueAssignments[c.id]) {
      const removeBlue = document.createElement('button');
      removeBlue.className = 'shield-remove-btn';
      removeBlue.textContent = (lang === 'fr') ? 'Retirer le bouclier (Technicien)' : 'Remove Shield (Technician)';

      removeBlue.addEventListener('click', (e) => {
        e.preventDefault();
        removeBlueShieldForTarget(c.id);
        location.reload();
      });

      shieldsDisplay.appendChild(removeBlue);
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
    setBlueShieldByTech({});
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

  const currentChar = allChars.find(ch => ch.id === currentCharId);
  const currentCamp = (currentChar?.camp || "mechkawaii");

  const teamChars = allChars.filter(c => {
    // doit être dans les persos sélectionnés (draft)
    if (!draft?.activeIds?.includes(c.id)) return false;

    // ✅ même camp que le perso actuel (IMPORTANT, même en mode single)
    return (c.camp || "mechkawaii") === currentCamp;
  });

  // Prevent orange shield if target already has a blue technician shield
  const blueByTarget = getBlueShieldAssignments();


  teamChars.forEach(char => {
    const btn = document.createElement('button');
    const hasBlue = (blueByTarget && blueByTarget[char.id] !== undefined);
    btn.textContent = t(char.name, lang);
    if(hasBlue){
      btn.disabled = true;
      btn.style.opacity = '0.55';
      btn.style.cursor = 'not-allowed';
      btn.title = (getLang()==='fr') ? 'Déjà protégé par un bouclier bleu' : 'Already protected by a blue shield';
    }
    btn.style.cssText = `width:100%;padding:10px;margin:8px 0;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white;color:black;transition:all .2s ease;`;

    btn.addEventListener('mouseover', ()=>{ btn.style.borderColor='#3b82f6'; btn.style.background='#eff6ff'; });
    btn.addEventListener('mouseout', ()=>{ btn.style.borderColor='#ddd'; btn.style.background='white'; });

    btn.addEventListener('click', ()=>{
      if(hasBlue) return;
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
   MODAL BLUE SHIELD (TECHNICIAN)
------------------------------ */
function showBlueShieldAssignmentModal(currentTechId, lang, allChars){
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;`;

  const content = document.createElement('div');
  content.style.cssText = `background:white;border-radius:8px;padding:20px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;color:black;`;

  const title = document.createElement('h2');
  title.textContent = (getLang()==="fr") ? "Bouclier du Technicien" : "Technician Shield";
  title.style.marginTop = '0';
  content.appendChild(title);

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

  const techChar = allChars.find(ch => ch.id === currentTechId);
  const techCamp = (techChar?.camp || "mechkawaii");

  // 1 seul bouclier bleu actif par Technicien
  const byTech = getBlueShieldByTech();
  const currentTargetId = byTech[currentTechId] || null;

  const info = document.createElement('div');
  info.style.cssText = "margin:10px 0 14px; padding:10px 12px; border:1px solid #ddd; border-radius:8px; background:#f8fafc; font-size:14px; line-height:1.35;";
  if(currentTargetId){
    const targetChar = allChars.find(ch => ch.id === currentTargetId);
    info.innerHTML = (getLang()==="fr")
      ? `✅ Bouclier déjà actif sur <strong>${t(targetChar?.name, lang) || currentTargetId}</strong>.<br/>Retire-le pour pouvoir en créer un autre.`
      : `✅ Shield already active on <strong>${t(targetChar?.name, lang) || currentTargetId}</strong>.<br/>Remove it to create a new one.`;
  }else{
    info.textContent = (getLang()==="fr")
      ? "Choisis un allié pour lui donner un bouclier bleu."
      : "Pick an ally to grant a blue shield.";
  }
  content.appendChild(info);

  if(currentTargetId){
    const removeBtn = document.createElement('button');
    removeBtn.textContent = tr("shield_remove");
    removeBtn.style.cssText = `width:100%;padding:10px;margin:0 0 12px;border:2px solid #3b82f6;border-radius:6px;cursor:pointer;background:#eff6ff;color:black;`;
    removeBtn.addEventListener('click', ()=>{
      const latest = getBlueShieldByTech();
      delete latest[currentTechId];
      setBlueShieldByTech(latest);
      document.body.removeChild(modal);
      setTimeout(()=>location.reload(), 120);
    });
    content.appendChild(removeBtn);
  }

  // Persos draftés + même camp
  const teamChars = allChars.filter(ch => {
    if (!draft?.activeIds?.includes(ch.id)) return false;
    return (ch.camp || "mechkawaii") === techCamp;
  });

  const orangeAssignments = getShieldAssignments();
  const byTarget = getBlueShieldAssignments(); // {targetId: techId}

  teamChars.forEach(char => {
    const btn = document.createElement('button');
    const hasOrange = (orangeAssignments && orangeAssignments[char.id] !== undefined);

    const alreadyTech = byTarget[char.id]; // undefined ou techId
    const isCurrent = currentTargetId === char.id;
    const isTakenByOther = !!alreadyTech && alreadyTech !== currentTechId;

    btn.textContent = isCurrent ? `✅ ${t(char.name, lang)}` : t(char.name, lang);
    btn.style.cssText = `width:100%;padding:10px;margin:8px 0;border:2px solid #ddd;border-radius:6px;cursor:pointer;background:white;color:black;transition:all .2s ease;`;

    if(currentTargetId && !isCurrent){
      // tech déjà utilisé => pas de nouvel assign
      btn.disabled = true;
      btn.style.opacity = "0.55";
      btn.style.cursor = "not-allowed";
    }
    if(isTakenByOther){
      btn.disabled = true;
      btn.style.opacity = "0.55";
      btn.style.cursor = "not-allowed";
      btn.title = (getLang()==="fr") ? "Déjà protégé par un autre Technicien" : "Already protected by another Technician";
    }

    if(hasOrange){
      btn.disabled = true;
      btn.style.opacity = '0.55';
      btn.style.cursor = 'not-allowed';
      btn.title = (getLang()==='fr') ? 'Ce perso a déjà un bouclier orange' : 'This unit already has an orange shield';
    }

    btn.addEventListener('mouseover', ()=>{
      if(btn.disabled) return;
      btn.style.borderColor='#3b82f6';
      btn.style.background='#eff6ff';
    });
    btn.addEventListener('mouseout', ()=>{
      if(btn.disabled) return;
      btn.style.borderColor='#ddd';
      btn.style.background='white';
    });

    btn.addEventListener('click', ()=>{
      if(hasOrange) return;
      if(btn.disabled) return;

      // sécurité : 1 seul bouclier bleu par tech
      const latest = getBlueShieldByTech();
      if(latest[currentTechId] && latest[currentTechId] !== char.id) return;

      latest[currentTechId] = char.id;
      setBlueShieldByTech(latest);

      document.body.removeChild(modal);
      setTimeout(()=>location.reload(), 120);
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
      localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");
    localStorage.removeItem(STORAGE_PREFIX + "blue-shield-by-tech");

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

  // Camp (pour styliser chaque onglet individuellement, même en mode "single")
  const tabCamp = (char.camp || "mechkawaii").toLowerCase();
  tab.classList.add(tabCamp === "prodrome" ? "camp-prodrome" : "camp-mechkawaii");
  tab.dataset.charId = char.id; // => data-char-id

  const saved = getState(char.id);
  const hp = saved?.hp ?? (char.hp?.max ?? 0);
  const maxHp = char.hp?.max ?? 0;
  const isKo = hp <= 0;
  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  const hpClass = hpPercentage <= 33 ? 'low' : '';
  const assignments = getShieldAssignments();
  const blueAssignments = getBlueShieldAssignments();
  const hasShield = (assignments[char.id] !== undefined) || (blueAssignments[char.id] !== undefined);
  const visualEl = document.createElement('div');
  visualEl.className = 'unit-tab-visual';
  visualEl.classList.add(tabCamp === "prodrome" ? "camp-prodrome" : "camp-mechkawaii");
  if (hasShield) visualEl.classList.add('has-shield');

  const charImage = char.images?.portrait || char.images?.character;
  if(charImage){
    const img = document.createElement('img');
    img.src = charImage;
    img.alt = t(char.name, lang);
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;filter:none;';
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
// ===============================
// Navigation vers Générateur
// ===============================

const terrainBtn = document.getElementById("terrainBtn");
const terrainPage = document.getElementById("terrainPage");
const terrainBackBtn = document.getElementById("terrainBackBtn");
const splash = document.getElementById("splash");

terrainBtn?.addEventListener("click", () => {
  // ✅ Important : rend visibles topbar/cards malgré body.has-splash
  document.documentElement.classList.add("splash-dismissed");

  splash.style.display = "none";
  terrainPage.classList.remove("hidden");
});

terrainBackBtn?.addEventListener("click", () => {
  terrainPage.classList.add("hidden");
  splash.style.display = "block";

  // ✅ On revient au comportement normal du splash
  document.documentElement.classList.remove("splash-dismissed");
});
// ===============================
// Création grille 7x7
// ===============================

function createEmptyGrid(){
  const grid = document.getElementById("terrainGrid");
  if(!grid) return;

  grid.innerHTML = "";

  const letters = ["A","B","C","D","E","F","G"];

  // Coin vide en haut à gauche
  grid.appendChild(document.createElement("div"));

  // Lettres en haut
  letters.forEach(letter => {
    const div = document.createElement("div");
    div.className = "coord";
    div.textContent = letter;
    grid.appendChild(div);
  });

  for(let row=1; row<=7; row++){

    // Numéro à gauche
    const rowLabel = document.createElement("div");
    rowLabel.className = "coord";
    rowLabel.textContent = row;
    grid.appendChild(rowLabel);

    for(let col=0; col<7; col++){
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.x = letters[col];
      tile.dataset.y = row;
      grid.appendChild(tile);
    }
  }
}

// Initialisation au chargement de la page terrain
terrainBtn?.addEventListener("click", () => {
  createEmptyGrid();

  // Si tu veux voir directement une map (avec flip), on génère une base
  // (Localisation A1 + Événement D4). Les règles avancées arrivent ensuite.
  try { generateBaseMap(); } catch(e) {}
});
// ===============================
// Terrain Model
// ===============================

const TERRAIN_TYPES = {
  VIERGE: "vierge",
  VILLE: "ville",
  ACCIDENTE: "accidente",
  ROUTE_DROITE: "route_droite",
  ROUTE_ANGLE: "route_angle",
  ROUTE_CROISEMENT: "route_croisement",
  EVENEMENT: "evenement",
  LOCALISATION: "localisation"
};

let terrainModel = [];
function generateBaseMap(){

  // Crée matrice 7x7 remplie de vierge
  terrainModel = Array.from({length:7}, () =>
    Array.from({length:7}, () => TERRAIN_TYPES.VIERGE)
  );

  // Localisation en A1 (0,0)
  terrainModel[0][0] = TERRAIN_TYPES.LOCALISATION;

  // Événement en D4 (3,3)
  terrainModel[3][3] = TERRAIN_TYPES.EVENEMENT;

  renderTerrain();
}
function renderTerrain(){
  const grid = document.getElementById("terrainGrid");
  if(!grid) return;

  const letters = ["A","B","C","D","E","F","G"];
  const tiles = grid.querySelectorAll(".tile"); // 👈 uniquement les cases du générateur

  tiles.forEach((tile) => {
    const x = letters.indexOf(tile.dataset.x);
    const y = parseInt(tile.dataset.y, 10) - 1;

    const type = terrainModel?.[y]?.[x] || "vierge";

    tile.classList.remove("flipped");
    tile.innerHTML = "";

    const inner = document.createElement("div");
    inner.className = "tile-inner";

    const front = document.createElement("div");
    front.className = "tile-face tile-front";

    const back = document.createElement("div");
    back.className = "tile-face tile-back";

    const img = document.createElement("img");
    img.src = `./assets/terrain/${type}.png`;
    img.alt = type;

    back.appendChild(img);
    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);

    const delay = (x + y) * 45;
    tile.style.setProperty("--delay", `${delay}ms`);

    // force reflow (important)
    void inner.offsetWidth;
      // flip will be triggered in batch after render
});
}


// ===============================
// Bind UI buttons (robuste)
// ===============================
(function bindTerrainUI(){
  const tryBind = (ids, fn) => {
    for(const id of ids){
      const el = document.getElementById(id);
      if(el){
        el.addEventListener("click", fn);
        return true;
      }
    }
    return false;
  };

  // Bouton "Générer une map"
  tryBind(["generateMapBtn","tgGenerate","terrainGenerate","btnGenerateMap"], () => {
    createEmptyGrid();
    generateBaseMap();
  });

  // Bouton "Maps préconstruites" (sera implémenté à l'étape suivante)
  tryBind(["presetMapBtn","tgPresets","terrainPresets","btnPresetMap"], () => {
    alert("Maps préconstruites : bientôt 👀");
  });
})();

/* =========================================================
   TERRAIN GENERATOR (Mechkawaii Companion)
   - 7×7 grid + coordinates
   - Fixed: localisation A1, evenement D4
   - Landing rows: row 1 & row 7 are always "vierge" (A1 is localisation)
   - Exact counts (total 49):
     accidente x6 (variants 1-3 used twice each)
     ville x8 (variants 1-4 used twice each)
     routes x6 (droite x2, angle x2, croisement x2) with visual continuity + rotation
     evenement x1, localisation x1
     vierge x27 (variants 1-4 spread across 27)
   - Random rotation for non-road tiles; computed rotation for road tiles
   - Flip animation (CSS scoped to #terrainGrid)
   ========================================================= */
(function TG_module(){
  const TG = {
    SIZE: 7,
    letters: ["A","B","C","D","E","F","G"],
    TYPES: {
      VIERGE: "vierge",
      VILLE: "ville",
      ACCIDENTE: "accidente",
      ROUTE_DROITE: "route_droite",
      ROUTE_ANGLE: "route_angle",
      ROUTE_CROISEMENT: "route_croisement",
      EVENEMENT: "evenement",
      LOCALISATION: "localisation"
    },
    VARIANTS: { vierge: 4, ville: 4, accidente: 3 },
    model: [] // 7x7 of {type, variant, rot}
  };

  const $ = (id) => document.getElementById(id);

  // ---------- helpers ----------
  function randInt(n){ return Math.floor(Math.random() * n); }
  function randRot(){ return randInt(4) * 90; }

  function shuffle(arr){
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function makeCell(type, variant=0, rot=null){
    return { type, variant, rot: (rot === null ? randRot() : rot) };
  }

  function key(x,y){ return `${x},${y}`; }
  function inBounds(x,y){ return x>=0 && y>=0 && x<TG.SIZE && y<TG.SIZE; }

  function getAvailablePositions(){
    const pos = [];
    for(let y=0; y<TG.SIZE; y++){
      for(let x=0; x<TG.SIZE; x++){
        if(y === 0 || y === TG.SIZE - 1) continue; // landing rows reserved
        if(x === 3 && y === 3) continue;           // event reserved
        pos.push({x,y});
      }
    }
    return pos;
  }

  // ---------- grid UI ----------
  function TG_createEmptyGrid(){
    const grid = $("terrainGrid");
    if(!grid) return;

    grid.innerHTML = "";

    grid.appendChild(document.createElement("div")); // corner

    TG.letters.forEach(letter => {
      const d = document.createElement("div");
      d.className = "coord";
      d.textContent = letter;
      grid.appendChild(d);
    });

    for(let row=1; row<=TG.SIZE; row++){
      const rowLabel = document.createElement("div");
      rowLabel.className = "coord";
      rowLabel.textContent = row;
      grid.appendChild(rowLabel);

      for(let col=0; col<TG.SIZE; col++){
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.x = TG.letters[col];
        tile.dataset.y = String(row);
        grid.appendChild(tile);
      }
    }
  }

  // ---------- variants distribution ----------
  function buildVariantPool(type, total){
    const n = TG.VARIANTS[type] || 0;
    if(!n) return Array(total).fill(0);
    const pool = [];
    for(let i=0; i<total; i++) pool.push(1 + (i % n));
    return shuffle(pool);
  }

  function poolsExact(){
    return {
      ville: shuffle([1,1,2,2,3,3,4,4]),
      accidente: shuffle([1,1,2,2,3,3]),
      vierge: buildVariantPool("vierge", 27)
    };
  }

  // ---------- road generation (1–3 groups, 6 tiles total) ----------
  function generateRoadCells(){
    // forbid roads on landing rows and on the fixed event tile (D4)
    function isRoadForbidden(x,y){
      return (y === 0 || y === TG.SIZE - 1) || (x === 3 && y === 3);
    }
    const all = getAvailablePositions();
    const groupsCount = 1 + randInt(3);

    // sizes sum to 6, each >=1
    let remaining = 6;
    const sizes = [];
    for(let g=0; g<groupsCount; g++){
      const left = groupsCount - g;
      const minForRest = left - 1;
      const maxHere = remaining - minForRest;
      const sizeHere = (g === groupsCount-1) ? remaining : (1 + randInt(maxHere));
      sizes.push(sizeHere);
      remaining -= sizeHere;
    }
    shuffle(sizes);

    const taken = new Set();
    const groups = [];

    function neighbors(x,y){
      return [
        {x:x+1,y}, {x:x-1,y}, {x,y:y+1}, {x,y:y-1}
      ].filter(p => inBounds(p.x,p.y) && !isRoadForbidden(p.x,p.y));
    }

    function pickStart(){
      const candidates = shuffle(all.slice());
      for(const p of candidates){
        if(isRoadForbidden(p.x,p.y)) continue;
        const k0 = key(p.x,p.y);
        if(taken.has(k0)) continue;
        return p;
      }
      return null;
    }

    for(const size of sizes){
      const start = pickStart();
      if(!start) break;

      const group = [start];
      taken.add(key(start.x,start.y));

      let safety = 2000;
      while(group.length < size && safety-- > 0){
        const base = group[randInt(group.length)];
        const opts = shuffle(neighbors(base.x, base.y)).filter(p => !taken.has(key(p.x,p.y)));
        if(!opts.length) continue;
        const nxt = opts[0];
        taken.add(key(nxt.x,nxt.y));
        group.push(nxt);
      }
      groups.push(group);
    }

    // fill leftover by attaching near existing roads
    let total = groups.reduce((s,g)=>s+g.length,0);
    let safety = 3000;
    while(total < 6 && safety-- > 0){
      const flat = groups.flat();
      const base = flat.length ? flat[randInt(flat.length)] : pickStart();
      if(!base) break;
      const opts = shuffle(neighbors(base.x, base.y)).filter(p => !taken.has(key(p.x,p.y)));
      if(!opts.length) continue;
      const nxt = opts[0];
      taken.add(key(nxt.x,nxt.y));
      if(!groups.length) groups.push([]);
      groups[randInt(groups.length)].push(nxt);
      total++;
    }

    return groups.flat().slice(0,6);
  }

  function roadAdjacency(roadSet){
    const need = new Map();
    const dirs = [
      {dx:0,dy:-1,k:"N"},
      {dx:1,dy:0,k:"E"},
      {dx:0,dy:1,k:"S"},
      {dx:-1,dy:0,k:"W"}
    ];
    for(const k0 of roadSet){
      const [x,y] = k0.split(",").map(Number);
      const obj = {N:false,E:false,S:false,W:false};
      for(const d of dirs){
        const k1 = key(x+d.dx, y+d.dy);
        if(roadSet.has(k1)) obj[d.k] = true;
      }
      need.set(k0, obj);
    }
    return need;
  }

  function requiredDirections(obj){
    return ["N","E","S","W"].filter(k => obj[k]);
  }

  function countTrue(obj){
    return ["N","E","S","W"].reduce((s,k)=>s+(obj[k]?1:0),0);
  }

  function solveRoadTiles(roadCells){
    const roadSet = new Set(roadCells.map(p => key(p.x,p.y)));
    const need = roadAdjacency(roadSet);

    // choose 2 junction candidates (prefer higher degree)
    const ranked = [...roadSet].sort((a,b)=>countTrue(need.get(b)) - countTrue(need.get(a)));
    const junctionKeys = new Set(ranked.slice(0,2));

    let straightLeft = 2, cornerLeft = 2, junctionLeft = 2;

    const solved = new Map();

    const rotDir = (dir, rot) => {
      const order = ["N","E","S","W"];
      const idx = order.indexOf(dir);
      const steps = (rot/90) % 4;
      return order[(idx + steps) % 4];
    };

    const patterns = {
      straight: (rot) => new Set([rotDir("N",rot), rotDir("S",rot)]),
      corner: (rot) => new Set([rotDir("N",rot), rotDir("E",rot)]),
      junction: (_rot) => new Set(["N","E","S","W"])
    };

    function bestFit(reqDirs, allowTypes){
      let best = null;
      for(const t of allowTypes){
        for(const rot of [0,90,180,270]){
          const conns = patterns[t](rot);
          if(!reqDirs.every(d => conns.has(d))) continue;
          const extra = [...conns].filter(d => !reqDirs.includes(d)).length;
          if(!best || extra < best.extra) best = {t, rot, extra};
        }
      }
      return best;
    }

    for(const k0 of roadSet){
      const req = requiredDirections(need.get(k0));
      const deg = req.length;

      let allow = [];
      if(deg >= 3 && junctionLeft > 0){
        allow = ["junction"];
      } else {
        if(junctionKeys.has(k0) && junctionLeft > 0) allow.push("junction");
        if(cornerLeft > 0) allow.push("corner");
        if(straightLeft > 0) allow.push("straight");
        if(!allow.length) allow = ["junction","corner","straight"];
      }

      const fit = bestFit(req, allow) || bestFit(req, ["junction","corner","straight"]) || {t:"junction", rot:0, extra:0};

      // consume counts (best effort)
      if(fit.t === "junction" && junctionLeft > 0) junctionLeft--;
      else if(fit.t === "corner" && cornerLeft > 0) cornerLeft--;
      else if(fit.t === "straight" && straightLeft > 0) straightLeft--;
      else {
        fit.t = "junction";
        fit.rot = 0;
      }

      const type =
        fit.t === "junction" ? TG.TYPES.ROUTE_CROISEMENT :
        fit.t === "corner" ? TG.TYPES.ROUTE_ANGLE :
        TG.TYPES.ROUTE_DROITE;

      solved.set(k0, {type, rot: fit.rot});
    }

    return solved;
  }

  // ---------- map generation ----------
  function TG_generateFullMap(){
    const pools = poolsExact();

    // start filled with vierge (we'll override with exact placements)
    TG.model = Array.from({length: TG.SIZE}, () =>
      Array.from({length: TG.SIZE}, () => makeCell(TG.TYPES.VIERGE, 1, randRot()))
    );

    // fixed tiles
    TG.model[0][0] = makeCell(TG.TYPES.LOCALISATION, 0, 0);
TG.model[3][3] = makeCell(TG.TYPES.EVENEMENT, 0, 0);
// roads
    const roadCells = generateRoadCells();
    const roadSolved = solveRoadTiles(roadCells);
    const roadSet = new Set(roadCells.map(p => key(p.x,p.y)));

    for(const p of roadCells){
      const solved = roadSolved.get(key(p.x,p.y));
      if(!solved) continue;
      TG.model[p.y][p.x] = makeCell(solved.type, 0, solved.rot);
    }

    // landing rows forced to vierge using pool (A1 excluded)
    function placeViergeAt(x,y){
      const v = pools.vierge.pop() || 1;
      TG.model[y][x] = makeCell(TG.TYPES.VIERGE, v, randRot());
    }

    for(let x=0; x<TG.SIZE; x++){
      if(!(x===0 && 0===0)) placeViergeAt(x,0);
      placeViergeAt(x,TG.SIZE-1);
    }
    TG.model[0][0] = makeCell(TG.TYPES.LOCALISATION, 0, 0);
// reapply

    // fill remaining positions (excluding fixed, roads, landing rows)
    const positions = [];
    for(let y=0; y<TG.SIZE; y++){
      for(let x=0; x<TG.SIZE; x++){
        const k0 = key(x,y);
        if(y === 0 || y === TG.SIZE-1) continue;
        if(k0 === key(0,0) || k0 === key(3,3)) continue;
        if(roadSet.has(k0)) continue;
        positions.push({x,y});
      }
    }
    shuffle(positions);

    // villes (8) exactly with pool
    for(let i=0; i<8 && positions.length; i++){
      const p = positions.pop();
      const v = pools.ville.pop() || 1;
      TG.model[p.y][p.x] = makeCell(TG.TYPES.VILLE, v, randRot());
    }

    // accidentes (6) exactly with pool
    for(let i=0; i<6 && positions.length; i++){
      const p = positions.pop();
      const v = pools.accidente.pop() || 1;
      TG.model[p.y][p.x] = makeCell(TG.TYPES.ACCIDENTE, v, randRot());
    }

    // rest vierge using remaining pool (to reach total 27)
    while(positions.length){
      const p = positions.pop();
      const v = pools.vierge.pop() || 1;
      TG.model[p.y][p.x] = makeCell(TG.TYPES.VIERGE, v, randRot());
    }

    TG_render();
  }

  // ---------- images (variants + fallback) ----------
  function srcFor(type, variant){
    if(variant && variant > 0){
      return `./assets/terrain/${type}_${variant}.png`;
    }
    return `./assets/terrain/${type}.png`;
  }

  // ---------- render (flip + rotation) ----------
function TG_render(){
  const grid = $("terrainGrid");
  if(!grid) return;

  const tiles = grid.querySelectorAll(".tile");

  tiles.forEach(tile => {
    const x = TG.letters.indexOf(tile.dataset.x);
    const y = parseInt(tile.dataset.y, 10) - 1;

    const cell = TG.model?.[y]?.[x] || makeCell(TG.TYPES.VIERGE, 1, 0);
    const type = cell.type || TG.TYPES.VIERGE;
    const variant = cell.variant || 0;
    const rot = Number.isFinite(cell.rot) ? cell.rot : 0;

    tile.classList.remove("flipped");
    tile.innerHTML = "";

    const inner = document.createElement("div");
    inner.className = "tile-inner";

    const front = document.createElement("div");
    front.className = "tile-face tile-front";

    const back = document.createElement("div");
    back.className = "tile-face tile-back";

    const img = document.createElement("img");
    const first = (TG.VARIANTS[type] ? srcFor(type, variant) : srcFor(type, 0));
    const fallback = srcFor(type, 0);

    img.src = first;
    img.alt = type;

    // rotate tile image (random for non-roads, solved for roads)
    img.style.transform = `rotate(${rot}deg)`;

    img.addEventListener("error", () => {
      if(img.src !== fallback) img.src = fallback;
    }, { once: true });

    back.appendChild(img);
    inner.appendChild(front);
    inner.appendChild(back);
    tile.appendChild(inner);

    const delay = (x + y) * 45;
    tile.style.setProperty("--delay", `${delay}ms`);

    // iOS/Safari: force reflow so transition triggers reliably
    void inner.offsetWidth;
  });

  // Trigger flip in one batch (reliable)
  setTimeout(() => {
    tiles.forEach(t => t.classList.add("flipped"));
  }, 20);
}

  // ---------- navigation / bindings ----------
  function TG_open(){
    const splash = $("splash");
    const terrainPage = $("terrainPage");
    if(!terrainPage) return;

    document.documentElement.classList.add("splash-dismissed");

    if(splash) splash.style.display = "none";
    terrainPage.classList.remove("hidden");

    TG_createEmptyGrid();
    TG_generateFullMap();
  }

  function TG_close(){
    const splash = $("splash");
    const terrainPage = $("terrainPage");
    if(!terrainPage) return;

    terrainPage.classList.add("hidden");
    if(splash) splash.style.display = "block";

    document.documentElement.classList.remove("splash-dismissed");
  }

  function TG_bind(){
    $("terrainBtn")?.addEventListener("click", TG_open);
    $("terrainBackBtn")?.addEventListener("click", TG_close);

    $("generateMapBtn")?.addEventListener("click", () => {
      TG_createEmptyGrid();
      TG_generateFullMap();
    });

    $("presetMapBtn")?.addEventListener("click", () => {
      alert("Maps préconstruites : prochaine étape 😄");
    });
  }

  TG_bind();
})();
