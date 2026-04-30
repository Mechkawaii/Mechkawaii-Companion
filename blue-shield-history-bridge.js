(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const HISTORY_KEY = PREFIX + "action-history";
  const MAX_HISTORY = 30;

  function readJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function currentName(charId) {
    const currentId = new URL(location.href).searchParams.get("id") || "";
    if (charId && charId === currentId) {
      return document.querySelector("#charName")?.textContent?.trim() || charId;
    }
    return charId || "?";
  }

  function message(charId) {
    const name = currentName(charId);
    return getLang() === "en" ? `Shield removed from ${name}.` : `Bouclier retiré de ${name}.`;
  }

  function toast(text) {
    let root = document.querySelector("#mkwToastRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "mkwToastRoot";
      document.body.appendChild(root);
    }
    const el = document.createElement("div");
    el.className = "mkw-toast";
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2700);
  }

  function addHistory(text) {
    const item = { id: String(Date.now()) + Math.random().toString(16).slice(2), message: text, type: "shield", at: new Date().toISOString() };
    const items = readJson(HISTORY_KEY, []);
    writeJson(HISTORY_KEY, [item, ...items].slice(0, MAX_HISTORY));
    toast(text);
  }

  function init() {
    window.addEventListener("mechkawaii:blue-shields-cleared", event => {
      const ids = Array.isArray(event.detail?.charIds) ? event.detail.charIds : [];
      ids.forEach(id => addHistory(message(id)));
    });

    window.addEventListener("mechkawaii:shield-updated", event => {
      if (event.detail?.type !== "technician" || !event.detail?.expired || !event.detail?.charId) return;
      addHistory(message(event.detail.charId));
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
