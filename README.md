# Tanjaka

Application de renforcement à la maison et de nutrition, adaptée aux aliments disponibles à Madagascar.

## Utilisation

L’application comprend le calendrier des séances, le suivi des séries et des variantes, un minuteur de repos, les repas A/B/C, le placard, les prix en ariary, les pesées et les mensurations.

Les données personnelles sont enregistrées dans le navigateur. Une sauvegarde JSON permet de les transférer entre appareils.

## Retrouver son journal après la migration

1. Ouvrir l’ancienne application Tanjaka dans le navigateur utilisé habituellement.
2. Dans **Paramètres**, choisir **Exporter une sauvegarde JSON**.
3. Ouvrir la nouvelle application, puis **Paramètres → Importer une sauvegarde JSON**.
4. Vérifier les pesées et l’historique des séances.

Le changement d’adresse demande ce transfert car chaque adresse dispose de son propre espace de données.

## Publication sur GitHub Pages

Le workflow `.github/workflows/pages.yml` publie les fichiers de l’application après chaque modification de la branche `main`.

Dans les paramètres du dépôt, **Pages → Source** doit utiliser **GitHub Actions**. GitHub affiche l’adresse publiée dans cette page et dans le résultat du workflow.

Les fichiers sont statiques et fonctionnent avec un serveur HTTP, sans installation de dépendances. Le service worker prépare les ressources pour une utilisation hors ligne après le premier chargement réussi.

## Développement

Modifier les fichiers directement à la racine du dépôt. Après une modification des ressources mises en cache, mettre à jour la version et la liste des fichiers dans `sw.js`.

## Édition Atelier · novembre 2026

Identité éditoriale sportive : Barlow Condensed et Manrope servies localement, papier clair ou encre sombre, vert acide et vermillon, photos en noir et blanc, ingrédients illustrés.

Le mode guidé propose un échauffement, la saisie des séries, le repos et la reprise après interruption. Un échauffement seul reste distinct d’une séance complète. Le carnet compare les premières séries du même exercice et de la même variante déclarée. Les choix de repas s’adaptent aux ingrédients absents tout en conservant les repas déjà notés.

La clé `tanjaka-2026-v1` et les historiques v1/v2 sont conservés. Les champs facultatifs `warmups`, `why` et `appearance` complètent le format v2. Les données ne quittent pas le navigateur.

### Vérifications

Le workflow vérifie les journaux v1/v2 et les imports, les six écrans à 320, 390, 768 et 1280 pixels dans les deux apparences, le parcours guidé complet, le minuteur, la reprise, les remplacements d’ingrédients et le chargement hors ligne. La publication de `main` dépend de ces vérifications.

Pour lancer les vérifications : `npm install --no-save --package-lock=false playwright@1.65.1`, puis `npx playwright install chromium` et `node qa/verify.mjs`.

Les fichiers de l’ancienne édition restent disponibles pour la compatibilité des anciens clients et les vérifications de migration. Après une modification du code ou du style, créer de nouveaux noms de ressources, puis mettre à jour `index.html`, la version et la liste précachée dans `sw.js`. Voir `THIRD_PARTY_NOTICES.md` pour les ressources visuelles.
