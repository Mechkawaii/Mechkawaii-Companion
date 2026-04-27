(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwTechnicianShieldUiStyles";
  let cachedChars = null;
  let applyingShield = false;

  const I18N = {
    fr: {
      title: "Bouclier du Technicien",
      help: "Choisis un allié ou toi-même pour lui donner un bouclier bleu.",
      cancel: "Annuler",
      unavailable: "Bouclier bleu déjà utilisé ce tour.",
      notEnough: "Pas assez d’énergie pour utiliser cette action de classe."
    },
    en: {
      title: "Technician Shield",
      help: "Choose an ally or this unit to give them a blue shield.",
      cancel: "Cancel",
      unavailable: "Blue shield already used this turn.",
      notEnough: "Not enough energy to use this class action."
    }
  };

  function getLang() { return localStorage.getItem(PREFIX + "lang") || "fr"; }
  function tr(key) { const lang = getLang(); return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key; }
  function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function textOf(value, lang) { if (!value) return ""; if (typeof value === "string") return value; return value[lang] || value.fr || value.en || ""; }
  function getName(char) { return textOf(char?.name, getLang()) || char?.id || "?"; }
  function getClass(char) { return textOf(char?.class, getLang()) || ""; }
  function getPortrait(char) { return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png"; }
  function currentId() { return new URL(location.href).searchParams.get("id") || ""; }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) { cachedChars = window.__cachedChars; return cachedChars; }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    return cachedChars;
  }

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentChar(chars) { return chars.find(c => c.id === currentId()) || null; }

  function getEligibleChars(chars) {
    const current = getCurrentChar(chars);
    const draftIds = getDraftIds();
    const camp = current?.camp || null;
    return chars.filter(char => {
      if (draftIds && !draftIds.includes(char.id)) return false;
      if (camp && (char.camp || "mechkawaii") !== camp) return false;
      return true;
    });
  }

  function isTechnicianChar(char) {
    const id = normalize(char?.id);
    const fr = String(char?.class?.fr || char?.class || "").toLowerCase();
    const en = String(char?.class?.en || "").toLowerCase();
    return id === "banado" || id === "genbu" || /\btechnicien\b/.test(fr) || /\btechnician\b/.test(en);
  }

  function isCurrentTechnician() {
    const id = normalize(currentId());
    return id === "banado" || id === "genbu" || /technicien|technician/.test(String(document.querySelector("#classActionTitle")?.textContent || "").toLowerCase());
  }

  function getFlow() { return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null); }
  function getRoundToken() { const f = getFlow(); return f ? `${f.roundNumber}:${f.currentCamp}` : "free"; }
  function blueShieldLockKey(id = currentId()) { return PREFIX + "blue-shield-turn-lock:" + id; }

  function blueShieldUsedThisTurn(id = currentId()) {
    const state = readJson(blueShieldLockKey(id), null);
    return !!state && state.token === getRoundToken() && state.used === true;
  }

  function lockBlueShieldForTurn(id = currentId()) {
    writeJson(blueShieldLockKey(id), { token: getRoundToken(), used: true });
  }

  function unlockStaleBlueShieldLock(id = currentId()) {
    const state = readJson(blueShieldLockKey(id), null);
    if (state && state.token !== getRoundToken()) localStorage.removeItem(blueShieldLockKey(id));
  }

  function getActionState(id) {
    const token = getRoundToken();
    const state = readJson(PREFIX + "turn-actions:" + id, { token, used: {} });
    return state.token === token ? state : { token, used: {} };
  }

  function isClassActionAlreadyUsed() {
    const state = getActionState(currentId());
    return Number(state.used?.class_action || 0) > 0;
  }

  function canUseClassAction() {
    unlockStaleBlueShieldLock();
    if (blueShieldUsedThisTurn()) return false;
    if (isClassActionAlreadyUsed()) return false;
    if (typeof window.mkwCanSpendEnergyAction === "function") return window.mkwCanSpendEnergyAction("class_action");
    return true;
  }

  function spendClassAction() {
    unlockStaleBlueShieldLock();
    if (blueShieldUsedThisTurn()) return false;
    if (isClassActionAlreadyUsed()) return false;
    if (typeof window.mkwSpendEnergyAction === "function") return !!window.mkwSpendEnergyAction("class_action");
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-action-validated", { detail: { charId: currentId(), action: "class_action" } }));
    return true;
  }

  function showToast(message) {
    const root = document.querySelector("#mkwToastRoot");
    if (root) {
      const el = document.createElement("div");
      el.className = "mkw-toast";
      el.textContent = message;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2300);
      return;
    }
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.45);font-weight:850;text-align:center;max-width:calc(100vw - 28px);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-tech-shield-backdrop { position: fixed; inset: 0; z-index: 9400; background: rgba(0,0,0,.68); display: flex; align-items: center; justify-content: center; padding: 18px; }
      .mkw-tech-shield-panel { width: min(460px, 100%); max-height: 82vh; overflow: auto; background: linear-gradient(180deg,#1a1a24,#101018); color: #fff; border: 1px solid rgba(255,255,255,.15); border-radius: 20px; box-shadow: 0 22px 55px rgba(0,0,0,.58); padding: 16px; }
      .mkw-tech-shield-title { font-weight: 950; font-size: 19px; margin-bottom: 6px; color: #fff; }
      .mkw-tech-shield-help { color: rgba(255,255,255,.72); font-size: 13px; line-height: 1.35; margin-bottom: 14px; }
      .mkw-tech-shield-target { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; padding: 11px; margin: 8px 0; border-radius: 15px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.065); color: #fff; cursor: pointer; box-shadow: none; min-height: 70px; }
      .mkw-tech-shield-target:hover { background: rgba(80,150,255,.12); border-color: rgba(80,150,255,.52); }
      .mkw-tech-shield-target:disabled { opacity: .42; filter: grayscale(.65); cursor: not-allowed; }
      .mkw-tech-shield-portrait { width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,.08); flex: 0 0 auto; padding: 4px; }
      .mkw-tech-shield-info { flex: 1; min-width: 0; }
      .mkw-tech-shield-name { font-weight: 950; color: #fff; line-height: 1.15; }
      .mkw-tech-shield-class { font-size: 12px; color: rgba(255,255,255,.62); margin-top: 2px; line-height: 1.2; }
      .mkw-tech-shield-cancel { width: 100%; margin-top: 12px; padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #fff; font-weight: 900; cursor: pointer; }
      .mkw-tech-class-action-disabled { opacity: .42 !important; filter: grayscale(.65) !important; cursor: not-allowed !important; }
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    applyingShield = false;
    document.querySelector(".mkw-tech-shield-backdrop")?.remove();
  }

  function syncClassActionToggle() {
    if (!isCurrentTechnician()) return;
    unlockStaleBlueShieldLock();
    const used = blueShieldUsedThisTurn() || isClassActionAlreadyUsed();
    const canUse = canUseClassAction();
    const input = document.querySelector("#classActionTitle")?.closest(".card")?.querySelector(".mkw-energy-switch input");
    const label = input?.closest(".mkw-energy-switch");
    if (input) {
      input.checked = used;
      input.disabled = used || !canUse;
    }
    if (label) {
      label.classList.toggle("is-disabled", used || !canUse);
      label.classList.toggle("mkw-tech-class-action-disabled", used || !canUse);
    }
  }

  function applyShield(technicianId, targetId) {
    if (applyingShield) return;
    if (blueShieldUsedThisTurn(technicianId) || blueShieldUsedThisTurn()) {
      showToast(tr("unavailable"));
      syncClassActionToggle();
      closeModal();
      return;
    }

    applyingShield = true;
    document.querySelectorAll(".mkw-tech-shield-target").forEach(btn => { btn.disabled = true; });

    if (!spendClassAction()) {
      applyingShield = false;
      showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("unavailable") : tr("notEnough"));
      syncClassActionToggle();
      closeModal();
      return;
    }

    lockBlueShieldForTurn(technicianId);
    lockBlueShieldForTurn(currentId());

    const byTech = readJson(PREFIX + "blue-shield-by-tech", {});
    byTech[technicianId] = targetId;
    writeJson(PREFIX + "blue-shield-by-tech", byTech);
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId: targetId, type: "technician" } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:technician-shield-applied", { detail: { technicianId, targetId } }));
    syncClassActionToggle();
    closeModal();
    setTimeout(() => location.reload(), 60);
  }

  async function openModal() {
    ensureStyles();
    closeModal();
    unlockStaleBlueShieldLock();

    if (!canUseClassAction()) {
      showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("unavailable") : tr("notEnough"));
      syncClassActionToggle();
      return;
    }

    const chars = await loadChars();
    const current = getCurrentChar(chars);
    if (!current || !isTechnicianChar(current)) return;
    const team = getEligibleChars(chars);

    const backdrop = document.createElement("div");
    backdrop.className = "mkw-tech-shield-backdrop";
    const panel = document.createElement("div");
    panel.className = "mkw-tech-shield-panel";
    panel.innerHTML = `<div class="mkw-tech-shield-title">${tr("title")}</div><div class="mkw-tech-shield-help">${tr("help")}</div>`;

    team.forEach(char => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mkw-tech-shield-target";
      row.innerHTML = `<img class="mkw-tech-shield-portrait" src="${getPortrait(char)}" alt=""><div class="mkw-tech-shield-info"><div class="mkw-tech-shield-name">${getName(char)}</div><div class="mkw-tech-shield-class">${getClass(char)}</div></div>`;
      row.addEventListener("click", () => applyShield(current.id, char.id));
      panel.appendChild(row);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mkw-tech-shield-cancel";
    cancel.textContent = tr("cancel");
    cancel.addEventListener("click", () => { closeModal(); syncClassActionToggle(); });
    panel.appendChild(cancel);
    backdrop.appendChild(panel);
    backdrop.addEventListener("click", event => { if (event.target === backdrop) { closeModal(); syncClassActionToggle(); } });
    document.body.appendChild(backdrop);
  }

  function isBlueShieldButton(button) {
    if (!button || button.closest(".mkw-tech-shield-backdrop")) return false;
    const card = button.closest(".card");
    if (!card || !card.querySelector("#classActionTitle")) return false;
    const title = document.querySelector("#classActionTitle")?.textContent?.toLowerCase() || "";
    const body = document.querySelector("#classActionBody")?.textContent?.toLowerCase() || "";
    const text = `${button.textContent || ""} ${title} ${body}`.toLowerCase();
    return /technicien|technician|bouclier|shield|proteger|protéger|protect/.test(text);
  }

  function isClassActionEnergySwitch(target) {
    const card = target?.closest?.(".card");
    if (!card || !card.querySelector("#classActionTitle")) return false;
    return !!target.closest(".mkw-energy-switch");
  }

  function bindClassActionSwitch() {
    document.addEventListener("click", event => {
      if (!isCurrentTechnician()) return;
      const switchEl = event.target.closest?.(".mkw-energy-switch");
      if (!switchEl || !isClassActionEnergySwitch(switchEl)) return;
      if (switchEl.closest(".mkw-tech-shield-backdrop")) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (!canUseClassAction()) {
        showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("unavailable") : tr("notEnough"));
        syncClassActionToggle();
        return;
      }
      openModal();
    }, true);

    document.addEventListener("change", event => {
      if (!isCurrentTechnician()) return;
      if (!isClassActionEnergySwitch(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      syncClassActionToggle();
    }, true);
  }

  function bindBlueShieldButton() {
    document.addEventListener("click", event => {
      const button = event.target.closest && event.target.closest("button, [role='button']");
      if (!isBlueShieldButton(button)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (!canUseClassAction()) {
        showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("unavailable") : tr("notEnough"));
        syncClassActionToggle();
        return;
      }
      openModal();
    }, true);
  }

  function init() {
    ensureStyles();
    bindBlueShieldButton();
    bindClassActionSwitch();
    window.addEventListener("mechkawaii:energy-updated", () => setTimeout(syncClassActionToggle, 60));
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(syncClassActionToggle, 60));
    window.addEventListener("mechkawaii:turn-start", () => setTimeout(syncClassActionToggle, 60));
    window.addEventListener("pageshow", () => setTimeout(syncClassActionToggle, 60));
    setTimeout(syncClassActionToggle, 300);
    setTimeout(syncClassActionToggle, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();