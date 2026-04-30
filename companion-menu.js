(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

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
    ensureButton();
    window.addEventListener("mechkawaii:nav-row-ready", ensureButton);
    setTimeout(ensureButton, 100);
    setTimeout(ensureButton, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
