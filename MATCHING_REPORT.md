# MATCHING_REPORT — Correspondances Excel ↔ carte

> Phase 3 — généré par `npm run match`. Ne pas modifier à la main.

## 1. Résumé

- Lignes lues dans `Feuil1` : **180** (contrôle : 180 attendues). Légende et lignes vides ignorées.
- Voiries sur la carte : 1119, dont 190 nommées.
- Décisions humaines enregistrées : **180**.

| Statut | Lignes |
|---|---:|
| validées | 152 |
| à valider | 0 |
| sections à tracer | 16 |
| introuvables sur la carte (fiche sans tracé) | 0 |
| rejetées | 12 |
| n'existe plus | 0 |

## 2. Propositions par confiance

| Confiance | Signification | Lignes |
|---|---|---:|
| forte | nom identique (après remise en ordre éventuelle), une seule voirie possible, gestionnaire cohérent | 135 |
| moyenne | nom proche, plusieurs voiries possibles, ou incohérence à vérifier | 17 |
| faible | partie de rue (section) | 16 |
| aucune | aucune voirie trouvée | 12 |

Rien n'est appliqué automatiquement, même en confiance « forte » : chaque ligne attend une décision (validation par lot permise).

## 3. À regarder en priorité : confiance moyenne (17)

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 66 | Grands Trys | Grand Trys (Soiron) |  |  | valide |
| 81 | Koreux Ruelles du | Ruelle du Koreux (Wegnez) |  |  | valide |
| 83 | La Saute | Saute (Cornesse) |  |  | valide |
| 87 | Léon Lepas Venelle | Venelle Léon Le Pas (Pepinster) |  |  | valide |
| 103 | Paire Rue du | Rue du Paire (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 104 | valide |
| 104 | Paire Ruelle du | Rue du Paire (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 103 | valide |
| 105 | Paix Rue de la | Rue de la Paix (Wegnez) | Rue de la Paix | 2 voiries possibles : choisir la bonne | valide |
| 113 | Place Sainte-Hubert | Place Saint Hubert (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 127 | valide |
| 116 | Pont Walrand Rue | Pont Walrand (Cornesse/Pepinster) |  |  | valide |
| 127 | Saint Hubert Rue | Place Saint Hubert (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 113 | valide |
| 130 | Soiron Route de | Route de Soiron (Cornesse) | Route de Soiron | 2 voiries possibles : choisir la bonne | valide |
| 137 | Sous le Château Rue | Sous le Château (Cornesse/Wegnez) |  |  | valide |
| 148 | Voie du Moulin | Voie du Moulin (Soiron) |  | voirie aussi proposée pour la/les ligne(s) 175 | valide |
| 153 | Ayrifagne | Ayrifagne (Pepinster) |  | Excel : SPW, mais la carte ne la situe pas sur le réseau régional | valide |
| 156 | Forges Thiry | Forges Thiry (Pepinster) |  | Excel : SPW, mais la carte ne la situe pas sur le réseau régional | valide |
| 162 | Massau | Rue Massau (Cornesse) |  |  | valide |
| 175 | Chemin du Moulin | Voie du Moulin (Soiron) |  | voirie aussi proposée pour la/les ligne(s) 148 | valide |

## 4. Parties de rue (sections, décision D4) (16)

La voirie « mère » est proposée. Le tracé exact de chaque section (quels segments) sera défini sur la carte lors de la phase d'édition.

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 20 | Bouhaye inférieure | Bouhaye (Soiron) |  |  | section_a_definir |
| 21 | Bouhaye supérieure | Bouhaye (Soiron) |  |  | section_a_definir |
| 42 | Drolenval descente Cornesse | Drolenval (Cornesse) |  |  | section_a_definir |
| 43 | Drolenval plat | Drolenval (Cornesse) |  |  | section_a_definir |
| 58 | Goffontaine 1 | Goffontaine (Cornesse) |  |  | section_a_definir |
| 59 | Goffontaine 2 | Goffontaine (Cornesse) |  |  | section_a_definir |
| 60 | Goffontaine Trasenster | Goffontaine (Cornesse) |  |  | section_a_definir |
| 122 | Quai Ferdinand Nicolaï Hoëgne | Quai Ferdinand Nicolaï (Pepinster) |  |  | section_a_definir |
| 131 | Soiron-Centre cimetière arrière | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 132 | Soiron-Centre cimetière centre | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 133 | Soiron-Centre Place de l'église | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 134 | Soiron-Centre Place du bac | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 135 | Soiron-Centre supérieure | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 136 | Soiron-Centre Taverne | Soiron-Centre (Soiron) |  |  | section_a_definir |
| 141 | Tribomont Bertholet-Verviers Rue | Rue Tribomont (Wegnez) | Tribomont |  | section_a_definir |
| 142 | Tribomont principale Rue | Rue Tribomont (Wegnez) | Tribomont |  | section_a_definir |

## 5. Aucune voirie trouvée sur la carte (12)

Causes possibles : chemin absent ou sans nom dans OpenStreetMap, nom très différent, voirie disparue. Ces lignes auront une fiche **sans tracé** (rien n'est dessiné).

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 11 | Aux Poissons Ruelle | — |  |  | rejete |
| 16 | Bois d'Olne | — |  |  | rejete |
| 28 | Chemin du Fond de Fiérain | — |  |  | rejete |
| 29 | Chemin du Nauzaury | — |  | nom en double dans l'Excel (pas de fusion automatique) | rejete |
| 31 | Clos Badon | — |  |  | rejete |
| 44 | Duc Rue du | — |  | « n'existe plus » selon l'Excel (D7) | rejete |
| 128 | Saussales Ruelle des | — |  |  | rejete |
| 171 | Chemin de la Baleine | — |  |  | rejete |
| 176 | Chemin du Nauzaury | — |  | nom en double dans l'Excel (pas de fusion automatique) | rejete |
| 177 | Fraity | — |  |  | rejete |
| 180 | Marly Ruelle | — |  |  | rejete |
| 183 | Try des Hayes | — |  |  | rejete |

## 6. Confiance forte (validation par lot possible) (135)

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 2 | A l'Assise | A l'Assise (Cornesse) |  |  | valide |
| 3 | Al Clusâre | Al clusâre (Wegnez) |  |  | valide |
| 4 | Albert 1er Avenue | Avenue Albert Ier (Pepinster) |  |  | valide |
| 5 | Alfred Brabant Rue | Rue Alfred Brabant (Pepinster) |  |  | valide |
| 6 | Anneuses Rue des | Rue des Anneuses (Wegnez) |  |  | valide |
| 7 | Antoine Franssen Rue | Rue Antoine Franssen (Wegnez) |  |  | valide |
| 8 | Armée Secrète Route de l' | Route de l'Armée Secrète (Pepinster) |  |  | valide |
| 9 | Au Chêne | Au Chêne (Soiron) |  |  | valide |
| 10 | Aux Cours | Aux Cours (Soiron) |  |  | valide |
| 12 | Avallon Rue d' | Rue d'Avallon (Pepinster) |  |  | valide |
| 13 | Beau Site | Beau Site (Pepinster) |  |  | valide |
| 14 | Belle Vue | Belle-Vue (Pepinster) |  |  | valide |
| 15 | Biez Rue du | Rue du Biez (Pepinster) |  |  | valide |
| 17 | Bois d'Oltmont Rue du | Rue du Bois d'Oltmont (Pepinster) |  |  | valide |
| 18 | Bois Herman | Bois Herman (Cornesse) |  |  | valide |
| 19 | Bouhais | Bouhais (Cornesse) |  |  | valide |
| 22 | Campagne Rue | Rue Campagne (Wegnez) |  |  | valide |
| 23 | Chalsèche | Chalsèche (Pepinster) |  |  | valide |
| 24 | Charles Fraipont Rue | Rue Charles Fraipont (Pepinster) |  |  | valide |
| 25 | Chemin aux Fraises | Chemin aux Fraises (Cornesse) |  |  | valide |
| 26 | Chemin de l'Hermitage | Chemin de l'Hermitage (Pepinster) |  |  | valide |
| 27 | Chemin de Thibaumont | Chemin de Thibaumont (Cornesse) |  |  | valide |
| 30 | Cité Mon Logis | Cité Mon Logis (Wegnez) |  |  | valide |
| 32 | Combattants Rue des | Rue des Combattants (Wegnez) |  |  | valide |
| 33 | Cornesse Route de | Route de Cornesse (Soiron) |  |  | valide |
| 34 | Coulée | Coulée (Cornesse) |  |  | valide |
| 35 | Cour Maréchal | Cour Maréchal (Soiron) |  |  | valide |
| 36 | Courte Rue | Rue Courte (Wegnez) |  |  | valide |
| 37 | Croix Maga Route de la | Route de la Croix Maga (Soiron) |  |  | valide |
| 38 | Cromhaise | Cromhaise (Cornesse) |  |  | valide |
| 39 | Déportés Rue des | Rue des Déportés (Wegnez) |  |  | valide |
| 40 | Doux Fonds Rue des | Rue des Doux Fonds (Wegnez) |  |  | valide |
| 41 | Douys | Douys (Cornesse) |  |  | valide |
| 45 | El Fagne | El Fagne (Pepinster) |  |  | valide |
| 46 | Emile Fairon Rue | Rue Émile Fairon (Pepinster) |  |  | valide |
| 47 | Emile Vandervelde Rue | Rue Emile Vandervelde (Wegnez) |  |  | valide |
| 48 | Eugène Pauquay Rue | Rue Eugène Pauquay (Wegnez) |  |  | valide |
| 49 | Fays | Fays (Soiron) |  |  | valide |
| 50 | Félix Defays Rue | Rue Félix Defays (Pepinster) |  |  | valide |
| 51 | Fiérain Val du | Val du Fièrain (Wegnez) |  |  | valide |
| 52 | Fond de Noulé | Fond de Noulé (Cornesse) |  |  | valide |
| 53 | Fond de Ville | Fond de Ville (Cornesse) |  |  | valide |
| 54 | Fort Rue du | Rue du Fort (Pepinster) |  |  | valide |
| 55 | François Jacob Rue | Rue François Jacob (Pepinster) |  |  | valide |
| 56 | Francval Rue | Rue Francval (Wegnez) |  |  | valide |
| 57 | Georges Lemaire Rue | Rue Georges Lemaire (Wegnez) |  |  | valide |
| 61 | Golettes | Golettes (Cornesse/Wegnez) |  |  | valide |
| 62 | Grande Fontaine | Grande Fontaine (Cornesse) |  |  | valide |
| 63 | Grand'Ry Cornesse | Grand'Ry Cornesse (Cornesse) |  |  | valide |
| 64 | Grand'Ry Wegnez | Grand'Ry Wegnez (Cornesse/Wegnez) |  |  | valide |
| 65 | Grands Près Rue des | Rue des Grands Prés (Pepinster) |  |  | valide |
| 67 | Grettouheid | Grettouheid (Cornesse) |  |  | valide |
| 68 | Henry François Hensay Rue | Rue Henry-François Hensay (Soiron) |  |  | valide |
| 69 | Hezée | Hezée (Cornesse/Soiron) |  |  | valide |
| 70 | Hospice Rue de l' | Rue de l'Hospice (Pepinster) |  |  | valide |
| 71 | Impasse de Prévôchamps | Impasse de Prévôchamps (Pepinster) |  |  | valide |
| 72 | Impasse Leroy | Impasse Leroy (Pepinster) |  |  | valide |
| 73 | Jacques Bouhy Rue | Rue Jacques Bouhy (Pepinster) |  |  | valide |
| 74 | Jardins Rue des | Rue des Jardins (Pepinster) |  |  | valide |
| 75 | Jean Grandrath Rue | Rue Jean Grandrath (Cornesse) |  |  | valide |
| 76 | Jean Simon Rue | Rue Jean Simon (Pepinster) |  |  | valide |
| 77 | Jenny Solheid Rue | Rue Jenny Solheid (Wegnez) |  |  | valide |
| 78 | Jonckay | Jonckay (Cornesse) |  |  | valide |
| 79 | Joseph Meunier Rue | Rue Joseph Meunier (Wegnez) |  |  | valide |
| 80 | Joseph Sougnez Rue | Rue Joseph Sougnez (Wegnez) |  |  | valide |
| 82 | la Nô Rue | Rue la Nô (Pepinster) |  |  | valide |
| 84 | Lambermont Rue de | Rue de Lambermont (Wegnez) |  |  | valide |
| 85 | Laurent Mairlot Rue | Rue Laurent Mairlot (Wegnez) |  |  | valide |
| 86 | Lefin | Lefin (Pepinster) |  |  | valide |
| 88 | Les Bagneures | Les Bagneures (Pepinster) |  |  | valide |
| 89 | Libération Rue de la | Rue de la Libération (Pepinster) |  |  | valide |
| 90 | Lieutenant Albert Dressen Rue | Rue Lieutenant Albert Dressen (Pepinster) |  |  | valide |
| 91 | Lieutenant Rue | Rue Lieutenant (Pepinster) |  |  | valide |
| 92 | Louis Formatin Rue | Rue Louis Formatin (Pepinster) |  |  | valide |
| 93 | Maison-Bois | Maison-Bois (Pepinster) |  |  | valide |
| 94 | Marcel Fikenne Rue | Rue Marcel Fikenne (Pepinster) |  |  | valide |
| 95 | Mathieu Regnier Rue | Rue Mathieu Regnier (Cornesse) |  |  | valide |
| 96 | Mathieu Closset Rue | Rue Mathieu Closset (Cornesse) |  |  | valide |
| 97 | Mohonthier | Mohonthier (Soiron) |  |  | valide |
| 98 | Mortbonhomme | Mortbonhomme (Cornesse) |  |  | valide |
| 99 | Mousset | Mousset (Pepinster) |  |  | valide |
| 100 | Nessonvaux Route de | Route de Nessonvaux (Soiron) |  |  | valide |
| 101 | Nids d'Aguesses | Nids d'Aguesses (Pepinster) |  |  | valide |
| 102 | Nouvelle Rue | Rue Nouvelle (Wegnez) |  |  | valide |
| 106 | Panorama Rue du | Rue du Panorama (Pepinster) |  |  | valide |
| 107 | Peléeheid Route de | Route de Peléeheid (Cornesse) |  |  | valide |
| 108 | Pepin Rue | Rue Pépin (Pepinster) |  |  | valide |
| 109 | Pierre Hauzeur Rue | Rue Pierre Hauzeur (Pepinster) |  |  | valide |
| 110 | Pierre Piqueray Rue | Rue Pierre Piqueray (Pepinster) |  |  | valide |
| 111 | Place Charles Fraipont | Place Charles Fraipont (Pepinster) |  |  | valide |
| 112 | Place Notre-Dame | Place Notre-Dame (Cornesse) |  |  | valide |
| 114 | Plateau Rue du | Rue du Plateau (Pepinster) |  |  | valide |
| 115 | Pompe Rue de la | Rue de la Pompe (Pepinster) |  |  | valide |
| 117 | Progrès Rue du | Rue du Progrès (Pepinster) |  |  | valide |
| 118 | Puits Ronval | Puits Ronval (Soiron) |  |  | valide |
| 119 | Quai Armand Follet | Quai Armand Follet (Pepinster) |  |  | valide |
| 120 | Quai de la Hoëgne | Quai de la Hoëgne (Pepinster) |  |  | valide |
| 121 | Quai Ferdinand Nicolaï | Quai Ferdinand Nicolaï (Pepinster) |  |  | valide |
| 123 | Raymond Legentil Rue | Rue Raymond Legentil (Pepinster) |  |  | valide |
| 124 | Refawtay | Réfawtay (Cornesse) |  |  | valide |
| 125 | Rolais | Rolais (Cornesse) |  |  | valide |
| 126 | Saint Germain | Saint Germain (Soiron) |  |  | valide |
| 129 | Sclassin | Sclassin (Cornesse) |  |  | valide |
| 138 | Sylvain Balau Rue | Rue Sylvain Balau (Pepinster) |  |  | valide |
| 139 | Thier Rue du | Rue du Thier (Wegnez) |  |  | valide |
| 140 | Tilleul | Tilleul (Soiron) |  |  | valide |
| 143 | Turlurette | Turlurette (Soiron) |  |  | valide |
| 144 | Vieille Eglise | Vieille Eglise (Cornesse) |  |  | valide |
| 145 | Voie Constant | Voie Constant (Pepinster) |  |  | valide |
| 146 | Voie Creuhy | Voie Creuhy (Wegnez) |  |  | valide |
| 147 | Voie du Bola | Voie du Bola (Soiron) |  |  | valide |
| 149 | Xhavée Rue | Rue Xhavée (Wegnez) |  |  | valide |
| 150 | Xhendelesse Rue de | Rue de Xhendelesse (Soiron) |  |  | valide |
| 152 | Alfred Drèze Rue | Rue Alfred Drèze (Pepinster) |  |  | valide |
| 154 | Chinheid | Chinheid (Pepinster) |  |  | valide |
| 155 | Flère | Flère (Cornesse/Pepinster) |  |  | valide |
| 157 | Hauts Sarts | Hauts Sarts (Pepinster) |  |  | valide |
| 158 | Hodister Rue | Rue Hodister (Wegnez) |  |  | valide |
| 159 | Hubert Halet Rue | Rue Hubert Halet (Cornesse) |  |  | valide |
| 160 | Louheau | Louheau (Cornesse) |  |  | valide |
| 161 | Louis Biérin Rue | Rue Louis Biérin (Cornesse) |  |  | valide |
| 163 | Neuve Rue | Rue Neuve (Pepinster) |  |  | valide |
| 164 | Prévôchamps | Prévôchamps (Pepinster) |  |  | valide |
| 165 | Purgatoire Rue | Rue Purgatoire (Wegnez) |  |  | valide |
| 166 | Régence Rue de la | Rue de la Régence (Cornesse/Pepinster) |  |  | valide |
| 167 | Route de Tancrémont | Route de Tancrémont (Pepinster) |  |  | valide |
| 168 | Vovegnez Rue | Rue Vovegnez (Wegnez) |  |  | valide |
| 170 | Bois l'Evêque Rue | Rue Bois l'Évêque (Pepinster) |  |  | valide |
| 172 | Chemin de Nôheid | Chemin de Nôheid (Cornesse) |  |  | valide |
| 173 | Chemin du Bois Robert | Chemin du Bois Robert (Pepinster) |  |  | valide |
| 174 | Chemin du Loup | Chemin du Loup (Wegnez) |  |  | valide |
| 178 | Hodwinry | Hodwinry (Cornesse) |  |  | valide |
| 179 | Les Golets | Les Golets (Soiron) |  |  | valide |
| 181 | Mazures | Mazures (Pepinster) |  |  | valide |
| 182 | Sohan | Sohan (Pepinster) |  |  | valide |

## 7. Voiries de la carte sans ligne Excel

20 voiries carrossables nommées n'ont aucune ligne Excel proposée. Elles restent visibles, en gris, avec le statut « à compléter » :

Aux Cours - Rue de Stockis _(Soiron)_ · Chaityfontaine _(Pepinster)_ · Chemin de Tancrémont _(Pepinster)_ · Chemin du Haras _(Pepinster)_ · Drève de Maison-Bois _(Pepinster)_ · Grand'Place-lez-Tancrémont _(Pepinster)_ · La Raye _(Wegnez)_ · Les Villers _(Pepinster)_ · Parc Forges Thiry _(Pepinster)_ · Parc Forges Thiry Chinheid _(Pepinster)_ · Rue Chereau _(Wegnez)_ · Rue de l'Esplanade _(Pepinster)_ · Rue de Wegnez _(Wegnez)_ · Rue des Ormes _(Wegnez)_ · Rue du Bief - Aux Cours _(Soiron)_ · Rue Golettes _(Cornesse)_ · Rue Grande Fortune _(Cornesse)_ · Rue Lefin _(Pepinster/Wegnez)_ · Rue Mathieu-Joseph Fassin _(Wegnez)_ · Ruelle du Cherreau _(Wegnez)_

## 8. Normalisations appliquées (traçabilité)

| Champ — règle | Lignes concernées |
|---|---:|
| ampleur_travaux — faute de frappe « Racalage » | 6 |
| ampleur_travaux — l'astérisque renvoie à la colonne Particularité | 4 |
| ampleur_travaux — table data/mappings/ampleur_travaux.json | 42 |
| densite — table data/mappings/densite.json | 146 |
| echeance_estimee — 2 ans depuis 05/2025 (estimée, D5) | 1 |
| echeance_estimee — 3 ans depuis 05/2025 (estimée, D5) | 4 |
| echeance_estimee — 5 ans depuis 05/2025 (estimée, D5) | 11 |
| echeance_estimee — 8 ans depuis 05/2025 (estimée, D5) | 1 |
| echeance_estimee — après 2030 (estimée, D5) | 3 |
| etat_note_suggeree — légende Excel : 1 = « RAS * » (vert vif) | 92 |
| etat_note_suggeree — légende Excel : 2 = « correct » (vert clair) | 11 |
| etat_note_suggeree — légende Excel : 3 = « valable » (vert foncé) | 14 |
| etat_note_suggeree — légende Excel : 4 = « mauvais » (rouge-orangé) | 3 |
| etat_note_suggeree — légende Excel : 5 = « dégradé » (violet) | 4 |
| etat_note_suggeree — rouge vif hors légende, corrigé en 4 (décision D2) | 13 |
| etiquettes — ampleur combinée | 1 |
| etiquettes — D7 : chantier Infrabel (Lefin) | 1 |
| etiquettes — D7 : chantier Infrabel (Rue Jacques Bouhy) | 1 |
| gestionnaire — « SPW » = gestionnaire, pas un état | 17 |
| gestionnaire — D7 : Rue Marcel Fikenne n'est pas communale | 1 |
| intensite — Lotissement = faible (D3) | 21 |
| intensite — table data/mappings/intensite.json | 138 |
| nom — espaces superflus retirés | 75 |
| nom_propose — ordre « Type + nom » proposé (non appliqué) | 84 |
| statut — D7 : Rue du Duc n'existe plus | 1 |
| type_habitat — table data/mappings/type_habitat.json | 129 |

Le détail ligne par ligne (avant → après) est dans `data/excel/feuil1_normalise.json`, champ `journal`.

## 9. Notes d'état suggérées par la couleur (D1, D2, D11)

| Note suggérée | Lignes |
|---|---:|
| 1 | 92 |
| 2 | 11 |
| 3 | 14 |
| 4 | 16 |
| 5 | 4 |
| aucune | 43 |

Ces notes restent des **suggestions** : elles ne deviennent des notes d'état qu'après validation par le père (écran prévu en phase 6).

