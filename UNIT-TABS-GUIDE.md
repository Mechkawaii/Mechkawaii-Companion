# SYSTÈME D'ONGLETS D'UNITÉS - Guide d'implémentation

## 📋 Vue d'ensemble

Le système de tabs permet de naviguer rapidement entre les unités sélectionnées avec :
- **Visuels 500×500px** (adaptés automatiquement en responsive)
- **Badge HP** avec couleur selon l'état
- **Tab active** avec bordure jaune et glow
- **Scroll horizontal** smooth sur mobile
- **Animation** au changement de HP
- **Fixé en bas** de l'écran

---

## 🎨 Fonctionnalités

### 1. Affichage automatique
- Apparaît quand au moins 1 unité est sélectionnée
- Se cache si aucune unité
- Glisse du bas avec animation smooth

### 2. Navigation
- **Clic sur un tab** → change l'unité active
- **Scroll horizontal** sur mobile pour voir toutes les unités
- **Auto-scroll** vers le tab actif

### 3. Indicateurs visuels
- **Bordure jaune** sur l'unité active
- **Badge HP** en haut à droite (vert si OK, rouge si bas)
- **Image de l'unité** 
- **Nom + rôle** en dessous

### 4. Responsive
- **Mobile** : tabs 120×120px, scroll horizontal
- **Desktop** : tabs 160×160px, centrées

---

## 🔧 Intégration dans ton projet

### Étape 1: HTML
Ajoute cette structure avant `</body>` :

```html
<!-- Barre d'onglets des unités (fixée en bas) -->
<div class="unit-tabs-container" id="unitTabsContainer">
  <div class="unit-tabs" id="unitTabs">
    <!-- Les tabs seront générés par JavaScript -->
  </div>
</div>
```

### Étape 2: Lier au choix des personnages

Quand un joueur sélectionne un personnage dans ta liste :

```javascript
// Dans ton code existant de sélection de perso
function onCharacterClick(character) {
  // Ajouter l'unité aux tabs
  addUnit({
    id: character.id,
    name: character.name,
    role: character.role,
    hp: character.maxHp,
    maxHp: character.maxHp,
    image: character.imageUrl // Chemin vers l'image 500×500px
  });
  
  // Ton code existant...
}
```

### Étape 3: Gérer les HP

Quand les HP changent :

```javascript
// Après avoir modifié les HP d'une unité
function changeHP(unitId, delta) {
  const unit = selectedUnits.find(u => u.id === unitId);
  unit.hp = Math.max(0, Math.min(unit.hp + delta, unit.maxHp));
  
  // Mettre à jour le tab
  updateUnitHP(unitId, unit.hp);
}
```

---

## 📁 Structure des données

```javascript
// Exemple de structure d'unité
const unit = {
  id: 'goryo',           // Identifiant unique
  name: 'Goryo',         // Nom affiché
  role: 'Grenadier',     // Rôle/classe
  hp: 2,                 // HP actuels
  maxHp: 3,              // HP max
  image: 'path/to/goryo.png' // Image 500×500px (ou ratio 1:1)
};

// Liste globale des unités actives
let selectedUnits = [];
let currentUnitId = null; // ID de l'unité affichée
```

---

## 🎯 API JavaScript

### Fonctions principales

```javascript
// Initialiser/rafraîchir les tabs
initUnitTabs();

// Ajouter une unité
addUnit(unitObject);

// Retirer une unité
removeUnit(unitId);

// Changer l'unité active
switchToUnit(unitId);

// Mettre à jour les HP (avec animation)
updateUnitHP(unitId, newHp);

// Obtenir l'unité courante
const unit = getCurrentUnit();
```

---

## 🎨 Personnalisation CSS

### Changer la taille des tabs

```css
/* Mobile */
.unit-tab {
  width: 140px;  /* Au lieu de 120px */
  height: 140px;
}

/* Desktop */
@media (min-width: 900px) {
  .unit-tab {
    width: 200px;  /* Au lieu de 160px */
    height: 200px;
  }
}
```

### Changer la position de la barre

```css
/* En haut au lieu du bas */
.unit-tabs-container {
  bottom: auto;
  top: 80px; /* Sous le header */
  border-top: none;
  border-bottom: 1px solid var(--border);
}
```

### Changer les couleurs du tab actif

```css
.unit-tab.active {
  border-color: #ff4d4d; /* Rouge au lieu de jaune */
  background: rgba(255, 77, 77, 0.12);
}
```

---

## 💡 Conseils d'utilisation

### 1. Images optimisées
```javascript
// Utilise des images carrées (1:1)
// Formats recommandés: PNG avec transparence ou WebP
// Taille: 500×500px ou 1000×1000px (pour retina)
```

### 2. Placeholder si pas d'image
Le code inclut déjà un fallback SVG avec l'initiale du nom.

### 3. Sauvegarder l'état
```javascript
// Sauvegarder dans localStorage
function saveUnits() {
  localStorage.setItem('mechkawaii-units', JSON.stringify(selectedUnits));
  localStorage.setItem('mechkawaii-current-unit', currentUnitId);
}

// Charger au démarrage
function loadUnits() {
  const saved = localStorage.getItem('mechkawaii-units');
  if (saved) {
    selectedUnits = JSON.parse(saved);
    currentUnitId = localStorage.getItem('mechkawaii-current-unit') || selectedUnits[0]?.id;
    initUnitTabs();
  }
}
```

---

## 🔄 Workflow complet

```
1. Joueur sélectionne personnages
   ↓
2. addUnit() pour chaque perso
   ↓
3. initUnitTabs() génère les tabs
   ↓
4. Barre apparaît en bas avec animation
   ↓
5. Clic sur tab → switchToUnit()
   ↓
6. Affichage mis à jour (fiche perso, HP, etc.)
   ↓
7. HP changent → updateUnitHP()
   ↓
8. Tab se met à jour avec animation
```

---

## 🐛 Dépannage

### Les tabs n'apparaissent pas
```javascript
// Vérifier que la classe est ajoutée
document.querySelector('.unit-tabs-container').classList.add('visible');
document.body.classList.add('tabs-visible');
```

### Les images ne s'affichent pas
```javascript
// Vérifier les chemins
console.log('Image path:', unit.image);

// Tester avec une URL absolue
image: 'https://example.com/goryo.png'
```

### Le scroll ne fonctionne pas
```css
/* Assurer que overflow-x est bien auto */
.unit-tabs {
  overflow-x: auto !important;
}
```

### Les tabs sont trop petits sur mobile
```css
.unit-tab {
  width: clamp(150px, 30vw, 200px);
  height: clamp(150px, 30vw, 200px);
}
```

---

## 📱 Comportement mobile

### Scroll horizontal
- **Touch**: Swipe horizontal naturel
- **Snap**: Les tabs s'alignent automatiquement
- **Momentum**: Scroll inertiel iOS/Android

### Performance
- `transform` utilisé pour les animations (GPU accelerated)
- `backdrop-filter` réduit sur mobile
- Images lazy-load possible avec `loading="lazy"`

---

## 🎮 Événements custom

Tu peux écouter les changements :

```javascript
// Quand l'unité active change
document.addEventListener('unitChanged', (e) => {
  console.log('Nouvelle unité:', e.detail.unitId);
});

// Dispatcher l'événement dans switchToUnit()
function switchToUnit(unitId) {
  // ... ton code existant
  
  document.dispatchEvent(new CustomEvent('unitChanged', {
    detail: { unitId, unit: getCurrentUnit() }
  }));
}
```

---

## 🚀 Améliorations futures

### 1. Glisser pour réorganiser
```javascript
// Utiliser SortableJS ou implémenter drag & drop
```

### 2. Compteur d'actions
```html
<div class="unit-tab-actions">⚡ 2/3</div>
```

### 3. Status effects (poison, stun, etc.)
```html
<div class="unit-tab-status">
  <span class="status-icon poison">☠️</span>
</div>
```

### 4. Animations au survol
```css
.unit-tab:hover .unit-tab-visual img {
  transform: scale(1.1) rotate(2deg);
}
```

---

## ✅ Checklist d'implémentation

- [ ] Ajouter le HTML de la barre de tabs
- [ ] Copier les fonctions JavaScript
- [ ] Préparer les images 500×500px des unités
- [ ] Lier la sélection de persos à `addUnit()`
- [ ] Implémenter `displayUnitDetails()` 
- [ ] Connecter les boutons HP à `updateUnitHP()`
- [ ] Tester sur mobile et desktop
- [ ] Ajouter la persistence localStorage
- [ ] Tester avec 1, 3, 6+ unités

---

Besoin d'aide pour l'implémentation ? Partage ton code HTML/JS existant ! 🚀
