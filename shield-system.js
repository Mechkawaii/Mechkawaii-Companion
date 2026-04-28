(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwShieldSystemStyles";
  const SHIELD_ON = "./assets/icons/shield_on.svg";

  const CLASSIC_ASSIGNMENTS_KEY = PREFIX + "shield-assignments";
  const CLASSIC_POOL_KEY = PREFIX + "shields";
  const CLASSIC_META_KEY = PREFIX + "shield-expiry-meta";
  const BLUE_BY_TECH_KEY = PREFIX + "blue-shield-by-tech";
  const BLUE_META_KEY = PREFIX + "blue-shield-expiry-meta";

  let cachedChars = null;
  let applyingBlueShield = false;

  const I18N = {
    fr: {
      protectTitle: "Se protéger",
      protectHelp: "Applique un bouclier à un allié ou à soi-même.",
      techTitle: "Bouclier du Technicien",
      techHelp: "Choisis un allié ou toi-même pour lui donner un bouclier bleu.",
      cancel: "Annuler",
      removeShield: "Retirer le bouclier",
      blueUnavailable: "Bouclier bleu déjà utilisé ce tour.",
      notEnoughClass: "Pas assez d’énergie pour utiliser cette action de classe."
    },
    en: {
      protectTitle: "Protect",
      protectHelp: "Apply a shield to an ally or to this unit.",
      techTitle: "Technician Shield",
      techHelp: "Choose an ally or this unit to give them a blue shield.",
      cancel: "Cancel",
      removeShield: "Remove shield",
      blueUnavailable: "Blue shield already used this turn.",
      notEnoughClass: "Not enough energy to use this class action."
    }
  };

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

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function tr(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function getCurrentCharId() {
    return new URL(location.href).searchParams.get("id") || "";
  }

  function getState(id) {
    return readJson(PREFIX + "state:" + id, null);
  }

  function getFlow() {
    return window.mkwGetGameFlowState?.() || readJson(PREFIX + "game-flow", null);
  }

  function getToken(flow = getFlow()) {
    if (!flow?.started) return "free";
    return `${Number(flow.roundNumber || 1)}:${flow.currentCamp || "mechkawaii"}`;
  }

  function getCamp(flow = getFlow()) {
    return flow?.currentCamp || window.__currentCharacter?.camp || "mechkawaii";
  }

  function textOf(value, lang = getLang()) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.fr || value.en || "";
  }

  function getName(char) {
    return textOf(char?.name) || char?.id || "?";
  }

  function getClass(char) {
    return textOf(char?.class) || "";
  }

  function getPortrait(char) {
    return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png";
  }

  async function loadChars() {
    if (Array.isArray(cachedChars)) return cachedChars;
    if (Array.isArray(window.__cachedChars)) {
      cachedChars = window.__cachedChars;
      return cachedChars;
    }
    const res = await fetch("./data/characters.json", { cache: "no-store" });
    cachedChars = await res.json();
    window.__cachedChars = cachedChars;
    return cachedChars;
  }

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentChar(chars) {
    return chars.find(c => c.id === getCurrentCharId()) || null;
  }

  function getCurrentTeam(chars) {
    const current = getCurrentChar(chars);
    if (!current) return [];

    const camp = current.camp || "mechkawaii";
    const draftIds = getDraftIds();

    return chars.filter(c => {
      if ((c.camp || "mechkawaii") !== camp) return false;
      if (draftIds && !draftIds.includes(c.id)) return false;
      return true;
    }).slice(0, 3);
  }

  function getHpCur(char) {
    const state = getState(char.id);
    const max = Number(char?.hp?.max ?? 0);
    if (!state) return max;
    if (typeof state.hp === "number") return Math.max(0, Math.min(Number(state.hp), max));
    if (state.hp && typeof state.hp === "object") return Math.max(0, Math.min(Number(state.hp.cur ?? max), max));
    return max;
  }

  function showToast(message) {
    const root = qs("#mkwToastRoot");
    if (root) {
      const el = document.createElement("div");
      el.className = "mkw-toast";
      el.textContent = message;
      root.appendChild(el);
      setTimeout(() => el.remove(), 2300);
      return;
    }

    const toast = document.createElement("div");
    toast.className = "mkw-shield-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2100);
  }

  function dispatchShieldUpdate(charId, extra = {}) {
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", {
      detail: { charId, ...extra }
    }));
  }

  function dispatchProtectValidated() {
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-action-validated", {
      detail: { charId: getCurrentCharId(), action: "protect" }
    }));
  }

  function setShieldGlow(targetId, enabled) {
    if (!targetId || targetId !== getCurrentCharId()) return;
    [qs("#hpCard"), qs("#charPortrait"), qs(".topbar")].forEach(el => {
      if (!el) return;
      el.classList.toggle("has-shield", enabled);
      el.classList.toggle("is-shielded", enabled);
      el.classList.toggle("shielded", enabled);
    });
  }

  function isRemoveShieldButton(btn) {
    if (!btn) return false;
    const txt = (btn.textContent || "").toLowerCase();
    return btn.id === "mkwCurrentShieldRemove" || txt.includes("retirer") || txt.includes("remove");
  }

  function getSharedShieldButtons() {
    return qsa("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button")
      .filter(btn => !isRemoveShieldButton(btn));
  }

  function getShieldButtonByIndex(index) {
    return getSharedShieldButtons()[index] || null;
  }

  function hideShieldButton(index) {
    const btn = getShieldButtonByIndex(index);
    if (!btn) return;
    btn.dataset.active = "false";
    btn.classList.remove("is-on");
    btn.style.display = "none";
  }

  function getSharedShields() {
    return readJson(CLASSIC_POOL_KEY, [true, true, true]);
  }

  function setSharedShields(shields) {
    writeJson(CLASSIC_POOL_KEY, shields);
  }

  function getShieldAssignments() {
    return readJson(CLASSIC_ASSIGNMENTS_KEY, {});
  }

  function setShieldAssignments(assignments) {
    writeJson(CLASSIC_ASSIGNMENTS_KEY, assignments);
  }

  function setClassicShieldExpiryMeta(index, targetCharId) {
    const meta = readJson(CLASSIC_META_KEY, {});
    meta[String(index)] = {
      targetId: targetCharId,
      placedToken: getToken(),
      expireOnCamp: getCamp()
    };
    writeJson(CLASSIC_META_KEY, meta);
  }

  function removeClassicShieldExpiryMeta(index) {
    const meta = readJson(CLASSIC_META_KEY, {});
    delete meta[String(index)];
    writeJson(CLASSIC_META_KEY, meta);
  }

  function cleanClassicPollutionFromTechMap(index) {
    const techMap = readJson(BLUE_BY_TECH_KEY, {});
    const key = "shared-shield-" + index;
    if (Object.prototype.hasOwnProperty.call(techMap, key)) {
      delete techMap[key];
      writeJson(BLUE_BY_TECH_KEY, techMap);
    }
  }

  function getShieldIndexForTarget(targetId) {
    if (!targetId) return -1;
    const assignments = getShieldAssignments();
    for (const key of Object.keys(assignments)) {
      if (assignments[key] === targetId) return Number(key);
    }
    return -1;
  }

  function ensureCurrentRemoveButton() {
    const currentId = getCurrentCharId();
    const section = qs(".shields-section") || qs("#hpCard .card-b") || qs("#hpCard");
    if (!section || !currentId) return;

    const existing = qs("#mkwCurrentShieldRemove");
    const index = getShieldIndexForTarget(currentId);

    if (index < 0) {
      existing?.remove();
      return;
    }

    if (existing) {
      existing.dataset.shieldIndex = String(index);
      existing.textContent = tr("removeShield");
      existing.style.display = "block";
      return;
    }

    const button = document.createElement("button");
    button.id = "mkwCurrentShieldRemove";
    button.type = "button";
    button.className = "mkw-current-shield-remove";
    button.dataset.shieldIndex = String(index);
    button.textContent = tr("removeShield");
    section.appendChild(button);
  }

  function assignShield(index, targetCharId, btn) {
    const shields = getSharedShields();
    const assignments = getShieldAssignments();

    shields[index] = false;
    assignments[index] = targetCharId;

    setSharedShields(shields);
    setShieldAssignments(assignments);
    setClassicShieldExpiryMeta(index, targetCharId);
    cleanClassicPollutionFromTechMap(index);

    if (btn) {
      btn.dataset.active = "false";
      btn.classList.remove("is-on");
      btn.style.display = "none";
    }

    dispatchProtectValidated();
    setShieldGlow(targetCharId, true);
    ensureCurrentRemoveButton();
    syncShieldTabs();
    dispatchShieldUpdate(targetCharId);
  }

  function removeShield(index) {
    const shields = getSharedShields();
    const assignments = getShieldAssignments();
    const oldTarget = assignments[index];

    // Retirer un bouclier classique enlève la protection, mais le jeton reste défaussé.
    shields[index] = false;
    delete assignments[index];
    removeClassicShieldExpiryMeta(index);

    setSharedShields(shields);
    setShieldAssignments(assignments);
    cleanClassicPollutionFromTechMap(index);
    hideShieldButton(index);
    setShieldGlow(oldTarget, false);
    ensureCurrentRemoveButton();
    syncShieldTabs();
    dispatchShieldUpdate(oldTarget);
  }

  function normalizeClassicMeta() {
    const flow = getFlow();
    const token = getToken(flow);
    const camp = getCamp(flow);
    const assignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    const meta = readJson(CLASSIC_META_KEY, {});
    let changed = false;

    Object.keys(meta).forEach(index => {
      if (!Object.prototype.hasOwnProperty.call(assignments, index)) {
        delete meta[index];
        changed = true;
      }
    });

    Object.keys(assignments).forEach(index => {
      if (!meta[index] || meta[index].targetId !== assignments[index]) {
        meta[index] = {
          targetId: assignments[index],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      }
    });

    if (changed) writeJson(CLASSIC_META_KEY, meta);
  }

  function normalizeBlueMeta() {
    const flow = getFlow();
    const token = getToken(flow);
    const camp = getCamp(flow);
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    let changed = false;

    Object.keys(meta).forEach(techId => {
      if (!Object.prototype.hasOwnProperty.call(byTech, techId)) {
        delete meta[techId];
        changed = true;
      }
    });

    Object.keys(byTech).forEach(techId => {
      if (!meta[techId] || meta[techId].targetId !== byTech[techId]) {
        meta[techId] = {
          targetId: byTech[techId],
          placedToken: token,
          expireOnCamp: camp
        };
        changed = true;
      }
    });

    if (changed) writeJson(BLUE_META_KEY, meta);
  }

  function expireClassicShields() {
    const flow = getFlow();
    if (!flow?.started) return [];

    const token = getToken(flow);
    const camp = getCamp(flow);
    const assignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    const shields = readJson(CLASSIC_POOL_KEY, [true, true, true]);
    const meta = readJson(CLASSIC_META_KEY, {});
    const expiredTargets = [];
    let changed = false;

    Object.keys(assignments).forEach(index => {
      const info = meta[index];
      if (!info) return;
      const shouldExpire = info.expireOnCamp === camp && info.placedToken !== token;
      if (!shouldExpire) return;

      const targetId = assignments[index] || info.targetId;
      delete assignments[index];
      delete meta[index];

      const idx = Number(index);
      if (Array.isArray(shields) && Number.isInteger(idx) && idx >= 0 && idx < shields.length) {
        shields[idx] = true;
      }

      if (targetId) expiredTargets.push(targetId);
      changed = true;
    });

    if (changed) {
      writeJson(CLASSIC_ASSIGNMENTS_KEY, assignments);
      writeJson(CLASSIC_META_KEY, meta);
      if (Array.isArray(shields)) writeJson(CLASSIC_POOL_KEY, shields);
    }

    return expiredTargets;
  }

  function expireBlueShields() {
    const flow = getFlow();
    if (!flow?.started) return [];

    const token = getToken(flow);
    const camp = getCamp(flow);
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    const meta = readJson(BLUE_META_KEY, {});
    const expiredTargets = [];
    let changed = false;

    Object.keys(byTech).forEach(techId => {
      const info = meta[techId];
      if (!info) return;
      const shouldExpire = info.expireOnCamp === camp && info.placedToken !== token;
      if (!shouldExpire) return;

      const targetId = byTech[techId] || info.targetId;
      delete byTech[techId];
      delete meta[techId];

      if (targetId) expiredTargets.push(targetId);
      changed = true;
    });

    if (changed) {
      writeJson(BLUE_BY_TECH_KEY, byTech);
      writeJson(BLUE_META_KEY, meta);
    }

    return expiredTargets;
  }

  function syncShieldExpiry() {
    normalizeClassicMeta();
    normalizeBlueMeta();

    const expired = [
      ...expireClassicShields(),
      ...expireBlueShields()
    ];

    if (expired.length) {
      const ids = Array.from(new Set(expired));
      ids.forEach(id => {
        setShieldGlow(id, false);
        dispatchShieldUpdate(id);
      });
      syncShieldTabs();
      window.dispatchEvent(new CustomEvent("mechkawaii:shields-expired", { detail: { charIds: ids } }));
    }
  }

  function getClassicShieldedIds() {
    const classicAssignments = readJson(CLASSIC_ASSIGNMENTS_KEY, {});
    return Object.values(classicAssignments).filter(Boolean);
  }

  function getBlueShieldedIds() {
    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    return Object.values(byTech).filter(Boolean);
  }

  function getShieldedIds() {
    return new Set([...getClassicShieldedIds(), ...getBlueShieldedIds()]);
  }

  function syncShieldTabs() {
    ensureStyles();
    const shieldedIds = getShieldedIds();
    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      const isShielded = shieldedIds.has(charId);
      tab.classList.toggle("mkw-tab-shielded", isShielded);
      tab.classList.remove("mkw-tab-shield-pulse");
    });
  }

  function delayedSync() {
    setTimeout(() => { syncShieldExpiry(); syncShieldTabs(); ensureCurrentRemoveButton(); syncTechUi(); }, 0);
    setTimeout(() => { syncShieldExpiry(); syncShieldTabs(); ensureCurrentRemoveButton(); syncTechUi(); }, 80);
    setTimeout(() => { syncShieldExpiry(); syncShieldTabs(); ensureCurrentRemoveButton(); syncTechUi(); }, 220);
  }

  function getShieldButton(el) {
    if (!el || !el.closest) return null;
    const btn = el.closest("#shieldsDisplay .shield-button, #shieldsDisplay .key-button, #shieldsDisplay button");
    if (!btn || isRemoveShieldButton(btn)) return null;
    return btn;
  }

  function resetClickedShield(btn) {
    if (!btn) return;
    btn.dataset.active = "true";
    btn.classList.add("is-on");
    btn.style.display = "";
    btn.style.backgroundImage = btn.style.backgroundImage || `url('${SHIELD_ON}')`;
  }

  async function openProtectModal(index, btn) {
    ensureStyles();
    resetClickedShield(btn);

    const chars = await loadChars();
    const team = getCurrentTeam(chars);

    const backdrop = document.createElement("div");
    backdrop.className = "mkw-protect-backdrop";

    const panel = document.createElement("div");
    panel.className = "mkw-protect-panel";
    panel.innerHTML = `<div class="mkw-protect-title">${tr("protectTitle")}</div><div class="mkw-protect-help">${tr("protectHelp")}</div>`;

    team.forEach(char => {
      const max = Number(char?.hp?.max ?? 0);
      const cur = getHpCur(char);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mkw-protect-target";
      row.innerHTML = `<img class="mkw-protect-portrait" src="${getPortrait(char)}" alt=""><div class="mkw-protect-info"><div class="mkw-protect-name">${getName(char)}</div><div class="mkw-protect-class">${getClass(char)}</div></div><div class="mkw-protect-value">${cur}/${max}</div>`;
      row.addEventListener("click", () => {
        assignShield(index, char.id, btn);
        backdrop.remove();
      });
      panel.appendChild(row);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mkw-protect-cancel";
    cancel.textContent = tr("cancel");
    cancel.addEventListener("click", () => { resetClickedShield(btn); backdrop.remove(); });

    panel.appendChild(cancel);
    backdrop.appendChild(panel);
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        resetClickedShield(btn);
        backdrop.remove();
      }
    });
    document.body.appendChild(backdrop);
  }

  function handleRemoveClick(event) {
    const btn = event.target.closest && event.target.closest("button");
    if (!btn || btn.id !== "mkwCurrentShieldRemove") return false;

    const index = Number(btn.dataset.shieldIndex);
    if (!Number.isFinite(index)) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    removeShield(index);
    return true;
  }

  function isTechnicianChar(char) {
    const id = normalize(char?.id);
    const fr = String(char?.class?.fr || char?.class || "").toLowerCase();
    const en = String(char?.class?.en || "").toLowerCase();
    return id === "banado" || id === "genbu" || /\btechnicien\b/.test(fr) || /\btechnician\b/.test(en);
  }

  function isCurrentTechnician() {
    const id = normalize(getCurrentCharId());
    const title = String(qs("#classActionTitle")?.textContent || "").toLowerCase();
    const body = String(qs("#classActionBody")?.textContent || "").toLowerCase();
    return id === "banado" || id === "genbu" || /technicien|technician|bouclier|shield/.test(`${title} ${body}`);
  }

  function blueShieldLockKey(id = getCurrentCharId()) {
    return PREFIX + "blue-shield-turn-lock:" + id;
  }

  function blueShieldUsedThisTurn(id = getCurrentCharId()) {
    const state = readJson(blueShieldLockKey(id), null);
    return !!state && state.token === getToken() && state.used === true;
  }

  function lockBlueShieldForTurn(id = getCurrentCharId()) {
    writeJson(blueShieldLockKey(id), { token: getToken(), used: true });
  }

  function unlockStaleBlueShieldLock(id = getCurrentCharId()) {
    const state = readJson(blueShieldLockKey(id), null);
    if (state && state.token !== getToken()) localStorage.removeItem(blueShieldLockKey(id));
  }

  function getActionState(id) {
    const token = getToken();
    const state = readJson(PREFIX + "turn-actions:" + id, { token, used: {} });
    return state.token === token ? state : { token, used: {} };
  }

  function isClassActionAlreadyUsed(id = getCurrentCharId()) {
    const state = getActionState(id);
    return Number(state.used?.class_action || 0) > 0;
  }

  function isTechnicianActionUsed() {
    unlockStaleBlueShieldLock();
    return blueShieldUsedThisTurn() || isClassActionAlreadyUsed();
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
    window.dispatchEvent(new CustomEvent("mechkawaii:energy-action-validated", { detail: { charId: getCurrentCharId(), action: "class_action" } }));
    return true;
  }

  function setBlueShieldExpiryMeta(technicianId, targetId) {
    const meta = readJson(BLUE_META_KEY, {});
    meta[technicianId] = {
      targetId,
      placedToken: getToken(),
      expireOnCamp: getCamp()
    };
    writeJson(BLUE_META_KEY, meta);
  }

  function closeTechModal() {
    applyingBlueShield = false;
    qs(".mkw-tech-shield-backdrop")?.remove();
  }

  function isBlueShieldButton(button) {
    if (!button || button.closest(".mkw-tech-shield-backdrop")) return false;
    const card = button.closest(".card");
    if (!card || !card.querySelector("#classActionTitle")) return false;
    const title = qs("#classActionTitle")?.textContent?.toLowerCase() || "";
    const body = qs("#classActionBody")?.textContent?.toLowerCase() || "";
    const text = `${button.textContent || ""} ${title} ${body}`.toLowerCase();
    return /technicien|technician|bouclier|shield|proteger|protéger|protect/.test(text);
  }

  function getBlueShieldButtons() {
    return qsa("button, [role='button']").filter(isBlueShieldButton);
  }

  function syncTechUi() {
    if (!isCurrentTechnician()) return;
    unlockStaleBlueShieldLock();

    const used = isTechnicianActionUsed();
    const canUse = canUseClassAction();
    const disabled = used || !canUse;

    getBlueShieldButtons().forEach(button => {
      button.classList.toggle("mkw-tech-blue-shield-disabled", disabled);
      button.classList.toggle("mkw-energy-disabled-action", disabled);
      button.toggleAttribute("aria-disabled", disabled);
      button.dataset.techShieldDisabled = disabled ? "1" : "0";
    });

    const input = qs("#classActionTitle")?.closest(".card")?.querySelector(".mkw-energy-switch input");
    const label = input?.closest(".mkw-energy-switch");
    const card = qs("#classActionTitle")?.closest(".card");

    if (input) {
      input.checked = used;
      input.disabled = disabled;
    }
    if (label) {
      label.classList.toggle("is-disabled", disabled);
      label.classList.toggle("mkw-tech-class-action-disabled", disabled);
      label.toggleAttribute("aria-disabled", disabled);
    }
    if (card) card.classList.toggle("mkw-tech-class-action-disabled", used);
  }

  function applyBlueShield(technicianId, targetId) {
    if (applyingBlueShield) return;
    if (blueShieldUsedThisTurn(technicianId) || blueShieldUsedThisTurn()) {
      showToast(tr("blueUnavailable"));
      syncTechUi();
      closeTechModal();
      return;
    }

    applyingBlueShield = true;
    qsa(".mkw-tech-shield-target").forEach(btn => { btn.disabled = true; });

    if (!spendClassAction()) {
      applyingBlueShield = false;
      showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("blueUnavailable") : tr("notEnoughClass"));
      syncTechUi();
      closeTechModal();
      return;
    }

    lockBlueShieldForTurn(technicianId);
    lockBlueShieldForTurn(getCurrentCharId());

    const byTech = readJson(BLUE_BY_TECH_KEY, {});
    byTech[technicianId] = targetId;
    writeJson(BLUE_BY_TECH_KEY, byTech);
    setBlueShieldExpiryMeta(technicianId, targetId);

    dispatchShieldUpdate(targetId, { type: "technician" });
    window.dispatchEvent(new CustomEvent("mechkawaii:technician-shield-applied", { detail: { technicianId, targetId } }));

    syncTechUi();
    syncShieldTabs();
    closeTechModal();
    setTimeout(() => location.reload(), 60);
  }

  async function openTechModal() {
    ensureStyles();
    closeTechModal();
    unlockStaleBlueShieldLock();

    if (!canUseClassAction()) {
      showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("blueUnavailable") : tr("notEnoughClass"));
      syncTechUi();
      return;
    }

    const chars = await loadChars();
    const current = getCurrentChar(chars);
    if (!current || !isTechnicianChar(current)) return;
    const team = getCurrentTeam(chars);

    const backdrop = document.createElement("div");
    backdrop.className = "mkw-tech-shield-backdrop";

    const panel = document.createElement("div");
    panel.className = "mkw-tech-shield-panel";
    panel.innerHTML = `<div class="mkw-tech-shield-title">${tr("techTitle")}</div><div class="mkw-tech-shield-help">${tr("techHelp")}</div>`;

    team.forEach(char => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mkw-tech-shield-target";
      row.innerHTML = `<img class="mkw-tech-shield-portrait" src="${getPortrait(char)}" alt=""><div class="mkw-tech-shield-info"><div class="mkw-tech-shield-name">${getName(char)}</div><div class="mkw-tech-shield-class">${getClass(char)}</div></div>`;
      row.addEventListener("click", () => applyBlueShield(current.id, char.id));
      panel.appendChild(row);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mkw-tech-shield-cancel";
    cancel.textContent = tr("cancel");
    cancel.addEventListener("click", () => { closeTechModal(); syncTechUi(); });

    panel.appendChild(cancel);
    backdrop.appendChild(panel);
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        closeTechModal();
        syncTechUi();
      }
    });
    document.body.appendChild(backdrop);
  }

  function isClassActionEnergySwitch(target) {
    const card = target?.closest?.(".card");
    if (!card || !card.querySelector("#classActionTitle")) return false;
    return !!target.closest(".mkw-energy-switch");
  }

  function handleTechShieldClick(event) {
    if (!isCurrentTechnician()) return false;

    const switchEl = event.target.closest?.(".mkw-energy-switch");
    if (switchEl && isClassActionEnergySwitch(switchEl) && !switchEl.closest(".mkw-tech-shield-backdrop")) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (!canUseClassAction()) {
        showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("blueUnavailable") : tr("notEnoughClass"));
        syncTechUi();
        return true;
      }
      openTechModal();
      return true;
    }

    const button = event.target.closest?.("button, [role='button']");
    if (!isBlueShieldButton(button)) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!canUseClassAction()) {
      showToast(blueShieldUsedThisTurn() || isClassActionAlreadyUsed() ? tr("blueUnavailable") : tr("notEnoughClass"));
      syncTechUi();
      return true;
    }
    openTechModal();
    return true;
  }

  function handleTechShieldChange(event) {
    if (!isCurrentTechnician()) return false;
    if (!isClassActionEnergySwitch(event.target)) return false;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    syncTechUi();
    return true;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-shield-toast { position: fixed; left: 50%; bottom: 92px; transform: translateX(-50%); z-index: 99999; background: #111; color: #fff; border: 1px solid rgba(255,255,255,.18); border-radius: 12px; padding: 10px 14px; box-shadow: 0 12px 28px rgba(0,0,0,.45); font-weight: 850; text-align: center; max-width: calc(100vw - 28px); }
      .mkw-protect-backdrop, .mkw-tech-shield-backdrop { position: fixed; inset: 0; z-index: 9400; background: rgba(0,0,0,.68); display: flex; align-items: center; justify-content: center; padding: 18px; }
      .mkw-protect-panel, .mkw-tech-shield-panel { width: min(460px, 100%); max-height: 82vh; overflow: auto; background: linear-gradient(180deg,#1a1a24,#101018); color: #fff; border: 1px solid rgba(255,255,255,.15); border-radius: 20px; box-shadow: 0 22px 55px rgba(0,0,0,.58); padding: 16px; }
      .mkw-protect-title, .mkw-tech-shield-title { font-weight: 950; font-size: 19px; margin-bottom: 6px; color: #fff; }
      .mkw-protect-help, .mkw-tech-shield-help { color: rgba(255,255,255,.72); font-size: 13px; line-height: 1.35; margin-bottom: 14px; }
      .mkw-protect-target, .mkw-tech-shield-target { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; padding: 11px; margin: 8px 0; border-radius: 15px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.065); color: #fff; cursor: pointer; box-shadow: none; min-height: 70px; }
      .mkw-protect-target:hover { background: rgba(255,255,255,.1); border-color: rgba(255,210,77,.45); }
      .mkw-tech-shield-target:hover { background: rgba(80,150,255,.12); border-color: rgba(80,150,255,.52); }
      .mkw-tech-shield-target:disabled { opacity: .42; filter: grayscale(.65); cursor: not-allowed; }
      .mkw-protect-portrait, .mkw-tech-shield-portrait { width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,.08); flex: 0 0 auto; padding: 4px; }
      .mkw-protect-info, .mkw-tech-shield-info { flex: 1; min-width: 0; }
      .mkw-protect-name, .mkw-tech-shield-name { font-weight: 950; color: #fff; line-height: 1.15; }
      .mkw-protect-class, .mkw-tech-shield-class { font-size: 12px; color: rgba(255,255,255,.62); margin-top: 2px; line-height: 1.2; }
      .mkw-protect-value { font-weight: 950; color: #ffd24d; white-space: nowrap; }
      .mkw-protect-cancel, .mkw-tech-shield-cancel { width: 100%; margin-top: 12px; padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #fff; font-weight: 900; cursor: pointer; }
      .mkw-current-shield-remove { margin-top: 10px; padding: 10px 12px; width: 100%; border-radius: 12px; border: 1px solid rgba(80,150,255,.45); background: rgba(80,150,255,.12); color: var(--text, #fff); font-weight: 900; cursor: pointer; }
      .mkw-current-shield-remove:hover { background: rgba(80,150,255,.18); }
      .mkw-tech-class-action-disabled, .mkw-tech-blue-shield-disabled { opacity: .42 !important; filter: grayscale(.65) !important; cursor: not-allowed !important; }
      .mkw-tech-blue-shield-disabled * { cursor: not-allowed !important; }
      .unit-tab.mkw-tab-shielded { border-color: rgba(80, 150, 255, .9) !important; box-shadow: 0 0 0 2px rgba(80,150,255,.22), 0 0 24px rgba(80,150,255,.55) !important; }
      .unit-tab.mkw-tab-shielded::after { content: ""; position: absolute; inset: 6px; border-radius: 14px; pointer-events: none; border: 1px solid rgba(120,185,255,.55); box-shadow: inset 0 0 18px rgba(80,150,255,.28); }
      .unit-tab.mkw-tab-shield-pulse { animation: none !important; transform: none !important; }
    `;
    document.head.appendChild(style);
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      if (handleRemoveClick(event)) return;
      if (handleTechShieldClick(event)) return;

      const btn = getShieldButton(event.target);
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (btn.dataset.active === "false" || btn.style.display === "none") return;
      btn.dataset.energyBound = "1";
      openProtectModal(Math.max(0, getSharedShieldButtons().indexOf(btn)), btn);
    }, true);

    document.addEventListener("change", event => {
      handleTechShieldChange(event);
    }, true);

    window.addEventListener("mechkawaii:shield-updated", delayedSync);
    window.addEventListener("mechkawaii:technician-shield-applied", delayedSync);
    window.addEventListener("mechkawaii:turn-start", delayedSync);
    window.addEventListener("mechkawaii:game-flow-updated", delayedSync);
    window.addEventListener("mechkawaii:energy-updated", delayedSync);
    window.addEventListener("pageshow", delayedSync);
    window.addEventListener("storage", delayedSync);
  }

  function init() {
    ensureStyles();
    delayedSync();
    bindEvents();
  }

  window.mkwSyncShieldExpiry = syncShieldExpiry;
  window.mkwSyncShieldTabs = syncShieldTabs;
  window.mkwSyncTechShieldUi = syncTechUi;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
