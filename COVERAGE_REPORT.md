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
- Voiries logiques : **1138** ; groupes de même nom entièrement hors commune : 0.

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
| Voiries (carrossables) | 223 | 185 | 38 | 89,7 | visibles |
| Chemins et sentiers | 624 | 24 | 600 | 115,4 | visibles (D6) |
| Accès et parkings sans nom | 291 | – | 291 | 19,3 | masqués (filtre) |

## 5. Même nom, groupes non reliés — à vérifier manuellement

Ces voiries portent le même nom dans OSM mais leurs morceaux ne se touchent pas. Elles sont gardées **séparées** (aucune fusion automatique).

- **trou possible** : moins de 50 m entre les morceaux, probablement une même rue avec un morceau manquant dans OSM ;
- **même nom, non relié** : morceaux éloignés, homonymes possibles ou rue en plusieurs branches.

| Nom | Partie | Alerte | Distance à l'autre partie | Longueur | Ancienne commune | Remarque |
|---|---|---|---:|---:|---|---|
| Ayrifagne | 1/2 | même nom, non relié | 152 m | 5 m | Pepinster | petit morceau en limite de commune |
| Ayrifagne | 2/2 | même nom, non relié | 152 m | 56 m | Pepinster |  |
| Belle-Vue | 1/2 | même nom, non relié | 100 m | 1215 m | Pepinster |  |
| Belle-Vue | 2/2 | même nom, non relié | 100 m | 872 m | Pepinster |  |
| Chinheid | 1/2 | trou possible | 15 m | 853 m | Pepinster |  |
| Chinheid | 2/2 | trou possible | 15 m | 54 m | Pepinster |  |
| Fays | 1/2 | même nom, non relié | 79 m | 268 m | Soiron |  |
| Fays | 2/2 | même nom, non relié | 79 m | 413 m | Soiron |  |
| Forges Thiry | 1/2 | même nom, non relié | 53 m | 170 m | Pepinster |  |
| Forges Thiry | 2/2 | même nom, non relié | 53 m | 497 m | Pepinster |  |
| Golettes | 1/2 | trou possible | 11 m | 99 m | Wegnez |  |
| Golettes | 2/2 | trou possible | 11 m | 394 m | Cornesse, Wegnez |  |
| Grand'Ry Wegnez | 1/3 | trou possible | 9 m | 73 m | Cornesse |  |
| Grand'Ry Wegnez | 2/3 | trou possible | 11 m | 815 m | Wegnez |  |
| Grand'Ry Wegnez | 3/3 | trou possible | 9 m | 65 m | Wegnez |  |
| Lefin | 1/2 | trou possible | 22 m | 858 m | Pepinster |  |
| Lefin | 2/2 | trou possible | 22 m | 209 m | Pepinster |  |
| Les Golets | 1/2 | même nom, non relié | 296 m | 446 m | Soiron |  |
| Les Golets | 2/2 | même nom, non relié | 296 m | 11 m | Soiron |  |
| Les Villers | 1/3 | trou possible | 23 m | 21 m | Pepinster |  |
| Les Villers | 2/3 | trou possible | 23 m | 43 m | Pepinster |  |
| Les Villers | 3/3 | trou possible | 26 m | 3 m | Pepinster | petit morceau en limite de commune |
| Quai de la Hoëgne | 1/2 | trou possible | 36 m | 198 m | Pepinster |  |
| Quai de la Hoëgne | 2/2 | trou possible | 36 m | 9 m | Pepinster |  |
| Route de l'Armée Secrète | 1/2 | même nom, non relié | 256 m | 460 m | Pepinster |  |
| Route de l'Armée Secrète | 2/2 | même nom, non relié | 256 m | 671 m | Pepinster |  |
| Route de Soiron | 1/2 | même nom, non relié | 1738 m | 1143 m | Cornesse |  |
| Route de Soiron | 2/2 | même nom, non relié | 1738 m | 2 m | Soiron | petit morceau en limite de commune |
| Route de Tancrémont | 1/2 | même nom, non relié | 85 m | 2517 m | Pepinster |  |
| Route de Tancrémont | 2/2 | même nom, non relié | 85 m | 435 m | Pepinster |  |
| Rue de la Paix | 1/2 | même nom, non relié | 2487 m | 854 m | Wegnez |  |
| Rue de la Paix | 2/2 | même nom, non relié | 2487 m | 15 m | Pepinster |  |
| Rue Jean Grandrath | 1/2 | même nom, non relié | 91 m | 323 m | Cornesse |  |
| Rue Jean Grandrath | 2/2 | même nom, non relié | 91 m | 40 m | Cornesse |  |
| Rue Pépin | 1/2 | trou possible | 25 m | 87 m | Pepinster |  |
| Rue Pépin | 2/2 | trou possible | 25 m | 91 m | Pepinster |  |
| Rue Pierre Hauzeur | 1/2 | trou possible | 14 m | 242 m | Pepinster |  |
| Rue Pierre Hauzeur | 2/2 | trou possible | 14 m | 107 m | Pepinster |  |
| Ruelle du Cherreau | 1/2 | trou possible | 10 m | 190 m | Wegnez |  |
| Ruelle du Cherreau | 2/2 | trou possible | 10 m | 475 m | Wegnez |  |

## 6. Indice « réseau régional SPW » (à confirmer)

Une voie est marquée quand au moins 80 % de sa longueur est à moins de 15 m du réseau régional. C'est un **indice** : la comparaison avec les 17 voiries « SPW » de l'Excel se fera en phase 3.

| Voirie | Indice | Routes régionales proches | Réf. OSM |
|---|---|---|---|
| Ayrifagne [1/2] | oui | N666 | – |
| Chemin de Tancrémont | oui | N666 | – |
| Chinheid [1/2] | oui | N690 | N690 |
| Flère | oui | N61 | N61 |
| Goffontaine | partiel | N61 | N61 |
| Grand'Place-lez-Tancrémont | oui | N666 | – |
| Hauts Sarts | oui | N666 | N666 |
| La Raye | partiel | N61 | – |
| Louheau | oui | N61 | N61 |
| Parc Forges Thiry | oui | N690 | N690 |
| Parc Forges Thiry Chinheid | oui | N690 | N690 |
| Prévôchamps | partiel | N690 | N690 |
| Route de Tancrémont [1/2] | oui | N666 | N666 |
| Route de Tancrémont [2/2] | oui | N666 | N666 |
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

Ancien chemin des Botterresses · Aux Cours - Rue de Stockis · Ayrifagne · Chemin de Tancrémont · Chemin du Couloury · Chemin du Haras · Chemin Tchepson · Chinheid · Drève de Maison-Bois · Forges Thiry · Forges Thiry · Goffontaine · Grand'Place-lez-Tancrémont · Haut Sart · La Raye · Les Bagneures · Les Golets · Les Villers · Les Villers · Les Villers · Maison-Bois · Mohonthier · Parc Forges Thiry · Parc Forges Thiry Chinheid · Route de l'Armée Secrète · Route de la Croix Maga · Route de Soiron · Route de Tancrémont · Route de Tancrémont · Rue Chereau · Rue de l'Esplanade · Rue de Wegnez · Rue des Ormes · Rue du Bief - Aux Cours · Rue Francval · Rue Mathieu-Joseph Fassin · Rue Tribomont · Ruelle du Cherreau · Ruelle du Cherreau · Sohan · Turlurette

Plus 83 voies sans nom coupées à la limite.

## 8. Liste des voiries et chemins nommés, par ancienne commune

À relire avec ton père : manque-t-il une rue ? un nom est-il faux dans OSM ?

### Cornesse (39)

A l'Assise · Bois Herman · Bouhais · Chemin aux Fraises · Chemin de Nôheid · Chemin de Thibaumont · Coulée · Cromhaise · Douys · Drolenval · Fond de Noulé · Fond de Ville · Goffontaine · Grand'Ry Cornesse · Grand'Ry Wegnez [1/3] · Grande Fontaine · Grettouheid · Hodwinry _(chemin)_ · Jonckay · Louheau · Mortbonhomme · Place Notre-Dame · Réfawtay · Rolais · Route de Peléeheid · Route de Soiron [1/2] · Rue Golettes · Rue Grande Fortune · Rue Hubert Halet · Rue Jean Grandrath [1/2] · Rue Jean Grandrath [2/2] · Rue Louis Biérin · Rue Massau · Rue Mathieu Closset · Rue Mathieu Regnier · Saute · Sclassin · sentier vicinal no 48 _(chemin)_ · Vieille Eglise

### Pepinster (86)

Avenue Albert Ier · Avenue Albert Lekeu _(chemin)_ · Ayrifagne [1/2] _(chemin)_ · Ayrifagne [2/2] · Beau Site · Belle-Vue [1/2] · Belle-Vue [2/2] _(chemin)_ · Chaityfontaine · Chalsèche · Chemin de l'Hermitage · Chemin de Tancrémont · Chemin du Bois Robert _(chemin)_ · Chemin du Haras · Chemin Serge Rouchet _(chemin)_ · Chemin Tchepson _(chemin)_ · Chinheid [1/2] · Chinheid [2/2] · Drève de Maison-Bois · El Fagne · Forges Thiry [1/2] · Forges Thiry [2/2] _(chemin)_ · Grand'Place-lez-Tancrémont · Hauts Sarts · Impasse de Prévôchamps · Impasse Leroy · Lefin [1/2] · Lefin [2/2] · Les Bagneures _(chemin)_ · Les Villers [1/3] · Les Villers [2/3] _(chemin)_ · Les Villers [3/3] · Maison-Bois · Mazures _(chemin)_ · Mousset · Nids d'Aguesses · Parc Forges Thiry · Parc Forges Thiry Chinheid · Place Charles Fraipont · Prévôchamps · Quai Armand Follet · Quai de la Hoëgne [1/2] · Quai de la Hoëgne [2/2] · Quai Ferdinand Nicolaï · Route de l'Armée Secrète [1/2] _(chemin)_ · Route de l'Armée Secrète [2/2] · Route de Tancrémont [1/2] · Route de Tancrémont [2/2] · Rue Alfred Brabant · Rue Alfred Drèze · Rue Bois l'Évêque · Rue Charles Fraipont · Rue d'Avallon · Rue de l'Esplanade · Rue de l'Hospice · Rue de la Libération · Rue de la Paix [2/2] · Rue de la Pompe · Rue des Grands Prés · Rue des Jardins · Rue du Biez · Rue du Bois d'Oltmont · Rue du Fort · Rue du Panorama · Rue du Plateau · Rue du Progrès · Rue Émile Fairon · Rue Félix Defays · Rue François Jacob · Rue Jacques Bouhy · Rue Jean Simon · Rue la Nô · Rue Lieutenant · Rue Lieutenant Albert Dressen · Rue Louis Formatin · Rue Marcel Fikenne · Rue Neuve · Rue Pépin [1/2] · Rue Pépin [2/2] · Rue Pierre Hauzeur [1/2] · Rue Pierre Hauzeur [2/2] · Rue Pierre Piqueray · Rue Raymond Legentil · Rue Sylvain Balau · Sohan · Venelle Léon Le Pas · Voie Constant

### Soiron (28)

Au Chêne · Aux Cours · Aux Cours - Rue de Stockis · Bouhaye · Cour Maréchal · Fays [1/2] · Fays [2/2] · Gr _(chemin)_ · Grand Trys · Haut Sart _(chemin)_ · Les Golets [1/2] _(chemin)_ · Les Golets [2/2] · Mohonthier · Puits Ronval · Route de Cornesse · Route de la Croix Maga · Route de Nessonvaux · Route de Soiron [2/2] · Rue de Xhendelesse · Rue du Bief - Aux Cours · Rue Henry-François Hensay · Saint Germain · Sentier local _(chemin)_ · Soiron-Centre · Tilleul · Turlurette · Voie du Bola · Voie du Moulin

### Wegnez (49)

Al clusâre · Ancien chemin des Botterresses _(chemin)_ · Chemin du Couloury _(chemin)_ · Chemin du Loup · Chemin du Vivier _(chemin)_ · Chemin no30 _(chemin)_ · Cité Mon Logis · Golettes [1/2] · Grand'Ry Wegnez [2/3] · Grand'Ry Wegnez [3/3] · La Raye · Place Saint Hubert · Rue Antoine Franssen · Rue Campagne · Rue Chereau · Rue Courte · Rue de la Paix [1/2] · Rue de Lambermont · Rue de Wegnez · Rue des Anneuses · Rue des Combattants · Rue des Déportés · Rue des Doux Fonds · Rue des Ormes · Rue du Paire · Rue du Thier · Rue Emile Vandervelde · Rue Eugène Pauquay · Rue Francval · Rue Georges Lemaire · Rue Hodister · Rue Jenny Solheid · Rue Joseph Meunier · Rue Joseph Sougnez · Rue Laurent Mairlot · Rue Mathieu-Joseph Fassin · Rue Nouvelle · Rue Purgatoire · Rue Tribomont · Rue Vovegnez · Rue Xhavée · Ruelle du Cherreau [1/2] · Ruelle du Cherreau [2/2] _(chemin)_ · Ruelle du Koreux · Sentier vicinal 31 _(chemin)_ · sentier vicinal 34 _(chemin)_ · Tribomont · Val du Fièrain · Voie Creuhy

### (à cheval / non déterminé) (7)

Flère — Cornesse / Pepinster · Golettes [2/2] — Cornesse / Wegnez · Hezée — Cornesse / Soiron · Pont Walrand — Cornesse / Pepinster · Rue de la Régence — Cornesse / Pepinster · Rue Lefin — Pepinster / Wegnez · Sous le Château — Cornesse / Wegnez

## 9. Limites connues

- OSM est une carte collaborative : une rue récente ou un chemin peu fréquenté peut manquer ou être mal nommé. Rien n'est ajouté à la main : les manques seront listés en phase 3 (noms de l'Excel introuvables).
- Les « voies sans nom » sont nombreuses (accès privés, chemins agricoles). Elles sont recensées, mais n'entreront pas dans le tableau principal.
- L'indice SPW est géométrique : un trottoir ou une bretelle longeant une nationale peut être marqué « partiel ».
