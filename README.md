# Voiries Pepinster

Application web privée de suivi de l'état des voiries de la commune de Pepinster.

**État : phase 1 terminée — socle et interface, avec données fictives étiquetées « démo ». Pas encore de vraie carte ni de vraies données.**

| Document | Contenu |
|---|---|
| [`PLAN.md`](PLAN.md) | architecture, méthode géographique, appariement, score de priorité, phases, décisions |
| [`DATA_AUDIT.md`](DATA_AUDIT.md) | audit de la feuille `Feuil1` de l'Excel source |
| [`DATA_MODEL.md`](DATA_MODEL.md) | modèle de base de données proposé |
| [`CLAUDE.md`](CLAUDE.md) | règles de travail pour Claude |
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
