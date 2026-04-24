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

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  }
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

  function dispatchHpUpdate(){
    window.dispatchEvent(new Event("mechkawaii:hp-updated"));
  }

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
    return chars.filter(c => {
      if ((c.camp || "mechkawaii") !== camp) return false;
      if (draftIds && !draftIds.includes(c.id)) return false;
      return true;
    });
  }

  async function openRepairModal(index, btn){
    const lang = getLang();
    const chars = await loadChars();
    const team = getCurrentTeam(chars);

    const modal = document.createElement("div");
    modal.className = "mkw-resource-modal";
    const panel = document.createElement("div");
    panel.className = "mkw-resource-panel";

    panel.innerHTML = `<div class="mkw-resource-title">Utiliser une clé</div>`;

    team.forEach(char => {
      const max = Number(char?.hp?.max ?? 0);
      const cur = getHpCur(char);
      const isMax = cur >= max;

      const target = document.createElement("button");
      target.disabled = isMax;
      target.textContent = `${char.id} ${cur}/${max}`;

      target.addEventListener("click", () => {
        if (isMax) return;
        const newHp = Math.min(max, getHpCur(char) + 1);
        setHpCur(char, newHp);
        dispatchHpUpdate();
        btn.dataset.active = "false";
        modal.remove();
      });

      panel.appendChild(target);
    });

    const cancel = document.createElement("button");
    cancel.textContent = "Annuler";
    cancel.onclick = () => modal.remove();

    panel.appendChild(cancel);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }

  function patchButtons(){
    qsa("#repairKeysDisplay .key-button, #repairKeysDisplay button").forEach((btn, index) => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        openRepairModal(index, btn);
      }, true);
    });
  }

  document.addEventListener("DOMContentLoaded", patchButtons);
})();