(function () {
  "use strict";

  const STORAGE_PREFIX = "mechkawaii:";
  const KEY_ICON_ON = "./assets/icons/key_on.svg";
  const KEY_ICON_OFF = "./assets/icons/key_off.svg";

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  function getLang(){
    return localStorage.getItem(STORAGE_PREFIX + "lang") || "fr";
  }

  function getCurrentCharId(){
    return new URL(location.href).searchParams.get("id");
  }

  function readJson(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      return fallback;
    }
  }

  function getState(charId){
    return readJson(STORAGE_PREFIX + "state:" + charId, null);
  }

  function setState(charId, state){
    localStorage.setItem(STORAGE_PREFIX + "state:" + charId, JSON.stringify(state));
  }

  async function loadCharactersSafe(){
    if (Array.isArray(window.__cachedChars)) return window.__cachedChars;
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Cannot load characters.json");
    const chars = await res.json();
    window.__cachedChars = chars;
    return chars;
  }

  function getDraftIds(){
    const draft = readJson(STORAGE_PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCharName(char, lang){
    const name = char?.name;
    if (!name) return char?.id || "?";
    if (typeof name === "string") return name;
    return name[lang] || name.fr || char.id;
  }

  function getCharClass(char, lang){
    const cls = char?.class;
    if (!cls) return "";
    if (typeof cls === "string") return cls;
    return cls[lang] || cls.fr || "";
  }

  function getCharHpMax(char){
    return Number(char?.hp?.max ?? 0);
  }

  function ensureStateForChar(char){
    const id = char.id;
    const max = getCharHpMax(char);
    const existing = getState(id);
    if (existing && typeof existing === "object") {
      const hp = existing.hp || {};
      return {
        ...existing,
        hp: {
          max: Number(hp.max ?? max),
          cur: Number(hp.cur ?? hp.max ?? max)
        }
      };
    }
    return { hp: { max, cur: max }, toggles: {} };
  }

  function getRepairKeyButtons(){
    const root = qs("#repairKeysDisplay");
    if (!root) return [];
    return qsa(".key-button, button", root).filter(btn => {
      const bg = String(btn.style.backgroundImage || "");
      return btn.dataset.toggleId === "repair_keys" || bg.includes("key_");
    });
  }

  function getRepairKeysState(){
    const buttons = getRepairKeyButtons();
    return buttons.map(btn => btn.dataset.active !== "false");
  }

  function setRepairKeysState(state){
    const buttons = getRepairKeyButtons();
    buttons.forEach((btn, index) => {
      const active = !!state[index];
      btn.dataset.active = active ? "true" : "false";
      btn.style.backgroundImage = `url('${active ? KEY_ICON_ON : KEY_ICON_OFF}')`;
      btn.classList.toggle("is-on", active);
    });
  }

  function saveCurrentRepairKeysState(keyIndex, active){
    const currentId = getCurrentCharId();
    if (!currentId) return;
    const currentChar = window.__repairKeysCurrentChar;
    const currentState = currentChar ? ensureStateForChar(currentChar) : (getState(currentId) || { hp: { max: 0, cur: 0 }, toggles: {} });
    const keysState = getRepairKeysState();
    keysState[keyIndex] = active;
    currentState.toggles = currentState.toggles || {};
    currentState.toggles.repair_keys = keysState;
    setState(currentId, currentState);
  }

  function refreshHpDisplayIfCurrent(targetId, targetState){
    if (targetId !== getCurrentCharId()) return;
    const curEl = qs("#hpCur");
    const maxEl = qs("#hpMaxLabel");
    const heartsEl = qs("#hpHearts");
    if (curEl) curEl.textContent = String(targetState.hp.cur);
    if (maxEl) maxEl.textContent = `/ ${targetState.hp.max}`;
    if (heartsEl) {
      heartsEl.innerHTML = "";
      for (let i = 1; i <= targetState.hp.max; i++) {
        const img = document.createElement("img");
        img.className = "heart";
        img.alt = "HP";
        img.src = i <= targetState.hp.cur ? "./assets/pv.svg" : "./assets/pv_off.svg";
        heartsEl.appendChild(img);
      }
    }
    window.dispatchEvent(new CustomEvent("mechkawaii:hp-updated", { detail: { charId: targetId, state: targetState } }));
  }

  function showToast(message){
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:5000;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.45);font-weight:700;text-align:center;max-width:calc(100vw - 28px);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }

  function closeModal(modal){
    modal?.remove();
  }

  async function openRepairModal(keyIndex){
    const lang = getLang();
    const currentId = getCurrentCharId();
    const chars = await loadCharactersSafe();
    const currentChar = chars.find(c => c.id === currentId);
    if (!currentChar) return;

    window.__repairKeysCurrentChar = currentChar;

    const currentCamp = currentChar.camp || "mechkawaii";
    const draftIds = getDraftIds();
    const candidates = chars.filter(char => {
      if ((char.camp || "mechkawaii") !== currentCamp) return false;
      if (draftIds && !draftIds.includes(char.id)) return false;
      return true;
    });

    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.64);display:flex;align-items:center;justify-content:center;padding:18px;";

    const panel = document.createElement("div");
    panel.style.cssText = "width:min(440px,100%);max-height:82vh;overflow:auto;background:linear-gradient(180deg,#181820,#101018);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.55);padding:16px;";

    const title = document.createElement("div");
    title.style.cssText = "font-weight:900;font-size:18px;margin-bottom:6px;";
    title.textContent = lang === "fr" ? "Utiliser une clé de réparation" : "Use a repair key";

    const subtitle = document.createElement("div");
    subtitle.style.cssText = "color:rgba(255,255,255,.72);font-size:13px;line-height:1.35;margin-bottom:14px;";
    subtitle.textContent = lang === "fr"
      ? "Choisis une unité alliée : elle récupère 1 PV."
      : "Choose an allied unit: it recovers 1 HP.";

    panel.appendChild(title);
    panel.appendChild(subtitle);

    candidates.forEach(char => {
      const state = ensureStateForChar(char);
      const isMax = state.hp.cur >= state.hp.max;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.cssText = "width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:11px;margin:8px 0;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;";

      const portrait = document.createElement("img");
      portrait.src = char.portrait || char.icon || "./assets/heart.png";
      portrait.alt = "";
      portrait.style.cssText = "width:46px;height:46px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.08);flex:0 0 auto;";

      const info = document.createElement("div");
      info.style.cssText = "flex:1;min-width:0;";
      info.innerHTML = `
        <div style="font-weight:900;">${getCharName(char, lang)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.62);">${getCharClass(char, lang)}</div>
      `;

      const hp = document.createElement("div");
      hp.style.cssText = "font-weight:900;color:#ffd24d;white-space:nowrap;";
      hp.textContent = `${state.hp.cur}/${state.hp.max}`;

      btn.appendChild(portrait);
      btn.appendChild(info);
      btn.appendChild(hp);

      btn.addEventListener("click", () => {
        const latest = ensureStateForChar(char);
        if (latest.hp.cur >= latest.hp.max) {
          showToast(lang === "fr" ? "Cette unité a déjà ses PV max." : "This unit is already at max HP.");
          return;
        }

        latest.hp.cur = Math.min(latest.hp.max, latest.hp.cur + 1);
        setState(char.id, latest);
        refreshHpDisplayIfCurrent(char.id, latest);

        const keysState = getRepairKeysState();
        keysState[keyIndex] = false;
        setRepairKeysState(keysState);
        saveCurrentRepairKeysState(keyIndex, false);

        closeModal(modal);
        showToast(lang === "fr" ? "+1 PV réparé." : "+1 HP repaired.");
        setTimeout(() => location.reload(), 160);
      });

      panel.appendChild(btn);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = lang === "fr" ? "Annuler" : "Cancel";
    cancel.style.cssText = "width:100%;margin-top:12px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:800;cursor:pointer;";
    cancel.addEventListener("click", () => closeModal(modal));

    panel.appendChild(cancel);
    modal.appendChild(panel);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
    document.body.appendChild(modal);
  }

  function patchRepairKeys(){
    const currentId = getCurrentCharId();
    if (!currentId) return;

    const buttons = getRepairKeyButtons();
    if (!buttons.length) return;

    buttons.forEach((btn, index) => {
      if (btn.dataset.repairKeyPatched === "1") return;
      btn.dataset.repairKeyPatched = "1";
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (btn.dataset.active === "false") {
          showToast(getLang() === "fr" ? "Cette clé est déjà utilisée." : "This key has already been used.");
          return;
        }
        openRepairModal(index);
      }, true);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(patchRepairKeys, 250);
    setTimeout(patchRepairKeys, 800);
    setInterval(patchRepairKeys, 2000);
  });
})();