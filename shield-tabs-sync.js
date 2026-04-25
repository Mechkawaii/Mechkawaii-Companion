(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwShieldTabsSyncStyles";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .unit-tab.mkw-tab-shielded {
        border-color: rgba(80, 150, 255, .9) !important;
        box-shadow:
          0 0 0 2px rgba(80,150,255,.22),
          0 0 24px rgba(80,150,255,.55) !important;
      }

      .unit-tab.mkw-tab-shielded::after {
        content: "";
        position: absolute;
        inset: 6px;
        border-radius: 14px;
        pointer-events: none;
        border: 1px solid rgba(120,185,255,.55);
        box-shadow: inset 0 0 18px rgba(80,150,255,.28);
      }

      @keyframes mkwTabShieldPulse {
        0% { transform: translateY(0) scale(1); }
        45% { transform: translateY(-3px) scale(1.045); }
        100% { transform: translateY(0) scale(1); }
      }

      .unit-tab.mkw-tab-shield-pulse {
        animation: mkwTabShieldPulse .75s ease-out both !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getShieldedIds() {
    const byTech = readJson(PREFIX + "blue-shield-by-tech", {});
    return new Set(Object.values(byTech).filter(Boolean));
  }

  function syncTabs(pulseId) {
    ensureStyles();
    const shieldedIds = getShieldedIds();
    document.querySelectorAll("#unitTabs [data-char-id]").forEach(tab => {
      const charId = tab.dataset.charId;
      const isShielded = shieldedIds.has(charId);
      tab.classList.toggle("mkw-tab-shielded", isShielded);
    });

    if (pulseId) {
      const tab = document.querySelector(`#unitTabs [data-char-id="${CSS.escape(pulseId)}"]`);
      if (tab) {
        tab.classList.remove("mkw-tab-shield-pulse");
        void tab.offsetWidth;
        tab.classList.add("mkw-tab-shield-pulse");
        setTimeout(() => tab.classList.remove("mkw-tab-shield-pulse"), 850);
      }
    }
  }

  function delayedSync(pulseId) {
    setTimeout(() => syncTabs(pulseId), 0);
    setTimeout(() => syncTabs(pulseId), 80);
    setTimeout(() => syncTabs(pulseId), 220);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => delayedSync());
  } else {
    delayedSync();
  }

  window.addEventListener("pageshow", () => delayedSync());
  window.addEventListener("mechkawaii:shield-updated", event => delayedSync(event?.detail?.charId));
  window.addEventListener("storage", () => delayedSync());

  new MutationObserver(() => delayedSync()).observe(document.documentElement, { childList: true, subtree: true });
})();