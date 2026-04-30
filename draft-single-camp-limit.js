(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const MAX_PER_CAMP_SINGLE = 3;
  let charsCache = null;

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function getSetup() {
    return readJson(PREFIX + "setup", null);
  }

  function isSingleDeviceDraft() {
    const setup = getSetup();
    return setup && setup.mode === "single" && document.body.classList.contains("page-index") && !!document.querySelector("#draftCard");
  }

  async function loadChars() {
    if (Array.isArray(charsCache)) return charsCache;
    if (Array.isArray(window.__cachedChars)) {
      charsCache = window.__cachedChars;
      return charsCache;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    charsCache = await res.json();
    window.__cachedChars = charsCache;
    return charsCache;
  }

  function setError(message) {
    const error = document.querySelector("#draftError");
    if (!error) return;
    error.textContent = message || "";
  }

  function getCharById(id) {
    const chars = charsCache || window.__cachedChars || [];
    return chars.find(char => char.id === id) || null;
  }

  function campOf(id) {
    const char = getCharById(id);
    return char?.camp || "mechkawaii";
  }

  function campLabel(camp) {
    const lang = getLang();
    if (camp === "prodrome") return lang === "fr" ? "Prodromes" : "Prodromes";
    return "Mechkawaii";
  }

  function selectedIds() {
    return Array.from(document.querySelectorAll("#draftList .toggle[data-char-id]")).filter(row => {
      const sw = row.querySelector(".switch");
      return sw && (sw.classList.contains("on") || sw.getAttribute("aria-checked") === "true");
    }).map(row => row.getAttribute("data-char-id")).filter(Boolean);
  }

  function selectedCountForCamp(camp) {
    return selectedIds().filter(id => campOf(id) === camp).length;
  }

  function isSwitchCurrentlyOn(sw) {
    return sw?.classList.contains("on") || sw?.getAttribute("aria-checked") === "true";
  }

  function updateDisabledVisuals() {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return;
    const counts = {
      mechkawaii: selectedCountForCamp("mechkawaii"),
      prodrome: selectedCountForCamp("prodrome")
    };

    document.querySelectorAll("#draftList .toggle[data-char-id]").forEach(row => {
      const sw = row.querySelector(".switch");
      if (!sw) return;
      const id = row.getAttribute("data-char-id");
      const camp = campOf(id);
      const isOn = isSwitchCurrentlyOn(sw);
      const blocked = !isOn && counts[camp] >= MAX_PER_CAMP_SINGLE;
      sw.classList.toggle("mkw-camp-limit-blocked", blocked);
      if (blocked) {
        sw.style.opacity = "0.35";
        sw.style.pointerEvents = "auto";
        sw.title = getLang() === "fr"
          ? `Maximum ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} en mode 1 appareil.`
          : `Maximum ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} in one-device mode.`;
      } else if (sw.classList.contains("mkw-camp-limit-blocked")) {
        sw.style.opacity = "";
        sw.title = "";
      } else if (!blocked && sw.title && sw.title.includes("Maximum")) {
        sw.title = "";
      }
    });
  }

  function blockIfNeeded(event) {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return false;
    const sw = event.target.closest?.("#draftList .toggle[data-char-id] .switch");
    if (!sw) return false;
    const row = sw.closest(".toggle[data-char-id]");
    const id = row?.getAttribute("data-char-id");
    if (!id) return false;

    if (isSwitchCurrentlyOn(sw)) return false;

    const camp = campOf(id);
    const count = selectedCountForCamp(camp);
    if (count < MAX_PER_CAMP_SINGLE) return false;

    const msg = getLang() === "fr"
      ? `Tu ne peux choisir que ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} en mode 1 appareil.`
      : `You can only choose ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} in one-device mode.`;
    setError(msg);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    updateDisabledVisuals();
    return true;
  }

  function validateConfirm(event) {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return;
    const btn = event.target.closest?.("#confirmDraft");
    if (!btn) return;

    const mech = selectedCountForCamp("mechkawaii");
    const prod = selectedCountForCamp("prodrome");
    if (mech === MAX_PER_CAMP_SINGLE && prod === MAX_PER_CAMP_SINGLE) return;

    const msg = getLang() === "fr"
      ? `En mode 1 appareil, choisis exactement ${MAX_PER_CAMP_SINGLE} Mechkawaii et ${MAX_PER_CAMP_SINGLE} Prodromes.`
      : `In one-device mode, choose exactly ${MAX_PER_CAMP_SINGLE} Mechkawaii and ${MAX_PER_CAMP_SINGLE} Prodromes.`;
    setError(msg);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  async function init() {
    if (!document.body.classList.contains("page-index")) return;
    try {
      await loadChars();
    } catch (error) {}

    document.addEventListener("click", event => {
      if (blockIfNeeded(event)) return;
      validateConfirm(event);
      setTimeout(updateDisabledVisuals, 30);
    }, true);

    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (blockIfNeeded(event)) return;
      setTimeout(updateDisabledVisuals, 30);
    }, true);

    const observer = new MutationObserver(() => setTimeout(updateDisabledVisuals, 30));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-checked"] });
    setTimeout(updateDisabledVisuals, 120);
    setTimeout(updateDisabledVisuals, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
