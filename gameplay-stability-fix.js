(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  let pendingUltimate = null;
  let cachedChars = null;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
  }

  function getRoundToken(flow = getFlow()) {
    return flow ? `${flow.roundNumber}:${flow.currentCamp}` : "free";
  }

  function getActionState(id) {
    const token = getRoundToken();
    const state = readJson(PREFIX + "turn-actions:" + id, { token, used: {} });
    return state.token === token ? state : { token, used: {} };
  }

  function getActionFromContext(el) {
    const card = el?.closest?.(".card");
    if (!card) return null;
    if (card.querySelector("#movementDesc") || card.querySelector("#movementImg")) return "move";
    if (card.querySelector("#attackDesc") || card.querySelector("#attackImg")) return "ranged_attack";
    if (card.querySelector("#classActionTitle") || card.querySelector("#classActionBody")) return "class_action";
    if (card.querySelector("#ultTitle") || card.querySelector("#ultToggleContainer")) return "ultimate";
    return null;
  }

  function canSpend(action) {
    if (!action) return true;
    if (typeof window.mkwCanSpendEnergyAction === "function") return window.mkwCanSpendEnergyAction(action);
    return true;
  }

  function spend(action) {
    if (!action) return false;
    if (typeof window.mkwSpendEnergyAction === "function") return window.mkwSpendEnergyAction(action);
    return false;
  }

  function blockEvent(event, message) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showToast(message || (getLang() === "fr" ? "Action impossible." : "Action unavailable."));
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function showToast(message) {
    const root = document.querySelector("#mkwToastRoot");
    if (root) {
      const el = document.createElement("div");
      el.className = "mkw-toast";
      el.textContent = message;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2200);
      return;
    }
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:9999;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 14px;box-shadow:0 12px 28px rgba(0,0,0,.45);font-weight:800;text-align:center;max-width:calc(100vw - 28px);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1900);
  }

  function hasBlockingModal() {
    return !!document.querySelector(".mkw-resource-modal, .mkw-protect-backdrop, .mkw-tech-shield-backdrop, #mkwTurnTransitionBackdrop, [role='dialog'], dialog, [class*='modal'], [class*='backdrop']");
  }

  function isCancelLike(el) {
    const text = String(el?.textContent || "").toLowerCase();
    return text.includes("annuler") || text.includes("cancel") || text.includes("fermer") || text.includes("close");
  }

  function isUsedUltimateButton(btn) {
    if (!btn) return false;
    return btn.getAttribute("aria-pressed") === "true" || btn.classList.contains("used") || btn.classList.contains("is-used") || btn.dataset.active === "false";
  }

  function markUsedTogglesReadonly() {
    const id = currentId();
    if (!id) return;

    document.querySelectorAll(".mkw-energy-switch input").forEach(input => {
      const label = input.closest(".mkw-energy-switch");
      const action = getActionFromContext(input);
      if (!action || action === "ultimate") return;

      const used = Number(getActionState(id).used?.[action] || 0) > 0;
      const impossible = !used && !canSpend(action);

      if (used || impossible) {
        input.disabled = true;
        label?.classList.add("is-disabled");
        label?.setAttribute("aria-disabled", "true");
      } else {
        input.disabled = false;
        label?.classList.remove("is-disabled");
        label?.removeAttribute("aria-disabled");
      }
    });
  }

  function applyButtonAvailability() {
    const groups = [
      { selector: "#repairKeysDisplay button, #repairKeysDisplay .key-button", action: "repair" },
      { selector: "#shieldsDisplay button, #shieldsDisplay .shield-button, #shieldsDisplay .key-button", action: "protect" },
      { selector: "#ultToggleContainer button, #ultToggleContainer [role='button']", action: "ultimate" }
    ];

    groups.forEach(group => {
      document.querySelectorAll(group.selector).forEach(btn => {
        const text = String(btn.textContent || "").toLowerCase();
        if (text.includes("retirer") || text.includes("remove")) return;
        const impossible = !canSpend(group.action);
        btn.classList.toggle("mkw-energy-disabled-action", impossible);
        btn.toggleAttribute("aria-disabled", impossible);
      });
    });
  }

  function refreshUiLocks() {
    markUsedTogglesReadonly();
    applyButtonAvailability();
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    return cachedChars;
  }

  function activeIds() {
    const ids = new Set();
    const draft = readJson(PREFIX + "draft", null);
    const opp = readJson(PREFIX + "opp-draft", null);
    if (Array.isArray(draft?.activeIds)) draft.activeIds.forEach(id => ids.add(id));
    if (Array.isArray(opp?.activeIds)) opp.activeIds.forEach(id => ids.add(id));
    return ids;
  }

  async function resetEnergyForCampOnce(flow) {
    if (!flow?.started || !flow.currentCamp) return;
    const token = `${flow.roundNumber}:${flow.currentCamp}`;
    const doneKey = PREFIX + "energy-reset-done:" + token;
    if (localStorage.getItem(doneKey) === "1") return;

    const chars = await loadChars();
    const ids = activeIds();
    const max = 3;

    chars.forEach(char => {
      if ((char.camp || "mechkawaii") !== flow.currentCamp) return;
      if (ids.size && !ids.has(char.id)) return;

      writeJson(PREFIX + "energy:" + char.id, { current: max, max });
      writeJson(PREFIX + "turn-actions:" + char.id, { token, used: {} });
    });

    localStorage.setItem(doneKey, "1");
    const id = currentId();
    if (id) window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: id, current: max, max } }));
    setTimeout(refreshUiLocks, 80);
  }

  function bindGlobalClickGuards() {
    document.addEventListener("click", event => {
      const repairBtn = event.target.closest?.("#repairKeysDisplay button, #repairKeysDisplay .key-button");
      if (repairBtn && !canSpend("repair")) return blockEvent(event, getLang() === "fr" ? "Pas assez d’énergie." : "Not enough energy.");

      const shieldBtn = event.target.closest?.("#shieldsDisplay button, #shieldsDisplay .shield-button, #shieldsDisplay .key-button");
      if (shieldBtn) {
        const text = String(shieldBtn.textContent || "").toLowerCase();
        if (!text.includes("retirer") && !text.includes("remove") && !canSpend("protect")) {
          return blockEvent(event, getLang() === "fr" ? "Pas assez d’énergie." : "Not enough energy.");
        }
      }

      const ultBtn = event.target.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button']");
      if (ultBtn) {
        if (isUsedUltimateButton(ultBtn)) return;
        if (!canSpend("ultimate")) return blockEvent(event, getLang() === "fr" ? "Pas assez d’énergie." : "Not enough energy.");

        pendingUltimate = { token: Date.now(), button: ultBtn };
        const token = pendingUltimate.token;
        setTimeout(() => {
          if (!pendingUltimate || pendingUltimate.token !== token) return;
          if (hasBlockingModal()) return;
          if (isUsedUltimateButton(ultBtn)) {
            spend("ultimate");
            pendingUltimate = null;
          }
        }, 260);
      }

      if (pendingUltimate) {
        const modalTarget = event.target.closest?.(".mkw-resource-target, .mkw-protect-target, [data-ultimate-target], [role='dialog'] button, dialog button, [class*='modal'] button, [class*='backdrop'] button");
        if (modalTarget) {
          if (isCancelLike(modalTarget)) {
            pendingUltimate = null;
          } else {
            setTimeout(() => {
              if (!pendingUltimate) return;
              spend("ultimate");
              pendingUltimate = null;
            }, 0);
          }
        }
      }
    }, true);
  }

  function init() {
    bindGlobalClickGuards();

    const observer = new MutationObserver(() => {
      clearTimeout(observer._mkwTimer);
      observer._mkwTimer = setTimeout(refreshUiLocks, 30);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled", "aria-disabled"] });

    window.addEventListener("mechkawaii:energy-updated", () => setTimeout(refreshUiLocks, 40));
    window.addEventListener("mechkawaii:game-flow-updated", event => resetEnergyForCampOnce(event.detail));
    window.addEventListener("mechkawaii:turn-start", event => resetEnergyForCampOnce(event.detail || getFlow()));

    setTimeout(() => resetEnergyForCampOnce(getFlow()), 300);
    setTimeout(refreshUiLocks, 300);
    setTimeout(refreshUiLocks, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
