# Suivi de chantiers

Application web pour iPhone qui sert au suivi des chantiers d'une entreprise de paysage. Elle compte quatre modules : Chantier François, Élagage, Plantation et Broyage. Chaque module a une carte OpenStreetMap, avec le cadastre IGN, les parcelles et des annotations.

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
