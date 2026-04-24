(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const ICONS = {
    keyOn: "./assets/icons/key_on.svg",
    keyOff: "./assets/icons/key_off.svg",
    shieldOn: "./assets/icons/shield_on.svg",
    shieldOff: "./assets/icons/shield_off.svg",
    fallback: "./assets/heart.png"
  };

  function qs(sel, root = document){ return root.querySelector(sel); }
  function qsa(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }
  function getLang(){ return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function getCurrentCharId(){ return new URL(location.href).searchParams.get("id"); }
  function readJson(key, fallback){ try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function getState(id){ return readJson(PREFIX + "state:" + id, null); }
  function setState(id, state){ writeJson(PREFIX + "state:" + id, state); }

  function getHpCur(char){
    const state = getState(char.id);
    const max = Number(char?.hp?.max ?? 0);
    if (!state) return max;
    if (typeof state.hp === "number") return Math.max(0, Math.min(Number(state.hp), max));
    if (state.hp && typeof state.hp === "object") return Math.max(0, Math.min(Number(state.hp.cur ?? max), max));
    return max;
  }

  function setHpCur(char, hpCur){
    const max = Number(char?.hp?.max ?? 0);
    const current = getState(char.id) || { hp: max, toggles: {} };
    current.hp = Math.max(0, Math.min(Number(hpCur), max));
    current.toggles = current.toggles || {};
    setState(char.id, current);
    return current;
  }

  function dispatchHpUpdate(char, hpCur){
    window.dispatchEvent(new CustomEvent("mechkawaii:hp-updated", { detail: { charId: char?.id, hp: hpCur } }));
  }

  function dispatchShieldUpdate(charId){
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId } }));
  }

  function getBlueShieldByTech(){ return readJson(PREFIX + "blue-shield-by-tech", {}); }
  function setBlueShieldByTech(map){ writeJson(PREFIX + "blue-shield-by-tech", map); }

  function setBlueShieldForSharedShield(index, targetCharId){
    const map = getBlueShieldByTech();
    map["shared-shield-" + index] = targetCharId;
    setBlueShieldByTech(map);
    syncCurrentShieldGlow(targetCharId);
    dispatchShieldUpdate(targetCharId);
  }

  function removeBlueShieldForSharedShield(index){
    const map = getBlueShieldByTech();
    const oldTarget = map["shared-shield-" + index];
    delete map["shared-shield-" + index];
    setBlueShieldByTech(map);
    syncCurrentShieldGlow(oldTarget);
    dispatchShieldUpdate(oldTarget);
  }

  function syncCurrentShieldGlow(targetCharId){
    if (!targetCharId || targetCharId !== getCurrentCharId()) return;
    const map = getBlueShieldByTech();
    const isShielded = Object.values(map).includes(targetCharId);
    const hpCard = qs("#hpCard");
    const portrait = qs("#charPortrait");
    const topbar = qs(".topbar");
    [hpCard, portrait, topbar].forEach(el => {
      if (!el) return;
      el.classList.toggle("has-shield", isShielded);
      el.classList.toggle("is-shielded", isShielded);
      el.classList.toggle("shielded", isShielded);
    });
  }

  function getName(char, lang){
    const n = char?.name;
    if (!n) return char?.id || "?";
    return typeof n === "string" ? n : (n[lang] || n.fr || char.id);
  }
  function getClass(char, lang){
    const c = char?.class;
    if (!c) return "";
    return typeof c === "string" ? c : (c[lang] || c.fr || "");
  }
  function getPortrait(char){ return char?.images?.portrait || char?.portrait || char?.icon || ICONS.fallback; }

  async function loadChars(){
    if (Array.isArray(window.__cachedChars)) return window.__cachedChars;
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    const chars = await res.json();
    window.__cachedChars = chars;
    return chars;
  }

  function getDraftIds(){
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentTeam(chars){
    const currentId = getCurrentCharId();
    const current = chars.find(c => c.id === currentId);
    if (!current) return [];
    const camp = current.camp || "mechkawaii";
    const draftIds = getDraftIds();
    return chars.filter(c => (c.camp || "mechkawaii") === camp && (!draftIds || draftIds.includes(c.id)));
  }

  function ensureStyles(){
    if (document.getElementById("mkwResourceModalStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwResourceModalStyles";
    style.textContent = `
      @keyframes mkwConsume { 0%{transform:scale(1);opacity:1} 40%{transform:scale(.72);opacity:.45} 100%{transform:scale(1);opacity:1} }
      @keyframes mkwRestore { 0%{transform:scale(.75);opacity:.5} 45%{transform:scale(1.18);opacity:1} 100%{transform:scale(1);opacity:1} }
      @keyframes mkwHealGlow { 0%{box-shadow:0 0 0 rgba(70,255,145,0)} 35%{box-shadow:0 0 0 3px rgba(70,255,145,.35),0 0 28px rgba(70,255,145,.85)} 100%{box-shadow:0 0 0 rgba(70,255,145,0)} }
      @keyframes mkwHeartPulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(70,255,145,0))} 45%{transform:scale(1.28);filter:drop-shadow(0 0 10px rgba(70,255,145,.95))} }
      .mkw-consume{animation:mkwConsume .35s ease}.mkw-restore{animation:mkwRestore .4s ease}
      .mkw-heal-glow{animation:mkwHealGlow .9s ease-out both!important;border-color:rgba(70,255,145,.75)!important}.mkw-heart-pulse{animation:mkwHeartPulse .8s ease-out both!important}
      .mkw-resource-modal{position:fixed;inset:0;z-index:5200;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;padding:18px}
      .mkw-resource-panel{width:min(460px,100%);max-height:82vh;overflow:auto;background:linear-gradient(180deg,#1a1a24,#101018);color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:20px;box-shadow:0 22px 55px rgba(0,0,0,.58);padding:16px}
      .mkw-resource-title{font-weight:950;font-size:19px;margin-bottom:6px}.mkw-resource-subtitle{color:rgba(255,255,255,.72);font-size:13px;line-height:1.35;margin-bottom:14px}
      .mkw-resource-target{width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:11px;margin:8px 0;border-radius:15px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.065);color:#fff;cursor:pointer}
      .mkw-resource-target:not(:disabled):hover{background:rgba(255,255,255,.1);border-color:rgba(255,210,77,.45)}.mkw-resource-target:disabled{opacity:.42;filter:grayscale(.75);cursor:not-allowed}
      .mkw-resource-portrait{width:48px;height:48px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,.08);flex:0 0 auto}.mkw-resource-info{flex:1;min-width:0}.mkw-resource-name{font-weight:950}.mkw-resource-class{font-size:12px;color:rgba(255,255,255,.62);margin-top:2px}
      .mkw-resource-value{font-weight:950;color:#ffd24d;white-space:nowrap}.mkw-resource-badge{font-size:10px;font-weight:950;color:#111;background:#cfd3d8;border-radius:999px;padding:3px 7px;white-space:nowrap;margin-top:5px}
      .mkw-resource-cancel{width:100%;margin-top:12px;padding:12px;border-radius:15px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer}.mkw-resource-danger{border-color:rgba(255,105,120,.5);background:rgba(255,80,100,.12)}
    `;
    document.head.appendChild(style);
  }

  function animate(btn, cls){
    ensureStyles();
    btn.classList.remove(cls);
    void btn.offsetWidth;
    btn.classList.add(cls);
  }

  function showToast(message){
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:5600;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.45);font-weight:800;text-align:center;max-width:calc(100vw - 28px);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }

  function openBaseModal(title, subtitle){
    ensureStyles();
    const modal = document.createElement("div");
    modal.className = "mkw-resource-modal";
    const panel = document.createElement("div");
    panel.className = "mkw-resource-panel";
    panel.innerHTML = `<div class="mkw-resource-title">${title}</div><div class="mkw-resource-subtitle">${subtitle}</div>`;
    modal.appendChild(panel);
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return { modal, panel };
  }

  function addCancel(panel, modal){
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mkw-resource-cancel";
    cancel.textContent = getLang() === "fr" ? "Annuler" : "Cancel";
    cancel.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      modal.remove();
    });
    panel.appendChild(cancel);
  }

  function saveRepairKeyState(index, active){
    const currentId = getCurrentCharId();
    if (!currentId) return;
    const state = getState(currentId) || { hp: 0, toggles: {} };
    state.toggles = state.toggles || {};
    const buttons = qsa("#repairKeysDisplay .key-button, #repairKeysDisplay button");
    const arr = buttons.map(btn => btn.dataset.active !== "false");
    arr[index] = active;
    state.toggles.repair_keys = arr;
    setState(currentId, state);
  }

  function updateCurrentHpUI(char, hpCur){
    if (char.id !== getCurrentCharId()) return;
    const max = Number(char?.hp?.max ?? 0);
    const curEl = qs("#hpCur");
    const maxEl = qs("#hpMaxLabel");
    const heartsEl = qs("#hpHearts");
    if (curEl) curEl.textContent = String(hpCur);
    if (maxEl) maxEl.textContent = `/ ${max}`;
    if (heartsEl) {
      heartsEl.innerHTML = "";
      for (let i = 1; i <= max; i++) {
        const img = document.createElement("img");
        img.className = "heart";
        img.alt = "HP";
        img.src = i <= hpCur ? "./assets/pv.svg" : "./assets/pv_off.svg";
        heartsEl.appendChild(img);
      }
    }
    const hpCard = qs("#hpCard");
    const heart = qsa("#hpHearts .heart")[Math.max(0, hpCur - 1)];
    if (hpCard) { hpCard.classList.remove("mkw-heal-glow"); void hpCard.offsetWidth; hpCard.classList.add("mkw-heal-glow"); setTimeout(() => hpCard.classList.remove("mkw-heal-glow"), 950); }
    if (heart) { heart.classList.remove("mkw-heart-pulse"); void heart.offsetWidth; heart.classList.add("mkw-heart-pulse"); setTimeout(() => heart.classList.remove("mkw-heart-pulse"), 850); }
  }

  async function openRepairModal(index, btn){
    const lang = getLang();
    const chars = await loadChars();
    const team = getCurrentTeam(chars);
    const { modal, panel } = openBaseModal(lang === "fr" ? "Utiliser une clé de réparation" : "Use a repair key", lang === "fr" ? "Choisis une unité alliée : elle récupère 1 PV." : "Choose an allied unit: it recovers 1 HP.");

    team.forEach(char => {
      const max = Number(char?.hp?.max ?? 0);
      const cur = getHpCur(char);
      const isMax = cur >= max;
      const target = document.createElement("button");
      target.type = "button";
      target.className = "mkw-resource-target";
      target.disabled = isMax;
      target.innerHTML = `<img class="mkw-resource-portrait" src="${getPortrait(char)}" alt=""><div class="mkw-resource-info"><div class="mkw-resource-name">${getName(char, lang)}</div><div class="mkw-resource-class">${getClass(char, lang)}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;"><div class="mkw-resource-value">${cur}/${max}</div>${isMax ? `<div class="mkw-resource-badge">${lang === "fr" ? "PV max" : "Max HP"}</div>` : ""}</div>`;
      target.addEventListener("click", () => {
        if (isMax) return;
        const newHp = Math.min(max, getHpCur(char) + 1);
        setHpCur(char, newHp);
        btn.dataset.active = "false";
        btn.style.backgroundImage = `url('${ICONS.keyOff}')`;
        btn.classList.remove("is-on");
        animate(btn, "mkw-consume");
        saveRepairKeyState(index, false);
        modal.remove();
        updateCurrentHpUI(char, newHp);
        dispatchHpUpdate(char, newHp);
        showToast(lang === "fr" ? "+1 PV réparé." : "+1 HP repaired.");
      });
      panel.appendChild(target);
    });
    addCancel(panel, modal);
  }

  function getSharedShields(){ return readJson(PREFIX + "shields", [true, true, true]); }
  function setSharedShields(value){ writeJson(PREFIX + "shields", value); }
  function getShieldAssignments(){ return readJson(PREFIX + "shield-assignments", {}); }
  function setShieldAssignments(value){ writeJson(PREFIX + "shield-assignments", value); }

  async function openShieldModal(index, btn){
    const lang = getLang();
    const chars = await loadChars();
    const team = getCurrentTeam(chars);
    const shields = getSharedShields();
    const assignments = getShieldAssignments();
    const assignedId = assignments[index] || getBlueShieldByTech()["shared-shield-" + index];
    const isAlreadyAssigned = !!assignedId || shields[index] === false || btn.dataset.active === "false";
    const isAvailable = !isAlreadyAssigned;

    const { modal, panel } = openBaseModal(isAvailable ? (lang === "fr" ? "Assigner un bouclier" : "Assign a shield") : (lang === "fr" ? "Bouclier assigné" : "Assigned shield"), isAvailable ? (lang === "fr" ? "Choisis une unité alliée à protéger." : "Choose an allied unit to protect.") : (lang === "fr" ? "Tu peux retirer ce bouclier et le remettre dans la réserve." : "You can remove this shield and return it to the pool."));

    if (!isAvailable) {
      const assigned = team.find(c => c.id === assignedId) || chars.find(c => c.id === assignedId);
      if (assigned) {
        const row = document.createElement("div");
        row.className = "mkw-resource-target";
        row.style.cursor = "default";
        row.innerHTML = `<img class="mkw-resource-portrait" src="${getPortrait(assigned)}" alt=""><div class="mkw-resource-info"><div class="mkw-resource-name">${getName(assigned, lang)}</div><div class="mkw-resource-class">${getClass(assigned, lang)}</div></div><div class="mkw-resource-value">🛡️</div>`;
        panel.appendChild(row);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mkw-resource-cancel mkw-resource-danger";
      remove.textContent = lang === "fr" ? "Retirer le bouclier" : "Remove shield";
      remove.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        shields[index] = true;
        delete assignments[index];
        setSharedShields(shields);
        setShieldAssignments(assignments);
        removeBlueShieldForSharedShield(index);
        btn.dataset.active = "true";
        btn.style.backgroundImage = `url('${ICONS.shieldOn}')`;
        btn.classList.add("is-on");
        animate(btn, "mkw-restore");
        modal.remove();
        showToast(lang === "fr" ? "Bouclier remis en réserve." : "Shield returned to pool.");
      });
      panel.appendChild(remove);
      addCancel(panel, modal);
      return;
    }

    team.forEach(char => {
      const target = document.createElement("button");
      target.type = "button";
      target.className = "mkw-resource-target";
      const cur = getHpCur(char);
      const max = Number(char?.hp?.max ?? 0);
      target.innerHTML = `<img class="mkw-resource-portrait" src="${getPortrait(char)}" alt=""><div class="mkw-resource-info"><div class="mkw-resource-name">${getName(char, lang)}</div><div class="mkw-resource-class">${getClass(char, lang)}</div></div><div class="mkw-resource-value">${cur}/${max}</div>`;
      target.addEventListener("click", () => {
        shields[index] = false;
        assignments[index] = char.id;
        setSharedShields(shields);
        setShieldAssignments(assignments);
        setBlueShieldForSharedShield(index, char.id);
        btn.dataset.active = "false";
        btn.style.backgroundImage = `url('${ICONS.shieldOff}')`;
        btn.classList.remove("is-on");
        animate(btn, "mkw-consume");
        modal.remove();
        showToast(lang === "fr" ? "Bouclier assigné." : "Shield assigned.");
      });
      panel.appendChild(target);
    });
    addCancel(panel, modal);
  }

  function patchButtons(){
    ensureStyles();
    qsa("#repairKeysDisplay .key-button, #repairKeysDisplay button").forEach((btn, index) => {
      if (btn.dataset.mkwResourcePatched === "repair") return;
      btn.dataset.mkwResourcePatched = "repair";
      btn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (btn.dataset.active === "false") { showToast(getLang() === "fr" ? "Cette clé est déjà utilisée." : "This key has already been used."); return; }
        openRepairModal(index, btn);
      }, true);
    });
    qsa("#shieldsDisplay .key-button, #shieldsDisplay button").forEach((btn, index) => {
      if (btn.dataset.mkwResourcePatched === "shield") return;
      btn.dataset.mkwResourcePatched = "shield";
      btn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openShieldModal(index, btn);
      }, true);
    });
    syncCurrentShieldGlow(getCurrentCharId());
  }

  function init(){ patchButtons(); setTimeout(patchButtons, 250); setTimeout(patchButtons, 900); setInterval(patchButtons, 2000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();