(function () {
  "use strict";

  const STORAGE_PREFIX = "mechkawaii:";
  const KEY_ICON_ON = "./assets/icons/key_on.svg";
  const KEY_ICON_OFF = "./assets/icons/key_off.svg";

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  function getLang(){ return localStorage.getItem(STORAGE_PREFIX + "lang") || "fr"; }
  function getCurrentCharId(){ return new URL(location.href).searchParams.get("id"); }

  function readJson(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch(e){ return fallback; }
  }

  function getState(charId){ return readJson(STORAGE_PREFIX + "state:" + charId, null); }
  function setState(charId, state){ localStorage.setItem(STORAGE_PREFIX + "state:" + charId, JSON.stringify(state)); }

  function ensureRepairStyles(){
    if (document.getElementById("mkwRepairKeyStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwRepairKeyStyles";
    style.textContent = `.mkw-repair-target--max{opacity:.42!important;filter:grayscale(.75);cursor:not-allowed!important}`;
    document.head.appendChild(style);
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

  function getCharHpMax(char){ return Number(char?.hp?.max ?? 0); }

  function ensureStateForChar(char){
    const id = char.id;
    const max = getCharHpMax(char);
    const existing = getState(id);

    if (existing && typeof existing === "object") {
      const hp = existing.hp || {};

      return {
        ...existing,
        hp: {
          max: max, // 🔥 force le vrai max depuis le JSON
          cur: Math.min(Number(hp.cur ?? max), max)
        }
      };
    }

    return { hp: { max, cur: max }, toggles: {} };
  }

  function getRepairKeyButtons(){
    const root = qs("#repairKeysDisplay");
    if (!root) return [];
    return qsa(".key-button, button", root);
  }

  function getRepairKeysState(){ return getRepairKeyButtons().map(btn => btn.dataset.active !== "false"); }

  function setRepairKeysState(state){
    getRepairKeyButtons().forEach((btn, index) => {
      const active = !!state[index];
      btn.dataset.active = active ? "true" : "false";
      btn.style.backgroundImage = `url('${active ? KEY_ICON_ON : KEY_ICON_OFF}')`;
    });
  }

  function saveCurrentRepairKeysState(keyIndex, active){
    const currentId = getCurrentCharId();
    if (!currentId) return;

    const currentState = getState(currentId) || { hp: { max: 0, cur: 0 }, toggles: {} };
    const keysState = getRepairKeysState();

    keysState[keyIndex] = active;
    currentState.toggles = currentState.toggles || {};
    currentState.toggles.repair_keys = keysState;

    setState(currentId, currentState);
  }

})();