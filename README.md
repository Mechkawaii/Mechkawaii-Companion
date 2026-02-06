# Mechkawaii — Fiches locales (gratuit)

## C'est quoi ?
Une mini webapp statique (HTML/CSS/JS) :
- ouverture via un lien (QR code possible)
- tout est géré sur le device (localStorage)
- FR/EN
- PV +/-
- toggles (boulier, réparer, etc.)
- patterns en **images** (tu fournis les PNG/SVG)

## Où mettre tes images ?
`assets/patterns/`
- johanna_movement.png
- johanna_attack.png

Tu peux utiliser PNG ou SVG. Si tu changes les noms, mets à jour `data/characters.json`.

## Ajouter un personnage
1) Duplique l'objet dans `data/characters.json`
2) Donne un `id` unique
3) Mets `hp.max`, textes FR/EN, toggles, et chemins d'images

## Hébergement 100% gratuit (recommandé)
### GitHub Pages
- Crée un repo, mets ces fichiers dedans
- Settings → Pages → Deploy from branch → main / root
- Tu obtiens un lien du type : https://<tonuser>.github.io/<repo>/

### Important
Ne pas ouvrir les fichiers en "local" (file://), certaines fonctions fetch ne marcheront pas.
Utilise toujours le lien GitHub Pages / Cloudflare Pages / Netlify.

## PV spécifiques
- Banado & Genbu : 4 PV
- Gyuki & Yamabato : 2 PV
