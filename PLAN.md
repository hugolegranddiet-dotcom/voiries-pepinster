# PLAN — Application « Voiries Pepinster »

> **Phase 0 — analyse et plan. Aucun code applicatif n'a été écrit.**
> Documents liés : `DATA_AUDIT.md` (audit de l'Excel), `DATA_MODEL.md` (base de données), `CLAUDE.md` (règles de travail), `Brief_Claude_Code_Voiries_Pepinster.md` (cahier des charges).
> Version 2 — 11 novembre 2026 — réponses aux questions Q1–Q10 intégrées (voir §9 « Décisions »). Quelques points restent ouverts (§9.2).

---

## Sommaire

1. Ce que l'application fera, en une phrase
2. Lexique pour débutant
3. Architecture technique
4. Obtenir toutes les routes de Pepinster (méthode géographique)
5. Associer les routes OSM aux lignes de l'Excel
6. Calcul transparent de la priorité
7. Plan de développement phase par phase
8. Risques et parades
9. **Décisions et points encore ouverts**
10. Comment passer à la phase 1

---

## 1. Ce que l'application fera, en une phrase

Une application web privée, sur ordinateur et smartphone, qui montre **chaque voirie réelle de Pepinster** sur une carte, **colorée d'une seule couleur selon sa priorité**. Elle permet de la **sélectionner** (sur la carte ou dans un tableau synchronisé), de **modifier ses critères** dans un panneau latéral, et de **garder l'historique** de chaque modification.

---

## 2. Lexique pour débutant

| Terme | En clair |
|---|---|
| **Next.js** | l'outil qui fabrique le site web (pages, navigation, partie serveur) |
| **TypeScript** | du JavaScript avec des « types » : l'ordinateur repère beaucoup d'erreurs avant qu'elles arrivent |
| **Tailwind CSS** | une manière rapide d'écrire la mise en page et les couleurs |
| **Leaflet** | la bibliothèque qui affiche la carte interactive |
| **OSM (OpenStreetMap)** | la carte libre du monde, faite par des bénévoles ; licence ODbL (citer la source) |
| **Overpass** | le service qui permet d'extraire une partie des données OSM (ex. les routes d'une commune) |
| **GeoJSON** | un format texte pour décrire des lignes et des polygones géographiques |
| **Supabase** | un service en ligne qui fournit la base de données (PostgreSQL) et la connexion sécurisée |
| **RLS (Row Level Security)** | des règles **dans la base** qui refusent toute lecture ou écriture à quiconque n'est pas autorisé |
| **Migration** | un fichier qui décrit une modification de la base, rejouable et versionné |
| **Git** | l'historique de toutes les versions du code ; permet de revenir en arrière |
| **Segment / voirie logique** | un morceau de tracé OSM / la « rue » telle que ton père la pense (une fiche, une couleur) |

---

## 3. Architecture technique

### 3.1 Choix retenus (et pourquoi)

| Besoin | Choix | Raison |
|---|---|---|
| Site web | **Next.js (App Router) + TypeScript + Tailwind** | standard, bien documenté, un seul projet pour le front et le serveur |
| Carte | **Leaflet + React Leaflet**, chargés **uniquement dans le navigateur** | léger, fiable avec ~2 000 tracés en mode *canvas* ; évite les erreurs de rendu côté serveur |
| Fond de carte | tuiles **OpenStreetMap** avec attribution visible ; en option, **orthophotos de la Wallonie** (licence à vérifier) | les photos aériennes aident à juger l'état d'une route |
| Base de données + connexion | **Supabase** (PostgreSQL + Auth + RLS) | gratuit au départ, sécurité dans la base, migrations versionnées |
| Géométries | **GeoJSON en JSONB** (pas PostGIS au départ) | suffisant pour afficher et cliquer ; PostGIS seulement si un vrai besoin apparaît |
| Calcul du score | **une fonction TypeScript pure**, testée (Vitest) | le même code sert à la carte, au tableau et aux tests ; aucun score « figé » en base |
| Lecture de l'Excel | lecture brute **une seule fois** vers `data/excel/feuil1_raw.json` avec **ExcelJS** (il lit les **couleurs** de cellules ; SheetJS gratuit ne les lit pas). openpyxl (Python) en secours | les couleurs portent une information essentielle (voir `DATA_AUDIT.md` §5) |
| Sélection carte ↔ tableau | l'identifiant de la voirie sélectionnée est placé dans l'**adresse de la page** (`?voirie=…`) | simple, robuste, le bouton « retour » fonctionne, aucune bibliothèque de plus |
| Écritures | **Server Actions** Next.js + validation **Zod** + RLS | double contrôle : formulaire validé côté serveur **et** base qui refuse l'interdit |
| Hébergement final | **Vercel** (offre Hobby, usage personnel), **uniquement après ton accord** | déploiement simple depuis Git ; aucune dépense sans validation |
| Qualité | ESLint, `tsc`, Vitest (unitaires), Playwright (bout en bout, phases 5–7) | chaque phase se termine par des vérifications automatiques |
| Sauvegarde | Git (code + données sources) + export CSV + export de la base | on peut toujours reconstruire |

### 3.2 Schéma de fonctionnement

```
 Téléphone / ordinateur du père
 ┌───────────────────────────────────────────────┐
 │  Navigateur                                   │
 │  ┌─────────────┐   ?voirie=…   ┌────────────┐ │
 │  │ Carte       │◄─────────────►│ Tableau    │ │
 │  │ (Leaflet)   │   sélection   │ (tri/filtre│ │
 │  └──────┬──────┘   partagée    └─────┬──────┘ │
 │         └──────── Panneau fiche ─────┘        │
 └─────────────────────┬─────────────────────────┘
                       │ HTTPS, session connectée
 ┌─────────────────────▼─────────────────────────┐
 │ Next.js (Vercel)                              │
 │  pages · Server Actions (Zod) · score.ts      │
 └─────────────────────┬─────────────────────────┘
                       │ clé publique + session ; RLS
 ┌─────────────────────▼─────────────────────────┐
 │ Supabase : Postgres + Auth                    │
 │ roads · road_segments · road_evaluations ·    │
 │ match_reviews · priority_settings · change_log│
 └───────────────────────────────────────────────┘

 Scripts locaux (lancés à la main, jamais par le site) :
 extraction OSM · recoupement SPW · lecture Excel · propositions d'appariement · import
```

### 3.3 Organisation prévue du dépôt

```
voiries-pepinster/
├── Brief_Claude_Code_Voiries_Pepinster.md
├── PLAN.md · DATA_AUDIT.md · DATA_MODEL.md · CLAUDE.md
├── docs/annexes/audit_feuil1.csv
├── source/etat_voiries_pepinster.xlsx      ← l'original, jamais modifié
├── data/
│   ├── excel/feuil1_raw.json               ← phase 3
│   ├── osm/ · spw/                         ← phase 2 (GeoJSON + métadonnées)
│   ├── mappings/                           ← tables de normalisation validées
│   └── matching/                           ← propositions et décisions
├── scripts/  geo/ · excel/ · match/ · db/
├── supabase/migrations/                    ← phase 4
├── src/
│   ├── app/ (carte, voiries, priorites, parametres, validation, connexion)
│   ├── components/ · lib/priority/score.ts · lib/geo/ · lib/db/
└── tests/ unit/ · e2e/
```

### 3.4 Sécurité (résumé)

- **Un seul compte**, créé à la main ; inscription publique désactivée.
- RLS sur **toutes** les tables ; refus par défaut.
- Clés secrètes dans `.env.local` (exclu de Git) et dans les variables d'environnement de l'hébergeur ; la clé `service_role` ne sert qu'aux scripts locaux.
- Aucune donnée personnelle de riverains ; seulement des voiries et des notes techniques.
- Les pages ne sont **pas indexées** par les moteurs de recherche (`noindex`).

---

## 4. Obtenir toutes les routes de Pepinster

### 4.1 Principe

**On ne dessine rien.** Toutes les géométries viennent d'une **extraction OSM unique, datée et versionnée**. On la recoupe ensuite avec le **réseau routier régional wallon** pour identifier les routes du SPW. Tout ce qui n'est pas dans OSM fait l'objet d'un **audit de couverture** et d'une **validation manuelle**. Une voirie absente d'OSM n'est **jamais tracée à la main** : elle existe dans le tableau avec la mention « pas de tracé ».

### 4.2 Étapes (réalisées en phase 2)

1. **Limite communale** : relation OSM `boundary=administrative`, `admin_level=8`, `name=Pepinster`. On vérifie son identifiant et son code INS, puis on la compare visuellement à la limite officielle wallonne. → `data/osm/pepinster_boundary_<date>.geojson`.
2. **Réseau** : une requête Overpass **unique**, dont voici l'esquisse :
   ```
   [out:json][timeout:180];
   area["boundary"="administrative"]["admin_level"="8"]["name"="Pepinster"]->.p;
   way(area.p)["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|road|service|track|path|footway|bridleway|cycleway|steps)(_link)?$"];
   out body geom;
   ```
   Le résultat est enregistré avec sa date `osm_base`, la requête exacte, la licence ODbL et l'empreinte du fichier (`geo_snapshots`).
   **Solution de secours** si Overpass est indisponible : extrait Belgique de Geofabrik, découpé localement avec la limite communale (même résultat, sans solliciter Overpass).
3. **Classement des voies** :

   | Catégorie | Types OSM | Visible par défaut |
   |---|---|---|
   | `voirie` | primary → residential, living_street, pedestrian, road, unclassified, **avec nom** | oui (carte + tableau principal) |
   | `chemin` | track, path, footway, bridleway, cycleway, steps | carte : oui (trait fin) ; tableau : filtre « chemins » |
   | `sans_nom` | toute voie sans nom (accès privés, parkings `service`…) | non, filtre « sans nom » |

4. **Regroupement en voiries logiques** : on regroupe les segments par **nom normalisé**, puis par **continuité réelle** (segments qui partagent un nœud OSM). Deux groupes de même nom non reliés deviennent **deux candidats homonymes**, à valider à la main. Un petit écart (< 50 m) entre deux groupes est signalé comme « trou possible dans OSM », sans jamais être comblé.
5. **Limite communale** — *décision D6* : les segments qui traversent la limite sont **coupés à la limite** pour l'affichage. Le seul point nouveau est l'intersection exacte entre le tracé OSM et la limite OSM. Il est **calculé, jamais dessiné**, et marqué comme tel (`clipped = true`). Le way d'origine reste conservé tel quel dans l'extraction.
6. **Gestionnaire SPW** : téléchargement de la couche « Réseau routier régional » du Géoportail wallon (service `MOBILITE/RES_ROUTIER_REGIONAL`, coordonnées Lambert 72 converties en WGS84), limitée à l'emprise de Pepinster. Un segment situé à moins de ~15 m du réseau régional sur ≥ 80 % de sa longueur est marqué `in_spw_network`. Les désaccords avec les 17 « SPW » de l'Excel vont en validation manuelle. **La licence de ce jeu de données doit être vérifiée** avant usage (la fiche transportdata.be ne l'indique pas).
7. **Audit de couverture** (`COVERAGE_REPORT.md`) : nombre de voies et de km par type, liste des voies sans nom, des homonymes et des segments en limite, plus une carte à relire **par ancienne commune** (Pepinster, Cornesse, Soiron, Wegnez). La phase 3 y ajoutera la liste des noms Excel introuvables dans OSM.
8. **Resynchronisation future** : un script séparé compare une nouvelle extraction à l'ancienne. Il produit la liste des ways ajoutés, supprimés ou modifiés, et **ne touche jamais** `road_evaluations`.

### 4.3 Point technique à anticiper

Depuis mon environnement de travail, les services **Overpass, Nominatim et Géoportail wallon sont actuellement bloqués** (testé aujourd'hui). Pour la phase 2, il faudra choisir l'une de ces options (O3, option a) recommandée) :
- **a)** ajouter ces domaines aux domaines autorisés dans les réglages de Claude (Paramètres → Capacités) : `overpass-api.de`, `download.geofabrik.de`, `geoservices.wallonie.be` ;
- **b)** lancer toi-même le script d'extraction dans le Terminal de ton Mac (je te donnerai la commande exacte).

---

## 5. Associer les routes OSM aux lignes de l'Excel

### 5.1 Règle d'or

**Aucune ligne Excel n'est liée à une route sans validation humaine.** L'ordinateur **propose**, il ne décide jamais. Même une correspondance exacte est présentée pour confirmation, mais elle peut être confirmée **en lot**.

### 5.2 Étapes

1. **Préparer le nom Excel**, en gardant toujours le brut : suppression des espaces en trop, Unicode, apostrophes. On génère ensuite des **variantes de recherche** : nom tel quel, nom **réordonné** (`Biez Rue du` → `Rue du Biez`) et cœur du nom sans le type (`Biez`).
2. **Préparer les noms OSM** : `name`, `alt_name`, `old_name`, `name:fr`. On les normalise de la même manière (minuscules, sans accents, `St`/`Saint`, `1er`).
3. **Chercher des candidats** et classer chaque ligne :

   | Méthode | Exemple | Statut proposé |
   |---|---|---|
   | `exact` | `Hezée` = `Hezée` | pré-coché, **confirmation en lot** |
   | `exact_reordonne` | `Hospice Rue de l'` = `Rue de l'Hospice` | pré-coché, confirmation en lot |
   | `approchant` | `Mathieu Regnier` ≈ `Rue Mathieu Régnier` | **validation individuelle** |
   | `section` | `Bouhaye inférieure`, `Soiron-Centre Taverne` | **section à définir** sur la carte |
   | `aucun` | aucun candidat | `introuvable_osm` : la fiche existe, sans tracé |
   | cas spéciaux | `Rue du Duc` (« n'existe plus »), `Chemin du Nauzaury` ×2 | traitement individuel |

   Garde-fous : pas de pré-cochage si **plusieurs** candidats existent (homonymes), si la ligne est un doublon, ou si le gestionnaire Excel (SPW) contredit le recoupement régional.
4. **Écran / fichier de validation** : chaque proposition s'affiche avec le tracé candidat **surligné sur la carte**. La décision (OK / autre candidat / section / introuvable) est enregistrée dans `data/matching/decisions.csv` en phase 3, puis dans `match_reviews` en phase 4. Un fichier CSV qui s'ouvre dans **Excel** est aussi produit, pour que ton père puisse relire à sa manière.
5. **Sections** : sur la carte, on sélectionne les segments OSM qui composent la section (ex. « Bouhaye inférieure »). Si un way doit être coupé, on ne le coupe qu'à un **nœud OSM existant**. La section devient une voirie à part entière, avec sa fiche et sa couleur.
6. **Rapport** `MATCHING_REPORT.md` : comptes par statut, liste complète des décisions, des introuvables et des routes OSM sans ligne Excel. Ces dernières sont visibles en **gris, « à compléter »**.

---

## 6. Calcul transparent de la priorité

> Proposition **à faire valider par ton père**. Tous les poids, échelles et seuils seront modifiables dans **Paramètres**, et chaque version sera conservée.
> Le score est **un outil d'aide au classement**, pas une expertise d'ingénierie ni une décision automatique de travaux.

### 6.1 Critères, poids et échelles

| Critère | Poids | Valeurs → points (0–100) | Source à l'import |
|---|---:|---|---|
| État de la chaussée (`etat_note`) | **55 %** | 1→0 · 2→25 · 3→50 · 4→75 · 5→100 | **vide** tant que la note n'est pas validée (suggestion par couleur, D1–D2) |
| Intensité de circulation | **20 %** | faible→0 · moyen→33 · élevé→67 · transit→100 | colonne D ; `Lotissement` → **faible** (*décision D3*, tracée) |
| Densité d'habitation | **15 %** | nul→0 · faible→25 · moyen bas→50 · moyen élevé→75 · élevé→100 | colonne F |
| Risque sécurité/mobilité | **10 %** | 1→0 · 2→25 · 3→50 · 4→75 · 5→100 | **vide** : saisie manuelle uniquement |

**Niveaux du risque sécurité/mobilité** (proposition par défaut, modifiable dans Paramètres) :
1 = aucun risque identifié · 2 = risque faible (gêne ponctuelle) · 3 = risque modéré (usagers vulnérables présents : école, piétons, cyclistes) · 4 = risque important (danger signalé : trottoir hors d'usage, affaissement, nids-de-poule profonds) · 5 = risque grave (à sécuriser sans attendre).

*Décision D3 : poids, échelles et seuils acceptés. Ils doivent pouvoir être **modifiés par ton père** dans l'écran Paramètres.*

### 6.2 Formule

```
critères connus K = critères renseignés (non vides)
couverture       = somme des poids de K / 100
score            = somme(poids_i × points_i pour i dans K) / somme des poids de K
```

**Le score n'est calculé que si les trois conditions sont réunies :**
1. `etat_note` est renseignée (une simple mention « RAS » ne suffit pas) ;
2. au moins un **autre** critère est renseigné ;
3. couverture ≥ **70 %**.

Sinon, la voirie affiche **« Non évalué »**, en **gris**.
Arrondi : à l'entier le plus proche (0,5 vers le haut). La couleur est choisie **sur le score arrondi**, pour que le chiffre affiché et la couleur concordent toujours.
Un score est marqué **« provisoire »** dès qu'un critère manque (couverture < 100 %).

### 6.3 Couleurs

| Score | Couleur |
|---|---|
| 0–24 | vert |
| 25–49 | jaune |
| 50–74 | orange |
| 75–100 | rouge |
| pas de score | gris |

Les teintes exactes seront choisies pour rester lisibles par les personnes daltoniennes. Le score est toujours écrit en chiffres dans le tableau et la fiche : **la couleur ne porte jamais seule l'information**.
**SPW** : le gestionnaire est indiqué par un **trait en pointillés**, pas par une couleur. La couleur reste celle du score (gris si non évalué). Une case « Exclure les voiries SPW du classement communal » est cochée par défaut. Les voiries SPW restent sur la carte.
**Autres gestionnaires** (*décision D7*) : une voirie non communale (ex. Rue Marcel Fikenne) a le gestionnaire `autre`. Elle est traitée comme une voirie SPW : visible, en pointillés, exclue par défaut du classement communal.

### 6.4 Exemples vérifiés (calculés par programme)

| Cas | État | Intensité | Densité | Risque | Couverture | Résultat |
|---|---|---|---|---|---:|---|
| A | 4 (75) | transit (100) | moyen bas (50) | – | 90 % | **76 — rouge, provisoire** |
| B | 2 (25) | – (Lotissement) | élevé (100) | – | 70 % | **41 — jaune, provisoire** |
| C | – (RAS) | moyen | moyen élevé | – | – | **Non évalué** (état manquant) |
| D | 5 | – | – | – | 55 % | **Non évalué** (aucun autre critère) |
| E | 5 (100) | – | faible (25) | – | 70 % | **84 — rouge, provisoire** |
| F | 5 (100) | faible (0) | faible (25) | – | 90 % | **65 — orange, provisoire** |
| G | 3 (50) | élevé (67) | moyen élevé (75) | 3 (50) | 100 % | **57 — orange** |

⚠️ **Limite à connaître (cas E et F)** : quand un critère manque, les autres pèsent plus lourd. La même route passe de 84 à 65 dès qu'on renseigne un trafic faible. C'est pour cela que la **couverture** et la mention **provisoire** sont toujours affichées.

### 6.5 Ce qui n'entre **pas** dans le score

L'ampleur des travaux, les échéances, le type d'habitat et les textes libres (`Sécurisation/Mobilité`, `Particularité`). Ils sont affichés dans la fiche et filtrables. Les ajouter au score serait une **décision du père**, à prendre plus tard.

### 6.6 Transparence dans l'interface

La fiche de chaque voirie montrera le détail du calcul : chaque critère, sa valeur, ses points, son poids, sa contribution, puis la couverture, la version des paramètres utilisée et les critères manquants.

---

## 7. Plan de développement phase par phase

Chaque phase se termine par : vérifications automatiques, résumé des fichiers créés ou modifiés, instructions exactes pour tester sur Mac, captures d'écran, limites restantes, commit Git `phase-N`, puis **arrêt jusqu'à ta validation**.

| Phase | Objectif | Livrables | Critères d'acceptation | Questions à trancher avant |
|---|---|---|---|---|
| **0** | Analyse et plan | ce document + `DATA_AUDIT.md`, `DATA_MODEL.md`, `CLAUDE.md`, annexe CSV | tu valides le plan | – |
| **1** | Socle et interface | projet Next.js, design responsive, navigation **Carte / Voiries / Priorités / Paramètres**, données **fictives étiquetées « démo »** | `npm run dev` s'ouvre ; `npm run lint` et `npm run typecheck` sans erreur ; l'affichage tient sur téléphone | – |
| **2** | Couverture géographique | limite + réseau réel extraits et versionnés, carte cliquable (1 couleur par voirie logique), recoupement SPW, `COVERAGE_REPORT.md` | aucun tracé inventé ; clic sur un segment = toute la voirie surlignée ; rapport de couverture relu | – (O3 résolu) |
| **3** | Import de l'Excel | lecture brute `Feuil1` (valeurs + couleurs), normalisations tracées, propositions d'appariement, écran/fichier de validation, `MATCHING_REPORT.md` | 180 lignes lues, légende ignorée ; aucune fusion automatique ; routes OSM hors Excel visibles « à compléter » | O8 (validation, après la phase) |
| **4** | Persistance et compte privé | migrations SQL, Auth (compte unique du père), RLS, CRUD, `change_log` | données conservées après rafraîchissement ; accès refusé sans connexion ou avec un autre compte (testé) | – |
| **5** | Carte ↔ tableau synchronisés | panneau latéral éditable, recherche sans accents/casse, filtres, sélection dans les deux sens | modifier une voirie à plusieurs segments : **tous** changent de couleur ensemble | – |
| **6** | Priorités | moteur de score, couverture, couleurs, SPW, classement, paramètres versionnés **modifiables par le père**, écran de validation des notes suggérées | tests unitaires des cas A–G et des cas limites (0 %, 70 % pile, tout vide, valeurs hors bornes) ; **test « liste témoin »** : les voiries de la feuille `Récap 102026` sortent en tête du classement communal (D8) | – |
| **7** | Finition et publication | accessibilité, erreurs, tests d'intégration et de sécurité, export CSV, sauvegarde, guide utilisateur, déploiement | publication **uniquement après ton accord explicite** ; aucune dépense sans validation | – |

---

## 8. Risques et parades

| Risque | Gravité | Parade |
|---|---|---|
| **Les notes d'état n'existent qu'en couleurs** : sans validation, toute la carte est grise | élevée | suggestions par couleur + validation par lot (D1, D2) |
| Noms Excel ≠ noms OSM (ordre inversé, lieux-dits, fautes) | élevée | variantes de recherche + validation manuelle obligatoire |
| Une ligne Excel = un **tronçon** et non une rue entière | moyenne | voiries de type `section`, faites de segments OSM réels |
| Données OSM incomplètes (chemins, nouveaux lotissements) | moyenne | audit de couverture ; fiche « sans tracé » ; jamais de dessin |
| Accès réseau bloqué (Overpass, Géoportail) | moyenne | option a) ou b) du §4.3 ; secours Geofabrik |
| Licence des données wallonnes non confirmée | moyenne | vérification avant usage ; sinon on se limite à OSM + Excel |
| Supabase gratuit **mis en pause** après une période d'inactivité (à confirmer en phase 4) | moyenne | vérification des conditions ; rappel ou alternative si besoin |
| Projet de code dans **iCloud Drive** : synchronisation de milliers de fichiers (`node_modules`), conflits, dépôt Git abîmé | **élevée** | le code vit sur GitHub ; sur le Mac, on le récupère dans `~/Developer`, hors iCloud (§10.2) |
| Maintenance par un débutant | moyenne | `CLAUDE.md`, commandes documentées, tests automatiques, Git |
| Mauvaise interprétation du score par l'utilisateur | moyenne | détail du calcul, mention « provisoire », avertissement « aide au classement » |

---

## 9. Décisions et points encore ouverts

### 9.1 Décisions du 11 novembre 2026

| N° | Sujet | Décision | Effet dans le projet |
|---|---|---|---|
| **D1** | Couleur de la case « Etat » | c'est bien la note 1–5 de la légende ; validation **par lot** acceptée | import → `etat_note_suggeree` ; écran « Valider les notes suggérées » avec validation par lot (phase 6) |
| **D2** | Rouge vif `#FF0000` (13 routes) | erreur de rouge : il fallait le rouge de la légende | ces 13 routes reçoivent la suggestion **4 (mauvais)**, avec l'origine « rouge vif corrigé en 4 ». Au total, **137 suggestions** (92 × 1, 11 × 2, 14 × 3, 16 × 4, 4 × 5) |
| **D3** | Échelles et poids du score | acceptés tels que proposés (§6.1) ; **modifiables** par le père | intensité 0/33/67/100 ; `Lotissement` → trafic **faible** (tracé) ; niveaux de risque 1–5 par défaut (§6.1) ; écran Paramètres éditable |
| **D4** | Tronçons | **fiches séparées** (Bouhaye inf./sup., Soiron-Centre ×6, Goffontaine 1/2…) | voiries de type `section`, faites de segments OSM réels |
| **D5** | Échéances | années passées = **années de réalisation** ; délais relatifs comptés **depuis mai 2025** | nouveau champ `annee_realisation` ; échéance **estimée** : 2 ans → 2027, 3 ans → 2028, 5 ans → 2030, 8 ans → 2033, « + de 5 ans » → après 2030 ; valeur brute toujours conservée |
| **D6** | Ce qu'on affiche | chemins agricoles et sentiers **visibles** ; routes **coupées à la limite** communale | chemins en trait fin, filtrables ; découpe à la limite marquée `clipped` (§4.2) |
| **D7** | Cas particuliers | Rue Marcel Fikenne : **non communale** · Rue Jacques Bouhy et Lefin : **chantier Infrabel** · Rue du Duc : **n'existe plus** | Fikenne → gestionnaire `autre`, exclue du classement communal ; Bouhy/Lefin → gestionnaire inchangé + étiquette « chantier Infrabel » ; Duc → `n_existe_plus`, hors carte, visible via le filtre « archivées » |
| **D8** | Feuille `Récap 102026` | c'est sa liste actuelle de priorités | **liste témoin**, non importée ; test automatique en phase 6 |
| **D9** | Compte de l'application | un seul compte : le **père** | `app_admins` contient une seule ligne |
| **D10** | Budget et sauvegarde | **0 €** ; dépôt **GitHub privé** `hugolegranddiet-dotcom/voiries-pepinster` | offres gratuites uniquement ; toute dépense demandera un accord explicite |
| **D11** | Couleurs inconnues (vert `#00B050`, jaune, astérisque de « RAS * ») | **pas de couleur** | aucune note suggérée pour ces routes : elles restent **grises** jusqu'à ce que le père saisisse une note |
| **D12** | Comptes techniques (GitHub, Supabase, Vercel) | au **nom de Hugo** | Hugo crée les comptes ; le père n'a que son compte dans l'application |
| **D13** | Développement | **ici, avec Claude**, sauvegarde sur GitHub | Hugo teste sur son Mac quand il le souhaite (§10.2) |
| **D14** | Noms en double sur la carte (COVERAGE §5) | « si même endroit, même rue ; sinon homonyme » | morceaux de même nom à moins de **300 m** réunis en une voirie ; au-delà, homonymes séparés (Route de Soiron, Rue de la Paix) ; journal dans `COVERAGE_REPORT.md` |
| **D16** | Validation des correspondances (11/11/2026) | fichier rempli par Hugo : OK sur les 168 propositions ; « laisse tomber les introuvées » | 152 lignes validées ; 16 parties de rue enregistrées comme SECTION (OK sur une section = SECTION, D4) ; 12 lignes sans voirie écartées ; fichier reçu archivé dans `data/matching/recus/` |
| **D15** | Relecture de la liste des rues OSM (COVERAGE §8) | « fais au mieux » | pas de relecture ligne à ligne par le père ; les écarts apparaissent dans `MATCHING_REPORT.md` (lignes Excel introuvables, voiries sans ligne Excel) |

### 9.2 Points encore ouverts

| N° | Question | Bloque | État |
|---|---|---|---|
| ~~O3~~ | Accès réseau pour la phase 2 | – | **Résolu** : extraction OSM lancée sur le Mac de Hugo (`npm run geo:extract`, 11/11/2026, relation 2436184). Réseau régional SPW consulté pour identification seulement : tracés non conservés, seul le résultat du recoupement est gardé |
| **O5** | `Chemin du Nauzaury` (lignes 29 et 176) : une voirie ou deux parties ? | non bloquant | aucune voirie de ce nom dans OSM : les deux lignes sont « aucune voirie trouvée » ; décision dans le fichier de validation |
| ~~O8~~ | Valider les correspondances | – | **Résolu** (D16) |
| **O10** | **Deux lignes Excel validées sur la même voirie** : Rue du Paire (l. 103 + 104), Place Saint Hubert (l. 113 + 127), Voie du Moulin (l. 148 + 175) | évaluation de ces 3 voiries | aucune donnée n'est choisie : leur évaluation reste vide (« conflit à résoudre ») jusqu'à décision de Hugo |
| **O9** | Tracé des **sections** (Bouhaye inf./sup., Soiron-Centre…) | couleur des sections | à définir sur la carte lors de la phase d'édition (5) ; d'ici là, rattachées à leur voirie mère |
| **O7** | Autoriser Claude à **écrire** sur le dépôt GitHub (installation de l'application GitHub « Claude ») | sauvegarde | le premier enregistrement est prêt et attend cette autorisation |

---

## 10. Comment passer à la phase 1

### 10.1 Mettre en place GitHub (≈ 10 minutes, une seule fois)

Je ne peux pas créer de compte à ta place. En revanche, une fois le dépôt relié, **c'est moi qui y dépose et sauvegarde tout le code**.

1. **Crée un compte gratuit** sur [github.com](https://github.com) (bouton *Sign up*), si tu n'en as pas déjà un.
2. **Crée un dépôt vide** : bouton **+** en haut à droite → *New repository* → nom `voiries-pepinster` → choisis **Private** → **ne coche rien** (ni README, ni .gitignore, ni licence) → *Create repository*.
3. **Relie GitHub à Claude** : sur claude.ai → *Paramètres* → *Connecteurs* → GitHub → autorise l'accès au dépôt `voiries-pepinster`.
4. **Envoie-moi ton nom d'utilisateur GitHub.** Je relierai le dépôt à notre conversation, j'y déposerai les documents de la phase 0 (premier enregistrement, ou *commit*), puis j'attendrai ton feu vert pour la phase 1.

### 10.2 Pour tester sur ton Mac (pas besoin tout de suite)

Ouvre l'application **Terminal** et tape :
```bash
node -v        # attendu : v20 ou plus récent ; sinon installe la version « LTS » depuis nodejs.org
git --version  # si macOS propose d'installer les « outils de ligne de commande », accepte
```
Le jour où tu voudras tester une phase, la commande pour récupérer le projet **hors d'iCloud** sera :
```bash
git clone https://github.com/<ton-nom-github>/voiries-pepinster.git ~/Developer/voiries-pepinster
```
Je te donnerai la suite à chaque fin de phase (`npm install`, `npm run dev`, puis ouvrir `http://localhost:3000`).

### 10.3 Message pour lancer la phase 1

> J'ai examiné et validé la phase 0. Réalise UNIQUEMENT la phase 1 du document `Brief_Claude_Code_Voiries_Pepinster.md`. Respecte les critères d'acceptation, n'anticipe pas la phase suivante. À la fin, lance les vérifications pertinentes, explique ce que je dois tester dans mon navigateur et attends mon retour.

---

*Sources consultées pour ce plan : wiki Overpass API ; politique d'usage des tuiles OSM ; fiche « Réseau routier géré par la Région wallonne » (transportdata.be, métadonnées du 19/03/2026, licence non indiquée) ; service `geoservices.wallonie.be/…/MOBILITE/RES_ROUTIER_REGIONAL/MapServer` ; wiki OSM Belgique (limites administratives).*
