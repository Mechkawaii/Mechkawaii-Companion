# 🎯 MODE NORMAL VS EXPERT - Guide d'implémentation

## 📋 Ce qui a été ajouté

Le système permet maintenant de choisir entre :
- **Mode Normal** ⭐ : Patterns standard
- **Mode Expert** 💀 : Patterns avancés

---

## 🔄 Flow utilisateur

### Setup initial
```
1. Choix du mode (Un appareil / Multi-appareils)
   ↓
2. [Si multi] Choix du camp (Mechkawaii / Prodrome)
   ↓
3. NOUVEAU → Choix de la difficulté (Normal / Expert)
   ↓
4. Sélection des personnages
   ↓
5. Jeu commence
```

### Affichage des patterns
Sur la page d'un personnage (`character.html`) :
- **Mode Normal** → Affiche `movement_normal.png` et `attack_normal.png`
- **Mode Expert** → Affiche `movement_expert.png` et `attack_expert.png`

---

## 📁 Structure des fichiers

### 1. Organisation des assets

```
assets/
└── patterns/
    ├── goryo_movement_normal.png
    ├── goryo_attack_normal.png
    ├── goryo_movement_expert.png
    ├── goryo_attack_expert.png
    ├── goki_movement_normal.png
    ├── goki_attack_normal.png
    ├── goki_movement_expert.png
    ├── goki_attack_expert.png
    └── ... (pour chaque personnage)
```

### 2. Mise à jour de `characters.json`

Pour chaque personnage, ajoute les 4 images :

```json
{
  "id": "goryo",
  "name": {"fr": "Goryo"},
  "class": {"fr": "Grenadier"},
  "camp": "mechkawaii",
  "hp": {"max": 3},
  "images": {
    "movement": "./assets/patterns/goryo_movement_normal.png",
    "attack": "./assets/patterns/goryo_attack_normal.png",
    "movement_expert": "./assets/patterns/goryo_movement_expert.png",
    "attack_expert": "./assets/patterns/goryo_attack_expert.png"
  },
  "texts": { ... },
  "toggles": []
}
```

**Important** :
- `movement` et `attack` = Mode Normal (obligatoires)
- `movement_expert` et `attack_expert` = Mode Expert (optionnels, fallback sur normal si absents)

---

## 🎮 Comment ça fonctionne

### 1. Sauvegarde de la difficulté

La difficulté est stockée dans le localStorage :
```javascript
localStorage.setItem("mechkawaii:setup", JSON.stringify({
  mode: "single",      // ou "multi"
  camp: "mechkawaii",  // ou "prodrome" (si multi)
  difficulty: "expert" // ou "normal"
}));
```

### 2. Chargement des images

Dans `app.js`, la fonction `initCharacter()` charge les bonnes images :

```javascript
const difficulty = setup?.difficulty || "normal";

if(difficulty === "expert"){
  // Charge les images expert, ou normal en fallback
  movImg.src = c.images?.movement_expert || c.images?.movement || "";
  atkImg.src = c.images?.attack_expert || c.images?.attack || "";
} else {
  // Charge les images normal
  movImg.src = c.images?.movement || "";
  atkImg.src = c.images?.attack || "";
}
```

---

## ✅ Checklist d'installation

### Étape 1 : Fichiers mis à jour
- [x] `app.js` - Logique de difficulté
- [x] `index.html` - Section de choix
- [ ] Upload les deux fichiers sur GitHub

### Étape 2 : Assets
- [ ] Créer le dossier `assets/patterns/`
- [ ] Pour chaque personnage, créer 4 images :
  - `[nom]_movement_normal.png`
  - `[nom]_attack_normal.png`
  - `[nom]_movement_expert.png`
  - `[nom]_attack_expert.png`

### Étape 3 : characters.json
- [ ] Ajouter les champs `movement_expert` et `attack_expert` pour chaque perso
- [ ] Tester qu'il n'y a pas d'erreurs JSON

### Étape 4 : Test
- [ ] Lancer le site
- [ ] Choisir "Mode Normal" → Vérifier les images normales
- [ ] Réinitialiser
- [ ] Choisir "Mode Expert" → Vérifier les images expert
- [ ] Tester sur mobile et desktop

---

## 🧪 Test complet

### Test 1 : Mode Normal
```
1. Ouvre le site
2. Choisis "Un seul appareil"
3. Choisis "⭐ Normal"
4. Sélectionne 6 personnages
5. Clique sur Goryo
6. → Les images doivent être goryo_movement_normal.png et goryo_attack_normal.png
```

### Test 2 : Mode Expert
```
1. Clique "Écran titre"
2. Clique "Changer mode"
3. Choisis "Multi-appareils"
4. Choisis "Mechkawaii"
5. Choisis "💀 Expert"
6. Sélectionne 3 personnages
7. Clique sur Goryo
8. → Les images doivent être goryo_movement_expert.png et goryo_attack_expert.png
```

### Test 3 : Fallback
```
Si tu n'as pas encore créé les images expert :
1. Choisis Mode Expert
2. → Les images normal doivent s'afficher (fallback)
3. Aucune erreur dans la console
```

---

## 🎨 Personnalisation UI

### Changer les icônes des boutons
Dans `index.html` :
```html
<button id="diffNormal" class="btn-accent">🌟 Normal</button>
<button id="diffExpert">🔥 Expert</button>
```

### Ajouter des descriptions
```html
<div id="difficultyPick" class="rule" style="display:none;">
  <h3>3) Choisis la difficulté</h3>
  
  <div style="margin-top:10px;">
    <button id="diffNormal" class="btn-accent" style="display:block; width:100%; text-align:left; margin-bottom:8px;">
      <div style="font-size:18px; font-weight:900;">⭐ Mode Normal</div>
      <div style="font-size:13px; opacity:0.8;">Idéal pour débuter</div>
    </button>
    
    <button id="diffExpert" style="display:block; width:100%; text-align:left;">
      <div style="font-size:18px; font-weight:900;">💀 Mode Expert</div>
      <div style="font-size:13px; opacity:0.8;">Pour les joueurs expérimentés</div>
    </button>
  </div>
</div>
```

### Afficher la difficulté dans le topbar
Ajoute dans `character.html` :
```html
<div class="topbar">
  <div class="brand">
    <div class="title">MECHKAWAII COMPANION</div>
    <div class="subtitle" id="difficultyDisplay"></div>
  </div>
</div>

<script>
// Dans app.js, fonction initCharacter()
const diffDisplay = qs("#difficultyDisplay");
if(diffDisplay){
  const icon = difficulty === "expert" ? "💀" : "⭐";
  const label = difficulty === "expert" ? "Mode Expert" : "Mode Normal";
  diffDisplay.textContent = `${icon} ${label}`;
}
</script>
```

---

## 🐛 Troubleshooting

### La section difficulté n'apparaît pas
**Vérifier** :
1. Le HTML contient bien `<div id="difficultyPick">`
2. Dans la console : `document.getElementById('difficultyPick')`
   - Si `null` → HTML pas chargé correctement
   - Si affiche l'élément → C'est bon

**Test rapide** :
```javascript
// Console F12
document.getElementById('difficultyPick').style.display = 'block';
// → La section doit apparaître
```

### Les mauvaises images s'affichent
**Causes possibles** :
1. Les chemins dans `characters.json` sont incorrects
2. Les images n'ont pas été uploadées
3. Cache du navigateur

**Solution** :
```javascript
// Console F12 sur character.html
console.log(setup?.difficulty); // Devrait afficher "normal" ou "expert"

// Vérifier les chemins des images
const movImg = document.querySelector('#movementImg');
console.log(movImg.src); // Devrait contenir "_expert" si mode expert
```

### Mode expert charge les images normal
**Cause** : Les champs `movement_expert` et `attack_expert` manquent dans `characters.json`

**Solution** : C'est le comportement voulu (fallback). Ajoute les champs manquants.

### Après "Changer mode", la difficulté n'est pas demandée
**Cause** : Le localStorage n'a pas été effacé correctement

**Solution** :
```javascript
// Console F12
localStorage.removeItem('mechkawaii:setup');
location.reload();
```

---

## 📊 Structure de données complète

### localStorage
```javascript
{
  "mechkawaii:setup": {
    "mode": "single" | "multi",
    "camp": "mechkawaii" | "prodrome", // si multi
    "difficulty": "normal" | "expert"
  },
  "mechkawaii:draft": {
    "activeIds": ["goryo", "goki", "gyuki"]
  },
  "mechkawaii:state:goryo": {
    "hp": 3,
    "toggles": {}
  }
}
```

---

## 🚀 Améliorations futures

### 1. Affichage visuel de la difficulté
Ajoute un badge sur les cards de personnages :
```html
<div class="char">
  <div class="badge" style="position:absolute; top:8px; right:8px;">
    💀 Expert
  </div>
  <!-- ... -->
</div>
```

### 2. Différentes règles selon difficulté
Dans `characters.json` :
```json
{
  "id": "goryo",
  "rules": {
    "normal": {
      "hp_regen": true,
      "damage_multiplier": 1
    },
    "expert": {
      "hp_regen": false,
      "damage_multiplier": 1.5
    }
  }
}
```

### 3. Stats par difficulté
Tracker les victoires :
```javascript
localStorage.setItem('mechkawaii:stats', JSON.stringify({
  normal: { games: 10, wins: 7 },
  expert: { games: 5, wins: 2 }
}));
```

---

## 📝 Résumé des modifications

| Fichier | Changement |
|---------|-----------|
| `app.js` | Ajout gestion difficulté + chargement images conditionnelles |
| `index.html` | Ajout section `#difficultyPick` |
| `characters.json` | Ajout champs `movement_expert` et `attack_expert` |
| `assets/patterns/` | Nouvelles images expert pour chaque perso |

---

Tout est prêt ! Il ne reste plus qu'à :
1. Créer les images expert
2. Mettre à jour `characters.json`
3. Upload sur GitHub
4. Tester ! 🎮
