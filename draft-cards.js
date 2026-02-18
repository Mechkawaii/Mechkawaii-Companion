/* =========================================================
   MECHKAWAII — Sélection par cartes visuelles (draft-cards.js)
   Remplace les toggles du #draftList par des cartes cliquables.
   À inclure après app.js :
   <link rel="stylesheet" href="./draft-cards.css" />
   <script src="./draft-cards.js" defer></script>
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

  function upgradeDraftList() {
    const draftList = document.getElementById("draftList");
    if (!draftList) return;
    if (draftList.classList.contains("draft-upgraded")) return;
    if (!window.__cachedChars || window.__cachedChars.length === 0) return;

    // Les toggles doivent être là
    const toggles = [...draftList.querySelectorAll(".toggle")];
    if (toggles.length === 0) return;

    const lang = getLang();
    const chars = window.__cachedChars;

    // Lire maxPick depuis le bouton confirm (ex: "Valider les 3 unités")
    const confirmBtn = document.getElementById("confirmDraft");
    const maxPickMatch = confirmBtn?.textContent?.match(/\d+/);
    const maxPick = maxPickMatch ? parseInt(maxPickMatch[0]) : 3;

    // Récupérer les ids dans l'ordre des toggles
    const charIds = toggles.map(row => {
      const nameEl = row.querySelector(".t");
      if (!nameEl) return null;
      const name = nameEl.textContent.trim();
      return chars.find(c => t(c.name, lang) === name)?.id || null;
    }).filter(Boolean);

    draftList.classList.add("draft-upgraded");
    draftList.innerHTML = "";

    const selected = new Set();

    // Cacher les anciens boutons confirm/skip — on en crée de nouveaux
    if (confirmBtn) confirmBtn.style.display = "none";
    const skipBtn = document.getElementById("skipDraft");
    if (skipBtn) skipBtn.style.display = "none";

    // Construire les cartes
    charIds.forEach(charId => {
      const c = chars.find(x => x.id === charId);
      if (!c) return;

      const card = document.createElement("div");
      card.className = "draft-card";
      card.dataset.charId = charId;

      const imgWrap = document.createElement("div");
      imgWrap.className = "draft-card-img-wrap";

      const fullSrc = c.images?.full;
      if (fullSrc) {
        const img = document.createElement("img");
        img.src = fullSrc;
        img.alt = t(c.name, lang);
        img.className = "draft-card-img";
        img.onerror = () => {
          imgWrap.innerHTML = `<div class="draft-card-initial">${t(c.name, lang).charAt(0)}</div>`;
        };
        imgWrap.appendChild(img);
      } else {
        imgWrap.innerHTML = `<div class="draft-card-initial">${t(c.name, lang).charAt(0)}</div>`;
      }

      // Checkmark sélection
      const check = document.createElement("div");
      check.className = "draft-card-check";
      check.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      imgWrap.appendChild(check);

      const info = document.createElement("div");
      info.className = "draft-card-info";

      const iconSrc = c.images?.portrait;
      if (iconSrc) {
        const icon = document.createElement("img");
        icon.src = iconSrc;
        icon.alt = "";
        icon.className = "draft-card-class-icon";
        icon.onerror = () => icon.style.display = "none";
        info.appendChild(icon);
      }

      const name = document.createElement("div");
      name.className = "draft-card-name";
      name.textContent = t(c.name, lang);
      info.appendChild(name);

      const classLabel = document.createElement("div");
      classLabel.className = "draft-card-class-label";
      classLabel.textContent = t(c.class, lang);
      info.appendChild(classLabel);

      card.appendChild(imgWrap);
      card.appendChild(info);
      draftList.appendChild(card);

      // Toggle sélection au clic
      card.addEventListener("click", () => {
        const draftError = document.getElementById("draftError");

        if (selected.has(charId)) {
          selected.delete(charId);
          card.classList.remove("selected");
        } else {
          if (selected.size >= maxPick) {
            if (draftError) draftError.textContent = lang === "fr"
              ? `Tu as déjà ${maxPick} unités sélectionnées.`
              : `You already selected ${maxPick} units.`;
            return;
          }
          selected.add(charId);
          card.classList.add("selected");
        }

        if (draftError) draftError.textContent = "";
        updateConfirmBtn();
      });
    });

    // Nouveau bouton confirmer
    const btnWrap = document.createElement("div");
    btnWrap.className = "draft-btn-wrap";

    const newConfirm = document.createElement("button");
    newConfirm.className = "btn-accent draft-confirm-btn";
    newConfirm.id = "draftConfirmNew";
    newConfirm.textContent = lang === "fr"
      ? `Valider les ${maxPick} unités`
      : `Confirm ${maxPick} units`;

    function updateConfirmBtn() {
      newConfirm.textContent = lang === "fr"
        ? `Valider ${selected.size} / ${maxPick} unité${selected.size > 1 ? "s" : ""}`
        : `Confirm ${selected.size} / ${maxPick} unit${selected.size > 1 ? "s" : ""}`;
      newConfirm.disabled = selected.size !== maxPick;
      newConfirm.style.opacity = selected.size !== maxPick ? "0.5" : "1";
    }
    updateConfirmBtn();

    newConfirm.addEventListener("click", () => {
      if (selected.size !== maxPick) return;
      localStorage.setItem(PREFIX + "draft", JSON.stringify({ activeIds: [...selected] }));
      location.reload();
    });

    btnWrap.appendChild(newConfirm);
    draftList.after(btnWrap);
  }

  function watch() {
    const draftList = document.getElementById("draftList");
    if (!draftList) return;

    const observer = new MutationObserver(() => {
      if (window.__cachedChars && window.__cachedChars.length > 0) {
        upgradeDraftList();
      }
    });
    observer.observe(draftList, { childList: true });

    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (window.__cachedChars && window.__cachedChars.length > 0) upgradeDraftList();
      if (attempts >= 20) clearInterval(poll);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
