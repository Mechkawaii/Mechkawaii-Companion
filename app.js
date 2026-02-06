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

    // Little “arcade” two-tone blip
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

    // Close context after sound to avoid keeping audio running
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
  // Inline SVG so it works offline + no assets needed
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
  // obj can be {fr,en} or string
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

// ---------- Pages ----------
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

  // --- Setup state ---
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

  // Buttons always available when setup exists
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

  // If no setup, show setup UI
  if(!setup){
    if(setupCard) setupCard.style.display = "block";
    if(draftCard) draftCard.style.display = "none";
    if(changeSetupBtn) changeSetupBtn.style.display = "none";
    if(changeDraftBtn) changeDraftBtn.style.display = "none";
    list.innerHTML = "";

    let mode = null; // "single" or "multi"
    let camp = null; // "mechkawaii" or "prodrome"

    qs("#modeSingle")?.addEventListener("click", ()=>{
      mode = "single";
      saveSetup({mode});
      location.reload();
    });
    qs("#modeMulti")?.addEventListener("click", ()=>{
      mode = "multi";
      if(campPick) campPick.style.display = "block";
    });

    qs("#campMech")?.addEventListener("click", ()=>{
      camp = "mechkawaii";
      saveSetup({mode:"multi", camp});
      location.reload();
    });
    qs("#campProd")?.addEventListener("click", ()=>{
      camp = "prodrome";
      saveSetup({mode:"multi", camp});
      location.reload();
    });

    qs("#resetSetupBtn")?.addEventListener("click", clearSetup);

    return;
  }

  // Setup exists
  if(changeSetupBtn) changeSetupBtn.style.display = "inline-block";
  if(changeDraftBtn) changeDraftBtn.style.display = "inline-block";

  // Filter characters by camp if needed
  let available = chars;
  if(setup.mode === "multi"){
    available = chars.filter(c => (c.camp || "mechkawaii") === (setup.camp || "mechkawaii"));
  }

  // --- Draft selection ---
  const maxPick = (setup.mode === "single") ? 6 : 3;
  const draftRaw = localStorage.getItem(STORAGE_PREFIX + "draft");
  let draft = draftRaw ? JSON.parse(draftRaw) : null; // { activeIds: [] }

  function saveDraft(obj){
    localStorage.setItem(STORAGE_PREFIX + "draft", JSON.stringify(obj));
  }

  // If no draft, show selection UI
  if(!draft){
    if(draftCard) draftCard.style.display = "block";
    if(setupCard) setupCard.style.display = "none";
    list.innerHTML = "";

    // Build check list
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
      saveDraft({activeIds: null}); // null means show all
      location.reload();
    });

    return;
  }

  // Determine active characters
  let toShow = available;
  if(Array.isArray(draft.activeIds) && draft.activeIds.length){
    toShow = available.filter(c => draft.activeIds.includes(c.id));
  }

  // Render list
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

  // If nothing to show (e.g. prodrome camp but no prodrome chars yet)
  if(toShow.length === 0){
    const msg = document.createElement("div");
    msg.className = "footer-note";
    msg.style.color = "var(--muted)";
    msg.textContent = (lang === "fr")
      ? "Aucun perso disponible pour ce camp (pour l’instant). Change de camp via “Changer config”."
      : "No characters available for this camp (yet). Change camp via “Change setup”.";
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

  // State init
  const saved = getState(c.id);
  const state = saved || {
    hp: c.hp?.max ?? 0,
    toggles: Object.fromEntries((c.toggles||[]).map(tg => [tg.id, false]))
  };

  // UI
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
  });
  qs("#hpPlus").addEventListener("click", ()=>{
    state.hp = clamp(state.hp + 1, 0, c.hp?.max ?? 0);
    setState(c.id, state);
    refreshHP();
  });

  refreshHP();

  // Text blocks
  qs("#classActionTitle").textContent = t(c.texts?.class_action_title, lang);
  qs("#classActionBody").textContent  = t(c.texts?.class_action_body, lang);
  qs("#ultTitle").textContent         = t(c.texts?.ultimate_title, lang);
  qs("#ultBody").textContent          = t(c.texts?.ultimate_body, lang);

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

  // Images
  const movImg = qs("#movementImg");
  const atkImg = qs("#attackImg");
  movImg.src = c.images?.movement || "";
  atkImg.src = c.images?.attack || "";

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
}

document.addEventListener("DOMContentLoaded", async ()=>{

  function showSplash(){
    const splash = document.getElementById("splash");
    if(splash){ splash.style.display = "block"; }
  }
  function hideSplash(){
    const splash = document.getElementById("splash");
    if(splash){ splash.remove(); }
  }

  const playBtn = document.getElementById("playBtn");
  if(playBtn){
    playBtn.addEventListener("click", ()=>{
      playPressStart();
      hideSplash();
    });
  }

  const backToSplash = document.getElementById("backToSplash");
  if(backToSplash){
    backToSplash.addEventListener("click", ()=>{
      location.reload();
    });
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
