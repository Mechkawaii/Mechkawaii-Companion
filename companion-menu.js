(function () {
  "use strict";

  const PREFIX = "mechkawaii:";
  const STYLE_ID = "mkwCompanionMenuStyles";

  const I18N = {
    fr: {
      menu: "Menu",
      tutorial: "Tutoriel",
      history: "Historique des actions",
      language: "Langue",
      french: "Français",
      english: "English",
      close: "Fermer"
    },
    en: {
      menu: "Menu",
      tutorial: "Tutorial",
      history: "Action History",
      language: "Language",
      french: "Français",
      english: "English",
      close: "Close"
    }
  };

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || document.querySelector("#lang")?.value || "fr";
  }

  function tr(key) {
    const lang = getLang();
    return (I18N[lang] && I18N[lang][key]) || I18N.fr[key] || key;
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .topbar .controls .pill:has(#lang) {
        display: none !important;
      }

      #mkwCompanionMenuButton {
        position: static;
        z-index: 1;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(18,18,26,.94);
        color: #fff;
        box-shadow: 0 12px 28px rgba(0,0,0,.25);
        cursor: pointer;
        display: inline-grid;
        place-items: center;
        padding: 0;
        overflow: hidden;
      }

      #mkwCompanionMenuButton .mkw-menu-icon {
        width: 22px;
        height: 22px;
        display: block;
      }

      #mkwCompanionMenuButton .mkw-menu-icon svg {
        width: 22px;
        height: 22px;
        display: block;
        stroke: currentColor;
      }

      #mkwCompanionMenuBackdrop {
        position: fixed;
        inset: 0;
        z-index: 9200;
        background: rgba(0,0,0,.56);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: calc(66px + env(safe-area-inset-top, 0px)) 12px 12px;
      }

      #mkwCompanionMenuPanel {
        width: min(340px, calc(100vw - 24px));
        background: linear-gradient(180deg,#1a1a24,#101018);
        color: #fff;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 20px;
        box-shadow: 0 24px 60px rgba(0,0,0,.55);
        padding: 14px;
      }

      @media (min-width: 760px) {
        #mkwCompanionMenuBackdrop {
          align-items: flex-start;
          justify-content: center;
          padding-top: 76px;
        }
      }

      .mkw-menu-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .mkw-menu-title {
        font-size: 18px;
        font-weight: 950;
      }

      .mkw-menu-close {
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.08);
        color: #fff;
        border-radius: 12px;
        padding: 8px 10px;
        font-weight: 900;
        cursor: pointer;
      }

      .mkw-menu-item {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 8px;
        padding: 12px;
        border-radius: 15px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.065);
        color: #fff;
        font-weight: 950;
        cursor: pointer;
        text-align: left;
      }

      .mkw-menu-item:hover {
        background: rgba(255,255,255,.1);
        border-color: rgba(255,210,77,.45);
      }

      .mkw-menu-section-label {
        margin: 14px 2px 6px;
        color: rgba(255,255,255,.62);
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      .mkw-menu-lang-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .mkw-menu-lang {
        padding: 11px 10px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.065);
        color: #fff;
        font-weight: 950;
        cursor: pointer;
      }

      .mkw-menu-lang.is-active {
        border-color: rgba(255,210,77,.75);
        background: rgba(255,210,77,.16);
        box-shadow: 0 0 18px rgba(255,210,77,.2);
      }
    `;
    document.head.appendChild(style);
  }

  function closeMenu() {
    document.querySelector("#mkwCompanionMenuBackdrop")?.remove();
  }

  function setLang(lang) {
    localStorage.setItem(PREFIX + "lang", lang);
    const select = document.querySelector("#lang");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeMenu();
    setTimeout(() => location.reload(), 60);
  }

  function openMenu() {
    closeMenu();
    const lang = getLang();
    const backdrop = document.createElement("div");
    backdrop.id = "mkwCompanionMenuBackdrop";
    backdrop.innerHTML = `
      <div id="mkwCompanionMenuPanel" role="dialog" aria-modal="true">
        <div class="mkw-menu-head">
          <div class="mkw-menu-title">${tr("menu")}</div>
          <button class="mkw-menu-close" type="button">${tr("close")}</button>
        </div>
        <button class="mkw-menu-item" type="button" data-action="tutorial"><span>${tr("tutorial")}</span><span>›</span></button>
        <button class="mkw-menu-item" type="button" data-action="history"><span>${tr("history")}</span><span>›</span></button>
        <div class="mkw-menu-section-label">${tr("language")}</div>
        <div class="mkw-menu-lang-row">
          <button class="mkw-menu-lang ${lang === "fr" ? "is-active" : ""}" type="button" data-lang="fr">${tr("french")}</button>
          <button class="mkw-menu-lang ${lang === "en" ? "is-active" : ""}" type="button" data-lang="en">${tr("english")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeMenu();
    });
    backdrop.querySelector(".mkw-menu-close")?.addEventListener("click", closeMenu);
    backdrop.querySelector('[data-action="tutorial"]')?.addEventListener("click", () => {
      closeMenu();
      setTimeout(() => window.mkwStartCharacterTutorial?.(), 80);
    });
    backdrop.querySelector('[data-action="history"]')?.addEventListener("click", () => {
      closeMenu();
      setTimeout(() => window.mkwOpenActionHistory?.(), 80);
    });
    backdrop.querySelectorAll("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  }

  function menuIconSvg() {
    return `
      <span class="mkw-menu-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" focusable="false">
          <circle cx="12" cy="12" r="3.2"></circle>
          <path d="M12 2.8v2.1"></path>
          <path d="M12 19.1v2.1"></path>
          <path d="M4.2 4.2l1.5 1.5"></path>
          <path d="M18.3 18.3l1.5 1.5"></path>
          <path d="M2.8 12h2.1"></path>
          <path d="M19.1 12h2.1"></path>
          <path d="M4.2 19.8l1.5-1.5"></path>
          <path d="M18.3 5.7l1.5-1.5"></path>
        </svg>
      </span>
    `;
  }

  function ensureButton() {
    let btn = document.querySelector("#mkwCompanionMenuButton");
    const slot = document.querySelector("#mkw-char-menu-slot");

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "mkwCompanionMenuButton";
      btn.type = "button";
      btn.innerHTML = menuIconSvg();
      btn.setAttribute("aria-label", tr("menu"));
      btn.addEventListener("click", openMenu);
    }

    if (slot && btn.parentNode !== slot) {
      slot.appendChild(btn);
    } else if (!slot && !btn.parentNode) {
      document.body.appendChild(btn);
    }
  }

  function init() {
    ensureStyles();
    ensureButton();
    window.addEventListener("mechkawaii:nav-row-ready", ensureButton);
    setTimeout(ensureButton, 100);
    setTimeout(ensureButton, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
