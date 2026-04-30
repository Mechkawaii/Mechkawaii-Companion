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
    return (char?.camp || "mechkawaii").toLowerCase();
  }

  function campLabel(camp) {
    return camp === "prodrome" ? "Prodromes" : "Mechkawaii";
  }

  function isDraftCardOn(card) {
    return !!card?.classList.contains("selected");
  }

  function isToggleRowOn(row) {
    const sw = row?.querySelector(".switch");
    return sw && (sw.classList.contains("on") || sw.getAttribute("aria-checked") === "true");
  }

  function selectedIdsFromCards() {
    return Array.from(document.querySelectorAll("#draftList .draft-card.selected[data-char-id]"))
      .map(card => card.getAttribute("data-char-id"))
      .filter(Boolean);
  }

  function selectedIdsFromToggles() {
    return Array.from(document.querySelectorAll("#draftList .toggle[data-char-id]"))
      .filter(isToggleRowOn)
      .map(row => row.getAttribute("data-char-id"))
      .filter(Boolean);
  }

  function selectedIds() {
    const hasCards = !!document.querySelector("#draftList .draft-card[data-char-id]");
    return hasCards ? selectedIdsFromCards() : selectedIdsFromToggles();
  }

  function selectedCountForCamp(camp) {
    return selectedIds().filter(id => campOf(id) === camp).length;
  }

  function errorForCamp(camp) {
    return getLang() === "fr"
      ? `Tu ne peux choisir que ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} en mode 1 appareil.`
      : `You can only choose ${MAX_PER_CAMP_SINGLE} ${campLabel(camp)} in one-device mode.`;
  }

  function exactError() {
    return getLang() === "fr"
      ? `En mode 1 appareil, choisis exactement ${MAX_PER_CAMP_SINGLE} Mechkawaii et ${MAX_PER_CAMP_SINGLE} Prodromes.`
      : `In one-device mode, choose exactly ${MAX_PER_CAMP_SINGLE} Mechkawaii and ${MAX_PER_CAMP_SINGLE} Prodromes.`;
  }

  function updateDisabledVisuals() {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return;
    const counts = {
      mechkawaii: selectedCountForCamp("mechkawaii"),
      prodrome: selectedCountForCamp("prodrome")
    };

    document.querySelectorAll("#draftList .draft-card[data-char-id]").forEach(card => {
      const id = card.getAttribute("data-char-id");
      const camp = campOf(id);
      const isOn = isDraftCardOn(card);
      const blocked = !isOn && counts[camp] >= MAX_PER_CAMP_SINGLE;
      card.classList.toggle("mkw-camp-limit-blocked", blocked);
      if (blocked) {
        card.style.opacity = "0.3";
        card.style.pointerEvents = "auto";
        card.title = errorForCamp(camp);
      } else {
        card.style.opacity = "";
        if (card.title === errorForCamp(camp)) card.title = "";
      }
    });

    document.querySelectorAll("#draftList .toggle[data-char-id]").forEach(row => {
      const sw = row.querySelector(".switch");
      if (!sw) return;
      const id = row.getAttribute("data-char-id");
      const camp = campOf(id);
      const isOn = isToggleRowOn(row);
      const blocked = !isOn && counts[camp] >= MAX_PER_CAMP_SINGLE;
      sw.classList.toggle("mkw-camp-limit-blocked", blocked);
      if (blocked) {
        sw.style.opacity = "0.35";
        sw.style.pointerEvents = "auto";
        sw.title = errorForCamp(camp);
      } else {
        sw.style.opacity = "";
        if (sw.title === errorForCamp(camp)) sw.title = "";
      }
    });
  }

  function blockCardIfNeeded(event) {
    const card = event.target.closest?.("#draftList .draft-card[data-char-id]");
    if (!card) return false;
    const id = card.getAttribute("data-char-id");
    if (!id || isDraftCardOn(card)) return false;
    const camp = campOf(id);
    if (selectedCountForCamp(camp) < MAX_PER_CAMP_SINGLE) return false;

    setError(errorForCamp(camp));
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    updateDisabledVisuals();
    return true;
  }

  function blockToggleIfNeeded(event) {
    const sw = event.target.closest?.("#draftList .toggle[data-char-id] .switch");
    if (!sw) return false;
    const row = sw.closest(".toggle[data-char-id]");
    if (!row || isToggleRowOn(row)) return false;
    const id = row.getAttribute("data-char-id");
    if (!id) return false;
    const camp = campOf(id);
    if (selectedCountForCamp(camp) < MAX_PER_CAMP_SINGLE) return false;

    setError(errorForCamp(camp));
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    updateDisabledVisuals();
    return true;
  }

  function blockIfNeeded(event) {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return false;
    return blockCardIfNeeded(event) || blockToggleIfNeeded(event);
  }

  function validateConfirm(event) {
    if (!isSingleDeviceDraft() || !Array.isArray(charsCache)) return;
    const btn = event.target.closest?.("#confirmDraft, #draftConfirmNew");
    if (!btn) return;

    const mech = selectedCountForCamp("mechkawaii");
    const prod = selectedCountForCamp("prodrome");
    if (mech === MAX_PER_CAMP_SINGLE && prod === MAX_PER_CAMP_SINGLE) return;

    setError(exactError());
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function injectStyles() {
    if (document.getElementById("mkwDraftSingleCampLimitStyles")) return;
    const style = document.createElement("style");
    style.id = "mkwDraftSingleCampLimitStyles";
    style.textContent = `
      #draftList .draft-card.mkw-camp-limit-blocked { filter: grayscale(.65); }
      #draftList .draft-card.mkw-camp-limit-blocked:hover { transform: none !important; }
    `;
    document.head.appendChild(style);
  }

  async function init() {
    if (!document.body.classList.contains("page-index")) return;
    injectStyles();
    try { await loadChars(); } catch (error) {}

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
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "aria-checked", "style"] });
    setTimeout(updateDisabledVisuals, 120);
    setTimeout(updateDisabledVisuals, 500);
    setTimeout(updateDisabledVisuals, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
