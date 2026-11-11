# DATA_AUDIT — Audit du fichier `etat_voiries_pepinster.xlsx`

> Phase 0 — document d'analyse, aucune donnée n'a été importée ni modifiée.
> Fichier audité : `etat_voiries_pepinster.xlsx` (40 452 octets), feuille **`Feuil1`**, plage `A1:I191`.
> Date de l'audit : 11 novembre 2026.
> Annexe ligne par ligne : [`docs/annexes/audit_feuil1.csv`](docs/annexes/audit_feuil1.csv) (séparateur `;`, s'ouvre dans Excel).

---

## 1. Résumé en 10 points

1. **180 lignes de voiries, 179 noms distincts** : les chiffres du cahier des charges sont confirmés.
2. Les voiries sont rangées en **trois blocs séparés par des lignes vides**. Ces blocs ont un sens métier (voir §2).
3. Colonne `Etat` : **84 « RAS », 17 « SPW », 79 vides**, confirmé. **Aucune note numérique 1–5** n'est écrite dans les cellules.
4. **Découverte importante : la note d'état semble codée par la couleur de fond de la cellule `Etat`.** La légende des lignes 185–189 associe une couleur à chaque note de 1 à 5. 124 lignes portent une couleur de la légende. Cette couleur n'a **pas** été convertie en note : elle sera proposée comme **note suggérée**, et deviendra une note seulement après validation (voir §5).
5. La même légende colore aussi les colonnes `Type de voire` et `Ampleur des travaux`. Elle donne ainsi l'échelle que le père utilise pour le trafic (faible → très élevé) et pour les travaux (Schlammage → Raclage/pose complet).
6. **75 noms** ont des espaces parasites. **84 noms** sont écrits à l'envers par rapport à l'usage OSM (« Biez Rue du » au lieu de « Rue du Biez »). **69 noms** sont des lieux-dits sans mot « Rue/Route… ».
7. Environ **18 lignes décrivent un tronçon** d'une rue plutôt qu'une rue entière (`Goffontaine 1/2`, `Bouhaye inférieure/supérieure`, `Soiron-Centre …` ×6, etc.). Il faut prévoir des « sections » de voirie.
8. Colonne `Année prévue` : très hétérogène. **22 années déjà passées** (2019–2025), 7 fois 2026, 4 plages, 20 délais relatifs (« 5 ans »…), 2 qualitatifs (« urgent », « prioritaire »).
9. La colonne `Sécurisation/Mobilité` décrit des **aménagements existants ou à faire**, pas un niveau de risque. Le critère `risque_securite` sera donc **vide pour toutes les routes** à l'import.
10. Le classeur contient **5 autres feuilles** (listes de choix et un « Récap 102026 »). Conformément à la consigne, elles **ne sont pas utilisées** comme données (voir §8).

---

## 2. Structure de la feuille `Feuil1`

| Lignes | Contenu | Nb | Remarque |
|---|---|---:|---|
| 1 | En-têtes | – | `Type de voire` : faute dans la source → champ `type_voirie_source` |
| 2–150 | **Bloc A — voiries communales évaluées** | 149 | contient tous les « RAS » (84) et 65 états vides |
| 151 | ligne vide | – | séparateur |
| 152–168 | **Bloc B — voiries SPW** | 17 | `Etat = SPW` partout ; colonnes C–F vides ; 8 années renseignées |
| 169 | ligne vide | – | séparateur |
| 170–183 | **Bloc C — chemins / voiries rurales** | 14 | `Etat` vide partout ; même couleur de thème pour toute la colonne B |
| 184 | ligne vide | – | |
| 185–189 | **Légende** (1 à 5) | – | **à ignorer à l'import**, sert uniquement d'échelle |
| 190 | ligne vide | – | |
| 191 | « ETATS de 1 à 5, 5 étant le pire » | – | à ignorer à l'import |

Total : 149 + 17 + 14 = **180 voiries**. Aucune ligne masquée, aucun filtre, aucune formule, aucun commentaire de cellule.

---

## 3. Colonne par colonne

### A — `Voirie` (nom)

- 180 valeurs, 179 distinctes. Seul doublon exact : **`Chemin du Nauzaury`** (lignes 29 et 176, voir §6).
- 75 noms avec espace final ou double espace : nettoyage automatique sans risque (la valeur brute est conservée).
- **84 noms inversés** (`Nom + Type + particule`). Exemple : `Hospice Rue de l'` → proposition `Rue de l'Hospice`. C'est une **proposition de lecture** pour faciliter la comparaison avec OSM, jamais un renommage automatique.
- **69 noms sans type de voie** (lieux-dits) : `Bouhais`, `Chalsèche`, `Grettouheid`, `Refawtay`… Leur nom dans OSM peut être identique, précédé de « Rue », ou absent.
- Quelques graphies à vérifier contre OSM : `Mathieu Regnier` (Régnier ?), `Place Sainte-Hubert` (Saint-Hubert ?), `la Nô Rue`, `Campagne Rue`, `Lieutenant Rue`.

### B — `Etat`

| Valeur texte | Nb | Interprétation imposée |
|---|---:|---|
| `RAS` | 84 | « rien à signaler » : **pas** automatiquement la note 1 |
| `SPW` | 17 | **gestionnaire** = Service public de Wallonie, pas un état |
| vide | 79 | état inconnu (65 dans le bloc A, 14 dans le bloc C) |

Analyse des couleurs : voir §5.

### C — `Type d'habitat`

36 valeurs brutes pour une dizaine de notions. Exemples de variantes : `campagne` ×23, `campapagne` ×7 (faute), `Campagne` ×2 ; `village` ×4, `Village` ×6 ; `4 façades` ×21, `4 façades ` ×1 ; `jointives`, `Jointives `, `maisons jointives`…
Valeurs à part : `n'existe plus` (Rue du Duc), `négligeable` ×6, `néant` ×2, `variable` ×3, `haut`, `ilot`, `arrière maison`, `Hall parking 3 façades`.
→ Cette colonne **n'entre pas dans le score**. On conserve la valeur brute et on ajoute une catégorie normalisée **proposée** (liste dans `DATA_MODEL.md`).

### D — `Type de voire` → `type_voirie_source`

Seulement 5 valeurs, propres : `Passage faible` 76, `Transit` 25, `Lotissement` 21, `Passage élevé` 19, `Passage moyen` 18, vide 21 (dont les 17 SPW).
Cette colonne mélange **une intensité de trafic** (faible / moyen / élevé / transit) et **un contexte** (`Lotissement`).

**Ce que disent les couleurs de la colonne D** (comparées à la légende) :

| Texte | Couleur de cellule | Niveau de légende |
|---|---|---|
| Passage faible (76/76) | vert clair `#7CEB99` | 2 = « faible » |
| **Lotissement (21/21)** | vert clair `#7CEB99` | 2 = « faible » |
| Passage moyen (16/18) | vert foncé `#009900` | 3 = « moyen » |
| Passage élevé (19/19) | rouge-orangé `#FF3300` | 4 = « élevé » |
| Transit (25/25) | violet `#975CCB` | 5 = « très élevé » |

Exceptions : ligne 37 `Croix Maga Route de la` et ligne 43 `Drolenval plat` (texte `Passage moyen`, mais couleur d'un autre niveau).
→ Le père a donc implicitement classé `Lotissement` en **trafic faible**. Le cahier des charges interdit d'appliquer cette équivalence automatiquement : elle sera **proposée** au père (question Q3).

### E — `Ampleur des travaux`

| Brut | Nb | Normalisé proposé |
|---|---:|---|
| vide | 128 | – |
| `Raclage/pose complet` | 23 | `Raclage/pose complet` |
| `Racalage/pose complet` | 6 | `Raclage/pose complet` (faute) |
| `raclage-pose complet` | 1 | `Raclage/pose complet` |
| `Mauvaise poches + raclage/ pose complet` | 1 | `Raclage/pose complet` + mention `mauvaises poches` |
| `Raclage/pose partiel` | 5 | `Raclage/pose partiel` |
| `Raclage/pose partiel*` | 4 | `Raclage/pose partiel` ; l'astérisque renvoie à la colonne `Particularité` |
| `Enduisage` | 11 | `Enduisage` |
| `Schlammage` | 1 | `Schlammage` |

Les couleurs de la colonne E suivent la légende de façon cohérente (Schlammage = 2, Enduisage = 3, partiel = 4, complet = 5).
→ **Hors score initial**, conformément au cahier des charges. Chaque normalisation sera tracée.

### F — `Densité d'habitation`

5 valeurs propres : `Faible` 42, `Moyen bas` 37, `Elevé` 36, `Moyen élevé` 31, vide 34 (dont 17 SPW). La liste de choix du classeur prévoit aussi `Nul` (jamais utilisé dans `Feuil1`).

### G — `Année prévue` → `echeance_brute`

| Nature | Nb | Valeurs | Traitement |
|---|---:|---|---|
| vide | 125 | – | inconnue |
| **année déjà passée** | 22 | 2019 ×3, 2020 ×3, 2022, 2023 ×5, 2024 ×5, 2025 ×5 | **ambigu** : année prévue à l'époque, ou année de réalisation ? (Q5) |
| année courante | 7 | 2026 | `annee_prevue = 2026` après validation |
| plage | 4 | `2025-2026` ×2, `2026-2027`, `2019-2027` | conservée en brut, pas d'année unique |
| délai relatif | 20 | `5 ans` ×11, `3 ans` ×4, `+ de 5 ans` ×3, `2 ans`, `8 ans` | **jamais converti en année** sans date de référence validée (Q5) |
| qualitatif | 2 | `urgent` (Rue du Fort), `prioritaire` (Grande Fontaine) | conservé ; signalé dans la fiche |

### H — `Sécurisation/Mobilité` → `mobilite_note`

21 valeurs renseignées sur 180, en texte libre : `néant` ×7, `OK` ×2, `existante / marquage cyclable` ×2, `quelques linéaires` ×2, `à revoir`, `à réparer`, `fait`, `Bandes cyclable`, `ilots de sécurité avec coussin`…
→ Ces valeurs décrivent des **aménagements**, pas un **niveau de risque**. `risque_securite` reste **vide** et devra être saisi à la main. « néant » ne veut pas dire « donnée manquante » : la valeur est conservée telle quelle.

### I — `Particularité` → `particularites`

78 valeurs, dont 66 distinctes, en texte libre. Certaines touchent au **gestionnaire** ou à l'**existence** de la voirie, et seront signalées pour validation :

| Ligne | Voirie | Texte | Conséquence |
|---|---|---|---|
| 44 | Rue du Duc | `N'existe plus` (+ colonne C `n'existe plus`) | statut `n_existe_plus` proposé, pas de tracé |
| 94 | Rue Marcel Fikenne | `non reprise ` | voirie peut-être **privée / non reprise** par la commune → gestionnaire à confirmer |
| 73 | Rue Jacques Bouhy | `Infrabel ?` | gestionnaire partiel possible (Infrabel) |
| 86 | Lefin | `1 tronçon en 2024 + Infrabel` | idem |
| 37 | Route de la Croix Maga | `! Faïençage, affaissement d'un côté` | alerte de l'auteur (« ! ») |
| 47 | Rue Emile Vandervelde | `! Fond de coffre` | alerte de l'auteur (« ! ») |

Aucune de ces informations ne modifie automatiquement un score ou un critère.

---

## 4. Valeurs manquantes par bloc

| Champ vide | Bloc A (149) | Bloc B SPW (17) | Bloc C chemins (14) |
|---|---:|---:|---:|
| Etat (texte) | 65 | 0 (tous `SPW`) | 14 |
| Type d'habitat | 4 | 17 | 0 |
| Type de voire | 2 | 17 | 2 |
| Densité | 12 | 17 | 5 |

---

## 5. Les couleurs de la colonne `Etat` : une note d'état cachée ?

### 5.1 La légende (lignes 185–189)

| Note | Libellé (col. C) | Couleur de la cellule B | Trafic (col. D) | Travaux (col. E) |
|---:|---|---|---|---|
| 1 | `RAS  *` | vert vif `#00FF00` | – | – |
| 2 | `correct` | vert clair `#7CEB99` | faible | Schlammage |
| 3 | `valable` | vert foncé `#009900` | moyen | Enduisage |
| 4 | `mauvais` | rouge-orangé `#FF3300` | élevé | Raclage/pose partiel |
| 5 | `dégradé` | violet `#975CCB` | Très élevé | Raclage/pose complet |

### 5.2 Couleurs observées dans la colonne B (180 lignes)

| Couleur | Dans la légende ? | Bloc A | Bloc B | Bloc C | Note suggérée |
|---|---|---:|---:|---:|---|
| vert vif `#00FF00` | oui (1) | **92** (84 RAS + 8 vides) | – | – | 1 |
| vert clair `#7CEB99` | oui (2) | 11 | – | – | 2 |
| vert foncé `#009900` | oui (3) | 14 | – | – | 3 |
| rouge-orangé `#FF3300` | oui (4) | 3 | – | – | 4 |
| violet `#975CCB` | oui (5) | 4 | – | – | 5 |
| **rouge pur `#FF0000`** | **non** | 13 | – | – | **aucune** (Q2) |
| **vert « standard » `#00B050`** | **non** | 9 | 15 | – | **aucune** (Q2) |
| vert `#29B95C` | non | – | 2 | – | aucune |
| **jaune `#FFFF00`** | **non** | 1 (Bois Herman) | – | – | aucune (Q2) |
| couleur de thème Excel | non | – | – | 14 | aucune |
| sans couleur | – | 2 (Rue du Duc, Les Bagneures) | – | – | aucune |

**Bilan** : 124 voiries du bloc A ont une couleur de la légende, donc une note suggérée de 1 à 5. 23 autres ont une couleur hors légende et resteront sans suggestion.

Lignes en **rouge pur `#FF0000`** (13) : Belle Vue, Rue du Biez, Bouhaye inférieure, Rue Francval, Grand'Ry Cornesse, Rue de l'Hospice, Maison-Bois, Rue Marcel Fikenne, Saint Germain, Route de Soiron, Rue Tribomont Bertholet-Verviers, Turlurette, Vieille Eglise. Visuellement, ce rouge est très proche du « 4 ». Plusieurs de ces voiries figurent aussi dans la feuille `Récap 102026`. **Hypothèse non appliquée** : « 4 ou 5, à traiter en priorité ».

Lignes en **vert `#00B050`** du bloc A (9) : Fond de Ville, Rue Nouvelle, Puits Ronval, Quai Ferdinand Nicolaï Hoëgne, Soiron-Centre (cimetière arrière, cimetière centre, Place de l'église), Tilleul, Voie Creuhy. Les 17 SPW portent la même famille de vert. **Signification inconnue.**

**Couleur de la colonne A (nom)** : vert vif sur 84 lignes (83 « RAS » et Chemin du Nauzaury l. 29), vert clair `#92D050` sur **8 voiries qui ont toutes une échéance 2025–2027** (Charles Fraipont, Combattants, Eugène Pauquay, la Nô, Place Charles Fraipont, Progrès, Quai Armand Follet, Saint Hubert). **Hypothèse non appliquée** : « travaux programmés ».

### 5.3 Pourquoi c'est déterminant

Le cahier des charges impose : *pas de score sans `etat_note`*. Sans les couleurs, **aucune voirie n'aurait de note d'état** au départ, et **toute la carte serait grise**.

**Méthode proposée** (à valider, voir Q1) :
1. L'import enregistre la couleur brute et une `etat_note_suggeree` avec son origine (`couleur_legende_excel`).
2. `etat_note` reste **vide**.
3. Le père valide les suggestions dans un écran dédié, une par une ou par lot (ex. « valider les 92 notes vertes = 1 »). Chaque validation est journalisée.
4. Pour « RAS + vert vif », la légende dit elle-même « 1 = RAS * ». La suggestion est donc forte, mais elle reste une **suggestion**. L'astérisque de la légende doit être expliqué (Q1).

---

## 6. Doublons, quasi-doublons et sections

### 6.1 Doublon exact : `Chemin du Nauzaury`

| | Ligne 29 (bloc A) | Ligne 176 (bloc C) |
|---|---|---|
| Valeurs C à I | `campagne`, `Passage faible`, –, `Faible`, –, –, `Partie tarmac OK` | **identiques** |
| Couleur de l'état | vert clair (note 2 suggérée) | couleur de thème du bloc C |
| Couleur du nom | vert vif | aucune |

→ Ce n'est peut-être pas un simple copier-coller. Il peut s'agir de deux parties (partie tarmac / partie chemin). **Pas de fusion automatique** : deux fiches en attente, décision manuelle après examen sur la carte (Q4).

### 6.2 Noms proches à ne pas confondre (aucune fusion)

| Paire | Lecture probable |
|---|---|
| `Impasse de Prévôchamps` (communal) / `Prévôchamps` (SPW) | deux voiries distinctes, gestionnaires différents |
| `Charles Fraipont Rue` / `Place Charles Fraipont` | rue et place, deux voiries |
| `Paire Rue du` / `Paire Ruelle du` | deux voiries |
| `Quai Ferdinand Nicolaï` / `Quai Ferdinand Nicolaï Hoëgne` / `Quai de la Hoëgne` | probablement deux tronçons d'un même quai + un autre quai |
| `Voie du Moulin` / `Chemin du Moulin` | à vérifier |
| `Golettes` / `Les Golets` | à vérifier (graphies proches) |
| `Lieutenant Rue` / `Lieutenant Albert Dressen Rue` | deux voiries probables |
| `Saint Hubert Rue` / `Place Sainte-Hubert` | rue et place ; graphie « Sainte » à vérifier |

### 6.3 Lignes décrivant probablement un **tronçon** (section) d'une voirie

`Goffontaine 1`, `Goffontaine 2`, `Goffontaine Trasenster`, `Bouhaye inférieure`, `Bouhaye supérieure`, `Drolenval descente Cornesse`, `Drolenval plat`, `Grand'Ry Cornesse`, `Grand'Ry Wegnez`, `Quai Ferdinand Nicolaï Hoëgne`, `Soiron-Centre` ×6 (`cimetière arrière`, `cimetière centre`, `Place de l'église`, `Place du bac`, `supérieure`, `Taverne`), `Tribomont Bertholet-Verviers Rue`, `Tribomont principale Rue`.

Ces lignes ont des états et des travaux **différents** pour des parties d'une même rue (ex. Bouhaye inférieure suggérée « rouge pur », Bouhaye supérieure « 3 »). Les fusionner ferait perdre de l'information. → Le modèle de données prévoit des **sections** composées uniquement de segments OSM réels (voir `DATA_MODEL.md`).

Les textes de `Particularité` mentionnent aussi des parties de rue (`* partie cimetière`, `tronçon salle`, `partie vers bois OK`, `150m raclage pose n°25-35`). Ils restent des notes et ne découpent pas la géométrie.

---

## 7. Règles de traitement retenues pour l'import (phase 3)

1. **Toujours conserver la valeur brute** de chaque cellule, sa couleur et son numéro de ligne (`import_rows`).
2. Nettoyage **sûr et automatique**, tracé : espaces en trop, Unicode (NFC), apostrophes (`'` / `’`).
3. Normalisations de vocabulaire (fautes, variantes) : **table de correspondance versionnée**, chaque application est journalisée.
4. `RAS` → `mention_etat_source = 'RAS'`, `etat_note = NULL`.
5. `SPW` → `gestionnaire = 'spw'` (source `excel`), `mention_etat_source = 'SPW'`, `etat_note = NULL`. Le gestionnaire sera aussi recoupé avec la carte régionale (phase 2).
6. Vide → `NULL`. **Jamais de valeur par défaut inventée.**
7. Couleurs → `etat_note_suggeree`, à valider (§5.3).
8. `Lotissement` → `intensite_circulation = faible` (décision D3, tracée), `type_voirie_source = 'Lotissement'` conservé.
9. Échéances (décision D5) : année passée → `annee_realisation` ; 2026 → `annee_prevue` ; délai relatif → `echeance_estimee` comptée depuis mai 2025 ; plages et qualitatifs → `echeance_brute` seulement. La valeur brute est toujours conservée.
10. Lignes 151, 169, 184, 185–191 → ignorées, avec un contrôle automatique qui vérifie qu'on importe bien **180 lignes**.

---

## 8. Autres feuilles du classeur (non utilisées comme données)

| Feuille | Contenu | Usage proposé |
|---|---|---|
| `Type de Voirie` | liste : Lotissement, Passage élevé/faible/moyen, Transit | aucun, sert de référence pour le vocabulaire |
| `Ampleur des travaux` | liste de 7 valeurs, dont `Mauvaise poches + tarmac partiel` et `Réparation ponctuelle` (absentes de Feuil1) | référence de vocabulaire |
| `Densité d'habitation` | Faible, Moyen bas, Moyen élevé, Elevé, **Nul** | référence d'échelle |
| `Feuil6` | Trottoirs, Solution cyclable, Aménagement diminution des vitesses, Pose de radar préventif, Diminution des vitesses | piste pour un futur champ structuré « aménagements » |
| `Récap 102026` | 15 voiries (copie de lignes de Feuil1), colonne « Année prévue au 05.2025 » | **à ne pas importer** ; pourrait servir de **liste témoin** pour vérifier que le score classe bien ces routes (Q8) |

Le titre « Année prévue au 05.2025 » de `Récap 102026` laisse penser que les délais relatifs (« 5 ans ») comptent **à partir de mai 2025**. Ce n'est qu'un indice, à confirmer (Q5).

---

## 9. Décisions reçues le 11/11/2026 (effet sur l'audit)

- **D1** : la couleur de la case `Etat` est bien la note 1–5 de la légende.
- **D2** : le rouge vif `#FF0000` (13 routes) est une erreur de teinte et compte comme **4**. Suggestions : 92 × 1, 11 × 2, 14 × 3, **16 × 4**, 4 × 5, soit **137** au total. Il reste sans suggestion 9 routes vertes `#00B050`, Bois Herman (jaune), Rue du Duc et Les Bagneures (sans couleur).
- **D3** : `Lotissement` = trafic faible.
- **D5** : années passées = réalisation ; délais relatifs comptés depuis mai 2025.
- **D7** : Rue Marcel Fikenne non communale ; Jacques Bouhy et Lefin : chantier Infrabel ; Rue du Duc : n'existe plus.
- **D8** : la feuille `Récap 102026` est la liste actuelle des priorités : elle servira de liste témoin.

- **D11** : les couleurs dont le sens est inconnu (vert `#00B050`, jaune) ne donnent **aucune** note : ces routes restent grises.

L'annexe `docs/annexes/audit_feuil1.csv` est mise à jour (colonne `note_suggeree_par_couleur`). Points encore ouverts : `PLAN.md` §9.2.
