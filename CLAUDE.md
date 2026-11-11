# CLAUDE.md — Règles de travail pour le projet « Voiries Pepinster »

Ce fichier est lu automatiquement par Claude Code à chaque session. Il prime sur les habitudes par défaut.

## Contexte

- Application web **privée**, en **français**, pour **un seul utilisateur** (le père de Hugo), qui gère l'état des voiries de la commune de **Pepinster** (province de Liège, Belgique).
- Hugo est **débutant** : explique chaque étape en français simple, donne des commandes exactes à copier-coller pour **macOS** et dis ce qu'on doit voir à l'écran.
- Documents de référence, **à relire avant toute phase** : `Brief_Claude_Code_Voiries_Pepinster.md`, `PLAN.md`, `DATA_AUDIT.md`, `DATA_MODEL.md`.

## Déroulement

- Le travail avance **phase par phase** (0 à 7, voir `PLAN.md` §7). **Ne jamais commencer la phase suivante sans la demande explicite de Hugo.**
- Fin de chaque phase : vérifications (`npm run lint`, `npm run typecheck`, tests), liste des fichiers créés ou modifiés, instructions de test sur Mac, captures si possible, limites restantes, commit Git `phase-N`, puis **arrêt**.
- Décisions prises : `PLAN.md` §9.1 (D1–D15). Points ouverts : §9.2. Ne jamais trancher seul un point ouvert.

## Règles de données — non négociables

1. **Aucun tracé fictif.** Toute géométrie vient d'une extraction OSM (ou d'une autre source officielle validée), datée et versionnée. On coupe un way **uniquement** à un nœud OSM existant. Aucune coordonnée inventée.
2. **Aucun nom de rue inventé.** Un nom réordonné (`Biez Rue du` → `Rue du Biez`) reste une **proposition**.
3. **Aucune correspondance Excel ↔ OSM sans validation humaine**, même exacte (validation par lot permise).
4. `RAS` ≠ note 1. `SPW` = **gestionnaire**, pas un état. Vide = inconnu (`NULL`).
5. La **couleur** de la case `Etat` donne une `etat_note_suggeree` selon la légende. Le rouge vif `#FF0000` compte comme 4 (D2). Les autres couleurs hors légende (vert `#00B050`, jaune…) ne donnent **aucune** suggestion : la route reste grise (D11). Une suggestion ne devient `etat_note` qu'après validation (par lot permise).
6. `Lotissement` → intensité `faible` (D3, tracé). `risque_securite` n'est **jamais** déduit d'un texte libre.
7. Échéances (D5) : année passée → `annee_realisation` ; délai relatif → `echeance_estimee` comptée depuis mai 2025, marquée « estimée » ; jamais dans `annee_prevue`. La valeur brute est toujours gardée.
8. **Toujours conserver la valeur brute**, et tracer chaque normalisation (`normalization_log`).
9. Pas de fusion automatique de doublons (`Chemin du Nauzaury` ×2) ni de noms proches.
10. Une resynchronisation géographique **ne modifie jamais** `road_evaluations`.
11. L'Excel source (`source/etat_voiries_pepinster.xlsx`) n'est **jamais modifié**. On importe uniquement la feuille `Feuil1`, lignes 2–183, en ignorant les lignes vides et la légende (185–191). Contrôle : **180 lignes**.

## Score de priorité

- Fonction pure dans `src/lib/priority/score.ts`, couverte par des tests unitaires. C'est la seule source du calcul : carte, tableau et classement l'utilisent tous.
- Pas de score sans `etat_note`. Il faut aussi au moins un autre critère et une couverture ≥ 70 % (paramétrable). Sinon « Non évalué », en gris.
- Score arrondi à l'entier, puis couleur choisie sur la valeur arrondie. Mention « provisoire » si la couverture est < 100 %.
- SPW : trait en pointillés ; jamais de couleur forcée ; exclusion possible du classement communal.
- Le score est une **aide au classement**, pas une décision : cet avertissement doit rester visible dans l'interface.

## Pile technique

Next.js (App Router) + TypeScript (strict) + Tailwind · React Leaflet, chargé côté navigateur uniquement (`dynamic(..., { ssr: false })`), rendu *canvas* · Supabase (Postgres, Auth, RLS) · Zod pour valider les entrées · Vitest · Playwright · ExcelJS pour la lecture unique de l'Excel (couleurs comprises).
Vérifier la version stable actuelle de chaque dépendance au moment de l'installer, puis la figer dans `package.json`.

## Sécurité

- RLS activée sur **toutes** les tables ; accès réservé aux `user_id` présents dans `app_admins`.
- Inscription publique désactivée.
- Secrets dans `.env.local` (dans `.gitignore`) ; **jamais** de clé `service_role` côté navigateur ni dans Git.
- Ne jamais publier, déployer, créer un compte payant ou engager une dépense sans l'accord explicite de Hugo.

## Cartographie

- Pas d'appel à Overpass à l'ouverture des pages : les données viennent des fichiers extraits et de la base.
- Attribution visible : « © contributeurs OpenStreetMap » (données et tuiles). Respecter la politique d'usage des tuiles OSM ; aucun téléchargement massif de tuiles.
- Vérifier la licence de toute donnée wallonne avant de l'utiliser.

## Style de code

- Noms de domaine **en français** dans la base et le métier (`voirie`, `gestionnaire`, `etat_note`) ; code technique en anglais courant si plus lisible.
- Petites fonctions, commentaires en français là où la logique métier n'est pas évidente.
- Interface en français, accessible (contrastes, clavier, pas d'information portée par la couleur seule), utilisable sur téléphone.
