/* =========================================================
   MECHKAWAII — Liste de personnages enrichie (charlist.js)
   ========================================================= */

(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function getLang() {
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }
  function t(obj, lang) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.fr || "";
  }
  function getState(charId) {
    try {
      const raw = localStorage.getItem(PREFIX + "state:" + charId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function upgradeCharList() {
    const list = document.getElementById("charList");
    if (!list || list.children.length === 0) return;
    if (list.classList.contains("charlist-upgraded")) return;

    // Attendre que __cachedChars soit disponible
    if (!window.__cachedChars || window.__cachedChars.length === 0) return;

    const links = [...list.querySelectorAll("a.char")];
    if (links.length === 0) return;

    list.classList.add("charlist-upgraded");
    list.innerHTML = "";

    const lang = getLang();
    const chars = window.__cachedChars;

    links.forEach(link => {
      const href = link.getAttribute("href") || "";
      const idMatch = href.match(/id=([^&]+)/);
      if (!idMatch) return;
      const charId = decodeURIComponent(idMatch[1]);
      const c = chars.find(x => x.id === charId);
      if (!c) return;
      list.appendChild(buildCard(c, lang, href));
    });
  }

  function buildCard(c, lang, href) {
    const saved = getState(c.id);
    const hp    = saved?.hp ?? (c.hp?.max ?? 0);
    const maxHp = c.hp?.max ?? 0;
    const isKo  = hp <= 0;
    const camp  = (c.camp || "mechkawaii").toLowerCase();

    const card = document.createElement("a");
    card.className = `char-card camp-${camp === "prodrome" ? "prodrome" : "mechkawaii"}`;
    card.href = href;
    if (isKo) card.classList.add("is-ko");

    /* Visuel plein corps */
    const visual = document.createElement("div");
    visual.className = "char-card-visual";

    const fullSrc = c.images?.full;
    if (fullSrc) {
      const img = document.createElement("img");
      img.src = fullSrc;
      img.alt = t(c.name, lang);
      img.className = "char-card-img";
      img.onerror = () => {
        visual.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
      };
      visual.appendChild(img);
    } else {
      visual.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
    }

    /* HP bar */
    const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    const hpBar = document.createElement("div");
    hpBar.className = "char-card-hpbar";
    hpBar.innerHTML = `<div class="char-card-hpbar-fill${hpPct <= 33 ? " low" : ""}" style="width:${hpPct}%"></div>`;
    visual.appendChild(hpBar);

    /* Infos */
    const info = document.createElement("div");
    info.className = "char-card-info";

    /* Logo de classe via c.images.portrait */
    const iconSrc = c.images?.portrait;
    const iconHtml = iconSrc
      ? `<img src="${iconSrc}" alt="" class="char-card-class-icon" onerror="this.style.display='none'" />`
      : "";

    info.innerHTML = `
      <div class="char-card-name">${t(c.name, lang)}</div>
      <div class="char-card-class">
        ${iconHtml}
        <span>${t(c.class, lang)}</span>
      </div>
    `;

    card.appendChild(visual);
    card.appendChild(info);
    return card;
  }

  function watch() {
    const list = document.getElementById("charList");
    if (!list) return;

    // Observer les mutations (app.js injecte les .char de manière async)
    const observer = new MutationObserver(() => {
      if (window.__cachedChars && window.__cachedChars.length > 0) {
        upgradeCharList();
      }
    });
    observer.observe(list, { childList: true });

    // Polling de sécurité (app.js est async, peut finir après nous)
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (window.__cachedChars && window.__cachedChars.length > 0) {
        upgradeCharList();
      }
      if (attempts >= 20) clearInterval(poll);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
