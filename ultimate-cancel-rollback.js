(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
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

  function stopWatching() {
    pending = null;
    if (observer) observer.disconnect();
    observer = null;
  }

  function restore(snap) {
    if (!snap || snap.charId !== currentId()) return;

    setRaw(PREFIX + "state:" + snap.charId, snap.state);
    setRaw(PREFIX + "energy:" + snap.charId, snap.energy);
    setRaw(PREFIX + "turn-actions:" + snap.charId, snap.actions);
    setRaw(PREFIX + "cu-badges", snap.cuBadges);
    setRaw(PREFIX + "copied-cu", snap.copiedCu);

    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: snap.charId } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: {} }));
    window.dispatchEvent(new CustomEvent("mechkawaii:ultimate-cancelled", { detail: { charId: snap.charId } }));
  }

  function isUltimateTrigger(target) {
    if (!target || !target.closest) return false;
    return !!target.closest("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch");
  }

  function isCancel(el) {
    const text = (el && el.textContent ? el.textContent : "").trim().toLowerCase();
    return text === "annuler" || text === "cancel" || text.includes("annuler") || text.includes("cancel");
  }

  function isModalElement(el) {
    if (!el || !el.closest) return false;
    return !!el.closest("[role='dialog'], dialog, .modal, .backdrop, [class*='modal'], [class*='backdrop'], .mkw-resource-modal, .mkw-protect-backdrop");
  }

  function bindModalButtons(root) {
    if (!pending) return;
    const scope = root && root.querySelectorAll ? root : document;

    Array.from(scope.querySelectorAll("button, [role='button']")).forEach(btn => {
      if (!isModalElement(btn)) return;

      if (isCancel(btn)) {
        if (btn.dataset.mkwUltimateCancelRollback === "1") return;
        btn.dataset.mkwUltimateCancelRollback = "1";
        btn.addEventListener("click", () => {
          const snap = pending;
          stopWatching();
          setTimeout(() => restore(snap), 0);
        }, true);
        return;
      }

      if (btn.dataset.mkwUltimateValidated === "1") return;
      btn.dataset.mkwUltimateValidated = "1";
      btn.addEventListener("click", () => {
        stopWatching();
      }, true);
    });
  }

  function watchModal() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(mutations => {
      if (!pending) return;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) bindModalButtons(node);
        });
      });
      bindModalButtons(document);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => bindModalButtons(document), 50);
    setTimeout(() => bindModalButtons(document), 180);

    setTimeout(() => {
      if (!pending) return;
      const modalCancelExists = Array.from(document.querySelectorAll("button, [role='button']")).some(btn => isCancel(btn) && isModalElement(btn));
      if (!modalCancelExists) stopWatching();
    }, 900);
  }

  function init() {
    document.addEventListener("click", event => {
      if (!isUltimateTrigger(event.target)) return;
      pending = snapshot();
      watchModal();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
