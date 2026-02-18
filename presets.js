/* =========================================================
   MECHKAWAII — Page Terrains Préconstruits (presets.js)
   À inclure APRÈS app.js dans index.html :
   <link rel="stylesheet" href="./presets.css" />
   <script src="./presets.js" defer></script>
   ========================================================= */

(function () {
  "use strict";

  /* -------------------------------------------------------
     Données des terrains
     Les textes sont extraits du fichier Lore_champs_de_bataille.txt
  ------------------------------------------------------- */
  const PRESETS = [
    {
      id: "01",
      emoji: "⚡️",
      title_fr: "Giga Centrale Électrique",
      title_en: "Giga Power Plant",
      lore_fr:
        "L'une des plus vastes centrales d'énergie de l'univers Mechkawaii. Ces installations colossales alimentent les métropoles grouillantes de vie et font tourner l'infrastructure des mégacités.\n\nMais leur importance en fait aussi des cibles stratégiques. Les Prodromes cherchent régulièrement à saboter ou capturer ces centrales pour plonger les villes dans l'obscurité… et affaiblir la résistance des habitants.",
      lore_en:
        "One of the largest energy plants in the Mechkawaii universe. These colossal facilities power teeming metropolises and keep the megacity infrastructure running.\n\nBut their importance also makes them strategic targets. The Prodromes regularly attempt to sabotage or capture these plants to plunge cities into darkness… and weaken the inhabitants' resistance.",
      img: "./assets/presets/01.png",
    },
    {
      id: "02",
      emoji: "🚚",
      title_fr: "Grande Route Logistique",
      title_en: "Great Logistics Road",
      lore_fr:
        "Principaux axes d'approvisionnement. Ces immenses routes industrielles transportent en continu des cargaisons précieuses : matériaux de construction, pièces mécaniques et modules d'armement destinés aux gigantesques Génématrices.\n\nMais une route si cruciale attire forcément les convoitises. Les Prodromes savent que frapper ici, c'est bloquer toute une chaîne de production. Embuscades, pillages et sabotages transforment fréquemment ce corridor en champ de bataille.",
      lore_en:
        "Main supply arteries. These vast industrial roads continuously transport precious cargo: construction materials, mechanical parts, and weapon modules destined for the colossal Génématrices.\n\nBut such a critical road inevitably attracts covetous eyes. The Prodromes know that striking here means blocking an entire production chain. Ambushes, pillaging, and sabotage frequently turn this corridor into a battlefield.",
      img: "./assets/presets/02.png",
    },
    {
      id: "03",
      emoji: "🌑",
      title_fr: "La Zone Cendrée",
      title_en: "The Ashen Zone",
      lore_fr:
        "Les vestiges d'un quartier entier réduit en poussière. Les façades calcinées tiennent à peine debout, et un voile gris recouvre chaque ruelle. Le silence est seulement brisé par l'écho métallique des pas et le craquement des débris qui s'effondrent.\n\nLes Prodromes aiment s'y aventurer car les cendres opaques brouillent la visibilité et masquent leurs mouvements.",
      lore_en:
        "The remnants of an entire district reduced to dust. Charred facades barely stand, and a grey veil covers every alley. The silence is broken only by the metallic echo of footsteps and the creak of collapsing debris.\n\nThe Prodromes love to venture here because the opaque ashes blur visibility and mask their movements.",
      img: "./assets/presets/03.png",
    },
    {
      id: "04",
      emoji: "🏭",
      title_fr: "L'Usine Silencieuse",
      title_en: "The Silent Factory",
      lore_fr:
        "Immense bâtiment industriel déserté, ses halls obscurs sont remplis de poutres tordues et de machines éventrées. L'air est chargé de poussière et de suie, vestiges d'une activité qui ne reprendra jamais.\n\nLes Mechkawaii la protègent car ses ruines recèlent encore des ressources rares, pièces mécaniques et énergie dormante.",
      lore_en:
        "A vast abandoned industrial building, its dark halls filled with twisted beams and gutted machines. The air is heavy with dust and soot, remnants of activity that will never resume.\n\nThe Mechkawaii protect it because its ruins still hold rare resources, mechanical parts, and dormant energy.",
      img: "./assets/presets/04.png",
    },
    {
      id: "05",
      emoji: "⚫",
      title_fr: "Le Cratère Noir",
      title_en: "The Black Crater",
      lore_fr:
        "Une explosion titanesque a éventré cette zone, ne laissant qu'un gouffre béant bordé de décombres noircis. Tout autour, les bâtiments sont tordus comme des silhouettes en souffrance, rappelant la violence de l'attaque.\n\nLes Prodromes y voient un symbole de destruction à entretenir, un rappel constant de leur puissance et de leur menace.",
      lore_en:
        "A titanic explosion gutted this zone, leaving only a gaping chasm bordered by blackened rubble. All around, buildings are twisted like suffering silhouettes, a reminder of the violence of the attack.\n\nThe Prodromes see it as a symbol of destruction to maintain, a constant reminder of their power and threat.",
      img: "./assets/presets/05.png",
    },
    {
      id: "06",
      emoji: "🚉",
      title_fr: "La Gare Fracturée",
      title_en: "The Fractured Station",
      lore_fr:
        "Les rails sont tordus, les wagons éventrés gisent de travers et l'édifice monumentale s'est effondrée. L'endroit résonne encore du vacarme des trains disparus.\n\nLes Prodromes attaquent cette zone pour couper les réseaux de transport et isoler les cités entre elles.",
      lore_en:
        "The rails are twisted, gutted wagons lie askew, and the monumental structure has collapsed. The place still echoes with the din of vanished trains.\n\nThe Prodromes attack this zone to cut transportation networks and isolate cities from each other.",
      img: "./assets/presets/06.png",
    },
    {
      id: "07",
      emoji: "🕯️",
      title_fr: "La Place du Souvenir",
      title_en: "The Place of Remembrance",
      lore_fr:
        "Une grande esplanade autrefois dédiée aux cérémonies, aujourd'hui ravagée par des impacts d'obus. Les statues sont décapitées et les pavés éclatés par les flammes.\n\nLes Prodromes aiment y frapper pour effacer les symboles de la mémoire collective et marquer leur domination psychologique.",
      lore_en:
        "A grand esplanade once dedicated to ceremonies, now ravaged by shell impacts. The statues are decapitated and the cobblestones shattered by flames.\n\nThe Prodromes love to strike here to erase the symbols of collective memory and assert their psychological dominance.",
      img: "./assets/presets/07.png",
    },
    {
      id: "08",
      emoji: "🏭",
      title_fr: "La Fosse d'Assemblage",
      title_en: "The Assembly Pit",
      lore_fr:
        "Vestige d'une usine souterraine, ses chaînes de montage sont figées et ses fosses grouillent de carcasses de mechas inachevés.\n\nLes Prodromes cherchent à s'en emparer pour réactiver les machines et détourner leur production.",
      lore_en:
        "Remnant of an underground factory, its assembly lines frozen and its pits teeming with unfinished mecha carcasses.\n\nThe Prodromes seek to seize it to reactivate the machines and divert their production.",
      img: "./assets/presets/08.png",
    },
    {
      id: "09",
      emoji: "🏢",
      title_fr: "Quartiers Résidentiels",
      title_en: "Residential Districts",
      lore_fr:
        "Des gratte-ciel éventrés, dont la moitié des étages a disparu, laissant des squelettes métalliques. Ses ruines dominent encore toute la zone.\n\nLes Prodromes en font un bastion, utilisant sa hauteur comme poste d'observation pour contrôler la ville.",
      lore_en:
        "Gutted skyscrapers, half their floors gone, leaving metallic skeletons. Their ruins still dominate the entire zone.\n\nThe Prodromes turn them into a bastion, using their height as an observation post to control the city.",
      img: "./assets/presets/09.png",
    },
    {
      id: "10",
      emoji: "📚",
      title_fr: "Les Grandes Archives",
      title_en: "The Great Archives",
      lore_fr:
        "Colossales bâtisses autrefois dédiées au savoir, aujourd'hui ouvertes en deux par une frappe orbitale. Des piles de tablettes de données s'entassent dans les couloirs noircis.\n\nLes Mechkawaii cherchent à la protéger car elle renferme encore des archives et des plans techniques cruciaux pour la reconstruction.",
      lore_en:
        "Colossal buildings once dedicated to knowledge, now split in two by an orbital strike. Stacks of data tablets pile up in blackened corridors.\n\nThe Mechkawaii seek to protect it because it still holds archives and technical blueprints crucial for reconstruction.",
      img: "./assets/presets/10.png",
    },
  ];

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */
  let currentIndex = 0;

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
  function getLang() {
    return localStorage.getItem("mechkawaii:lang") || "fr";
  }

  function tr(frVal, enVal) {
    return getLang() === "en" ? enVal : frVal;
  }

  /* -------------------------------------------------------
     Build HTML
  ------------------------------------------------------- */
  function buildPresetsPage() {
    const page = document.createElement("div");
    page.id = "presetsPage";
    page.className = "hidden";
    page.innerHTML = `
      <div class="container">
        <div class="topbar">
          <div class="brand">
            <div class="title" id="presetsPageTitle">TERRAINS PRÉCONSTRUITS</div>
          </div>
          <div class="controls"></div>
        </div>

        <div class="presets-carousel-section">

          <div class="presets-nav">
            <button class="presets-nav-btn" id="presetsPrevBtn" aria-label="Précédent">‹</button>
            <span class="presets-counter" id="presetsCounter">1 / ${PRESETS.length}</span>
            <button class="presets-nav-btn" id="presetsNextBtn" aria-label="Suivant">›</button>
          </div>

          <div class="presets-stage" id="presetsStage">
            <!-- card injected by JS -->
          </div>

          <div class="presets-dots" id="presetsDots"></div>

          <p class="presets-keyboard-hint" id="presetsKeyHint">← → pour naviguer · clic pour retourner</p>

        </div>
      </div>
    `;
    document.body.appendChild(page);
  }

  /* -------------------------------------------------------
     Render card
  ------------------------------------------------------- */
  function renderCard(index, flipped = false) {
    const stage = document.getElementById("presetsStage");
    if (!stage) return;

    const p = PRESETS[index];
    const lang = getLang();
    const title = lang === "en" ? p.title_en : p.title_fr;
    const lore = lang === "en" ? p.lore_en : p.lore_fr;

    // Paragraphs (split on \n\n)
    const paragraphs = lore
      .split("\n\n")
      .map((para) => `<p class="preset-lore">${para.replace(/\n/g, "<br>")}</p>`)
      .join("");

    stage.innerHTML = `
      <div class="preset-card${flipped ? " is-flipped" : ""}" id="presetCard" tabindex="0" aria-label="${title}">

        <!-- Recto : texte -->
        <div class="preset-face preset-front" data-num="${p.id.padStart(2, "0")}" style="background-image: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.35) 100%), url('./assets/presets/bg/${p.id}.png')">
          <div class="preset-lore-wrapper">
            <h2 class="preset-title">${title} <span class="title-emoji" aria-hidden="true">${p.emoji}</span></h2>
            ${paragraphs}
          </div>
          <span class="preset-hint" aria-hidden="true">${tr("Voir le terrain ↩", "Show terrain ↩")}</span>
        </div>

        <!-- Verso : image -->
        <div class="preset-face preset-back">
          <img src="${p.img}" alt="${title}" loading="lazy">
          <div class="preset-img-label">${title}</div>
          <span class="preset-hint-back" aria-hidden="true">${tr("Lire le lore ↩", "Read lore ↩")}</span>
        </div>

      </div>
    `;

    // Bind flip on card click
    const card = document.getElementById("presetCard");
    if (card) {
      card.addEventListener("click", () => {
        card.classList.toggle("is-flipped");
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.classList.toggle("is-flipped");
        }
      });
    }
  }

  /* -------------------------------------------------------
     Render dots
  ------------------------------------------------------- */
  function renderDots() {
    const container = document.getElementById("presetsDots");
    if (!container) return;
    container.innerHTML = "";
    PRESETS.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "preset-dot" + (i === currentIndex ? " is-active" : "");
      dot.setAttribute("aria-label", `Terrain ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      container.appendChild(dot);
    });
  }

  /* -------------------------------------------------------
     Update counter
  ------------------------------------------------------- */
  function updateCounter() {
    const counter = document.getElementById("presetsCounter");
    if (counter) counter.textContent = `${currentIndex + 1} / ${PRESETS.length}`;

    const prevBtn = document.getElementById("presetsPrevBtn");
    const nextBtn = document.getElementById("presetsNextBtn");
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === PRESETS.length - 1;
  }

  /* -------------------------------------------------------
     Navigation
  ------------------------------------------------------- */
  function goTo(index) {
    if (index < 0 || index >= PRESETS.length) return;
    currentIndex = index;
    renderCard(currentIndex);
    renderDots();
    updateCounter();

    // Reset stage animation
    const stage = document.getElementById("presetsStage");
    if (stage) {
      stage.style.animation = "none";
      void stage.offsetWidth;
      stage.style.animation = "";
    }
  }

  /* -------------------------------------------------------
     Open / close
  ------------------------------------------------------- */
  function openPresets() {
    const page = document.getElementById("presetsPage");
    if (!page) return;

    // Update i18n on open
    const titleEl = document.getElementById("presetsPageTitle");
    if (titleEl) titleEl.textContent = tr("TERRAINS PRÉCONSTRUITS", "PRESET TERRAINS");
    const keyHint = document.getElementById("presetsKeyHint");
    if (keyHint) keyHint.textContent = tr("← → pour naviguer · clic pour retourner", "← → to navigate · click to flip");

    // Injecter le fil d'ariane sous la topbar
    if (!page.querySelector("#mkw-breadcrumb-presets")) {
      const bc = document.createElement("nav");
      bc.id = "mkw-breadcrumb-presets";
      bc.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:14px;";

      const homeBtn = document.createElement("button");
      homeBtn.className = "bc-step bc-done";
      homeBtn.id = "presetsGoHome";
      homeBtn.textContent = "Accueil";

      const sep1 = document.createElement("span");
      sep1.className = "bc-sep";
      sep1.textContent = ">";

      const terrainBtn = document.createElement("button");
      terrainBtn.className = "bc-step bc-done";
      terrainBtn.id = "presetsGoTerrain";
      terrainBtn.textContent = "Terrain";

      const sep2 = document.createElement("span");
      sep2.className = "bc-sep";
      sep2.textContent = ">";

      const currentLabel = document.createElement("button");
      currentLabel.className = "bc-step bc-current";
      currentLabel.textContent = "Maps préconstruites";
      currentLabel.disabled = true;

      bc.appendChild(homeBtn);
      bc.appendChild(sep1);
      bc.appendChild(terrainBtn);
      bc.appendChild(sep2);
      bc.appendChild(currentLabel);

      const container = page.querySelector(".container");
      const topbar = container?.querySelector(".topbar");
      if (topbar?.nextSibling) {
        container.insertBefore(bc, topbar.nextSibling);
      } else if (container) {
        container.appendChild(bc);
      }
    }

    currentIndex = 0;
    page.classList.remove("hidden");

    renderCard(currentIndex);
    renderDots();
    updateCounter();
  }

  function closePresets() {
    const page = document.getElementById("presetsPage");
    if (page) page.classList.add("hidden");
  }

  /* -------------------------------------------------------
     Bind events
  ------------------------------------------------------- */
  function bind() {
    // Prev / Next buttons + breadcrumb
    document.addEventListener("click", (e) => {
      if (e.target.id === "presetsPrevBtn") goTo(currentIndex - 1);
      if (e.target.id === "presetsNextBtn") goTo(currentIndex + 1);

      // Breadcrumb : retour terrain
      if (e.target.id === "presetsGoTerrain") {
        closePresets();
      }

      // Breadcrumb : retour accueil
      if (e.target.id === "presetsGoHome") {
        closePresets();
        const terrainPage = document.getElementById("terrainPage");
        if (terrainPage) terrainPage.classList.add("hidden");
        const splash = document.getElementById("splash");
        if (splash) splash.style.display = "block";
        document.documentElement.classList.remove("splash-dismissed");
      }
    });

    // Keyboard navigation (only when page is visible)
    document.addEventListener("keydown", (e) => {
      const page = document.getElementById("presetsPage");
      if (!page || page.classList.contains("hidden")) return;

      if (e.key === "ArrowLeft") goTo(currentIndex - 1);
      if (e.key === "ArrowRight") goTo(currentIndex + 1);
      if (e.key === "Escape") closePresets();
    });

    // Touch swipe support
    let touchStartX = 0;
    document.addEventListener("touchstart", (e) => {
      const page = document.getElementById("presetsPage");
      if (!page || page.classList.contains("hidden")) return;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener("touchend", (e) => {
      const page = document.getElementById("presetsPage");
      if (!page || page.classList.contains("hidden")) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goTo(currentIndex + 1);
        else goTo(currentIndex - 1);
      }
    }, { passive: true });

    // Hook into the existing presetMapBtn in app.js terrain page
    // We replace the alert() by intercepting the button's click
    const presetMapBtn = document.getElementById("presetMapBtn");
    if (presetMapBtn) {
      // Remove old listeners by cloning the button
      const newBtn = presetMapBtn.cloneNode(true);
      presetMapBtn.parentNode.replaceChild(newBtn, presetMapBtn);
      newBtn.addEventListener("click", openPresets);
    }
  }

  /* -------------------------------------------------------
     Init
  ------------------------------------------------------- */
  function init() {
    buildPresetsPage();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
