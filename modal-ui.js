(function(){
  "use strict";

  const PREFIX = "mechkawaii:";

  function safeParse(raw){
    if(!raw) return null;
    try { return JSON.parse(raw); } catch(e){ return null; }
  }

  function getLang(){
    return localStorage.getItem(PREFIX + "lang") || "fr";
  }

  function t(obj, lang){
    if(obj == null) return "";
    if(typeof obj === "string") return obj;
    return obj[lang] || obj.fr || "";
  }

  function normalize(s){
    return (s||"")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim();
  }

  function findCharByLabel(label, chars, lang){
    const n = normalize(label);
    return chars.find(c => normalize(t(c.name, lang)) === n || normalize(t(c.name, "fr")) === n || normalize(t(c.name, "en")) === n);
  }

  async function getAllChars(){
    if(Array.isArray(window.__cachedChars) && window.__cachedChars.length){
      return window.__cachedChars;
    }
    try{
      const res = await fetch("./data/characters.json", {cache:"no-store"});
      if(!res.ok) return [];
      const data = await res.json();
      window.__cachedChars = data;
      return data;
    }catch(e){ return []; }
  }

  function isOverlay(node){
    if(!(node instanceof HTMLElement)) return false;
    const style = getComputedStyle(node);
    return style.position === "fixed" && (node.style.zIndex === "1000" || style.zIndex === "1000");
  }

  async function enhanceOverlay(overlay){
    if(overlay.dataset.mkwStyled === "1") return;

    const content = overlay.firstElementChild;
    if(!content) return;

    const h2 = content.querySelector("h2");
    if(!h2) return;

    overlay.dataset.mkwStyled = "1";

    overlay.classList.add("mkw-modal-overlay");
    content.classList.add("mkw-modal-content");

    const lang = getLang();
    const chars = await getAllChars();

    // Header
    const header = document.createElement("div");
    header.className = "mkw-modal-header";

    const title = document.createElement("h2");
    title.className = "mkw-modal-title";
    title.textContent = h2.textContent;

    const subtitle = document.createElement("p");
    subtitle.className = "mkw-modal-subtitle";
    subtitle.textContent = lang === "fr" ? "Choisis une unité pour recevoir le bouclier" : "Choose a unit to receive the shield";

    header.appendChild(title);
    header.appendChild(subtitle);

    // Body
    const body = document.createElement("div");
    body.className = "mkw-modal-body";

    const grid = document.createElement("div");
    grid.className = "mkw-modal-grid";

    // Buttons extraction
    const buttons = Array.from(content.querySelectorAll("button"));

    let cancelBtn = null;

    buttons.forEach(btn => {
      const label = btn.textContent || "";
      const n = normalize(label);

      if(n.includes("annuler") || n.includes("cancel")){
        cancelBtn = btn;
        btn.classList.add("mkw-modal-close");
        return;
      }

      const char = findCharByLabel(label, chars, lang);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "mkw-modal-card";

      if(!char){
        card.classList.add("mkw-modal-hero-action", "mkw-modal-danger");
      }

      const visual = document.createElement("div");
      visual.className = "mkw-modal-card__visual";

      const img = document.createElement("img");
      if(char){
        img.src = char.images?.full || char.images?.portrait || "";
        img.alt = t(char.name, lang);
      } else {
        img.src = "./assets/icons/shield_off.svg";
      }

      visual.appendChild(img);

      const bodyCard = document.createElement("div");
      bodyCard.className = "mkw-modal-card__body";

      const name = document.createElement("p");
      name.className = "mkw-modal-card__name";
      name.textContent = char ? t(char.name, lang) : label;

      bodyCard.appendChild(name);

      if(char){
        const meta = document.createElement("div");
        meta.className = "mkw-modal-card__meta";

        const pillClass = document.createElement("span");
        pillClass.className = "mkw-modal-pill";
        pillClass.textContent = t(char.class, lang);

        const pillHp = document.createElement("span");
        pillHp.className = "mkw-modal-pill";
        pillHp.textContent = "HP " + (char.hp?.max ?? "?");

        meta.appendChild(pillClass);
        meta.appendChild(pillHp);

        bodyCard.appendChild(meta);
      }

      card.appendChild(visual);
      card.appendChild(bodyCard);

      card.addEventListener("click", () => btn.click());

      btn.classList.add("mkw-modal-hidden-btn");

      grid.appendChild(card);
    });

    body.appendChild(grid);

    // Footer actions
    const actions = document.createElement("div");
    actions.className = "mkw-modal-actions";

    if(cancelBtn){
      actions.appendChild(cancelBtn);
    }

    // Clean content
    content.innerHTML = "";
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(actions);
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if(isOverlay(node)){
          enhanceOverlay(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true });
})();
