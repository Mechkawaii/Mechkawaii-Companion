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
    const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    const card = document.createElement("a");
    card.className = `char-card camp-${camp === "prodrome" ? "prodrome" : "mechkawaii"}`;
    card.href = href;
    if (isKo) card.classList.add("is-ko");

    /* Image plein corps */
    const imgWrap = document.createElement("div");
    imgWrap.className = "char-card-img-wrap";

    const fullSrc = c.images?.full;
    if (fullSrc) {
      const img = document.createElement("img");
      img.src = fullSrc;
      img.alt = t(c.name, lang);
      img.className = "char-card-img";
      img.onerror = () => {
        imgWrap.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
      };
      imgWrap.appendChild(img);
    } else {
      imgWrap.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
    }

    /* Infos : logo + nom + classe */
    const info = document.createElement("div");
    info.className = "char-card-info";

    const iconSrc = c.images?.portrait;
    if (iconSrc) {
      const icon = document.createElement("img");
      icon.src = iconSrc;
      icon.alt = "";
      icon.className = "char-card-class-icon";
      icon.onerror = () => icon.style.display = "none";
      info.appendChild(icon);
    }

    const name = document.createElement("div");
    name.className = "char-card-name";
    name.textContent = t(c.name, lang);
    info.appendChild(name);

    const classLabel = document.createElement("div");
    classLabel.className = "char-card-class-label";
    classLabel.textContent = t(c.class, lang);
    info.appendChild(classLabel);

    /* HP bar */
    const hpBar = document.createElement("div");
    hpBar.className = "char-card-hpbar";
    hpBar.innerHTML = `<div class="char-card-hpbar-fill${hpPct <= 33 ? " low" : ""}" style="width:${hpPct}%"></div>`;

    card.appendChild(imgWrap);
    card.appendChild(info);
    card.appendChild(hpBar);
    return card;
  }

  function watch() {
    const list = document.getElementById("charList");
    if (!list) return;

    const observer = new MutationObserver(() => {
      if (window.__cachedChars && window.__cachedChars.length > 0) {
        upgradeCharList();
      }
    });
    observer.observe(list, { childList: true });

    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (window.__cachedChars && window.__cachedChars.length > 0) upgradeCharList();
      if (attempts >= 20) clearInterval(poll);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
