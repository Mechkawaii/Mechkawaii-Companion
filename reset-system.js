(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwResetSystemStyles";
  let resetAllBound = false;
  let resetUnitBound = false;

  const I18N = {
    fr: {
      resetAllTitle: "Tout réinitialiser ?",
      resetAllText: "Cette action remet toute l’application à zéro : configuration, unités choisies, PV, boucliers, énergie, tours, historique et effets actifs. Tu reviendras au menu d’accueil.",
      resetUnitTitle: "Réinitialiser cette unité ?",
      resetUnitText: "Cette action remet uniquement l’unité active à zéro : PV, clés de réparation, boucliers liés, énergie, actions du tour, Coup Unique et effets actifs.",
      cancel: "Annuler",
      confirmAll: "Oui, tout réinitialiser",
      confirmUnit: "Oui, réinitialiser l’unité",
      resetUnitLabel: "Réinitialiser l’unité"
    },
    en: {
      resetAllTitle: "Reset everything?",
      resetAllText: "This will fully reset the app: setup, selected units, HP, shields, energy, turns, history and active effects. You will return to the home menu.",
      resetUnitTitle: "Reset this unit?",
      resetUnitText: "This will reset only the active unit: HP, repair keys, linked shields, energy, turn actions, Ultimate Ability and active effects.",
      cancel: "Cancel",
      confirmAll: "Yes, reset everything",
      confirmUnit: "Yes, reset unit",
      resetUnitLabel: "Reset unit"
    }
  };

  function getLang() { return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key) { const lang = getLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function currentId() { return new URL(location.href).searchParams.get("id") || ""; }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-reset-hidden { display: none !important; }
      .mkw-reset-backdrop { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0,0,0,.68); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .mkw-reset-panel { width: min(460px, 100%); color: #fff; background: linear-gradient(180deg, #1a1a24, #101018); border: 1px solid rgba(255,255,255,.15); border-radius: 22px; box-shadow: 0 24px 70px rgba(0,0,0,.6); padding: 18px; }
      .mkw-reset-title { font-size: 20px; font-weight: 950; margin-bottom: 8px; }
      .mkw-reset-text { color: rgba(255,255,255,.74); font-size: 14px; line-height: 1.4; margin-bottom: 16px; }
      .mkw-reset-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
      .mkw-reset-actions button { border-radius: 14px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.08); color: #fff; font-weight: 900; padding: 11px 13px; cursor: pointer; }
      .mkw-reset-actions .mkw-reset-danger { border-color: rgba(255,89,119,.7); background: rgba(255,89,119,.18); }
      @media (max-width: 520px) { .mkw-reset-actions button { width: 100%; } }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function confirmModal({ title, text, confirmText, onConfirm }) {
    ensureStyles();
    document.querySelector(".mkw-reset-backdrop")?.remove();

    const backdrop = document.createElement("div");
    backdrop.className = "mkw-reset-backdrop";
    backdrop.innerHTML = `
      <div class="mkw-reset-panel" role="dialog" aria-modal="true">
        <div class="mkw-reset-title"></div>
        <div class="mkw-reset-text"></div>
        <div class="mkw-reset-actions">
          <button type="button" class="mkw-reset-cancel"></button>
          <button type="button" class="mkw-reset-danger"></button>
        </div>
      </div>
    `;
    backdrop.querySelector(".mkw-reset-title").textContent = title;
    backdrop.querySelector(".mkw-reset-text").textContent = text;
    backdrop.querySelector(".mkw-reset-cancel").textContent = tr("cancel");
    backdrop.querySelector(".mkw-reset-danger").textContent = confirmText;
    backdrop.querySelector(".mkw-reset-cancel").addEventListener("click", () => backdrop.remove());
    backdrop.querySelector(".mkw-reset-danger").addEventListener("click", () => { backdrop.remove(); onConfirm(); });
    backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.remove(); });
    document.body.appendChild(backdrop);
  }

  function forceHomeImmediately() {
    localStorage.removeItem(PREFIX + "splashDismissed");
    sessionStorage.setItem(PREFIX + "skipResumeOnce", "1");
    sessionStorage.setItem(PREFIX + "forceHomeMenu", "1");
    document.documentElement.classList.remove("splash-dismissed");
    document.body?.classList.add("has-splash");
  }

  function resetEverything() {
    const lang = localStorage.getItem(PREFIX + "lang");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
    if (lang) localStorage.setItem(PREFIX + "lang", lang);
    forceHomeImmediately();
    location.assign("./index.html?reset=" + Date.now() + "#home");
  }

  function removeUnitFromObjectMap(key, id) {
    const map = readJson(key, null);
    if (!map || typeof map !== "object" || Array.isArray(map)) return;
    let changed = false;
    Object.keys(map).forEach(k => {
      const value = map[k];
      const serialized = JSON.stringify(value);
      if (k === id || value === id || (serialized && serialized.includes(`\"${id}\"`))) {
        delete map[k];
        changed = true;
      }
    });
    if (changed) writeJson(key, map);
  }

  function resetSharedShieldIfAssigned(id) {
    const assignments = readJson(PREFIX + "shield-assignments", null);
    const shields = readJson(PREFIX + "shields", null);
    if (!assignments || typeof assignments !== "object" || Array.isArray(assignments)) return;
    let changed = false;
    Object.keys(assignments).forEach(k => {
      const value = assignments[k];
      const serialized = JSON.stringify(value);
      const related = k === id || value === id || (serialized && serialized.includes(`\"${id}\"`));
      if (!related) return;
      const possibleIndex = Number(k);
      const valueIndex = Number(value);
      if (Array.isArray(shields)) {
        if (Number.isInteger(possibleIndex) && possibleIndex >= 0 && possibleIndex < shields.length) shields[possibleIndex] = true;
        if (Number.isInteger(valueIndex) && valueIndex >= 0 && valueIndex < shields.length) shields[valueIndex] = true;
        if (value && typeof value === "object" && Number.isInteger(Number(value.index))) {
          const idx = Number(value.index);
          if (idx >= 0 && idx < shields.length) shields[idx] = true;
        }
      }
      delete assignments[k];
      changed = true;
    });
    if (changed) writeJson(PREFIX + "shield-assignments", assignments);
    if (Array.isArray(shields)) writeJson(PREFIX + "shields", shields);
  }

  function resetUnit(id) {
    if (!id) return;
    localStorage.removeItem(PREFIX + "state:" + id);
    localStorage.removeItem(PREFIX + "energy:" + id);
    localStorage.removeItem(PREFIX + "turn-actions:" + id);
    localStorage.removeItem(PREFIX + "road-start:" + id);
    localStorage.removeItem(PREFIX + "blue-shield-turn-lock:" + id);
    resetSharedShieldIfAssigned(id);
    removeUnitFromObjectMap(PREFIX + "blue-shield-by-tech", id);
    removeUnitFromObjectMap(PREFIX + "cu-badges", id);
    const copied = readJson(PREFIX + "copied-cu", null);
    if (copied) {
      const serialized = JSON.stringify(copied);
      if (serialized && serialized.includes(`\"${id}\"`)) localStorage.removeItem(PREFIX + "copied-cu");
    }
    window.dispatchEvent(new CustomEvent("mechkawaii:unit-reset", { detail: { charId: id } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: id } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId: id } }));
    location.reload();
  }

  function isResetAllButton(el) {
    const btn = el?.closest?.("button, [role='button'], a");
    if (!btn) return null;
    if (btn.matches("#resetSetupBtn, [data-reset-all], .mkw-reset-all")) return btn;
    const text = normalizeText(btn.textContent || btn.getAttribute("aria-label") || btn.getAttribute("title"));
    if (text === "tout reinitialiser" || text === "reset everything") return btn;
    return null;
  }

  function isResetUnitButton(el) {
    const btn = el?.closest?.("#resetBtn");
    return btn || null;
  }

  function showResetAllConfirm() {
    confirmModal({ title: tr("resetAllTitle"), text: tr("resetAllText"), confirmText: tr("confirmAll"), onConfirm: resetEverything });
  }

  function showResetUnitConfirm() {
    confirmModal({ title: tr("resetUnitTitle"), text: tr("resetUnitText"), confirmText: tr("confirmUnit"), onConfirm: () => resetUnit(currentId()) });
  }

  function bindResetAll() {
    if (resetAllBound) return;
    resetAllBound = true;
    document.addEventListener("click", event => {
      if (event.target.closest?.(".mkw-reset-backdrop")) return;
      const btn = isResetAllButton(event.target);
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showResetAllConfirm();
    }, true);
  }

  function bindResetUnit() {
    if (resetUnitBound) return;
    resetUnitBound = true;
    document.addEventListener("click", event => {
      if (event.target.closest?.(".mkw-reset-backdrop")) return;
      const btn = isResetUnitButton(event.target);
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showResetUnitConfirm();
    }, true);
  }

  function polishUi() {
    const resetBtn = document.querySelector("#resetBtn");
    if (resetBtn && resetBtn.textContent !== tr("resetUnitLabel")) resetBtn.textContent = tr("resetUnitLabel");
    document.querySelectorAll(".mkw-reset-flow").forEach(btn => {
      if (!btn.classList.contains("mkw-reset-hidden")) btn.classList.add("mkw-reset-hidden");
    });
  }

  function init() {
    ensureStyles();
    bindResetAll();
    bindResetUnit();
    polishUi();
    setTimeout(polishUi, 150);
    setTimeout(polishUi, 600);
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(polishUi, 0));
    window.addEventListener("pageshow", polishUi);
  }

  bindResetAll();
  bindResetUnit();

  window.mkwResetEverything = resetEverything;
  window.mkwResetUnit = resetUnit;
  window.mkwShowResetEverythingConfirm = showResetAllConfirm;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
