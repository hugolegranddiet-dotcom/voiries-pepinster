# Voiries Pepinster

Application web privée de suivi de l'état des voiries de la commune de Pepinster.

**État : phase 2 terminée — carte réelle de Pepinster (OpenStreetMap), voiries cliquables, audit de couverture. Les écrans Voiries et Priorités restent en données « démo » jusqu'aux phases 3 à 6.**

| Document | Contenu |
|---|---|
| [`PLAN.md`](PLAN.md) | architecture, méthode géographique, appariement, score de priorité, phases, décisions |
| [`DATA_AUDIT.md`](DATA_AUDIT.md) | audit de la feuille `Feuil1` de l'Excel source |
| [`DATA_MODEL.md`](DATA_MODEL.md) | modèle de base de données proposé |
| [`CLAUDE.md`](CLAUDE.md) | règles de travail pour Claude |
| [`COVERAGE_REPORT.md`](COVERAGE_REPORT.md) | couverture géographique (généré par `npm run geo:build`) |
| [`Brief_Claude_Code_Voiries_Pepinster.md`](Brief_Claude_Code_Voiries_Pepinster.md) | cahier des charges |
| `source/etat_voiries_pepinster.xlsx` | fichier Excel d'origine (jamais modifié) |

Données cartographiques prévues : © contributeurs OpenStreetMap (licence ODbL).

## Lancer l'application sur ton Mac

Prérequis (une seule fois) : Node.js 20.9 ou plus récent (version « LTS » sur nodejs.org) et Git.

```bash
# 1. Récupérer le projet (la première fois), hors d'iCloud
git clone https://github.com/hugolegranddiet-dotcom/voiries-pepinster.git ~/Developer/voiries-pepinster
cd ~/Developer/voiries-pepinster

# (les fois suivantes : se placer dans le dossier puis récupérer les nouveautés)
# cd ~/Developer/voiries-pepinster && git pull

# 2. Installer les dépendances (après chaque git pull qui modifie package.json)
npm install

# 3. Démarrer l'application
npm run dev
```

Ouvre ensuite **http://localhost:3000** dans ton navigateur. Pour arrêter : `Ctrl + C` dans le Terminal.

## Vérifications automatiques

| Commande | Ce qu'elle vérifie |
|---|---|
| `npm run lint` | règles de qualité du code (ESLint) |
| `npm run typecheck` | cohérence des types TypeScript |
| `npm run test` | tests automatiques (Vitest) |
| `npm run check` | les trois à la suite |
| `npm run build` | compilation de la version finale |

## Données géographiques

| Commande | Rôle | Où la lancer |
|---|---|---|
| `npm run geo:extract` | extraction unique et datée d'OpenStreetMap → `data/osm/raw/AAAA-MM-JJ/` | sur le Mac (accès à OpenStreetMap) |
| `npm run geo:spw` | consultation du réseau régional SPW → cache local non versionné | partout |
| `npm run geo:build` | voiries logiques, découpe à la limite, `public/geo/*`, `COVERAGE_REPORT.md` | partout |

L'application ne contacte **jamais** OpenStreetMap pour les données : elle lit les fichiers de `public/geo/`. Seul le fond de carte (les tuiles) vient d'OpenStreetMap, avec attribution.
