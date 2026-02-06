const STORAGE_PREFIX = "mechkawaii_v0:";
const LS = window.localStorage;

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function getParam(name){
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

function getLang(){
  return LS.getItem(STORAGE_PREFIX + "lang") || "fr";
}
function toggleLang(){
  const next = getLang() === "fr" ? "en" : "fr";
  LS.setItem(STORAGE_PREFIX + "lang", next);
  return next;
}
function t(val, lang){
  if(val == null) return "";
  if(typeof val === "string") return val;
  // expecting {fr, en}
  return (lang === "en" ? (val.en ?? val.fr) : (val.fr ?? val.en)) ?? "";
}

async function loadCharacters(){
  const res = await fetch("./data/characters.json", {cache:"no-store"});
  if(!res.ok) throw new Error("characters.json not found");
  return await res.json();
}

function normCamp(c){
  const camp = (c.camp || "").toLowerCase();
  if(camp.includes("pro")) return "prodrome";
  return "mechkawaii";
}

function campLabel(camp, lang){
  if(lang === "en") return camp === "prodrome" ? "Prodrome" : "Mechkawaii";
  return camp === "prodrome" ? "Prodrome" : "Mechkawaii";
}

function bindLangButton(){
  const btn = qs("#langBtn");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    toggleLang();
    location.reload();
  });
}

function setSegActive(id){
  qsa(".segbtn").forEach(b=>b.classList.remove("active"));
  const el = qs("#"+id);
  if(el) el.classList.add("active");
}

function keyFor(id){ return STORAGE_PREFIX + "char:" + id; }
function loadState(id){
  try{
    return JSON.parse(LS.getItem(keyFor(id)) || "{}");
  }catch(e){
    return {};
  }
}
function saveState(id, obj){
  LS.setItem(keyFor(id), JSON.stringify(obj));
}

function heartImg(filled){
  const src = filled ? "./assets/pv.svg" : "./assets/pv_off.svg";
  return `<img class="heart" src="${src}" alt="HP" />`;
}

async function initIndex(){
  bindLangButton();
  const lang = getLang();

  const list = qs("#list");
  const note = qs("#statusNote");
  if(!list) return;

  let campFilter = LS.getItem(STORAGE_PREFIX + "campFilter") || "all";
  function applyFilter(chars){
    if(campFilter === "all") return chars;
    return chars.filter(c => normCamp(c) === campFilter);
  }

  const chars = await loadCharacters();

  function render(){
    const filtered = applyFilter(chars);
    list.innerHTML = "";
    filtered.forEach(c=>{
      const camp = normCamp(c);
      const a = document.createElement("a");
      a.className = "item";
      a.href = `character.html?id=${encodeURIComponent(c.id)}`;
      a.innerHTML = `
        <div class="n">${t(c.name, lang)}</div>
        <div class="m">
          <span class="badge">${campLabel(camp, lang)}</span>
          <span class="badge">${t(c.class, lang)}</span>
          <span class="badge">HP ${c.hp?.max ?? "?"}</span>
        </div>
      `;
      list.appendChild(a);
    });

    if(note){
      const total = chars.length;
      const shown = filtered.length;
      note.textContent = (lang === "en")
        ? `${shown} / ${total} characters`
        : `${shown} / ${total} personnages`;
    }
  }

  // Filter buttons
  const bAll = qs("#campAll");
  const bMech = qs("#campMech");
  const bProd = qs("#campProd");

  function setFilter(val){
    campFilter = val;
    LS.setItem(STORAGE_PREFIX + "campFilter", val);
    setSegActive(val === "all" ? "campAll" : (val === "mechkawaii" ? "campMech" : "campProd"));
    render();
  }

  bAll?.addEventListener("click", ()=>setFilter("all"));
  bMech?.addEventListener("click", ()=>setFilter("mechkawaii"));
  bProd?.addEventListener("click", ()=>setFilter("prodrome"));

  // Init active state
  setSegActive(campFilter === "all" ? "campAll" : (campFilter === "mechkawaii" ? "campMech" : "campProd"));
  render();
}

async function initCharacter(){
  bindLangButton();
  const lang = getLang();
  const id = getParam("id");
  if(!id) return;

  const chars = await loadCharacters();
  const c = chars.find(x => x.id === id);
  if(!c) return;

  const camp = normCamp(c);

  qs("#name").textContent = t(c.name, lang);
  qs("#camp").textContent = campLabel(camp, lang);
  qs("#cls").textContent = t(c.class, lang);

  const state = loadState(id);
  const hpMax = c.hp?.max ?? 0;
  let hpCur = Math.min(hpMax, Math.max(0, state.hp ?? hpMax));

  function renderHP(){
    const hpIcons = qs("#hpIcons");
    hpIcons.innerHTML = "";
    for(let i=1;i<=hpMax;i++){
      const span = document.createElement("span");
      span.innerHTML = heartImg(i <= hpCur);
      hpIcons.appendChild(span);
    }
  }

  function save(){
    saveState(id, {
      ...state,
      hp: hpCur,
      toggles: toggles
    });
  }

  const togglesDef = [
    { key:"abacus", fr:"Boulier", en:"Abacus" },
    { key:"shield", fr:"Bouclier", en:"Shield" },
    { key:"stunned", fr:"Étourdi", en:"Stunned" },
  ];

  let toggles = state.toggles || {};
  const tgWrap = qs("#toggles");
  tgWrap.innerHTML = "";
  togglesDef.forEach(def=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pill" + (toggles[def.key] ? " on" : "");
    b.textContent = (lang === "en" ? def.en : def.fr);
    b.addEventListener("click", ()=>{
      toggles[def.key] = !toggles[def.key];
      b.classList.toggle("on", !!toggles[def.key]);
      save();
    });
    tgWrap.appendChild(b);
  });

  qs("#hpMinus")?.addEventListener("click", ()=>{
    hpCur = Math.max(0, hpCur - 1);
    renderHP(); save();
  });
  qs("#hpPlus")?.addEventListener("click", ()=>{
    hpCur = Math.min(hpMax, hpCur + 1);
    renderHP(); save();
  });

  renderHP();
  save(); // ensure defaults saved
}

document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    if(qs("#list")) await initIndex();
    if(qs("#hpIcons")) await initCharacter();
  }catch(err){
    console.error(err);
    const n = qs("#statusNote");
    if(n) n.textContent = "Erreur de chargement. Vérifie que data/characters.json existe à la racine.";
  }
});
