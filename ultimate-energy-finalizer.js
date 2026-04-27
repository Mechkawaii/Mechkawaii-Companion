(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwUltimateEnergyFinalizerStyle";
  let pending = null;
  let observer = null;

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function raw(key) {
    return localStorage.getItem(key);
  }

  function setRaw(key, value) {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }

  function snapshot() {
    const id = currentId();
    if (!id) return null;
    return {
      charId: id,
      state: raw(PREFIX + "state:" + id),
      energy: raw(PREFIX + "energy:" + id),
      actions: raw(PREFIX + "turn-actions:" + id),
      cuBadges: raw(PREFIX + "cu-badges"),
      copiedCu: raw(PREFIX + "copied-cu")
    };
  }

  function restore(snap) {
    if (!snap || snap.charId !== currentId()) return;
    setRaw(PREFIX + "state:" + snap.charId, snap.state);
    setRaw(PREFIX + "energy:" + snap.charId, snap.energy);
    setRaw(PREFIX + "turn-actions:" + snap.charId, snap.actions);
    setRaw(PREFIX + "cu-badges", snap.cuBadges);
    setRaw(PREFIX + "copied-cu", snap.copiedCu);

    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: snap.charId } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:ultimate-cancelled", { detail: { charId: snap.charId } }));
  }

  function stop() {
    pending = null;
    if (observer) observer.disconnect();
    observer = null;
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function toast(message) {
    const el = document.createElement("div");
    el.className = "mkw-ultimate-energy-toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-ultimate-energy-toast {
        position: fixed;
        left: 50%;
        bottom: 92px;
        transform: translateX(-50%);
        z-index: 99999;
        background: #111;
        color: #fff;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 12px;
        padding: 10px 14px;
        box-shadow: 0 12px 28px rgba(0,0,0,.45);
        font-weight: 850;
        text-align: center;
        max-width: calc(100vw - 28px);
      }
    `;
    document.head.appendChild(style);
  }

  function isUltimateTrigger(target) {
    return !!target?.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch");
  }

  function isUltimateUsed(btn) {
    if (!btn) return false;
    return btn.getAttribute("aria-pressed") === "true" ||
      btn.classList.contains("used") ||
      btn.classList.contains("is-used") ||
      btn.classList.contains("on") ||
      btn.dataset.active === "false" ||
      btn.getAttribute("aria-checked") === "true";
  }

  function isModal(el) {
    return !!el?.closest?.("[role='dialog'], dialog, .modal, .backdrop, [class*='modal'], [class*='backdrop'], .mkw-resource-modal, .mkw-protect-backdrop, .mkw-tech-shield-backdrop");
  }

  function anyModal() {
    return document.querySelector("[role='dialog'], dialog, .modal, .backdrop, [class*='modal'], [class*='backdrop'], .mkw-resource-modal, .mkw-protect-backdrop, .mkw-tech-shield-backdrop");
  }

  function isCancelLike(el) {
    const text = String(el?.textContent || "").trim().toLowerCase();
    return text.includes("annuler") || text.includes("cancel") || text.includes("fermer") || text.includes("close");
  }

  function canSpendUltimate() {
    if (typeof window.mkwCanSpendEnergyAction !== "function") return true;
    return window.mkwCanSpendEnergyAction("ultimate");
  }

  function spendUltimateOnce() {
    if (!pending || pending.spent) return false;
    if (!canSpendUltimate()) {
      toast(getLang() === "fr" ? "Pas assez d’énergie pour utiliser ce Coup Unique." : "Not enough energy to use this Ultimate Ability.");
      return false;
    }
    let ok = false;
    if (typeof window.mkwSpendEnergyAction === "function") ok = window.mkwSpendEnergyAction("ultimate");
    else if (typeof window.mkwValidateUltimateEnergy === "function") ok = window.mkwValidateUltimateEnergy();
    pending.spent = !!ok;
    if (ok) window.dispatchEvent(new CustomEvent("mechkawaii:ultimate-energy-finalized", { detail: { charId: currentId() } }));
    return ok;
  }

  function handleCancel() {
    const snap = pending?.snap;
    stop();
    setTimeout(() => restore(snap), 0);
  }

  function handleValidated() {
    if (!pending) return;
    pending.validated = true;
    setTimeout(() => {
      spendUltimateOnce();
      stop();
    }, 0);
  }

  function bindModalButtons(root) {
    if (!pending) return;
    const scope = root?.querySelectorAll ? root : document;
    Array.from(scope.querySelectorAll("button, [role='button'], [data-ultimate-target]")).forEach(btn => {
      if (!isModal(btn)) return;
      if (btn.dataset.mkwUltimateEnergyFinalizer === "1") return;
      btn.dataset.mkwUltimateEnergyFinalizer = "1";

      btn.addEventListener("click", event => {
        if (!pending) return;
        if (isCancelLike(btn)) {
          handleCancel();
          return;
        }
        handleValidated();
      }, true);
    });
  }

  function watchModal() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(mutations => {
      if (!pending) return;
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node instanceof Element) bindModalButtons(node);
      }));
      bindModalButtons(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => bindModalButtons(document), 40);
    setTimeout(() => bindModalButtons(document), 160);

    const startToken = pending?.token;
    setTimeout(() => {
      if (!pending || pending.token !== startToken) return;
      if (!anyModal()) {
        if (isUltimateUsed(pending.button)) handleValidated();
        else stop();
      }
    }, 420);
  }

  function init() {
    ensureStyles();

    document.addEventListener("click", event => {
      const trigger = event.target?.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch");
      if (!trigger) return;

      if (!canSpendUltimate()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toast(getLang() === "fr" ? "Pas assez d’énergie pour utiliser ce Coup Unique." : "Not enough energy to use this Ultimate Ability.");
        return;
      }

      pending = {
        token: Date.now(),
        snap: snapshot(),
        button: trigger,
        validated: false,
        spent: false
      };
      watchModal();
    }, true);

    document.addEventListener("click", event => {
      if (!pending) return;
      const btn = event.target?.closest?.("button, [role='button'], [data-ultimate-target]");
      if (!btn || !isModal(btn)) return;
      if (isCancelLike(btn)) handleCancel();
      else handleValidated();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
