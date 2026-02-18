/* =========================================================
   MECHKAWAII — Liste de personnages enrichie (charlist.js)
   Remplace l'écran vide (image 4) par des cartes visuelles.

   Attend :
   - c.images.portrait  → visuel plein corps du perso
   - c.images.icon      → logo / icône de la classe (optionnel)

   À inclure dans index.html après app.js :
   <link rel="stylesheet" href="./charlist.css" />
   <script src="./charlist.js" defer></script>
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

  /* -------------------------------------------------------
     Observer : dès que #charList reçoit des .char,
     on les remplace par nos cartes améliorées
  ------------------------------------------------------- */
  function upgradeCharList() {
    const list = document.getElementById("charList");
    if (!list || list.children.length === 0) return;

    // Déjà upgradé ?
    if (list.classList.contains("charlist-upgraded")) return;

    // Les .char créés par app.js ont un attribut href
    const links = [...list.querySelectorAll("a.char")];
    if (links.length === 0) return;

    list.classList.add("charlist-upgraded");
    list.innerHTML = ""; // on vide et reconstruit

    const lang = getLang();
    const chars = window.__cachedChars || [];

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

  /* -------------------------------------------------------
     Construire une carte personnage
  ------------------------------------------------------- */
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

    /* ── Visuel plein corps (character_xxx.png) ── */
    const visual = document.createElement("div");
    visual.className = "char-card-visual";

    const portrait = c.images?.full
      || `./assets/characters/full_${c.id}.png`;
    if (portrait) {
      const img = document.createElement("img");
      img.src = portrait;
      img.alt = t(c.name, lang);
      img.className = "char-card-img";
      img.onerror = () => {
        visual.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
      };
      visual.appendChild(img);
    } else {
      visual.innerHTML = `<div class="char-card-initial">${t(c.name, lang).charAt(0)}</div>`;
    }

    /* ── HP bar ── */
    const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    const hpBar = document.createElement("div");
    hpBar.className = "char-card-hpbar";
    hpBar.innerHTML = `<div class="char-card-hpbar-fill${hpPct <= 33 ? " low" : ""}" style="width:${hpPct}%"></div>`;
    visual.appendChild(hpBar);

    /* ── Infos bas de carte ── */
    const info = document.createElement("div");
    info.className = "char-card-info";

    /* Logo de classe → assets/characters/classe_{nomclasse}.png */
    const rawClass = (typeof c.class === "object" ? c.class.fr : c.class) || "";
    const classSlug = rawClass.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire accents
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const icon = `./assets/characters/classe_${classSlug}.png`;
    const iconHtml = icon
      ? `<img src="${icon}" alt="" class="char-card-class-icon" />`
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

  /* -------------------------------------------------------
     Observer les modifications de #charList
  ------------------------------------------------------- */
  function watch() {
    const list = document.getElementById("charList");
    if (!list) return;

    const observer = new MutationObserver(() => upgradeCharList());
    observer.observe(list, { childList: true });

    // Essai immédiat au cas où app.js a déjà rendu
    upgradeCharList();
    setTimeout(upgradeCharList, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
