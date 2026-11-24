# Suivi de chantiers

Application web pour iPhone qui sert au suivi des chantiers d'une entreprise de paysage. Elle compte quatre modules : Chantier François, Élagage, Plantation et Broyage, plus un module Entretien qui suit les marchés d'entretien semaine par semaine. Chaque module a une carte OpenStreetMap, avec le cadastre IGN, les parcelles et des annotations.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'entrée et chantiers d'exemple |
| `config.js` | **Partage des données** : la configuration Firebase (le seul fichier à modifier pour relier l'équipe) |
| `app.js` | Le code de l'application (écrans, carte, cadastre, annotations, synchronisation) |
| `style.css` | Les couleurs et la mise en page |

## Activer le partage entre tous les utilisateurs

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Dans **Authentication**, activez « E-mail/Mot de passe », puis créez un compte pour chaque membre de l'équipe.
3. Dans **Firestore Database**, créez la base (emplacement en Europe, mode production). Dans l'onglet **Règles**, collez :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Dans **Paramètres du projet › Vos applications › Web**, copiez les valeurs de `firebaseConfig` dans `config.js`, puis envoyez ce fichier sur GitHub.

Pour faire un essai sans toucher au code, ouvrez Réglages, puis « Activer le partage d'équipe », et collez-y le bloc `firebaseConfig`. Le partage ne sera activé que sur ce téléphone. Le bouton « Copier config.js » donne ensuite le fichier tout prêt.

## Comment les données sont rangées (Firestore)

- `chantiers/{id}` : un document par chantier. Le champ `data` contient tout le chantier en JSON (infos, tâches, journal, parcelles, annotations), `maj` donne la date de modification et `par` l'e-mail de l'auteur.
- `photos/{id}` : une photo par document. Le champ `data` contient l'image en JPEG (format data URL) ; le journal y renvoie sous la forme `ph:{id}`.
- `app/reglages` : le nom de l'entreprise et les noms des modules (JSON dans `data`).

## Ajouter ou modifier un module

Dans `app.js`, en haut du fichier :
- `KEYS` donne la liste des modules ;
- `TPL` donne les tâches type ;
- `FIELDS` donne les champs propres au module ;
- `COL` donne les couleurs (couleurs à reporter aussi dans `style.css`, variables `--francois`, `--elagage`…).

## Sources des cartes

- Fond de carte : © contributeurs OpenStreetMap.
- Cadastre (Parcellaire Express) et photos aériennes : © IGN Géoplateforme (data.geopf.fr).
- Sélection des parcelles : API Carto Cadastre de l'IGN.

## Module Entretien

Chaque site d'entretien a une liste de prestations. Pour chacune, l'app garde la désignation, la quantité, l'unité, la durée d'un passage et les **semaines ISO** où elle est prévue. L'app n'affiche et n'enregistre aucun prix. Le planning revient tous les ans : les passages faits sont enregistrés par année et par semaine (`faits["2026-30"]`).

- Onglet **Planning** : la liste des passages de la semaine pour tous les sites, à cocher.
- Fiche d'un site, répartie en onglets :
  - **Passages** : les prestations, avec les semaines à cocher ;
  - **Carte** : le plan ou la photo aérienne, avec les parcelles et les annotations ;
  - **Photos** : la galerie du site, avec légendes ;
  - **Opérations** : les interventions spéciales, hors planning ;
  - **Infos** : les tâches, le journal et les informations du site.
- Le fichier `import-entretien-CCBVL.json` contient les 9 sites et les 50 prestations du DPGF CCBVL. Pour le charger, ouvrez Réglages, puis Importer. **Attention : l'import remplace toutes les données.**

## Où sont rangées les données (en plus de ce qui est décrit plus haut)

- `photos` dans un chantier : `[{id, src, date, par, legende}]`. Le champ `src` vaut `ph:{id}` quand la photo est partagée avec l'équipe.
- `ops` dans un chantier (opérations spéciales) : `[{id, titre, date, statut: afaire|encours|fait, desc, heures, photos, par}]`.
- Les onglets sont dans l'adresse de la page, ce qui permet de garder un lien vers un onglet précis : `#c-{id}--carte`, `#m-entretien--ops`…
