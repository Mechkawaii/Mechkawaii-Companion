(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";
  const FLOW_KEY = PREFIX + "game-flow";
  const BLUE_TOKEN_KEY = PREFIX + "shield-state-sync-blue-token";

  const SHIELD_CLASSES = [
    "has-shield",
    "is-shielded",
    "shielded",
    "mkw-tab-shielded",
    "mkw-tab-shield-pulse"
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCurrentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getFlowToken() {
    const flow = window.mkwGetGameFlowState?.() || readJson(FLOW_KEY, null);
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function getClassicShieldedIds() {
    return new Set(Object.values(readJson(CLASSIC_ASSIGNMENTS_KEY, {})).filter(Boolean));
  }

  function getBlueData() {
    return {
      byTech: readJson(BLUE_BY_TECH_KEY, {}),
      meta: readJson(BLUE_META_KEY, {})
    };
  }

  function getBlueShieldedIds() {
    const { byTech, meta } = getBlueData();
    return new Set([
      ...Object.values(byTech || {}).filter(Boolean),
      ...Object.values(meta || {}).map(item => item?.targetId).filter(Boolean)
    ]);
  }

  function clearBlueShields() {
    writeJson(BLUE_BY_TECH_KEY, {});
    writeJson(BLUE_META_KEY, {});
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX + "blue-shield-turn-lock:")) localStorage.removeItem(key);
    });
  }

  function expireBlueIfTurnChanged() {
    const blue = getBlueShieldedIds();
    const currentToken = getFlowToken();

    if (!blue.size) {
      // Pas de bouclier bleu actif : on met simplement le token à jour
      // pour qu'il soit prêt pour la prochaine pose de bouclier.
      localStorage.setItem(BLUE_TOKEN_KEY, currentToken);
      return;
    }

    // Il y a un bouclier bleu actif : on compare avec le token
    // enregistré au moment où le bouclier a été posé.
    const previousToken = localStorage.getItem(BLUE_TOKEN_KEY);

    if (!previousToken) {
      // Pas de token de référence → on en pose un maintenant (première exécution).
      localStorage.setItem(BLUE_TOKEN_KEY, currentToken);
      return;
    }

    if (previousToken !== currentToken) {
      // Le tour a changé depuis que le bouclier a été posé → on l'expire.
      clearBlueShields();
      // On NE met PAS à jour le token ici : c'est le prochain
      // "shield applied" (ou le branch "!blue.size" ci-dessus) qui le fera.
      // Cela évite que le token soit mis à jour pendant que le bouclier
      // est encore présent visuellement (race condition).
    }
  }

  function removeShieldClasses(el) {
    if (!el) return;
    SHIELD_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  function syncCurrentCharacter(allShielded) {
    const currentId = getCurrentCharId();
    if (!currentId || allShielded.has(currentId)) return;

    [
      "#hpCard",
      "#charPortrait",
      ".topbar",
      ".hp-shields-wrapper",
      ".hp-section",
      ".shields-section"
    ].forEach(selector => removeShieldClasses(document.querySelector(selector)));

    document.querySelectorAll(".has-shield, .is-shielded, .shielded").forEach(el => {
      if (!el.closest?.("#unitTabs")) removeShieldClasses(el);
    });
  }

  function syncTabs(allShielded) {
    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      const shielded = allShielded.has(charId);
      tab.classList.toggle("mkw-tab-shielded", shielded);
      if (!shielded) tab.classList.remove("mkw-tab-shield-pulse");
    });
  }

  function syncShieldVisualState() {
    expireBlueIfTurnChanged();

    const classic = getClassicShieldedIds();
    const blue = getBlueShieldedIds();
    const allShielded = new Set([...classic, ...blue]);

    syncCurrentCharacter(allShielded);
    syncTabs(allShielded);
  }

  function init() {
    localStorage.setItem(BLUE_TOKEN_KEY, getFlowToken());

    window.mkwSyncShieldVisualState = syncShieldVisualState;
    window.addEventListener("mechkawaii:game-flow-updated", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("mechkawaii:turn-start", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("mechkawaii:shield-updated", () => setTimeout(syncShieldVisualState, 0));
    window.addEventListener("pageshow", syncShieldVisualState);

    // ✅ FIX : quand le Technicien pose un bouclier bleu, on snapshot le token
    // du tour en cours. C'est CE token qui sera comparé au tour suivant
    // pour décider si le bouclier doit expirer.
    window.addEventListener("mechkawaii:technician-shield-applied", () => {
      localStorage.setItem(BLUE_TOKEN_KEY, getFlowToken());
    });

    setInterval(syncShieldVisualState, 100);
    syncShieldVisualState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
