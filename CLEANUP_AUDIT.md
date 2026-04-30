# Mechkawaii Companion — Audit nettoyage

Branche auditée : `clean-codebase`

## Objectif

Stabiliser le code sans refaire toute l'application d'un coup. Le nettoyage doit se faire par petites étapes testables, avec un commit par zone fonctionnelle.

## État actuel

La branche `clean-codebase` a déjà commencé le ménage : plusieurs anciens fichiers de patch ont été supprimés ou remplacés par des systèmes dédiés.

### Points positifs

- `character.html` charge désormais des modules plus explicites : `shield-system.js`, `ultimate-system.js`, `energy-system.js`, `game-flow.js`, `reset-system.js`.
- Les vieux fichiers de rustine ne sont plus chargés dans `character.html`.
- Les styles de la fiche personnage sont mieux séparés avec `character-page.css`, `energy-system.css`, `game-flow.css`, etc.
- Le système de badges Coup Unique mobile est isolé dans `mobile-cu-badges.css` et `mobile-cu-badges.js`.

### Risques actuels

- `app.js` reste le plus gros fichier à risque : il contient encore i18n, stockage, setup, draft, rendu personnage, HP, état de partie et logique générale.
- `mobile-cu-badges.js` corrige encore le DOM après rendu. Il fonctionne, mais la solution propre serait de créer les badges correctement à la source.
- `index.html` contient encore du CSS inline et du JavaScript inline.
- `index.html` charge `style.css` deux fois.
- Certains styles ou comportements sont encore très spécifiques mobile et pourraient devenir fragiles si le header change.

## Nettoyage recommandé

### Phase 1 — Nettoyage sans risque

- Retirer les doublons de chargement CSS/JS.
- Déplacer le CSS inline de `index.html` dans un fichier dédié.
- Déplacer le JS inline non critique de `index.html` dans un fichier dédié.
- Garder uniquement le mini-script anti-flash du splash dans le HTML, car il doit s'exécuter avant le rendu.

### Phase 2 — Badges Coup Unique

- Trouver la fonction source qui crée les badges CU.
- Supprimer la génération de la croix à la source.
- Gérer directement l'ordre des badges : badge vide à gauche, puis badges actifs.
- Réduire `mobile-cu-badges.js` à une simple logique mobile légère, ou le supprimer si le rendu source devient propre.

### Phase 3 — Découpage de `app.js`

Découper progressivement :

- `storage.js` : accès localStorage, préfixes, helpers d'état.
- `i18n.js` : dictionnaire, `tr()`, `applyI18n()`.
- `setup-flow.js` : choix device / camp / difficulté.
- `draft-flow.js` : sélection des unités.
- `character-render.js` : rendu fiche personnage, portrait, HP, déplacement, attaque.

### Phase 4 — Vérification fichiers morts

- Lister tous les fichiers chargés par les HTML.
- Comparer avec les fichiers présents à la racine.
- Supprimer les JS/CSS non référencés après vérification.
- Vérifier GitHub Pages après chaque suppression.

## Règle de nettoyage

Ne pas mixer refactor et nouvelle fonctionnalité dans le même commit. Chaque commit doit pouvoir être testé seul.

Ordre conseillé :

1. `index.html` : enlever doublons et inline léger.
2. Badges CU : supprimer la croix à la source.
3. `app.js` : extraire les helpers les plus simples.
4. Audit fichiers morts.
