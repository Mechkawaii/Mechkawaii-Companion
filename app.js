const STORAGE_PREFIX = "mechkawaii:";

/* ------------------------------
   DOM helpers
------------------------------ */
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

/* ------------------------------
   LANG (Flags on Index)
------------------------------ */
function getLang(){
  const saved = localStorage.getItem(STORAGE_PREFIX + "lang");
  return saved || "fr";
}

function setLang(lang){
  localStorage.setItem(STORAGE_PREFIX + "lang", lang);
}

/**
 * Cache/désactive le select #lang partout (si jamais il existe encore dans le HTML).
 * La langue se choisit uniquement via les drapeaux sur l'accueil.
 */
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

/**
 * Initialise les drapeaux (uniquement sur index.html).
 * HTML attendu:
 * <div id="langFlags">
 *   <button data-lang="fr">🇫🇷</button>
 *   <button data-lang="en">🇬🇧</button>
 * </div>
 */
function initLangFlags(){
  const wrap = qs("#langFlags");
  if(!wrap) return;

  const current = getLang();
  wrap.querySelectorAll("[data-lang]").forEach(btn=>{
    const v = btn.getAttribute("data-lang");
    btn.classList.toggle("active", v === current);

    btn.addEventListener("click", ()=>{
      setLang(v);
      location.reload();
    });
  });
}

/* ------------------------------
   STATE / STORAGE
------------------------------ */
function heartIcon(filled){
  const src = filled ? "./assets/pv.svg" : "./assets/pv_off.svg";
  return `<img src="${src}" class="heart" alt="PV" />`;
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

/**
 * Anti-crash : si root n'existe pas dans le HTML, on sort sans planter.
 * visual_keys => rend des boutons "key-button"
 */
function renderToggleRow(root, toggle, isOn, lang, onChange, sharedShields = null){
  if(!root) return;

  if (toggle.type === "visual_keys") {
    const keysContainer = document.createElement("div");
    keysContainer.className = "toggle-visual-keys";

    const label = document.createElement("label");
    label.style.cssText = `
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      min-width: 150px;
    `;
    label.textContent = t(toggle.label, lang);

    // On a déjà un titre dans le HTML pour ces sections
    if (toggle.id === "repair_keys" || toggle.id === "shield") {
      label.style.display = "none";
    }

    const keysDisplay = document.createElement("div");
    keysDisplay.className = "keys-display";

    const maxKeys = toggle.maxKeys || 2;
    const isShield = toggle.id === "shield";

    const currentState = isShield
      ? (Array.isArray(sharedShields) ? sharedShields : (Array.isArray(isOn) ? isOn : [true, true, true]))
      : (Array.isArray(isOn) ? isOn : [isOn, isOn]);

    for (let i = 0; i < maxKeys; i++) {
      const key = document.createElement("button");
      key.className = "key-button";
      key.type = "button";

      const keyState = currentState[i] !== undefined ? currentState[i] : true;

      key.dataset.keyIndex = String(i);
      key.dataset.toggleId = toggle.id;
      key.dataset.active = keyState ? "true" : "false";

      key.style.backgroundImage =
        `url('./assets/icons/${isShield ? "shield" : "key"}_${keyState ? "on" : "off"}.svg')`;

      key.addEventListener("click", function(e){
        e.preventDefault();
        this.dataset.active = this.dataset.active === "true" ? "false" : "true";
        this.style.backgroundImage =
          `url('./assets/icons/${isShield ? "shield" : "key"}_${this.dataset.active === "true" ? "on" : "off"}.svg')`;

        const keysState = [];
        keysDisplay.querySelectorAll(".key-button").forEach(kb=>{
          keysState.push(kb.dataset.active === "true");
        });
        onChange(keysState);
      });

      keysDisplay.appendChild(key);
    }

    keysContainer.appendChild(label);
    keysContainer.appendChild(keysDisplay);
    root.appendChild(keysContainer);
    return;
  }

  // Switch classique
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
  sw.setAttribute("role", "switch");
  sw.setAttribute("tabindex", "0");
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

/* ------------------------------
   INDEX
------------------------------ */
async function initIndex(){
  const lang = getLang();
  bindTopbar();
  initLangFlags();

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
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

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
            if(draftError) draftError.textContent =
              (lang === "fr") ? `Tu as déjà ${maxPick} persos sélectionnés.` : `You already selected ${maxPick} characters.`;
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
        if(draftError) draftError.textContent =
          (lang === "fr") ? `Sélectionne exactement ${maxPick} persos.` : `Select exactly ${maxPick} characters.`;
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
      ? "Aucun perso disponible pour ce camp (pour l'instant). Change de camp via \"Changer config\"."
      : "No characters available for this camp (yet). Change camp via \"Change setup\".";
    list.appendChild(msg);
  }
}

/* ------------------------------
   CHARACTER
------------------------------ */
async function initCharacter(){
  const lang = getLang();
  bindTopbar();

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
    if (tg.type === "visual_keys") {
      const maxKeys = tg.maxKeys || 2;
      defaultToggles[tg.id] = Array.from({length: maxKeys}, ()=>true);
    } else {
      defaultToggles[tg.id] = false;
    }
  });

  // Merge (important si ancien state)
  const state = saved || { hp: c.hp?.max ?? 0, toggles: {} };
  if (state.hp == null) state.hp = c.hp?.max ?? 0;
  if (!state.toggles) state.toggles = {};
  Object.keys(defaultToggles).forEach((k) => {
    if (state.toggles[k] === undefined) state.toggles[k] = defaultToggles[k];
  });
  setState(c.id, state);

  // UI header
  const charName = qs("#charName");
  const charClass = qs("#charClass");
  const hpMaxLabel = qs("#hpMaxLabel");
  if(charName) charName.textContent = t(c.name, lang);
  if(charClass) charClass.textContent = t(c.class, lang);
  if(hpMaxLabel) hpMaxLabel.textContent = `/${c.hp?.max ?? 0}`;

  const charPortrait = qs("#charPortrait");
  if (charPortrait) {
    charPortrait.innerHTML = "";
    const charImage = c.images?.portrait || c.images?.character;

    if (charImage) {
      const img = document.createElement("img");
      img.src = charImage;
      img.alt = t(c.name, lang);
      img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;";
      img.onerror = function(){
        charPortrait.innerHTML =
          `<div style="font-size:36px;font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(c.name, lang).charAt(0)}</div>`;
      };
      charPortrait.appendChild(img);
    } else {
      charPortrait.innerHTML =
        `<div style="font-size:36px;font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(c.name, lang).charAt(0)}</div>`;
    }
  }

  // HP
  const hpCurEl = qs("#hpCur");
  const hpHeartsEl = qs("#hpHearts");

  function refreshHP(){
    if(hpCurEl) hpCurEl.textContent = String(state.hp);
    renderHP(hpHeartsEl, state.hp, c.hp?.max ?? 0);
  }

  function updateShieldFxOnCard(){
    // On met l'effet de bouclier sur la card HP (celle qui contient le titre)
    const cards = document.querySelectorAll(".card");
    let hpCard = null;

    for (const card of cards) {
      if (card.textContent.includes("Points de Vie") || card.textContent.includes("Life")) {
        hpCard = card;
        break;
      }
    }
    if(!hpCard) return;

    const assignments = getShieldAssignments();
    if (assignments[c.id] !== undefined) hpCard.classList.add("has-shield");
    else hpCard.classList.remove("has-shield");
  }

  qs("#hpMinus")?.addEventListener("click", ()=>{
    state.hp = clamp(state.hp - 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);
    refreshHP();
    updateTabHP(c.id, state.hp);
  });

  qs("#hpPlus")?.addEventListener("click", ()=>{
    state.hp = clamp(state.hp + 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);
    refreshHP();
    updateTabHP(c.id, state.hp);
  });

  refreshHP();

  // Texts
  qs("#classActionTitle") && (qs("#classActionTitle").textContent = t(c.texts?.class_action_title, lang));
  qs("#classActionBody") && (qs("#classActionBody").textContent = t(c.texts?.class_action_body, lang));
  qs("#ultTitle") && (qs("#ultTitle").textContent = t(c.texts?.ultimate_title, lang));
  qs("#ultBody") && (qs("#ultBody").textContent = t(c.texts?.ultimate_body, lang));
  qs("#movementDesc") && (qs("#movementDesc").textContent = t(c.texts?.movement_desc, lang) || "");
  qs("#attackDesc") && (qs("#attackDesc").textContent = t(c.texts?.attack_desc, lang) || "");

  // --- Boucliers (même UI que les clés) + assignation ---
  const shieldsDisplay = qs("#shieldsDisplay");
  if (shieldsDisplay) {
    shieldsDisplay.innerHTML = "";

    const shieldToggle = (c.toggles || []).find(tg => tg.id === "shield");
    if (shieldToggle) {
      const freshShields = getSharedShields();
      const freshAssignments = getShieldAssignments();

      // Rend les 3 boutons (type key-button)
      renderToggleRow(
        shieldsDisplay,
        shieldToggle,
        freshShields,
        lang,
        (v)=>{ setSharedShields(v); },
        freshShields
      );

      // Transforme chaque bouton en "assignation"
      const keyButtons = shieldsDisplay.querySelectorAll(".key-button");
      keyButtons.forEach((btn, i)=>{
        // shield déjà consommé ? => on le cache
        if (!freshShields[i]) {
          btn.style.display = "none";
          return;
        }

        // toujours visuel "on" tant qu'il est dispo
        btn.dataset.active = "true";
        btn.style.backgroundImage = "url('./assets/icons/shield_on.svg')";

        btn.onclick = (e)=>{
          e.preventDefault();
          showShieldAssignmentModal(i, c.id, lang, chars);
        };
      });

      // Si ce perso a un bouclier : bouton retirer (usage unique => ne retourne pas en réserve)
      if (freshAssignments[c.id] !== undefined) {
        const removeShield = document.createElement("button");
        removeShield.className = "shield-remove-btn";
        removeShield.textContent = (lang === "fr") ? "Retirer le bouclier" : "Remove the shield";

        removeShield.addEventListener("click", (e)=>{
          e.preventDefault();
          const assignments = getShieldAssignments();
          delete assignments[c.id];
          setShieldAssignments(assignments);

          // ⚠️ On NE touche PAS aux shields (usage unique)
          location.reload();
        });

        shieldsDisplay.appendChild(removeShield);
      }
    }
  }

  // --- Clés de réparation ---
  const repairKeysDisplay = qs("#repairKeysDisplay");
  if (repairKeysDisplay) {
    repairKeysDisplay.innerHTML = "";
    const repairToggle = (c.toggles || []).find(tg => tg.id === "repair_keys");
    if (repairToggle) {
      const keysState = state.toggles[repairToggle.id] || [true, true];
      renderToggleRow(repairKeysDisplay, repairToggle, keysState, lang, (v)=>{
        state.toggles[repairToggle.id] = v;
        setState(c.id, state);
      });
    }
  }

  // --- Coup Unique toggle dans sa section ---
  const ultToggleContainer = qs("#ultToggleContainer");
  if (ultToggleContainer) ultToggleContainer.innerHTML = "";

  const isUltimateToggle = (tg)=>{
    const fr = (t(tg.label, "fr") || "").toLowerCase();
    const en = (t(tg.label, "en") || "").toLowerCase();
    return fr.includes("coup unique") || en.includes("ultimate");
  };

  const ultimateToggle = (c.toggles || []).find(isUltimateToggle);
  if (ultimateToggle && ultToggleContainer) {
    const isOn = !!state.toggles[ultimateToggle.id];
    renderToggleRow(ultToggleContainer, ultimateToggle, isOn, lang, (v)=>{
      state.toggles[ultimateToggle.id] = v;
      setState(c.id, state);
    });
  }

  // Patterns (normal/expert)
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
    const fresh = {
      hp: c.hp?.max ?? 0,
      toggles: {...defaultToggles}
    };
    setState(c.id, fresh);

    // reset global shields + assignments
    setSharedShields([true, true, true]);
    setShieldAssignments({});
    location.reload();
  });

  qs("#backBtn")?.addEventListener("click", ()=>{ location.href = "./index.html"; });

  updateShieldFxOnCard();
  initUnitTabs(id, chars, lang);
}

/* ------------------------------
   MODAL SHIELD (assign)
   - Consomme le bouclier dans la réserve (sharedShields[index]=false)
------------------------------ */
function showShieldAssignmentModal(shieldIndex, currentCharId, lang, allChars){
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    color: black;
  `;

  const title = document.createElement("h2");
  title.textContent = (lang === "fr") ? "Assigner le bouclier" : "Assign shield";
  title.style.marginTop = "0";
  content.appendChild(title);

  const setupRaw = localStorage.getItem(STORAGE_PREFIX + "setup");
  const setup = setupRaw ? JSON.parse(setupRaw) : null;
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  const draft = draftRaw ? JSON.parse(draftRaw) : null;

  // équipe : uniquement les persos sélectionnés (draft)
  let teamChars = allChars.filter(c=>{
    if (!draft?.activeIds?.includes(c.id)) return false;
    if (setup?.mode === "single") return true;

    // multi : même camp
    const currentChar = allChars.find(ch=>ch.id === currentCharId);
    return (c.camp || "mechkawaii") === (currentChar?.camp || "mechkawaii");
  });

  // fallback : si pas de draft, on prend tout le camp
  if(!teamChars.length){
    teamChars = allChars;
  }

  teamChars.forEach(char=>{
    const btn = document.createElement("button");
    btn.textContent = t(char.name, lang);
    btn.style.cssText = `
      width: 100%;
      padding: 10px;
      margin: 8px 0;
      border: 2px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      background: white;
      color: black;
      transition: all 0.2s ease;
    `;

    btn.addEventListener("mouseover", ()=>{
      btn.style.borderColor = "#3b82f6";
      btn.style.background = "#eff6ff";
    });
    btn.addEventListener("mouseout", ()=>{
      btn.style.borderColor = "#ddd";
      btn.style.background = "white";
    });

    btn.addEventListener("click", ()=>{
      const assignments = getShieldAssignments();
      const shields = getSharedShields();

      // assigne + consomme le bouclier
      assignments[char.id] = shieldIndex;
      shields[shieldIndex] = false;

      setShieldAssignments(assignments);
      setSharedShields(shields);

      document.body.removeChild(modal);
      setTimeout(()=>location.reload(), 150);
    });

    content.appendChild(btn);
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = (lang === "fr") ? "Annuler" : "Cancel";
  closeBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 16px;
    border: 2px solid #999;
    border-radius: 6px;
    cursor: pointer;
    background: #f5f5f5;
    color: black;
  `;
  closeBtn.addEventListener("click", ()=>document.body.removeChild(modal));
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);
}

/* ------------------------------
   BOOT
------------------------------ */
document.addEventListener("DOMContentLoaded", async ()=>{
  const SPLASH_KEY = STORAGE_PREFIX + "splashDismissed";
  const splashDismissed = localStorage.getItem(SPLASH_KEY) === "1";

  function hideSplash(){
    const splash = document.getElementById("splash");
    if(splash) splash.remove();
    document.body.classList.remove("has-splash");
  }

  // ✅ plus de son : juste fermer le splash
  const playBtn = document.getElementById("playBtn");
  if(playBtn){
    playBtn.addEventListener("click", ()=>{
      localStorage.setItem(SPLASH_KEY, "1");
      document.body.classList.remove("has-splash");
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

      chars.forEach(c=>{
        localStorage.removeItem(STORAGE_PREFIX + "state:" + c.id);
      });

      localStorage.removeItem(SPLASH_KEY);
      location.reload();
    });
  }

  if(splashDismissed){
    document.body.classList.remove("has-splash");
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

/* ------------------------------
   TABS (Bottom)
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
    unitTabsWrapper.classList.remove("visible");
    document.body.classList.remove("tabs-visible");
    return;
  }

  unitTabsWrapper.classList.add("visible");
  document.body.classList.add("tabs-visible");

  tabsContainer.innerHTML = "";
  tabCharacters.forEach(char=>{
    const tab = createCharacterTab(char, lang);
    tabsContainer.appendChild(tab);
  });
}

function createCharacterTab(char, lang){
  const tab = document.createElement("div");
  tab.className = "unit-tab";
  tab.dataset.charId = char.id;

  const saved = getState(char.id);
  const hp = saved?.hp ?? (char.hp?.max ?? 0);
  const maxHp = char.hp?.max ?? 0;

  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  const hpClass = hpPercentage <= 33 ? "low" : "";

  const assignments = getShieldAssignments();
  const hasShield = assignments[char.id] !== undefined;

  const visualEl = document.createElement("div");
  visualEl.className = "unit-tab-visual";
  if (hasShield) visualEl.classList.add("has-shield");

  const charImage = char.images?.portrait || char.images?.character;
  if(charImage){
    const img = document.createElement("img");
    img.src = charImage;
    img.alt = t(char.name, lang);
    img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.4));";
    img.onerror = function(){
      visualEl.innerHTML =
        `<div style="width:70%;height:70%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px, 8vw, 36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
    };
    visualEl.appendChild(img);
  } else {
    visualEl.innerHTML =
      `<div style="width:70%;height:70%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:clamp(24px, 8vw, 36px);font-weight:900;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.3)">${t(char.name, lang).charAt(0)}</div>`;
  }

  const hpBadge = document.createElement("div");
  hpBadge.className = `unit-tab-hp ${hpClass}`;
  hpBadge.innerHTML = `<span>❤️</span><span>${hp}/${maxHp}</span>`;
  visualEl.appendChild(hpBadge);

  const infoEl = document.createElement("div");
  infoEl.className = "unit-tab-info";
  infoEl.innerHTML = `
    <div class="unit-tab-name">${t(char.name, lang)}</div>
    <div class="unit-tab-role">${t(char.class, lang)}</div>
  `;

  tab.appendChild(visualEl);
  tab.appendChild(infoEl);

  if (hasShield) tab.classList.add("has-shield");

  tab.addEventListener("click", ()=>{
    location.href = `character.html?id=${encodeURIComponent(char.id)}`;
  });

  return tab;
}

function updateTabHP(charId, newHp){
  const tab = document.querySelector(`.unit-tab[data-char-id="${charId}"]`);
  if(!tab) return;

  const hpBadge = tab.querySelector(".unit-tab-hp");
  if(!hpBadge) return;

  const allChars = window.__cachedChars;
  if(allChars){
    const char = allChars.find(c => c.id === charId);
    const maxHp = char?.hp?.max ?? 0;

    const hpPercentage = maxHp > 0 ? (newHp / maxHp) * 100 : 100;
    hpBadge.className = "unit-tab-hp" + (hpPercentage <= 33 ? " low" : "");
    hpBadge.querySelector("span:last-child").textContent = `${newHp}/${maxHp}`;

    tab.style.animation = "none";
    setTimeout(()=>{ tab.style.animation = "heartShake 0.3s ease"; }, 10);
  }
}
