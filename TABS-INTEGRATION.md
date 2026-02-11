# 🎯 ONGLETS D'UNITÉS - Intégration terminée !

## Ce qui a été ajouté

J'ai intégré le système d'onglets directement dans ton `app.js` existant. Voici comment ça fonctionne :

---

## 📋 Comment ça marche

### Mode "Un seul appareil" (6 personnages)
Quand tu es sur la page d'un personnage :
- **Les 5 AUTRES personnages** apparaissent en onglets en bas
- Clic sur un onglet → Navigue vers ce personnage
- Les HP de chaque personnage sont affichés et mis à jour

### Mode "Multi-appareils" (3 personnages par camp)
Quand tu es sur la page d'un personnage :
- **Les 2 AUTRES personnages** du même camp apparaissent en onglets
- Clic sur un onglet → Navigue vers ce personnage
- Badge HP rouge si ≤ 33%

---

## 🎨 Comportement

### Affichage automatique
- Les onglets **apparaissent automatiquement** en bas de la page `character.html`
- Si aucun autre personnage n'est disponible → Les onglets ne s'affichent pas
- Animation de glissement depuis le bas

### Mise à jour des HP
- Quand tu changes les HP sur la page (+ ou -) :
  - L'affichage principal se met à jour
  - Le badge HP dans l'onglet se met à jour aussi (si visible)
  - Animation "shake" sur l'onglet

### Navigation
- Clic sur un onglet → Redirection vers `character.html?id=XXX`
- L'état (HP, toggles) est conservé via localStorage

---

## 📁 Fichiers modifiés

### 1. `app.js` (mis à jour)
**Changements** :
- Ajout de `initUnitTabs()` dans `initCharacter()`
- Nouvelle fonction `initUnitTabs(currentCharId, allChars, lang)`
- Nouvelle fonction `createCharacterTab(char, lang)`
- Nouvelle fonction `updateTabHP(charId, newHp)`
- Appel de `updateTabHP()` dans les boutons HP +/-

### 2. `index.html` (déjà mis à jour)
- Container des tabs ajouté avant `</body>`

### 3. `style.css` (déjà mis à jour)
- Tous les styles des tabs sont présents

---

## 🧪 Test complet

1. **Setup initial** :
   - Ouvre ton site
   - Choisis "Un seul appareil" ou "Multi-appareils"
   - Sélectionne 6 persos (single) ou 3 persos (multi)

2. **Test des onglets** :
   - Clique sur un personnage → Va vers sa page
   - **Vérifie** : Les autres personnages apparaissent en bas
   - Clique sur un onglet → Change de personnage

3. **Test des HP** :
   - Sur la page d'un perso, clique HP - ou +
   - **Vérifie** : Le badge HP dans les onglets se met à jour
   - Navigue vers un autre perso via onglet
   - Reviens au premier → Les HP sont sauvegardés

---

## 🎯 Exemple de flow

**Mode "Un seul appareil" - 6 persos sélectionnés :**
```
Sélection: Goryo, Goki, Gyuki, Aiko, Kuro, Yuki

Page de Goryo:
└─ Onglets en bas: [Goki] [Gyuki] [Aiko] [Kuro] [Yuki]

Clic sur [Goki] → Va vers page de Goki
└─ Onglets en bas: [Goryo] [Gyuki] [Aiko] [Kuro] [Yuki]
```

**Mode "Multi-appareils" - 3 persos Mechkawaii :**
```
Sélection: Goryo, Goki, Gyuki (tous Mechkawaii)

Page de Goryo:
└─ Onglets en bas: [Goki] [Gyuki]

Clic sur [Goki] → Va vers page de Goki
└─ Onglets en bas: [Goryo] [Gyuki]
```

---

## 🐛 Troubleshooting

### Les onglets n'apparaissent pas
**Vérifier** :
1. Le HTML contient bien `<div id="unitTabs"></div>` dans `character.html`
2. La console (F12) n'affiche pas d'erreurs
3. Tu as bien sélectionné plusieurs personnages en début de parcours

**Test rapide** :
```javascript
// Console F12 sur character.html
console.log(document.querySelector('.unit-tabs-container'));
// Devrait afficher l'élément, pas null
```

### Les onglets sont vides
**Cause probable** : Le draft n'a pas été sauvegardé correctement
**Solution** :
1. Retourne à l'écran titre
2. Clique "Changer mode"
3. Refais la sélection des personnages

### Les HP ne se mettent pas à jour dans les onglets
**Note** : C'est normal si tu es sur la page du perso.
Les HP des AUTRES persos s'affichent dans les onglets, pas celui affiché.

---

## 🎨 Personnalisation

### Changer la taille des onglets
Dans `style.css` :
```css
.unit-tab {
  width: clamp(150px, 30vw, 200px);  /* Plus grand */
  height: clamp(150px, 30vw, 200px);
}
```

### Changer les couleurs
```css
.unit-tab-hp.low {
  color: #ff0000;  /* Rouge plus vif */
}
```

### Position des onglets
```css
.unit-tabs-container {
  bottom: 0;  /* En bas */
  /* OU */
  top: 80px;  /* En haut sous le header */
}
```

---

## ✅ Checklist finale

- [x] `app.js` mis à jour avec système d'onglets
- [x] `index.html` contient le container des tabs
- [x] `style.css` contient les styles des tabs
- [ ] Upload les 3 fichiers sur GitHub
- [ ] Test du flow complet
- [ ] Vérifier sur mobile ET desktop

---

## 🚀 Pour aller plus loin

### Ajouter des images de personnages
Dans ton `characters.json`, ajoute un champ image :
```json
{
  "id": "goryo",
  "name": {"fr": "Goryo"},
  "image": "./assets/characters/goryo.png"
}
```

Puis modifie `createCharacterTab()` :
```javascript
const imageHtml = char.image 
  ? `<img src="${char.image}" style="width:100%;height:100%;object-fit:contain">`
  : placeholderHtml;
```

### Ajouter un compteur d'actions
```javascript
// Dans le badge HP
<div class="unit-tab-hp">
  <span>❤️ ${hp}/${maxHp}</span>
  <span>⚡ 2/3</span>  // Actions restantes
</div>
```

---

Tout est prêt ! Upload les fichiers et teste 🎮
