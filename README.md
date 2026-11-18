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

Dans les paramètres du dépôt, ouvrir **Pages**, choisir **Deploy from a branch**, puis **main** et **/(root)**. Enregistrer. GitHub affiche l’adresse publiée dans cette page.

Les fichiers sont statiques et fonctionnent avec un serveur HTTP, sans installation de dépendances. Le service worker prépare les ressources pour une utilisation hors ligne après le premier chargement réussi.

## Développement

Modifier les fichiers directement à la racine du dépôt. Après une modification des ressources mises en cache, mettre à jour la version et la liste des fichiers dans `sw.js`.
