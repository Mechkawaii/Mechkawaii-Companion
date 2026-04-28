(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  let pending = null;
  let observer = null;
  let glowObserver = null;
  let cachedCharacters = null;
  let currentUltimateRearmableCache = true;
  let syncingGlow = false;

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

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function getLockConfirmedKey(id = currentId()) {
    return PREFIX + "ultimate-lock-confirmed:" + id;
  }

  function isUltimateLockConfirmed(id = currentId()) {
    return localStorage.getItem(getLockConfirmedKey(id)) === "1";
  }

  function setUltimateLockConfirmed(id = currentId(), value = true) {
    if (!id) return;
    if (value) localStorage.setItem(getLockConfirmedKey(id), "1");
    else localStorage.removeItem(getLockConfirmedKey(id));
  }

  async function loadCharacters() {
    if (Array.isArray(cachedCharacters)) return cachedCharacters;
    if (Array.isArray(window.__cachedChars)) {
      cachedCharacters = window.__cachedChars;
      return cachedCharacters;
    }
    try {
      const res = await fetch("./data/characters.json", { cache: "no-store" });
      cachedCharacters = await res.json();
      window.__cachedChars = cachedCharacters;
      return cachedCharacters;
    } catch (error) {
      cachedCharacters = [];
      return cachedCharacters;
    }
  }

  async function isCurrentUltimateRearmable() {
    const id = currentId();
    if (!id) return true;
    const chars = await loadCharacters();
    const char = chars.find(item => item.id === id);
    currentUltimateRearmableCache = char?.cu_rearmable !== false;
    return currentUltimateRearmableCache;
  }

  function removeLegacyLockOverlay(card) {
    if (!card) return;

    card.querySelectorAll("img, [class], [id], [style]").forEach(el => {
      const src = String(el.getAttribute("src") || "").toLowerCase();
      const cls = String(el.className || "").toLowerCase();
      const id = String(el.id || "").toLowerCase();
      const style = String(el.getAttribute("style") || "").toLowerCase();
      const marker = `${src} ${cls} ${id} ${style}`;

      const isLegacyCuVide = marker.includes("cu_vide") ||
        marker.includes("cu-vide") ||
        marker.includes("cuvide") ||
        marker.includes("cu vide") ||
        marker.includes("ultimate_empty") ||
        marker.includes("ultimate-empty");

      const isLegacyLockOverlay = marker.includes("legacy") && marker.includes("ult") ||
        marker.includes("red") && marker.includes("stripe") ||
        marker.includes("diagonal") && marker.includes("ult") ||
        marker.includes("lock") && marker.includes("overlay") ||
        marker.includes("skill") && marker.includes("overlay");

      if (isLegacyCuVide || isLegacyLockOverlay) el.remove();
    });
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
      copiedCu: raw(PREFIX + "copied-cu"),
      lockConfirmed: raw(getLockConfirmedKey(id))
    };
  }

  function restore(snap) {
    if (!snap || snap.charId !== currentId()) return;

    setRaw(PREFIX + "state:" + snap.charId, snap.state);
    setRaw(PREFIX + "energy:" + snap.charId, snap.energy);
    setRaw(PREFIX + "turn-actions:" + snap.charId, snap.actions);
    setRaw(PREFIX + "cu-badges", snap.cuBadges);
    setRaw(PREFIX + "copied-cu", snap.copiedCu);
    setRaw(getLockConfirmedKey(snap.charId), snap.lockConfirmed);

    window.dispatchEvent(new CustomEvent("mechkawaii:energy-updated", { detail: { charId: snap.charId } }));
    window.dispatchEvent(new CustomEvent("mechkawaii:game-flow-updated", { detail: {} }));
    window.dispatchEvent(new CustomEvent("mechkawaii:ultimate-cancelled", { detail: { charId: snap.charId } }));
  }

  function stop() {
    pending = null;
    if (observer) observer.disconnect();
    observer = null;
  }

  function toast(message) {
    const el = document.createElement("div");
    el.className = "mkw-ultimate-energy-toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function getUltimateTrigger(target) {
    return target?.closest?.("#ultToggleContainer button, #ultToggleContainer [role='button'], #ultToggleContainer .toggle, #ultToggleContainer .switch") || null;
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

  function keepUltimateToggleLocked(trigger) {
    const container = document.getElementById("ultToggleContainer");
    const sw = container?.querySelector(".switch") || trigger;
    if (!sw) return;
    sw.classList.add("on");
    sw.classList.add("used");
    sw.classList.add("is-used");
    sw.setAttribute("aria-pressed", "true");
    sw.setAttribute("aria-checked", "true");
    sw.dataset.active = "true";
    sw.dataset.locked = "true";
    const input = sw.querySelector?.("input");
    if (input) input.checked = true;
  }

  function isLockedNonRearmableUltimate(trigger) {
    return !pending && isUltimateUsed(trigger) && !currentUltimateRearmableCache && isUltimateLockConfirmed(currentId());
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
    if (ok) {
      setUltimateLockConfirmed(currentId(), true);
      window.dispatchEvent(new CustomEvent("mechkawaii:ultimate-energy-finalized", { detail: { charId: currentId() } }));
    }
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
      const ok = spendUltimateOnce();
      const trigger = pending?.button;
      stop();
      if (ok && trigger) keepUltimateToggleLocked(trigger);
      syncGlow();
    }, 0);
  }

  function bindModalButtons(root) {
    if (!pending) return;
    const scope = root?.querySelectorAll ? root : document;

    Array.from(scope.querySelectorAll("button, [role='button'], [data-ultimate-target]")).forEach(btn => {
      if (!isModal(btn)) return;
      if (btn.dataset.mkwUltimateSystem === "1") return;
      btn.dataset.mkwUltimateSystem = "1";

      btn.addEventListener("click", () => {
        if (!pending) return;
        if (isCancelLike(btn)) handleCancel();
        else setTimeout(handleValidated, 0);
      }, false);
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

  function syncGlow() {
    if (syncingGlow) return;
    syncingGlow = true;

    const container = document.getElementById("ultToggleContainer");
    if (!container) {
      syncingGlow = false;
      return;
    }

    const card = container.closest(".card");
    if (!card) {
      syncingGlow = false;
      return;
    }
    card.id = "ultCard";

    const sw = container.querySelector(".switch");
    if (!sw) {
      syncingGlow = false;
      return;
    }

    const used = sw.classList.contains("on");
    card.classList.toggle("ult-used", used);
    card.classList.remove("ult-skill-locked");
    removeLegacyLockOverlay(card);

    isCurrentUltimateRearmable().then(rearmable => {
      if (!used && rearmable) setUltimateLockConfirmed(currentId(), false);
      const locked = used && !rearmable && isUltimateLockConfirmed(currentId());
      card.classList.toggle("ult-skill-locked", locked);
      if (locked) removeLegacyLockOverlay(card);
    }).finally(() => {
      syncingGlow = false;
    });
  }

  function initGlow() {
    const container = document.getElementById("ultToggleContainer");
    if (!container) return;

    if (glowObserver) glowObserver.disconnect();
    glowObserver = new MutationObserver(syncGlow);
    glowObserver.observe(container, { subtree: true, attributes: true, attributeFilter: ["class", "style", "src", "aria-pressed", "aria-checked", "data-active"] });

    setTimeout(syncGlow, 100);
    setTimeout(syncGlow, 300);
  }

  function init() {
    initGlow();
    isCurrentUltimateRearmable();

    document.addEventListener("click", event => {
      const trigger = getUltimateTrigger(event.target);
      if (!trigger) return;

      if (isLockedNonRearmableUltimate(trigger)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        keepUltimateToggleLocked(trigger);
        syncGlow();
        toast(getLang() === "fr" ? "Ce Coup Unique ne peut pas être réamorcé." : "This Ultimate Ability cannot be reactivated.");
        return;
      }

      if (!canSpendUltimate()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        toast(getLang() === "fr" ? "Pas assez d’énergie pour utiliser ce Coup Unique." : "Not enough energy to use this Ultimate Ability.");
        return;
      }

      if (!isUltimateUsed(trigger)) setUltimateLockConfirmed(currentId(), false);
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
      else setTimeout(handleValidated, 0);
    }, false);

    window.addEventListener("mechkawaii:ultimate-cancelled", () => setTimeout(syncGlow, 60));
    window.addEventListener("mechkawaii:energy-updated", () => setTimeout(syncGlow, 60));
    window.addEventListener("pageshow", () => { initGlow(); isCurrentUltimateRearmable(); setTimeout(syncGlow, 60); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();