# DATA_MODEL — Modèle de données « Voiries Pepinster »

> Phase 0 — version 2 (décisions D1–D10 du 11/11/2026 intégrées, voir `PLAN.md` §9). Le schéma SQL réel sera écrit en **phase 4** (migrations versionnées Supabase).
> Base cible : **PostgreSQL (Supabase)**. Géométries en **GeoJSON stocké en JSONB** pour le MVP ; passage à PostGIS seulement si un besoin spatial réel apparaît.

---

## 1. Idée centrale en une image

```
                ┌────────────────────────────┐
  geo_snapshots │ extraction OSM du jj/mm/aaaa│  (une ligne par extraction)
                └──────────────┬─────────────┘
                               │ 1..n
                ┌──────────────▼─────────────┐        ┌──────────────────┐
 road_segments  │ segment = 1 way OSM réel   │ n..1   │ roads            │
                │ (ou une partie d'un way,   ├───────►│ voirie logique   │
                │  coupée à un nœud OSM)     │        │ 1 fiche, 1 couleur│
                └────────────────────────────┘        └───┬──────────┬───┘
                                                          │1..1      │0..n
                                       ┌──────────────────▼──┐   ┌───▼────────────┐
                                       │ road_evaluations    │   │ match_reviews  │
                                       │ critères métier     │   │ décisions      │
                                       │ (notes du père)     │   │ d'appariement  │
                                       └─────────────────────┘   └───┬────────────┘
                                                                     │ n..1
                                       ┌─────────────────────────────▼──┐
                                       │ import_rows (180 lignes Excel  │
                                       │ brutes, couleurs, n° de ligne) │
                                       └────────────────────────────────┘
   + priority_settings (poids, échelles, seuils — versionnés)
   + change_log (avant/après, auteur, date — alimenté automatiquement)
   + app_admins (l'unique compte autorisé)
```

**Pourquoi trois niveaux (segment → voirie → évaluation) ?**
- La **géographie** (segments OSM) pourra être resynchronisée plus tard **sans toucher** aux notes du père.
- Une **voirie logique** regroupe tous ses segments : une seule fiche, une seule couleur, un clic n'importe où sélectionne toute la route.
- Les **évaluations** sont séparées : on peut les exporter, les historiser et les protéger indépendamment.

---

## 2. Tables

Conventions : clés `uuid` (`gen_random_uuid()`), horodatages `timestamptz`, `NULL` = **inconnu** (jamais « 0 » ni « non » par défaut).

### 2.1 `geo_snapshots` — traçabilité des extractions géographiques

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `source` | text | `osm_overpass`, `osm_geofabrik`, `spw_reseau_regional`, `osm_boundary` |
| `source_date` | timestamptz | date des données (`osm_base` renvoyée par Overpass) |
| `extracted_at` | timestamptz | date de l'extraction |
| `query` | text | requête exacte utilisée (reproductibilité) |
| `licence` | text | ex. `ODbL 1.0 — © contributeurs OpenStreetMap` |
| `file_path` | text | fichier GeoJSON versionné dans le dépôt |
| `file_sha256` | text | empreinte du fichier |
| `stats` | jsonb | nombre de ways, km, nommés/non nommés… |

### 2.2 `roads` — voirie logique (une fiche, une couleur)

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | = `road_id` |
| `nom_canonique` | text | nom affiché, validé (ex. `Rue du Biez`) |
| `nom_normalise` | text | minuscules, sans accents, pour la recherche (calculé) |
| `alias` | text[] | autres graphies (nom Excel brut, `alt_name` OSM…) |
| `categorie` | enum `road_category` | `voirie` · `section` · `chemin` · `sans_nom` · `autre` |
| `parent_road_id` | uuid FK → roads, nullable | pour une **section** : la voirie « mère » (ex. Bouhaye) |
| `gestionnaire` | enum `manager` | `commune` · `spw` · `autre` · `inconnu` (défaut `inconnu`) |
| `gestionnaire_detail` | text, nullable | ex. `Infrabel (partiel ?)`, `privé / non reprise` |
| `gestionnaire_source` | enum | `excel` · `spw_reseau_regional` · `osm_ref` · `manuel` |
| `statut_fiche` | enum `road_status` | `a_completer` · `importe_excel` · `valide` · `n_existe_plus` · `hors_commune` |
| `statut_geo` | enum `geo_status` | `trace_osm` · `sans_trace` (voirie Excel introuvable dans OSM : **aucun tracé inventé**) |
| `traverse_limite` | boolean | au moins un segment coupe la limite communale |
| `osm_name` | text, nullable | nom d'origine dans OSM |
| `created_at`, `updated_at` | timestamptz | |

Règles :
- Une voirie Excel **introuvable dans OSM** existe en base (`statut_geo = sans_trace`). Elle est visible dans le tableau avec la mention « pas de tracé », **jamais sur la carte**.
- Une voirie OSM **absente de l'Excel** : `statut_fiche = a_completer`, aucune évaluation, **grise** sur la carte.
- `section` : une partie de rue évaluée séparément par le père (ex. `Bouhaye inférieure`). Elle a sa **propre** fiche et sa **propre** couleur. Elle n'est faite **que de segments OSM réels**.

### 2.3 `road_segments` — tracés OSM réels

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | = `segment_id` |
| `road_id` | uuid FK → roads, nullable | `NULL` tant qu'il n'est pas rattaché |
| `snapshot_id` | uuid FK → geo_snapshots | extraction d'origine |
| `osm_way_id` | bigint | identifiant du way OSM |
| `osm_version` | int | version du way au moment de l'extraction |
| `part_index` | int, défaut 0 | 0 = way entier ; 1, 2… = partie d'un way coupé |
| `from_node_id`, `to_node_id` | bigint, nullable | nœuds OSM de coupure (si `part_index > 0`) |
| `highway` | text | `residential`, `tertiary`, `track`… |
| `osm_name` | text, nullable | |
| `osm_ref` | text, nullable | ex. `N61` (indice de route régionale) |
| `osm_tags` | jsonb | tous les tags utiles (surface, access…) |
| `geometry` | jsonb | GeoJSON `LineString` (WGS84), **coordonnées OSM uniquement** |
| `length_m` | numeric | longueur calculée |
| `inside_ratio` | numeric | part de la longueur dans la commune (0–1) |
| `in_spw_network` | boolean, nullable | recoupement avec le réseau régional wallon |
| `clipped` | boolean | `true` si le tracé a été coupé à la limite communale (D6) ; seuls les points d'intersection avec la limite OSM sont calculés |

Contraintes : `unique (snapshot_id, osm_way_id, part_index)`.
**Règle absolue** : on ne coupe un way OSM **qu'à un nœud OSM existant**, et on ne crée **jamais** de coordonnée. Seule exception, décidée (D6) : le point d'intersection exact avec la limite communale, calculé et marqué `clipped`.

### 2.4 `road_evaluations` — critères métier (1 par voirie)

| Colonne | Type | Description |
|---|---|---|
| `road_id` | uuid PK, FK → roads | |
| `etat_note` | smallint, nullable, `check 1..5` | **note validée** ; seule utilisée par le score |
| `etat_note_suggeree` | smallint, nullable, `check 1..5` | proposée d'après la couleur Excel |
| `etat_note_suggeree_origine` | text, nullable | ex. `couleur_legende_excel #009900` ou `rouge_vif_corrige_en_4 #FF0000` (D2) |
| `mention_etat_source` | enum | `RAS` · `SPW` · `vide` · `autre` |
| `type_habitat_brut` | text | valeur Excel d'origine |
| `type_habitat` | enum, nullable | catégorie normalisée (voir §3) |
| `type_voirie_source` | text | valeur brute colonne D (`Passage faible`, `Lotissement`…) |
| `intensite_circulation` | enum, nullable | `faible` · `moyen` · `eleve` · `transit` |
| `densite_habitation` | enum, nullable | `nul` · `faible` · `moyen_bas` · `moyen_eleve` · `eleve` |
| `ampleur_travaux_brut` | text | |
| `ampleur_travaux` | enum, nullable | `schlammage` · `enduisage` · `raclage_partiel` · `raclage_complet` · `reparation_ponctuelle` · `autre` |
| `echeance_brute` | text | `5 ans`, `urgent`, `2025-2026`… (jamais transformé) |
| `annee_prevue` | smallint, nullable | année explicite **future ou courante** (ex. 2026) |
| `annee_realisation` | smallint, nullable | année **passée** de la colonne G = année de réalisation (D5) |
| `echeance_estimee` | smallint, nullable | année estimée d'un délai relatif, comptée depuis mai 2025 (D5) : 2 ans → 2027, 3 ans → 2028, 5 ans → 2030, 8 ans → 2033 |
| `echeance_estimee_regle` | text, nullable | règle appliquée, ex. `5 ans depuis 05/2025` ; « + de 5 ans » → `après 2030` sans année fixe |
| `mobilite_note` | text, nullable | texte libre (colonne H) |
| `risque_securite` | smallint, nullable, `check 1..5` | **saisie manuelle uniquement** |
| `particularites` | text, nullable | texte libre (colonne I) |
| `etiquettes` | text[] | étiquettes structurées, ex. `chantier_infrabel` (D7) |
| `statut_validation` | enum | `non_valide` · `partiellement_valide` · `valide` |
| `source_excel_ligne` | smallint, nullable | n° de ligne dans `Feuil1` |
| `updated_at` | timestamptz | |
| `updated_by` | uuid FK → auth.users | |

Le **score n'est pas stocké** : il est recalculé à partir de ces champs et des paramètres actifs (voir `PLAN.md` §6). Aucune valeur ne peut donc devenir « périmée ».

### 2.5 `import_batches` et `import_rows` — mémoire fidèle de l'Excel

`import_batches` : `id`, `file_name`, `file_sha256`, `sheet` (`Feuil1`), `range` (`A1:I191`), `rows_expected` (180), `rows_imported`, `imported_at`, `report` (jsonb).

`import_rows` :

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `batch_id` | uuid FK | |
| `excel_row` | smallint | 2 à 183 |
| `bloc` | text | `A_communal` · `B_spw` · `C_chemins` |
| `raw` | jsonb | les 9 cellules **telles quelles** (espaces compris) |
| `fills` | jsonb | couleur de fond de chaque cellule |
| `normalized` | jsonb | valeurs après normalisation |
| `normalization_log` | jsonb | liste `{champ, avant, après, règle}` |
| `road_id` | uuid FK, nullable | voirie liée **après validation** |

L'import est **idempotent** : relancer l'import du même fichier (même empreinte) ne crée pas de doublons.

### 2.6 `match_reviews` — validation manuelle des correspondances

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `import_row_id` | uuid FK | ligne Excel concernée |
| `candidates` | jsonb | jusqu'à 3 voiries OSM candidates avec score et méthode |
| `method` | enum | `exact` · `exact_reordonne` · `approchant` · `section` · `aucun` |
| `proposed_road_id` | uuid, nullable | meilleure proposition |
| `status` | enum | `a_valider` · `valide` · `rejete` · `section_a_definir` · `introuvable_osm` · `n_existe_plus` |
| `decided_road_id` | uuid, nullable | décision finale |
| `decided_by`, `decided_at` | | |
| `comment` | text | justification |

**Aucun lien `import_rows.road_id` n'est posé tant que `status ≠ valide`.**

### 2.7 `priority_settings` — paramètres du score (versionnés)

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `version` | int | incrémentée à chaque modification |
| `is_active` | boolean | une seule version active |
| `weights` | jsonb | `{"etat":55,"intensite":20,"densite":15,"risque":10}` |
| `scales` | jsonb | correspondances valeur → 0–100 pour chaque critère |
| `thresholds` | jsonb | `[{"max":24,"couleur":"vert"},…]` |
| `min_coverage` | numeric | 0.70 |
| `ranking_managers` | text[] | gestionnaires inclus dans le classement communal ; défaut `{commune}` (SPW et `autre` exclus, D7) |
| `created_at`, `created_by` | | |

Les anciennes versions sont conservées : on peut toujours expliquer **avec quels paramètres** un classement a été produit.

### 2.8 `change_log` — historique des modifications

`id`, `table_name`, `record_id`, `field`, `old_value` (jsonb), `new_value` (jsonb), `changed_by`, `changed_at`, `reason` (texte libre facultatif).
Rempli par un **déclencheur Postgres** sur `roads`, `road_evaluations`, `match_reviews` et `priority_settings`. L'interface ne peut donc pas l'oublier.

### 2.9 `app_admins` — l'unique utilisateur autorisé

`user_id` (uuid PK, FK → `auth.users`). Une seule ligne : le **compte du père** (D9).

---

## 3. Vocabulaires (enums) et normalisations proposées

### `type_habitat` (hors score)
| Catégorie | Valeurs brutes rattachées |
|---|---|
| `campagne` | campagne, Campagne, campapagne |
| `campagne_forestier` | campagne-forestier, Campagne-forestier, Chemin forestier |
| `village` | village, Village, village  campagne |
| `quatre_facades` | 4 façades, 4 façades␠, 4 façades (en bas) |
| `trois_facades` | 3 façades |
| `jointives` | jointives, Jointives␠, maisons jointives, jointive 1 côté, maisons jointives 1 côté, maisons jointives/1 coté |
| `mixte_jointives_4f` | jointives / 4 façades, jointives 3 façades |
| `lotissement_3f` | Lotissement 3 façades, Lotis. 3 façades-jointives |
| `lotissement_4f` | Lotissement 4 façades, Lotissement 3/4 façades |
| `lotissement` | Lotissement |
| `negligeable` | négligeable, néant |
| `autre` | variable, haut, ilot, arrière maison, Hall parking 3 façades, maisons jointives et activités industrielles, n'existe plus |

Ces regroupements sont des **propositions** : le père les valide une fois, dans une table de correspondance versionnée (`data/mappings/type_habitat.json`).

### `intensite_circulation` (critère du score)
| Valeur brute colonne D | Valeur proposée |
|---|---|
| Passage faible | `faible` |
| Passage moyen | `moyen` |
| Passage élevé | `eleve` |
| Transit | `transit` |
| Lotissement | **`faible`** (décision D3, inscrite dans `normalization_log`) |

### `densite_habitation` (critère du score)
Faible → `faible` · Moyen bas → `moyen_bas` · Moyen élevé → `moyen_eleve` · Elevé → `eleve` · (Nul → `nul`).

---

## 4. Sécurité des données (Row Level Security)

- RLS **activée sur toutes les tables**.
- Politique unique, en lecture et en écriture : `exists (select 1 from app_admins where user_id = auth.uid())`.
- Inscription publique **désactivée** dans Supabase ; le compte est créé à la main.
- La clé `service_role` n'est utilisée **que** par les scripts d'import lancés en local. Elle ne va **jamais** dans le navigateur ni dans Git.
- Tests prévus en phase 4 : un visiteur non connecté et un compte non autorisé doivent recevoir **0 ligne** et un **refus d'écriture**.

---

## 5. Ce qui vit dans des fichiers versionnés (Git) plutôt qu'en base

| Fichier | Rôle |
|---|---|
| `data/osm/pepinster_boundary_<date>.geojson` | limite communale extraite |
| `data/osm/pepinster_roads_<date>.geojson` | réseau extrait (source de vérité de la géométrie importée) |
| `data/osm/metadata_<date>.json` | requête, date `osm_base`, licence, empreinte |
| `data/spw/reseau_regional_<date>.geojson` | réseau régional pour le recoupement SPW |
| `data/excel/feuil1_raw.json` | lecture brute unique de l'Excel (valeurs + couleurs) |
| `data/mappings/*.json` | tables de normalisation validées |
| `data/matching/decisions.csv` | décisions d'appariement validées (avant leur import en base) |

On peut ainsi **reconstruire la base à l'identique** à partir du dépôt.

---

## 6. Écarts appliqués lors de la mise en œuvre (phase 4)

| Point | Prévu | Appliqué | Raison |
|---|---|---|---|
| Identifiants de `roads` et `road_segments` | `uuid` | **texte stable** (`n:rue du biez`, `w123456`, `s:20` pour une section, `123456-2` pour un segment coupé) | identiques aux fichiers de la carte et aux décisions ; ré-import sans table de correspondance |
| `road_segments` | `part_index`, nœuds de coupure | `coupe_limite` (booléen) ; l'identifiant porte la partie | les seules coupes actuelles sont celles de la limite communale (D6) |
| `road_evaluations` | — | ajout `annee_realisation`, `echeance_estimee(_regle)`, `etiquettes`, statut `conflit_a_resoudre` | décisions D5, D7 et point O10 |
| Journal | déclencheur | déclencheur sur `roads`, `road_evaluations`, `match_reviews`, `priority_settings` ; les créations faites par l'import ne sont pas journalisées (tracées par `import_batches`) | éviter des milliers de lignes inutiles |
| Fichiers de la carte | `public/geo/` | **`data/geo/`** (non publiés) ; la carte lit la base via `/api/carte`, après connexion | une seule source de vérité, rien de public |
