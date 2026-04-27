(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwUltimateDisabledStateFixStyle";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  async function loadEnergyData() {
    if (window.__mkwEnergyCosts) return window.__mkwEnergyCosts;
    const res = await fetch("./data/energy-costs.json", { cache: "no-store" });
    window.__mkwEnergyCosts = await res.json();
    return window.__mkwEnergyCosts;
  }

  function getEnergy(id) {
    const state = readJson(PREFIX + "energy:" + id, null);
    if (!state || typeof state.current !== "number") return 3;
    return Math.max(0, Math.min(3, Number(state.current)));
  }

  function getUltimateCost(data, id) {
    const key = normalize(id);
    const alias = data?.aliases?.[key];
    const costs = data?.costs?.[key] || data?.costs?.[alias] || data?.costs?.[normalize(alias)] || null;
    return Number(costs?.ultimate ?? 3);
  }

  function isAlreadyUsed(btn) {
    return btn.getAttribute("aria-pressed") === "true" ||
      btn.getAttribute("aria-checked") === "true" ||
      btn.classList.contains("used") ||
      btn.classList.contains("is-used") ||
      btn.classList.contains("on") ||
      btn.dataset.active === "false";
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #ultToggleContainer .mkw-ultimate-energy-disabled,
      #ultToggleContainer .mkw-ultimate-energy-disabled * {
        opacity: .38 !important;
        filter: grayscale(.75) !important;
        cursor: not-allowed !important;
      }

      #ultToggleContainer .mkw-ultimate-energy-disabled {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.45);font-weight:850;text-align:center;max-width:calc(100vw - 28px);";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  async function applyUltimateState() {
    const id = currentId();
    if (!id) return;
    const data = await loadEnergyData();
    const energy = getEnergy(id);
    const cost = getUltimateCost(data, id);
    const disabled = energy < cost;

    document.querySelectorAll("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch").forEach(btn => {
      if (isAlreadyUsed(btn)) return;
      btn.classList.toggle("mkw-ultimate-energy-disabled", disabled);
      btn.classList.toggle("mkw-energy-disabled-action", disabled);
      btn.toggleAttribute("aria-disabled", disabled);
      btn.dataset.energyBlocked = disabled ? "1" : "0";
    });
  }

  function bindClickGuard() {
    document.addEventListener("click", event => {
      const btn = event.target.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch");
      if (!btn || btn.dataset.energyBlocked !== "1") return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      toast((localStorage.getItem(PREFIX + "lang") || "fr") === "fr" ? "Pas assez d’énergie pour utiliser ce Coup Unique." : "Not enough energy to use this Ultimate Ability.");
    }, true);
  }

  function scheduleApply() {
    clearTimeout(scheduleApply.timer);
    scheduleApply.timer = setTimeout(applyUltimateState, 40);
  }

  function init() {
    ensureStyles();
    bindClickGuard();

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-pressed", "aria-checked", "data-active"] });

    window.addEventListener("mechkawaii:energy-updated", scheduleApply);
    window.addEventListener("mechkawaii:game-flow-updated", scheduleApply);
    window.addEventListener("mechkawaii:turn-start", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);

    setTimeout(applyUltimateState, 100);
    setTimeout(applyUltimateState, 400);
    setTimeout(applyUltimateState, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
