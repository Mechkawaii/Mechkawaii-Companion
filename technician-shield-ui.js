(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwTechnicianShieldUiStyles";
  let cachedChars = null;

  const I18N = {
    fr: {
      title: "Bouclier du Technicien",
      help: "Choisis un allié pour lui donner un bouclier bleu.",
      cancel: "Annuler"
    },
    en: {
      title: "Technician Shield",
      help: "Choose an ally to give them a blue shield.",
      cancel: "Cancel"
    }
  };

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function tr(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

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

  function textOf(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.fr || value.en || "";
  }

  function getName(char) {
    return textOf(char?.name, getLang()) || char?.id || "?";
  }

  function getClass(char) {
    return textOf(char?.class, getLang()) || "";
  }

  function getPortrait(char) {
    return char?.images?.portrait || char?.portrait || char?.icon || "./assets/heart.png";
  }

  function currentId() {
    return new URL(location.href).searchParams.get("id") || "";
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

  function getDraftIds() {
    const draft = readJson(PREFIX + "draft", null);
    return Array.isArray(draft?.activeIds) ? draft.activeIds : null;
  }

  function getCurrentChar(chars) {
    return chars.find(c => c.id === currentId()) || null;
  }

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
    const fr = String(char?.class?.fr || char?.class || "").toLowerCase();
    const en = String(char?.class?.en || "").toLowerCase();
    return /\btechnicien\b/.test(fr) || /\btechnician\b/.test(en);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .mkw-tech-shield-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9400;
        background: rgba(0,0,0,.68);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }
      .mkw-tech-shield-panel {
        width: min(460px, 100%);
        max-height: 82vh;
        overflow: auto;
        background: linear-gradient(180deg,#1a1a24,#101018);
        color: #fff;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 20px;
        box-shadow: 0 22px 55px rgba(0,0,0,.58);
        padding: 16px;
      }
      .mkw-tech-shield-title { font-weight: 950; font-size: 19px; margin-bottom: 6px; color: #fff; }
      .mkw-tech-shield-help { color: rgba(255,255,255,.72); font-size: 13px; line-height: 1.35; margin-bottom: 14px; }
      .mkw-tech-shield-target {
        width: 100%; display: flex; align-items: center; gap: 12px; text-align: left;
        padding: 11px; margin: 8px 0; border-radius: 15px;
        border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.065);
        color: #fff; cursor: pointer; box-shadow: none; min-height: 70px;
      }
      .mkw-tech-shield-target:hover { background: rgba(80,150,255,.12); border-color: rgba(80,150,255,.52); }
      .mkw-tech-shield-portrait {
        width: 48px; height: 48px; object-fit: contain; border-radius: 12px;
        background: rgba(255,255,255,.08); flex: 0 0 auto; padding: 4px;
      }
      .mkw-tech-shield-info { flex: 1; min-width: 0; }
      .mkw-tech-shield-name { font-weight: 950; color: #fff; line-height: 1.15; }
      .mkw-tech-shield-class { font-size: 12px; color: rgba(255,255,255,.62); margin-top: 2px; line-height: 1.2; }
      .mkw-tech-shield-cancel {
        width: 100%; margin-top: 12px; padding: 12px; border-radius: 15px;
        border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08);
        color: #fff; font-weight: 900; cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    document.querySelector(".mkw-tech-shield-backdrop")?.remove();
  }

  function applyShield(technicianId, targetId) {
    const byTech = readJson(PREFIX + "blue-shield-by-tech", {});
    byTech[technicianId] = targetId;
    writeJson(PREFIX + "blue-shield-by-tech", byTech);
    window.dispatchEvent(new CustomEvent("mechkawaii:shield-updated", { detail: { charId: targetId, type: "technician" } }));
    closeModal();
    setTimeout(() => location.reload(), 60);
  }

  async function openModal() {
    ensureStyles();
    closeModal();
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
    cancel.addEventListener("click", closeModal);
    panel.appendChild(cancel);
    backdrop.appendChild(panel);
    backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
    document.body.appendChild(backdrop);
  }

  function isTrigger(button) {
    if (!button || button.closest(".mkw-tech-shield-backdrop")) return false;
    const card = button.closest(".card");
    if (!card || !card.querySelector("#classActionTitle")) return false;
    const title = document.querySelector("#classActionTitle")?.textContent?.toLowerCase() || "";
    const body = document.querySelector("#classActionBody")?.textContent?.toLowerCase() || "";
    const text = `${button.textContent || ""} ${title} ${body}`.toLowerCase();
    return /technicien|technician/.test(title) && /bouclier|shield|assigner|assign|proteger|protéger|protect/.test(text);
  }

  function init() {
    ensureStyles();
    document.addEventListener("click", event => {
      const button = event.target.closest && event.target.closest("button, [role='button']");
      if (!isTrigger(button)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openModal();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
