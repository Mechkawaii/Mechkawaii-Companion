# 📋 LISTE DES IMAGES À CRÉER

## Structure des dossiers

```
assets/
└── patterns/
    ├── MECHKAWAII/
    │   ├── banado_movement_normal.png
    │   ├── banado_attack_normal.png
    │   ├── banado_movement_expert.png
    │   ├── banado_attack_expert.png
    │   ├── meimei_movement_normal.png
    │   ├── meimei_attack_normal.png
    │   ├── meimei_movement_expert.png
    │   ├── meimei_attack_expert.png
    │   ├── johanna_movement_normal.png
    │   ├── johanna_attack_normal.png
    │   ├── johanna_movement_expert.png
    │   ├── johanna_attack_expert.png
    │   ├── yamabato_movement_normal.png
    │   ├── yamabato_attack_normal.png
    │   ├── yamabato_movement_expert.png
    │   ├── yamabato_attack_expert.png
    │   ├── fuyu_movement_normal.png
    │   ├── fuyu_attack_normal.png
    │   ├── fuyu_movement_expert.png
    │   └── fuyu_attack_expert.png
    │
    └── PRODROME/
        ├── goki_movement_normal.png
        ├── goki_attack_normal.png
        ├── goki_movement_expert.png
        ├── goki_attack_expert.png
        ├── goryo_movement_normal.png
        ├── goryo_attack_normal.png
        ├── goryo_movement_expert.png
        ├── goryo_attack_expert.png
        ├── gyuki_movement_normal.png
        ├── gyuki_attack_normal.png
        ├── gyuki_movement_expert.png
        ├── gyuki_attack_expert.png
        ├── gaoro_movement_normal.png
        ├── gaoro_attack_normal.png
        ├── gaoro_movement_expert.png
        ├── gaoro_attack_expert.png
        ├── genbu_movement_normal.png
        ├── genbu_attack_normal.png
        ├── genbu_movement_expert.png
        └── genbu_attack_expert.png
```

---

## 📊 Récapitulatif par personnage

### MECHKAWAII (5 personnages × 4 images = 20 images)

#### Banado (Technicien) - HP: 3
- [ ] `banado_movement_normal.png`
- [ ] `banado_attack_normal.png`
- [ ] `banado_movement_expert.png`
- [ ] `banado_attack_expert.png`

#### Meimei (Éclaireur) - HP: 2
- [ ] `meimei_movement_normal.png`
- [ ] `meimei_attack_normal.png`
- [ ] `meimei_movement_expert.png`
- [ ] `meimei_attack_expert.png`

#### Johanna (Grenadier) - HP: 3
- [ ] `johanna_movement_normal.png`
- [ ] `johanna_attack_normal.png`
- [ ] `johanna_movement_expert.png`
- [ ] `johanna_attack_expert.png`

#### Yamabato (Voltigeur) - HP: 2
- [ ] `yamabato_movement_normal.png`
- [ ] `yamabato_attack_normal.png`
- [ ] `yamabato_movement_expert.png`
- [ ] `yamabato_attack_expert.png`

#### Fuyu (Pyrotechnicien) - HP: 3
- [ ] `fuyu_movement_normal.png`
- [ ] `fuyu_attack_normal.png`
- [ ] `fuyu_movement_expert.png`
- [ ] `fuyu_attack_expert.png`

---

### PRODROME (5 personnages × 4 images = 20 images)

#### Goki (Pyrotechnicien) - HP: 3
- [ ] `goki_movement_normal.png`
- [ ] `goki_attack_normal.png`
- [ ] `goki_movement_expert.png`
- [ ] `goki_attack_expert.png`

#### Goryo (Grenadier) - HP: 3
- [ ] `goryo_movement_normal.png`
- [ ] `goryo_attack_normal.png`
- [ ] `goryo_movement_expert.png`
- [ ] `goryo_attack_expert.png`

#### Gyuki (Voltigeur) - HP: 2
- [ ] `gyuki_movement_normal.png`
- [ ] `gyuki_attack_normal.png`
- [ ] `gyuki_movement_expert.png`
- [ ] `gyuki_attack_expert.png`

#### Gaoro (Éclaireur) - HP: 2
- [ ] `gaoro_movement_normal.png`
- [ ] `gaoro_attack_normal.png`
- [ ] `gaoro_movement_expert.png`
- [ ] `gaoro_attack_expert.png`

#### Genbu (Technicien) - HP: 3
- [ ] `genbu_movement_normal.png`
- [ ] `genbu_attack_normal.png`
- [ ] `genbu_movement_expert.png`
- [ ] `genbu_attack_expert.png`

---

## 📈 Total

- **10 personnages**
- **4 images par personnage** (2 normal + 2 expert)
- **= 40 images PNG au total**

---

## 🎨 Recommandations de taille

- **Résolution recommandée** : 500×500px ou 800×800px
- **Format** : PNG avec transparence
- **Poids** : < 200 Ko par image (optimisé pour le web)

---

## 🔄 Ordre de priorité

### Phase 1 : Images Normal (obligatoire)
Créer d'abord toutes les images **_normal** pour que le jeu fonctionne :
- 10 images `*_movement_normal.png`
- 10 images `*_attack_normal.png`
→ **20 images minimum** pour lancer le jeu

### Phase 2 : Images Expert (optionnel au début)
Ajouter progressivement les images expert :
- 10 images `*_movement_expert.png`
- 10 images `*_attack_expert.png`
→ **20 images supplémentaires** pour mode expert complet

**Note** : Si les images expert manquent, le jeu utilisera automatiquement les images normal (fallback).

---

## 📝 Nomenclature stricte

⚠️ **IMPORTANT** : Les noms doivent être EXACTEMENT comme indiqué :

✅ Correct :
- `banado_movement_normal.png`
- `goryo_attack_expert.png`

❌ Incorrect :
- `Banado_Movement_Normal.png` (majuscules)
- `banado-movement-normal.png` (tirets au lieu d'underscores)
- `banado_move_normal.png` (movement abrégé)
- `banado_movement_normal.jpg` (format JPG au lieu de PNG)

---

## 🧪 Test rapide

Pour tester si les images sont bien placées, ouvre la console sur la page d'un perso :

```javascript
// Vérifier si l'image charge
const img = document.querySelector('#movementImg');
console.log(img.src); // Doit afficher le bon chemin
console.log(img.complete); // Doit être true si chargée
```

Si l'image ne charge pas :
1. Vérifier le chemin dans `characters.json`
2. Vérifier que le nom du fichier est exact
3. Vérifier que le fichier est bien uploadé sur GitHub

---

## 💡 Astuce : Générer les fichiers vides

Pour créer rapidement la structure :

```bash
cd assets/patterns

# MECHKAWAII
for char in banado meimei johanna yamabato fuyu; do
  touch ${char}_movement_normal.png
  touch ${char}_attack_normal.png
  touch ${char}_movement_expert.png
  touch ${char}_attack_expert.png
done

# PRODROME
for char in goki goryo gyuki gaoro genbu; do
  touch ${char}_movement_normal.png
  touch ${char}_attack_normal.png
  touch ${char}_movement_expert.png
  touch ${char}_attack_expert.png
done
```

Ensuite, remplace les fichiers vides par tes vraies images ! 🎨
