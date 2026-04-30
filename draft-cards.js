/* =========================================================
   MECHKAWAII — Sélection par cartes visuelles (draft-cards.js)
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

  const COL_COLORS = {
    urbain:  { border: "rgba(255,159,80,0.5)",  glow: "rgba(255,159,80,0.12)",  text: "#FF9F50" },
    foret:   { border: "rgba(94,207,106,0.5)",  glow: "rgba(94,207,106,0.12)",  text: "#5ecf6a" },
    hacker:  { border: "rgba(167,139,250,0.5)", glow: "rgba(167,139,250,0.12)", text: "#a78bfa" },
    general: { border: "rgba(244,114,182,0.5)", glow: "rgba(244,114,182,0.12)", text: "#f472b6" },
  };
  const COL_LABELS = {
    urbain:  { fr: "Biome Urbain",           en: "Urban Biome" },
    foret:   { fr: "Biome Foret",            en: "Forest Biome" },
    hacker:  { fr: "Additionnels - Hacker",  en: "Additional - Hacker" },
    general: { fr: "Additionnels - General", en: "Additional - General" },
  };
  const PILL_LABELS = {
    urbain:  { fr: "Urbain",  en: "Urban" },
    foret:   { fr: "Foret",   en: "Forest" },
    hacker:  { fr: "Hacker",  en: "Hacker" },
    general: { fr: "General", en: "General" },
  };
  const COL_ORDER = ["urbain", "foret", "hacker", "general"];
  const ADDITIONAL_LIMIT = ["hacker", "general"];

  function injectStyles() {
    if (document.getElementById("mkw-draft-col-css")) return;
    const s = document.createElement("style");
    s.id = "mkw-draft-col-css";
    s.textContent =
      "#draftList.draft-upgraded{display:block!important;padding:4px 0 8px;}" +
      ".draft-col-heading-vis{margin:16px 0 8px;padding:6px 12px;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--text);border-left:3px solid #FF9F50;border-radius:0 6px 6px 0;background:rgba(255,255,255,.04);display:flex;align-items:center;gap:6px;}" +
      ".draft-col-heading-vis[data-col=foret]{border-left-color:#5ecf6a;}" +
      ".draft-col-heading-vis[data-col=hacker]{border-left-color:#a78bfa;}" +
      ".draft-col-heading-vis[data-col=general]{border-left-color:#f472b6;}" +
      ".draft-col-heading-vis .col-sub{font-size:10px;font-weight:500;text-transform:none;letter-spacing:0;opacity:.65;margin-left:auto;}" +
      ".draft-col-row{display:flex;flex-direction:row;gap:10px;flex-wrap:wrap;margin-bottom:4px;}" +
      ".draft-card{flex:0 0 auto;width:120px;display:flex;flex-direction:column;align-items:center;gap:8px;border-radius:14px;border:2px solid rgba(255,255,255,0.1);background:rgba(19,19,26,0.85);padding:10px 8px;cursor:pointer;transition:border-color .2s,transform .15s,box-shadow .2s,background .2s;user-select:none;}" +
      ".draft-card:hover{transform:translateY(-3px);}" +
      ".draft-card-img-wrap{position:relative;width:100%;aspect-ratio:2/3;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.3);}" +
      ".draft-card-img{width:100%;height:100%;object-fit:contain;object-position:center bottom;display:block;transition:transform .2s;}" +
      ".draft-card:hover .draft-card-img{transform:scale(1.04);}" +
      ".draft-card-initial{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:900;color:rgba(255,255,255,.15);}" +
      ".draft-card-check{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.5);transition:opacity .2s,transform .2s;z-index:2;background:#FF9F50;}" +
      ".draft-card-check svg{width:12px;height:12px;color:#000;}" +
      ".draft-card.selected .draft-card-check{opacity:1;transform:scale(1);}" +
      ".draft-card-info{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;}" +
      ".draft-card-class-icon{width:28px;height:28px;object-fit:contain;}" +
      ".draft-card-name{font-size:12px;font-weight:900;text-align:center;color:var(--text);line-height:1.2;transition:color .2s;}" +
      ".draft-card-class-label{font-size:10px;font-weight:600;color:var(--muted);text-align:center;}" +
      ".draft-col-pill{display:inline-block;font-size:9px;font-weight:700;padding:1px 5px;border-radius:20px;margin-top:2px;}" +
      ".draft-btn-wrap{margin-top:16px;display:flex;gap:10px;}" +
      ".draft-confirm-btn{transition:opacity .2s;}";
    document.head.appendChild(s);
  }

  function upgradeDraftList() {
    const draftList = document.getElementById("draftList");
    if (!draftList) return;
    if (draftList.classList.contains("draft-upgraded")) return;
    if (!window.__cachedChars || window.__cachedChars.length === 0) return;

    // Attendre les .toggle avec data-char-id (generés par app.js)
    const toggles = [...draftList.querySelectorAll(".toggle[data-char-id]")];
    if (toggles.length === 0) return;

    injectStyles();

    const lang = getLang();
    const chars = window.__cachedChars;

    const confirmBtn = document.getElementById("confirmDraft");
    const maxPickMatch = confirmBtn?.textContent?.match(/\d+/);
    const maxPick = maxPickMatch ? parseInt(maxPickMatch[0]) : 3;

    // Grouper par collection depuis data-collection
    const groups = {};
    COL_ORDER.forEach(k => { groups[k] = []; });
    toggles.forEach(row => {
      const col = row.getAttribute("data-collection") || "urbain";
      const id = row.getAttribute("data-char-id");
      if (id) (groups[col] = groups[col] || []).push(id);
    });

    draftList.classList.add("draft-upgraded");
    draftList.innerHTML = "";

    if (confirmBtn) confirmBtn.style.display = "none";
    const skipBtn = document.getElementById("skipDraft");
    if (skipBtn) skipBtn.style.display = "none";

    const selected = new Set();
    const cardMap = {};

    function countCol(col) {
      return [...selected].filter(id => {
        const ch = chars.find(x => x.id === id);
        return ch && (ch.collection || "urbain") === col;
      }).length;
    }

    function refreshCards() {
      Object.entries(cardMap).forEach(function(entry) {
        var id = entry[0];
        var card = entry[1];
        var ch = chars.find(function(x) { return x.id === id; });
        var charCol = (ch && ch.collection) ? ch.collection : "urbain";
        var isOn = selected.has(id);
        var colors = COL_COLORS[charCol] || COL_COLORS.urbain;

        card.classList.toggle("selected", isOn);
        var nameEl = card.querySelector(".draft-card-name");
        var checkEl = card.querySelector(".draft-card-check");

        if (isOn) {
          card.style.borderColor = colors.border;
          card.style.background = colors.glow;
          card.style.boxShadow = "0 0 18px " + colors.glow;
          if (nameEl) nameEl.style.color = colors.text;
          if (checkEl) checkEl.style.background = colors.text;
        } else {
          card.style.borderColor = "";
          card.style.background = "";
          card.style.boxShadow = "";
          if (nameEl) nameEl.style.color = "";
        }

        var blocked = false;
        if (!isOn) {
          if (selected.size >= maxPick) blocked = true;
          if (ADDITIONAL_LIMIT.includes(charCol) && countCol(charCol) >= 1) blocked = true;
        }
        card.style.opacity = blocked ? "0.3" : "";
        card.style.pointerEvents = blocked ? "none" : "";
      });

      updateConfirmBtn();
    }

    // Construire les sections
    COL_ORDER.forEach(function(colKey) {
      var group = groups[colKey];
      if (!group || group.length === 0) return;

      var colors = COL_COLORS[colKey] || COL_COLORS.urbain;

      var heading = document.createElement("div");
      heading.className = "draft-col-heading-vis";
      heading.setAttribute("data-col", colKey);
      heading.textContent = (lang === "fr") ? COL_LABELS[colKey].fr : COL_LABELS[colKey].en;
      draftList.appendChild(heading);

      var rowEl = document.createElement("div");
      rowEl.className = "draft-col-row";

      group.forEach(function(charId) {
        var c = chars.find(function(x) { return x.id === charId; });
        if (!c) return;

        var charCol = c.collection || "urbain";
        var pillLabel = (PILL_LABELS[charCol] || {})[lang] || charCol;
        var camp = (c.camp || "mechkawaii").toLowerCase();

        var card = document.createElement("div");
        card.className = "draft-card camp-" + (camp === "prodrome" ? "prodrome" : "mechkawaii");
        card.dataset.charId = charId;
        cardMap[charId] = card;

        var imgWrap = document.createElement("div");
        imgWrap.className = "draft-card-img-wrap";
        var fullSrc = c.images && c.images.full;
        if (fullSrc) {
          var img = document.createElement("img");
          img.src = fullSrc;
          img.alt = t(c.name, lang);
          img.className = "draft-card-img";
          img.onerror = function() {
            imgWrap.innerHTML = '<div class="draft-card-initial">' + t(c.name, lang).charAt(0) + '</div>';
          };
          imgWrap.appendChild(img);
        } else {
          imgWrap.innerHTML = '<div class="draft-card-initial">' + t(c.name, lang).charAt(0) + '</div>';
        }

        var check = document.createElement("div");
        check.className = "draft-card-check";
        check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        imgWrap.appendChild(check);

        var info = document.createElement("div");
        info.className = "draft-card-info";

        var iconSrc = c.images && c.images.portrait;
        if (iconSrc) {
          var icon = document.createElement("img");
          icon.src = iconSrc;
          icon.alt = "";
          icon.className = "draft-card-class-icon";
          icon.onerror = function() { icon.style.display = "none"; };
          info.appendChild(icon);
        }

        var nameEl = document.createElement("div");
        nameEl.className = "draft-card-name";
        nameEl.textContent = t(c.name, lang);
        info.appendChild(nameEl);

        var classLabel = document.createElement("div");
        classLabel.className = "draft-card-class-label";
        classLabel.textContent = t(c.class, lang);
        info.appendChild(classLabel);

        var pill = document.createElement("div");
        pill.className = "draft-col-pill";
        pill.textContent = pillLabel;
        pill.style.background = colors.glow;
        pill.style.color = colors.text;
        info.appendChild(pill);

        card.appendChild(imgWrap);
        card.appendChild(info);
        rowEl.appendChild(card);

        card.addEventListener("click", function() {
          var draftError = document.getElementById("draftError");
          if (selected.has(charId)) {
            selected.delete(charId);
            if (draftError) draftError.textContent = "";
          } else {
            if (selected.size >= maxPick) {
              if (draftError) draftError.textContent = lang === "fr"
                ? "Tu as deja " + maxPick + " unites selectionnees."
                : "You already selected " + maxPick + " units.";
              return;
            }
            if (ADDITIONAL_LIMIT.includes(charCol) && countCol(charCol) >= 1) {
              if (draftError) draftError.textContent = lang === "fr"
                ? "Maximum 1 personnage " + pillLabel + " par equipe."
                : "Maximum 1 " + pillLabel + " character per team.";
              return;
            }
            selected.add(charId);
            if (draftError) draftError.textContent = "";
          }
          refreshCards();
        });
      });

      draftList.appendChild(rowEl);
    });

    // Bouton confirmer
    var btnWrap = document.createElement("div");
    btnWrap.className = "draft-btn-wrap";

    var newConfirm = document.createElement("button");
    newConfirm.className = "btn-accent draft-confirm-btn";
    newConfirm.id = "draftConfirmNew";

    function updateConfirmBtn() {
      newConfirm.textContent = lang === "fr"
        ? "Valider " + selected.size + " / " + maxPick + " unite" + (selected.size > 1 ? "s" : "")
        : "Confirm " + selected.size + " / " + maxPick + " unit" + (selected.size > 1 ? "s" : "");
      newConfirm.disabled = selected.size !== maxPick;
      newConfirm.style.opacity = selected.size !== maxPick ? "0.5" : "1";
    }
    updateConfirmBtn();

    newConfirm.addEventListener("click", function() {
      if (selected.size !== maxPick) return;
      var ids = [...selected];
      if (typeof window.mkwConfirmDraftSelection === "function") {
        window.mkwConfirmDraftSelection(ids);
        return;
      }
      localStorage.setItem(PREFIX + "draft", JSON.stringify({ activeIds: ids }));
      location.href = "character.html?id=" + encodeURIComponent(ids[0]);
    });

    btnWrap.appendChild(newConfirm);
    draftList.after(btnWrap);
  }

  function watch() {
    var draftList = document.getElementById("draftList");
    if (!draftList) return;

    var observer = new MutationObserver(function() {
      if (window.__cachedChars && window.__cachedChars.length > 0) {
        upgradeDraftList();
      }
    });
    observer.observe(draftList, { childList: true });

    var attempts = 0;
    var poll = setInterval(function() {
      attempts++;
      if (window.__cachedChars && window.__cachedChars.length > 0) upgradeDraftList();
      if (attempts >= 30) clearInterval(poll);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
