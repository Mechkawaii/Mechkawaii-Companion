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

  function ensureButtonFX(){
    if (document.getElementById("mkwButtonFx")) return;
    const style = document.createElement("style");
    style.id = "mkwButtonFx";
    style.textContent = `
      @keyframes mkwConsume { 0%{transform:scale(1);opacity:1} 40%{transform:scale(.7);opacity:.4} 100%{transform:scale(1);opacity:1} }
      @keyframes mkwRestore { 0%{transform:scale(.7);opacity:.4} 40%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
      .mkw-consume { animation: mkwConsume .35s ease; }
      .mkw-restore { animation: mkwRestore .4s ease; }
    `;
    document.head.appendChild(style);
  }

  function animateConsume(btn){
    ensureButtonFX();
    btn.classList.remove("mkw-consume");
    void btn.offsetWidth;
    btn.classList.add("mkw-consume");
  }

  function animateRestore(btn){
    ensureButtonFX();
    btn.classList.remove("mkw-restore");
    void btn.offsetWidth;
    btn.classList.add("mkw-restore");
  }

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
    setState(char.id, current);
    return current;
  }

  function dispatchHpUpdate(char, hpCur){
    window.dispatchEvent(new CustomEvent("mechkawaii:hp-updated", { detail: { charId: char?.id, hp: hpCur } }));
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
    return chars.filter(c => (c.camp || "mechkawaii") === camp && (!draftIds || draftIds.includes(c.id)));
  }

  function openModal(title, subtitle){
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

  async function openRepairModal(index, btn){
    const lang = getLang();
    const chars = await loadChars();
    const team = getCurrentTeam(chars);
    const { modal, panel } = openModal("Réparer", "Choisis une unité");

    team.forEach(char => {
      const max = Number(char.hp.max);
      const cur = getHpCur(char);
      const target = document.createElement("button");
      target.textContent = `${char.id} ${cur}/${max}`;
      target.disabled = cur >= max;

      target.onclick = () => {
        if (cur >= max) return;
        const newHp = Math.min(max, cur + 1);
        setHpCur(char, newHp);
        btn.dataset.active = "false";
        animateConsume(btn);
        modal.remove();
        dispatchHpUpdate(char, newHp);
      };

      panel.appendChild(target);
    });

    const cancel = document.createElement("button");
    cancel.textContent = "Annuler";
    cancel.onclick = () => modal.remove();
    panel.appendChild(cancel);
  }

  function patchButtons(){
    qsa("#repairKeysDisplay button, #repairKeysDisplay .key-button").forEach((btn, i) => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        openRepairModal(i, btn);
      }, true);
    });

    qsa("#shieldsDisplay button, #shieldsDisplay .key-button").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        animateConsume(btn);
      }, true);
    });
  }

  document.addEventListener("DOMContentLoaded", patchButtons);
})();
