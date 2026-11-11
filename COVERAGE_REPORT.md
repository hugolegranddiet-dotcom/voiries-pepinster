# COVERAGE_REPORT — Couverture géographique de Pepinster

> Phase 2 — généré automatiquement par `npm run geo:build`. Ne pas modifier à la main.

## 1. Source

| | |
|---|---|
| Données | OpenStreetMap, ODbL 1.0 — © contributeurs OpenStreetMap |
| Date des données OSM | 2026-11-11T19:26:45Z |
| Extraction | 2026-11-11, dossier `data/osm/raw/2026-11-11/` |
| Commune | relation OSM 2436184, code INS 63058 |
| Anciennes communes (admin_level 9) | Cornesse, Pepinster, Soiron, Wegnez |
| Empreinte de `voies.json` | `591d3ece42869232…` |
| Réseau régional | SPW — Réseau routier régional, consulté pour identification uniquement (tracés non conservés) |

## 2. Contrôles

- Ways OSM reçus : **1469** ; dans la commune (en tout ou en partie) : **1469** ; entièrement hors commune (écartés) : **0**.
- Ways coupés à la limite (D6) : **136** ; points d'intersection calculés : **184** (tous vérifiés sur la limite).
- Coordonnées inventées : **0** (contrôle bloquant du script).
- Voiries logiques : **1119** ; groupes de même nom entièrement hors commune : 0.

## 3. Réseau par type OSM (partie dans la commune)

| Type `highway` | Ways | dont nommés | Longueur (km) |
|---|---:|---:|---:|
| track | 321 | 44 | 72,4 |
| path | 192 | 12 | 35,6 |
| residential | 207 | 192 | 29,1 |
| service | 319 | 28 | 22,4 |
| tertiary | 94 | 90 | 21,1 |
| unclassified | 85 | 74 | 17,7 |
| footway | 129 | 12 | 11,5 |
| primary | 35 | 31 | 7,6 |
| secondary | 50 | 50 | 6,1 |
| pedestrian | 4 | 0 | 0,3 |
| steps | 28 | 3 | 0,3 |
| living_street | 4 | 4 | 0,3 |
| cycleway | 1 | 0 | 0 |

## 4. Voiries logiques par catégorie

| Catégorie | Voiries | dont nommées | sans nom | Longueur (km) | Affichage par défaut |
|---|---:|---:|---:|---:|---|
| Voiries (carrossables) | 211 | 173 | 38 | 92,5 | visibles |
| Chemins et sentiers | 617 | 17 | 600 | 112,6 | visibles (D6) |
| Accès et parkings sans nom | 291 | – | 291 | 19,3 | masqués (filtre) |

## 5. Même nom, morceaux non reliés — décision D14

Règle validée par Hugo le 11/11/2026 : « si même endroit, même rue ; sinon homonyme ». Traduction : morceaux de même nom à moins de **300 m** → une seule voirie ; au-delà → homonymes séparés.

| Nom | Morceaux | Écart max. regroupé | Décision appliquée |
|---|---:|---:|---|
| Ayrifagne | 2 | 152 m | même rue (réunie) |
| Belle-Vue | 2 | 100 m | même rue (réunie) |
| Chinheid | 2 | 15 m | même rue (réunie) |
| Fays | 2 | 79 m | même rue (réunie) |
| Forges Thiry | 2 | 53 m | même rue (réunie) |
| Golettes | 2 | 11 m | même rue (réunie) |
| Grand'Ry Wegnez | 3 | 20 m | même rue (réunie) |
| Lefin | 2 | 22 m | même rue (réunie) |
| Les Golets | 2 | 296 m | même rue (réunie) |
| Les Villers | 3 | 111 m | même rue (réunie) |
| Quai de la Hoëgne | 2 | 36 m | même rue (réunie) |
| Route de l'Armée Secrète | 2 | 256 m | même rue (réunie) |
| Route de Soiron | 2 | – | homonymes (séparés) |
| Route de Tancrémont | 2 | 85 m | même rue (réunie) |
| Rue de la Paix | 2 | – | homonymes (séparés) |
| Rue Jean Grandrath | 2 | 91 m | même rue (réunie) |
| Rue Pépin | 2 | 25 m | même rue (réunie) |
| Rue Pierre Hauzeur | 2 | 14 m | même rue (réunie) |
| Ruelle du Cherreau | 2 | 10 m | même rue (réunie) |

Homonymes restant séparés :

| Nom | Partie | Alerte | Distance à l'autre partie | Longueur | Ancienne commune | Remarque |
|---|---|---|---:|---:|---|---|
| Route de Soiron | 1/2 | même nom, non relié | 1738 m | 1143 m | Cornesse |  |
| Route de Soiron | 2/2 | même nom, non relié | 1738 m | 2 m | Soiron | petit morceau en limite de commune |
| Rue de la Paix | 1/2 | même nom, non relié | 2487 m | 854 m | Wegnez |  |
| Rue de la Paix | 2/2 | même nom, non relié | 2487 m | 15 m | Pepinster |  |

## 6. Indice « réseau régional SPW » (à confirmer)

Une voie est marquée quand au moins 80 % de sa longueur est à moins de 15 m du réseau régional. C'est un **indice** : la comparaison avec les 17 voiries « SPW » de l'Excel se fera en phase 3.

| Voirie | Indice | Routes régionales proches | Réf. OSM |
|---|---|---|---|
| Chemin de Tancrémont | oui | N666 | – |
| Chinheid | partiel | N690 | N690 |
| Flère | oui | N61 | N61 |
| Goffontaine | partiel | N61 | N61 |
| Grand'Place-lez-Tancrémont | oui | N666 | – |
| Hauts Sarts | oui | N666 | N666 |
| La Raye | partiel | N61 | – |
| Louheau | oui | N61 | N61 |
| Parc Forges Thiry | oui | N690 | N690 |
| Parc Forges Thiry Chinheid | oui | N690 | N690 |
| Prévôchamps | partiel | N690 | N690 |
| Route de Tancrémont | oui | N666 | N666 |
| Rue Alfred Drèze | oui | N666, N690 | N666, N690 |
| Rue de la Régence | oui | N61, N690 | N690 |
| Rue Hodister | oui | N61 | N61 |
| Rue Hubert Halet | oui | N61 | N61 |
| Rue Lefin | partiel | N61 | – |
| Rue Louis Biérin | oui | N61 | N61 |
| Rue Massau | oui | N61 | N61 |
| Rue Neuve | partiel | N690 | N690 |
| Rue Purgatoire | oui | N61 | N61 |
| Rue Vovegnez | oui | N61 | N61 |

Plus 31 voies sans nom (trottoirs, accès, bretelles…) superposées au réseau régional.

## 7. Voiries coupées à la limite communale

Ancien chemin des Botterresses · Aux Cours - Rue de Stockis · Ayrifagne · Chemin de Tancrémont · Chemin du Couloury · Chemin du Haras · Chemin Tchepson · Chinheid · Drève de Maison-Bois · Forges Thiry · Goffontaine · Grand'Place-lez-Tancrémont · Haut Sart · La Raye · Les Bagneures · Les Golets · Les Villers · Maison-Bois · Mohonthier · Parc Forges Thiry · Parc Forges Thiry Chinheid · Route de l'Armée Secrète · Route de la Croix Maga · Route de Soiron · Route de Tancrémont · Rue Chereau · Rue de l'Esplanade · Rue de Wegnez · Rue des Ormes · Rue du Bief - Aux Cours · Rue Francval · Rue Mathieu-Joseph Fassin · Rue Tribomont · Ruelle du Cherreau · Sohan · Turlurette

Plus 83 voies sans nom coupées à la limite.

## 8. Liste des voiries et chemins nommés, par ancienne commune

À relire avec ton père : manque-t-il une rue ? un nom est-il faux dans OSM ?

### Cornesse (37)

A l'Assise · Bois Herman · Bouhais · Chemin aux Fraises · Chemin de Nôheid · Chemin de Thibaumont · Coulée · Cromhaise · Douys · Drolenval · Fond de Noulé · Fond de Ville · Goffontaine · Grand'Ry Cornesse · Grande Fontaine · Grettouheid · Hodwinry _(chemin)_ · Jonckay · Louheau · Mortbonhomme · Place Notre-Dame · Réfawtay · Rolais · Route de Peléeheid · Route de Soiron [1/2] · Rue Golettes · Rue Grande Fortune · Rue Hubert Halet · Rue Jean Grandrath · Rue Louis Biérin · Rue Massau · Rue Mathieu Closset · Rue Mathieu Regnier · Saute · Sclassin · sentier vicinal no 48 _(chemin)_ · Vieille Eglise

### Pepinster (74)

Avenue Albert Ier · Avenue Albert Lekeu _(chemin)_ · Ayrifagne · Beau Site · Belle-Vue · Chaityfontaine · Chalsèche · Chemin de l'Hermitage · Chemin de Tancrémont · Chemin du Bois Robert _(chemin)_ · Chemin du Haras · Chemin Serge Rouchet _(chemin)_ · Chemin Tchepson _(chemin)_ · Chinheid · Drève de Maison-Bois · El Fagne · Forges Thiry · Grand'Place-lez-Tancrémont · Hauts Sarts · Impasse de Prévôchamps · Impasse Leroy · Lefin · Les Bagneures _(chemin)_ · Les Villers · Maison-Bois · Mazures _(chemin)_ · Mousset · Nids d'Aguesses · Parc Forges Thiry · Parc Forges Thiry Chinheid · Place Charles Fraipont · Prévôchamps · Quai Armand Follet · Quai de la Hoëgne · Quai Ferdinand Nicolaï · Route de l'Armée Secrète · Route de Tancrémont · Rue Alfred Brabant · Rue Alfred Drèze · Rue Bois l'Évêque · Rue Charles Fraipont · Rue d'Avallon · Rue de l'Esplanade · Rue de l'Hospice · Rue de la Libération · Rue de la Paix [2/2] · Rue de la Pompe · Rue des Grands Prés · Rue des Jardins · Rue du Biez · Rue du Bois d'Oltmont · Rue du Fort · Rue du Panorama · Rue du Plateau · Rue du Progrès · Rue Émile Fairon · Rue Félix Defays · Rue François Jacob · Rue Jacques Bouhy · Rue Jean Simon · Rue la Nô · Rue Lieutenant · Rue Lieutenant Albert Dressen · Rue Louis Formatin · Rue Marcel Fikenne · Rue Neuve · Rue Pépin · Rue Pierre Hauzeur · Rue Pierre Piqueray · Rue Raymond Legentil · Rue Sylvain Balau · Sohan · Venelle Léon Le Pas · Voie Constant

### Soiron (26)

Au Chêne · Aux Cours · Aux Cours - Rue de Stockis · Bouhaye · Cour Maréchal · Fays · Gr _(chemin)_ · Grand Trys · Haut Sart _(chemin)_ · Les Golets · Mohonthier · Puits Ronval · Route de Cornesse · Route de la Croix Maga · Route de Nessonvaux · Route de Soiron [2/2] · Rue de Xhendelesse · Rue du Bief - Aux Cours · Rue Henry-François Hensay · Saint Germain · Sentier local _(chemin)_ · Soiron-Centre · Tilleul · Turlurette · Voie du Bola · Voie du Moulin

### Wegnez (45)

Al clusâre · Ancien chemin des Botterresses _(chemin)_ · Chemin du Couloury _(chemin)_ · Chemin du Loup · Chemin du Vivier _(chemin)_ · Chemin no30 _(chemin)_ · Cité Mon Logis · La Raye · Place Saint Hubert · Rue Antoine Franssen · Rue Campagne · Rue Chereau · Rue Courte · Rue de la Paix [1/2] · Rue de Lambermont · Rue de Wegnez · Rue des Anneuses · Rue des Combattants · Rue des Déportés · Rue des Doux Fonds · Rue des Ormes · Rue du Paire · Rue du Thier · Rue Emile Vandervelde · Rue Eugène Pauquay · Rue Francval · Rue Georges Lemaire · Rue Hodister · Rue Jenny Solheid · Rue Joseph Meunier · Rue Joseph Sougnez · Rue Laurent Mairlot · Rue Mathieu-Joseph Fassin · Rue Nouvelle · Rue Purgatoire · Rue Tribomont · Rue Vovegnez · Rue Xhavée · Ruelle du Cherreau · Ruelle du Koreux · Sentier vicinal 31 _(chemin)_ · sentier vicinal 34 _(chemin)_ · Tribomont · Val du Fièrain · Voie Creuhy

### (à cheval / non déterminé) (8)

Flère — Cornesse / Pepinster · Golettes — Cornesse / Wegnez · Grand'Ry Wegnez — Cornesse / Wegnez · Hezée — Cornesse / Soiron · Pont Walrand — Cornesse / Pepinster · Rue de la Régence — Cornesse / Pepinster · Rue Lefin — Pepinster / Wegnez · Sous le Château — Cornesse / Wegnez

## 9. Limites connues

- OSM est une carte collaborative : une rue récente ou un chemin peu fréquenté peut manquer ou être mal nommé. Rien n'est ajouté à la main : les manques seront listés en phase 3 (noms de l'Excel introuvables).
- Les « voies sans nom » sont nombreuses (accès privés, chemins agricoles). Elles sont recensées, mais n'entreront pas dans le tableau principal.
- L'indice SPW est géométrique : un trottoir ou une bretelle longeant une nationale peut être marqué « partiel ».
