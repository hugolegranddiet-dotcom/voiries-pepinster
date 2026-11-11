# MATCHING_REPORT — Correspondances Excel ↔ carte

> Phase 3 — généré par `npm run match`. Ne pas modifier à la main.

## 1. Résumé

- Lignes lues dans `Feuil1` : **180** (contrôle : 180 attendues). Légende et lignes vides ignorées.
- Voiries sur la carte : 1119, dont 190 nommées.
- Décisions humaines enregistrées : **0**.

| Statut | Lignes |
|---|---:|
| validées | 0 |
| à valider | 179 |
| sections à tracer | 0 |
| introuvables sur la carte (fiche sans tracé) | 0 |
| rejetées | 0 |
| n'existe plus | 1 |

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
| 66 | Grands Trys | Grand Trys (Soiron) |  |  | a_valider |
| 81 | Koreux Ruelles du | Ruelle du Koreux (Wegnez) |  |  | a_valider |
| 83 | La Saute | Saute (Cornesse) |  |  | a_valider |
| 87 | Léon Lepas Venelle | Venelle Léon Le Pas (Pepinster) |  |  | a_valider |
| 103 | Paire Rue du | Rue du Paire (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 104 | a_valider |
| 104 | Paire Ruelle du | Rue du Paire (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 103 | a_valider |
| 105 | Paix Rue de la | Rue de la Paix (Wegnez) | Rue de la Paix | 2 voiries possibles : choisir la bonne | a_valider |
| 113 | Place Sainte-Hubert | Place Saint Hubert (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 127 | a_valider |
| 116 | Pont Walrand Rue | Pont Walrand (Cornesse/Pepinster) |  |  | a_valider |
| 127 | Saint Hubert Rue | Place Saint Hubert (Wegnez) |  | voirie aussi proposée pour la/les ligne(s) 113 | a_valider |
| 130 | Soiron Route de | Route de Soiron (Cornesse) | Route de Soiron | 2 voiries possibles : choisir la bonne | a_valider |
| 137 | Sous le Château Rue | Sous le Château (Cornesse/Wegnez) |  |  | a_valider |
| 148 | Voie du Moulin | Voie du Moulin (Soiron) |  | voirie aussi proposée pour la/les ligne(s) 175 | a_valider |
| 153 | Ayrifagne | Ayrifagne (Pepinster) |  | Excel : SPW, mais la carte ne la situe pas sur le réseau régional | a_valider |
| 156 | Forges Thiry | Forges Thiry (Pepinster) |  | Excel : SPW, mais la carte ne la situe pas sur le réseau régional | a_valider |
| 162 | Massau | Rue Massau (Cornesse) |  |  | a_valider |
| 175 | Chemin du Moulin | Voie du Moulin (Soiron) |  | voirie aussi proposée pour la/les ligne(s) 148 | a_valider |

## 4. Parties de rue (sections, décision D4) (16)

La voirie « mère » est proposée. Le tracé exact de chaque section (quels segments) sera défini sur la carte lors de la phase d'édition.

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 20 | Bouhaye inférieure | Bouhaye (Soiron) |  |  | a_valider |
| 21 | Bouhaye supérieure | Bouhaye (Soiron) |  |  | a_valider |
| 42 | Drolenval descente Cornesse | Drolenval (Cornesse) |  |  | a_valider |
| 43 | Drolenval plat | Drolenval (Cornesse) |  |  | a_valider |
| 58 | Goffontaine 1 | Goffontaine (Cornesse) |  |  | a_valider |
| 59 | Goffontaine 2 | Goffontaine (Cornesse) |  |  | a_valider |
| 60 | Goffontaine Trasenster | Goffontaine (Cornesse) |  |  | a_valider |
| 122 | Quai Ferdinand Nicolaï Hoëgne | Quai Ferdinand Nicolaï (Pepinster) |  |  | a_valider |
| 131 | Soiron-Centre cimetière arrière | Soiron-Centre (Soiron) |  |  | a_valider |
| 132 | Soiron-Centre cimetière centre | Soiron-Centre (Soiron) |  |  | a_valider |
| 133 | Soiron-Centre Place de l'église | Soiron-Centre (Soiron) |  |  | a_valider |
| 134 | Soiron-Centre Place du bac | Soiron-Centre (Soiron) |  |  | a_valider |
| 135 | Soiron-Centre supérieure | Soiron-Centre (Soiron) |  |  | a_valider |
| 136 | Soiron-Centre Taverne | Soiron-Centre (Soiron) |  |  | a_valider |
| 141 | Tribomont Bertholet-Verviers Rue | Rue Tribomont (Wegnez) | Tribomont |  | a_valider |
| 142 | Tribomont principale Rue | Rue Tribomont (Wegnez) | Tribomont |  | a_valider |

## 5. Aucune voirie trouvée sur la carte (12)

Causes possibles : chemin absent ou sans nom dans OpenStreetMap, nom très différent, voirie disparue. Ces lignes auront une fiche **sans tracé** (rien n'est dessiné).

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 11 | Aux Poissons Ruelle | — |  |  | a_valider |
| 16 | Bois d'Olne | — |  |  | a_valider |
| 28 | Chemin du Fond de Fiérain | — |  |  | a_valider |
| 29 | Chemin du Nauzaury | — |  | nom en double dans l'Excel (pas de fusion automatique) | a_valider |
| 31 | Clos Badon | — |  |  | a_valider |
| 44 | Duc Rue du | — |  | « n'existe plus » selon l'Excel (D7) | n_existe_plus |
| 128 | Saussales Ruelle des | — |  |  | a_valider |
| 171 | Chemin de la Baleine | — |  |  | a_valider |
| 176 | Chemin du Nauzaury | — |  | nom en double dans l'Excel (pas de fusion automatique) | a_valider |
| 177 | Fraity | — |  |  | a_valider |
| 180 | Marly Ruelle | — |  |  | a_valider |
| 183 | Try des Hayes | — |  |  | a_valider |

## 6. Confiance forte (validation par lot possible) (135)

| Ligne | Nom Excel | Proposition | Autres | Remarques | Statut |
|---:|---|---|---|---|---|
| 2 | A l'Assise | A l'Assise (Cornesse) |  |  | a_valider |
| 3 | Al Clusâre | Al clusâre (Wegnez) |  |  | a_valider |
| 4 | Albert 1er Avenue | Avenue Albert Ier (Pepinster) |  |  | a_valider |
| 5 | Alfred Brabant Rue | Rue Alfred Brabant (Pepinster) |  |  | a_valider |
| 6 | Anneuses Rue des | Rue des Anneuses (Wegnez) |  |  | a_valider |
| 7 | Antoine Franssen Rue | Rue Antoine Franssen (Wegnez) |  |  | a_valider |
| 8 | Armée Secrète Route de l' | Route de l'Armée Secrète (Pepinster) |  |  | a_valider |
| 9 | Au Chêne | Au Chêne (Soiron) |  |  | a_valider |
| 10 | Aux Cours | Aux Cours (Soiron) |  |  | a_valider |
| 12 | Avallon Rue d' | Rue d'Avallon (Pepinster) |  |  | a_valider |
| 13 | Beau Site | Beau Site (Pepinster) |  |  | a_valider |
| 14 | Belle Vue | Belle-Vue (Pepinster) |  |  | a_valider |
| 15 | Biez Rue du | Rue du Biez (Pepinster) |  |  | a_valider |
| 17 | Bois d'Oltmont Rue du | Rue du Bois d'Oltmont (Pepinster) |  |  | a_valider |
| 18 | Bois Herman | Bois Herman (Cornesse) |  |  | a_valider |
| 19 | Bouhais | Bouhais (Cornesse) |  |  | a_valider |
| 22 | Campagne Rue | Rue Campagne (Wegnez) |  |  | a_valider |
| 23 | Chalsèche | Chalsèche (Pepinster) |  |  | a_valider |
| 24 | Charles Fraipont Rue | Rue Charles Fraipont (Pepinster) |  |  | a_valider |
| 25 | Chemin aux Fraises | Chemin aux Fraises (Cornesse) |  |  | a_valider |
| 26 | Chemin de l'Hermitage | Chemin de l'Hermitage (Pepinster) |  |  | a_valider |
| 27 | Chemin de Thibaumont | Chemin de Thibaumont (Cornesse) |  |  | a_valider |
| 30 | Cité Mon Logis | Cité Mon Logis (Wegnez) |  |  | a_valider |
| 32 | Combattants Rue des | Rue des Combattants (Wegnez) |  |  | a_valider |
| 33 | Cornesse Route de | Route de Cornesse (Soiron) |  |  | a_valider |
| 34 | Coulée | Coulée (Cornesse) |  |  | a_valider |
| 35 | Cour Maréchal | Cour Maréchal (Soiron) |  |  | a_valider |
| 36 | Courte Rue | Rue Courte (Wegnez) |  |  | a_valider |
| 37 | Croix Maga Route de la | Route de la Croix Maga (Soiron) |  |  | a_valider |
| 38 | Cromhaise | Cromhaise (Cornesse) |  |  | a_valider |
| 39 | Déportés Rue des | Rue des Déportés (Wegnez) |  |  | a_valider |
| 40 | Doux Fonds Rue des | Rue des Doux Fonds (Wegnez) |  |  | a_valider |
| 41 | Douys | Douys (Cornesse) |  |  | a_valider |
| 45 | El Fagne | El Fagne (Pepinster) |  |  | a_valider |
| 46 | Emile Fairon Rue | Rue Émile Fairon (Pepinster) |  |  | a_valider |
| 47 | Emile Vandervelde Rue | Rue Emile Vandervelde (Wegnez) |  |  | a_valider |
| 48 | Eugène Pauquay Rue | Rue Eugène Pauquay (Wegnez) |  |  | a_valider |
| 49 | Fays | Fays (Soiron) |  |  | a_valider |
| 50 | Félix Defays Rue | Rue Félix Defays (Pepinster) |  |  | a_valider |
| 51 | Fiérain Val du | Val du Fièrain (Wegnez) |  |  | a_valider |
| 52 | Fond de Noulé | Fond de Noulé (Cornesse) |  |  | a_valider |
| 53 | Fond de Ville | Fond de Ville (Cornesse) |  |  | a_valider |
| 54 | Fort Rue du | Rue du Fort (Pepinster) |  |  | a_valider |
| 55 | François Jacob Rue | Rue François Jacob (Pepinster) |  |  | a_valider |
| 56 | Francval Rue | Rue Francval (Wegnez) |  |  | a_valider |
| 57 | Georges Lemaire Rue | Rue Georges Lemaire (Wegnez) |  |  | a_valider |
| 61 | Golettes | Golettes (Cornesse/Wegnez) |  |  | a_valider |
| 62 | Grande Fontaine | Grande Fontaine (Cornesse) |  |  | a_valider |
| 63 | Grand'Ry Cornesse | Grand'Ry Cornesse (Cornesse) |  |  | a_valider |
| 64 | Grand'Ry Wegnez | Grand'Ry Wegnez (Cornesse/Wegnez) |  |  | a_valider |
| 65 | Grands Près Rue des | Rue des Grands Prés (Pepinster) |  |  | a_valider |
| 67 | Grettouheid | Grettouheid (Cornesse) |  |  | a_valider |
| 68 | Henry François Hensay Rue | Rue Henry-François Hensay (Soiron) |  |  | a_valider |
| 69 | Hezée | Hezée (Cornesse/Soiron) |  |  | a_valider |
| 70 | Hospice Rue de l' | Rue de l'Hospice (Pepinster) |  |  | a_valider |
| 71 | Impasse de Prévôchamps | Impasse de Prévôchamps (Pepinster) |  |  | a_valider |
| 72 | Impasse Leroy | Impasse Leroy (Pepinster) |  |  | a_valider |
| 73 | Jacques Bouhy Rue | Rue Jacques Bouhy (Pepinster) |  |  | a_valider |
| 74 | Jardins Rue des | Rue des Jardins (Pepinster) |  |  | a_valider |
| 75 | Jean Grandrath Rue | Rue Jean Grandrath (Cornesse) |  |  | a_valider |
| 76 | Jean Simon Rue | Rue Jean Simon (Pepinster) |  |  | a_valider |
| 77 | Jenny Solheid Rue | Rue Jenny Solheid (Wegnez) |  |  | a_valider |
| 78 | Jonckay | Jonckay (Cornesse) |  |  | a_valider |
| 79 | Joseph Meunier Rue | Rue Joseph Meunier (Wegnez) |  |  | a_valider |
| 80 | Joseph Sougnez Rue | Rue Joseph Sougnez (Wegnez) |  |  | a_valider |
| 82 | la Nô Rue | Rue la Nô (Pepinster) |  |  | a_valider |
| 84 | Lambermont Rue de | Rue de Lambermont (Wegnez) |  |  | a_valider |
| 85 | Laurent Mairlot Rue | Rue Laurent Mairlot (Wegnez) |  |  | a_valider |
| 86 | Lefin | Lefin (Pepinster) |  |  | a_valider |
| 88 | Les Bagneures | Les Bagneures (Pepinster) |  |  | a_valider |
| 89 | Libération Rue de la | Rue de la Libération (Pepinster) |  |  | a_valider |
| 90 | Lieutenant Albert Dressen Rue | Rue Lieutenant Albert Dressen (Pepinster) |  |  | a_valider |
| 91 | Lieutenant Rue | Rue Lieutenant (Pepinster) |  |  | a_valider |
| 92 | Louis Formatin Rue | Rue Louis Formatin (Pepinster) |  |  | a_valider |
| 93 | Maison-Bois | Maison-Bois (Pepinster) |  |  | a_valider |
| 94 | Marcel Fikenne Rue | Rue Marcel Fikenne (Pepinster) |  |  | a_valider |
| 95 | Mathieu Regnier Rue | Rue Mathieu Regnier (Cornesse) |  |  | a_valider |
| 96 | Mathieu Closset Rue | Rue Mathieu Closset (Cornesse) |  |  | a_valider |
| 97 | Mohonthier | Mohonthier (Soiron) |  |  | a_valider |
| 98 | Mortbonhomme | Mortbonhomme (Cornesse) |  |  | a_valider |
| 99 | Mousset | Mousset (Pepinster) |  |  | a_valider |
| 100 | Nessonvaux Route de | Route de Nessonvaux (Soiron) |  |  | a_valider |
| 101 | Nids d'Aguesses | Nids d'Aguesses (Pepinster) |  |  | a_valider |
| 102 | Nouvelle Rue | Rue Nouvelle (Wegnez) |  |  | a_valider |
| 106 | Panorama Rue du | Rue du Panorama (Pepinster) |  |  | a_valider |
| 107 | Peléeheid Route de | Route de Peléeheid (Cornesse) |  |  | a_valider |
| 108 | Pepin Rue | Rue Pépin (Pepinster) |  |  | a_valider |
| 109 | Pierre Hauzeur Rue | Rue Pierre Hauzeur (Pepinster) |  |  | a_valider |
| 110 | Pierre Piqueray Rue | Rue Pierre Piqueray (Pepinster) |  |  | a_valider |
| 111 | Place Charles Fraipont | Place Charles Fraipont (Pepinster) |  |  | a_valider |
| 112 | Place Notre-Dame | Place Notre-Dame (Cornesse) |  |  | a_valider |
| 114 | Plateau Rue du | Rue du Plateau (Pepinster) |  |  | a_valider |
| 115 | Pompe Rue de la | Rue de la Pompe (Pepinster) |  |  | a_valider |
| 117 | Progrès Rue du | Rue du Progrès (Pepinster) |  |  | a_valider |
| 118 | Puits Ronval | Puits Ronval (Soiron) |  |  | a_valider |
| 119 | Quai Armand Follet | Quai Armand Follet (Pepinster) |  |  | a_valider |
| 120 | Quai de la Hoëgne | Quai de la Hoëgne (Pepinster) |  |  | a_valider |
| 121 | Quai Ferdinand Nicolaï | Quai Ferdinand Nicolaï (Pepinster) |  |  | a_valider |
| 123 | Raymond Legentil Rue | Rue Raymond Legentil (Pepinster) |  |  | a_valider |
| 124 | Refawtay | Réfawtay (Cornesse) |  |  | a_valider |
| 125 | Rolais | Rolais (Cornesse) |  |  | a_valider |
| 126 | Saint Germain | Saint Germain (Soiron) |  |  | a_valider |
| 129 | Sclassin | Sclassin (Cornesse) |  |  | a_valider |
| 138 | Sylvain Balau Rue | Rue Sylvain Balau (Pepinster) |  |  | a_valider |
| 139 | Thier Rue du | Rue du Thier (Wegnez) |  |  | a_valider |
| 140 | Tilleul | Tilleul (Soiron) |  |  | a_valider |
| 143 | Turlurette | Turlurette (Soiron) |  |  | a_valider |
| 144 | Vieille Eglise | Vieille Eglise (Cornesse) |  |  | a_valider |
| 145 | Voie Constant | Voie Constant (Pepinster) |  |  | a_valider |
| 146 | Voie Creuhy | Voie Creuhy (Wegnez) |  |  | a_valider |
| 147 | Voie du Bola | Voie du Bola (Soiron) |  |  | a_valider |
| 149 | Xhavée Rue | Rue Xhavée (Wegnez) |  |  | a_valider |
| 150 | Xhendelesse Rue de | Rue de Xhendelesse (Soiron) |  |  | a_valider |
| 152 | Alfred Drèze Rue | Rue Alfred Drèze (Pepinster) |  |  | a_valider |
| 154 | Chinheid | Chinheid (Pepinster) |  |  | a_valider |
| 155 | Flère | Flère (Cornesse/Pepinster) |  |  | a_valider |
| 157 | Hauts Sarts | Hauts Sarts (Pepinster) |  |  | a_valider |
| 158 | Hodister Rue | Rue Hodister (Wegnez) |  |  | a_valider |
| 159 | Hubert Halet Rue | Rue Hubert Halet (Cornesse) |  |  | a_valider |
| 160 | Louheau | Louheau (Cornesse) |  |  | a_valider |
| 161 | Louis Biérin Rue | Rue Louis Biérin (Cornesse) |  |  | a_valider |
| 163 | Neuve Rue | Rue Neuve (Pepinster) |  |  | a_valider |
| 164 | Prévôchamps | Prévôchamps (Pepinster) |  |  | a_valider |
| 165 | Purgatoire Rue | Rue Purgatoire (Wegnez) |  |  | a_valider |
| 166 | Régence Rue de la | Rue de la Régence (Cornesse/Pepinster) |  |  | a_valider |
| 167 | Route de Tancrémont | Route de Tancrémont (Pepinster) |  |  | a_valider |
| 168 | Vovegnez Rue | Rue Vovegnez (Wegnez) |  |  | a_valider |
| 170 | Bois l'Evêque Rue | Rue Bois l'Évêque (Pepinster) |  |  | a_valider |
| 172 | Chemin de Nôheid | Chemin de Nôheid (Cornesse) |  |  | a_valider |
| 173 | Chemin du Bois Robert | Chemin du Bois Robert (Pepinster) |  |  | a_valider |
| 174 | Chemin du Loup | Chemin du Loup (Wegnez) |  |  | a_valider |
| 178 | Hodwinry | Hodwinry (Cornesse) |  |  | a_valider |
| 179 | Les Golets | Les Golets (Soiron) |  |  | a_valider |
| 181 | Mazures | Mazures (Pepinster) |  |  | a_valider |
| 182 | Sohan | Sohan (Pepinster) |  |  | a_valider |

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

