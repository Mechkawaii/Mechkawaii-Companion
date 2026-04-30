(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const HISTORY_KEY = PREFIX + "action-history";
  const MAX_HISTORY = 30;

  const I18N = {
    fr: {
      history: "Historique",
      close: "Fermer",
      clear: "Vider",
      empty: "Aucune action pour le moment.",
      hpLost: "{name} perd 1 PV.",
      hpGained: "{name} récupère 1 PV.",
      keyUsed: "Clé de réparation utilisée.",
      shieldApplied: "Bouclier appliqué à {name}.",
      shieldRemoved: "Bouclier retiré de {name}.",
      ultUsed: "Coup unique utilisé.",
      ultReady: "Coup unique réactivé.",
      reset: "Fiche réinitialisée.",
      generic: "Action enregistrée."
    },
    en: {
      history: "History",
      close: "Close",
      clear: "Clear",
      empty: "No actions yet.",
      hpLost: "{name} loses 1 HP.",
      hpGained: "{name} recovers 1 HP.",
      keyUsed: "Repair Key used.",
      shieldApplied: "Shield applied to {name}.",
      shieldRemoved: "Shield removed from {name}.",
      ultUsed: "Ultimate Ability used.",
      ultReady: "Ultimate Ability rearmed.",
      reset: "Character sheet reset.",
      generic: "Action saved."
    }
  };

  let previousHp = null;
  let previousShieldAssignments = null;
  let previousUltUsed = null;
  let historyPanel = null;
  let toastRoot = null;

  function getLang() { return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key, vars = {}) {
    const lang = getLang();
    let text = (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
    Object.keys(vars).forEach(name => { text = text.replaceAll("{" + name + "}", vars[name]); });
    return text;
  }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function getCurrentCharId() { return new URL(location.href).searchParams.get("id") || ""; }
  function getCurrentName() { return document.querySelector("#charName")?.textContent?.trim() || getCurrentCharId() || "?"; }
  function getCurrentHp() { const n = Number(document.querySelector("#hpCur")?.textContent?.trim()); return Number.isFinite(n) ? n : null; }
  function getState() { const id = getCurrentCharId(); return id ? readJson(PREFIX + "state:" + id, {}) : {}; }
  function getUltUsed() {
    const state = getState();
    if (typeof state.ultUsed === "boolean") return state.ultUsed;
    if (typeof state.ultimateUsed === "boolean") return state.ultimateUsed;
    const pressed = document.querySelector("#ultToggleContainer button[aria-pressed]")?.getAttribute("aria-pressed");
    if (pressed === "true") return true;
    if (pressed === "false") return false;
    return null;
  }
  function getHistory() { return readJson(HISTORY_KEY, []); }
  function saveHistory(items) { writeJson(HISTORY_KEY, items.slice(0, MAX_HISTORY)); }

  function ensureToastRoot() {
    if (toastRoot) return toastRoot;
    toastRoot = document.createElement("div");
    toastRoot.id = "mkwToastRoot";
    document.body.appendChild(toastRoot);
    return toastRoot;
  }
  function toast(message) { ensureToastRoot(); const el = document.createElement("div"); el.className = "mkw-toast"; el.textContent = message; toastRoot.appendChild(el); setTimeout(() => el.remove(), 2700); }
  function addHistory(message, options = {}) {
    const item = { id: String(Date.now()) + Math.random().toString(16).slice(2), message, type: options.type || "generic", at: new Date().toISOString() };
    saveHistory([item, ...getHistory()].slice(0, MAX_HISTORY));
    toast(message);
    renderHistoryPanel();
  }
  function formatTime(iso) { try { return new Intl.DateTimeFormat(getLang() === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); } catch (e) { return ""; } }
  function renderHistoryPanel() {
    if (!historyPanel) return;
    const list = historyPanel.querySelector(".mkw-history-list");
    if (!list) return;
    const items = getHistory();
    list.innerHTML = "";
    if (!items.length) { const empty = document.createElement("div"); empty.className = "mkw-history-empty"; empty.textContent = tr("empty"); list.appendChild(empty); return; }
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "mkw-history-item";
      row.innerHTML = `<div class="mkw-history-dot"></div><div><div class="mkw-history-text"></div><div class="mkw-history-time">${formatTime(item.at)}</div></div>`;
      row.querySelector(".mkw-history-text").textContent = item.message;
      list.appendChild(row);
    });
  }
  function openHistory() {
    closeHistory();
    const backdrop = document.createElement("div");
    backdrop.id = "mkwHistoryBackdrop";
    backdrop.innerHTML = `<div id="mkwHistoryPanel" role="dialog" aria-modal="true"><div class="mkw-history-head"><div class="mkw-history-title">${tr("history")}</div><div class="mkw-history-actions"><button id="mkwClearHistory">${tr("clear")}</button><button id="mkwCloseHistory">${tr("close")}</button></div></div><div class="mkw-history-list"></div></div>`;
    document.body.appendChild(backdrop);
    historyPanel = backdrop.querySelector("#mkwHistoryPanel");
    renderHistoryPanel();
    backdrop.addEventListener("click", event => { if (event.target === backdrop) closeHistory(); });
    backdrop.querySelector("#mkwCloseHistory")?.addEventListener("click", closeHistory);
    backdrop.querySelector("#mkwClearHistory")?.addEventListener("click", () => { saveHistory([]); renderHistoryPanel(); });
  }
  function closeHistory() { document.querySelector("#mkwHistoryBackdrop")?.remove(); historyPanel = null; }

  function snapshot() { previousHp = getCurrentHp(); previousShieldAssignments = readJson(PREFIX + "shield-assignments", {}); previousUltUsed = getUltUsed(); }
  function checkHpChange() {
    const hp = getCurrentHp();
    if (hp === null || previousHp === null) { previousHp = hp; return; }
    if (hp === previousHp) return;
    addHistory(tr(hp < previousHp ? "hpLost" : "hpGained", { name: getCurrentName() }), { type: "hp" });
    previousHp = hp;
  }
  function checkShieldChange() {
    const current = readJson(PREFIX + "shield-assignments", {});
    const before = previousShieldAssignments || {};
    Object.keys(current).forEach(index => { if (before[index] !== current[index]) addHistory(tr("shieldApplied", { name: current[index] === getCurrentCharId() ? getCurrentName() : current[index] }), { type: "shield" }); });
    Object.keys(before).forEach(index => { if (before[index] && !current[index]) addHistory(tr("shieldRemoved", { name: before[index] === getCurrentCharId() ? getCurrentName() : before[index] }), { type: "shield" }); });
    previousShieldAssignments = current;
  }
  function checkUltChange() {
    const ult = getUltUsed();
    if (ult === null || previousUltUsed === null) { previousUltUsed = ult; return; }
    if (ult === previousUltUsed) return;
    addHistory(tr(ult ? "ultUsed" : "ultReady"), { type: "ultimate" });
    previousUltUsed = ult;
  }
  function delayedCheckAll() { setTimeout(() => { checkHpChange(); checkShieldChange(); checkUltChange(); }, 0); setTimeout(() => { checkHpChange(); checkShieldChange(); checkUltChange(); }, 120); }
  function installListeners() {
    document.addEventListener("click", event => {
      const btn = event.target && event.target.closest ? event.target.closest("button") : null;
      if (!btn) return;
      if (btn.id === "resetBtn") { setTimeout(() => { addHistory(tr("reset"), { type: "reset" }); snapshot(); }, 120); return; }
      if (btn.closest("#repairKeysDisplay") || btn.closest(".mkw-repair-modal") || (btn.textContent || "").toLowerCase().includes("réparer") || (btn.textContent || "").toLowerCase().includes("repair")) setTimeout(() => addHistory(tr("keyUsed"), { type: "repair" }), 160);
      delayedCheckAll();
    }, true);
    window.addEventListener("mechkawaii:shield-updated", delayedCheckAll);
    window.addEventListener("storage", delayedCheckAll);
  }
  function init() { ensureToastRoot(); setTimeout(snapshot, 80); installListeners(); window.mkwOpenActionHistory = openHistory; }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
