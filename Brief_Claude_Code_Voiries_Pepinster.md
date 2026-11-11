# Projet « Voiries Pepinster » — cahier des charges et instructions Claude Code

**Document de référence à placer à la racine du projet avec le fichier `etat_voiries_pepinster.xlsx`.**

## 1. Vision du produit

Application web privée en français, accessible sur ordinateur et smartphone, permettant au père du commanditaire de consulter **toutes les voiries cartographiables de la commune de Pepinster (Belgique)**, y compris celles absentes de l'Excel ; de rechercher une route ; de cliquer sur son tracé cartographique ; d'ouvrir une fiche ; de modifier ses critères ; et de visualiser sa priorité par une couleur unique appliquée à toute la voirie. Le tableau et la carte partagent une seule base de données.

Utilisateur final : un seul administrateur autorisé. Le but est d'utiliser l'application directement après une importation unique de l'Excel, sans synchronisation continue avec ce fichier.

## 2. Source Excel — audit initial vérifié

Nom original : `Etat des lieux 2026 triés.xlsx`. Feuille à importer : `Feuil1`, plage `A1:I191`. Ligne 1 : en-têtes.

Colonnes :
- A — `Voirie`
- B — `Etat`
- C — `Type d'habitat`
- D — `Type de voire` (faute dans l'en-tête source, à mapper vers `type_voirie`)
- E — `Ampleur des travaux`
- F — `Densité d'habitation`
- G — `Année prévue`
- H — `Sécurisation/Mobilité`
- I — `Particularité`

La feuille contient **180 lignes de voiries, 179 noms distincts**. `Chemin du Nauzaury` figure deux fois : ne pas fusionner automatiquement sans examiner le contenu et la correspondance géographique. Les cellules des lignes **185 à 189** définissent une légende, pas des voiries ; la ligne **191** indique « ETATS de 1 à 5, 5 étant le pire » ; ignorer les lignes de légende lors de l'import. Les chiffres 1–5 dans ces lignes ne sont pas des évaluations individuelles.

Dans les **180 lignes de voiries**, la colonne `Etat` contient **84 « RAS »**, **17 « SPW »** et **79 cellules vides**. Il n'existe pas de vraie note d'état numérique 1–5 renseignée pour les routes.

Sens : `RAS` = rien à signaler ; ce n'est **pas automatiquement** la note 1. `SPW` = relevant du Service public de Wallonie ; **gestionnaire**, pas état de la chaussée. Les autres colonnes contiennent des variantes orthographiques (ex. `campapagne`, `Racalage/pose complet` vs `Raclage/pose complet`) et des échéances hétérogènes (`2026`, `5 ans`, `urgent`, `2025-2026`, etc.). Préserver la valeur brute et tracer les normalisations.

Ne jamais remplir une donnée manquante par une invention ni interpréter un délai relatif comme une année fixe sans validation.

## 3. Carte et géographie

- Afficher la limite administrative exacte de la commune de Pepinster.
- Extraire les géométries du réseau de rues et routes pertinent dans cette limite. Source initiale suggérée : OpenStreetMap / données OSM sous licence ODbL, importées une seule fois et conservées en GeoJSON. Vérifier les droits, la source et sa date. Étudier les données du Géoportail wallon pour identifier les routes régionales/SPW et d'éventuelles lacunes.
- **Ne jamais simuler des tracés** ni inventer des noms de rues. Prévoir un audit de couverture et une validation manuelle de tout ce qui n'est pas référencé dans OSM.
- Distinguer la **voirie logique** (`road_id`, nom canonique, une fiche, une couleur) de ses **segments géographiques OSM** (`segment_id`, `osm_way_id`, géométrie). Regrouper tous les segments d'une même route logique, avec vérification manuelle des homonymes, traversées de limite et voies disjointes.
- Une rue = une seule note et couleur, même si composée de plusieurs `LineString` ; stocker la géométrie agrégée en `MultiLineString` ou une liste de segments liés à `road_id`.
- Cliquer sur n'importe quel segment ouvre la même fiche ; sélection = route entière surlignée.
- Routes absentes du fichier Excel : créées en base avec statut `à compléter`, sans critères inventés ; elles sont visibles en gris tant qu'aucun score valide n'existe.
- Les voies non nommées et chemins doivent être recensés avec une catégorie explicite, mais ne pas encombrer le tableau principal des routes circulables. Prévoir un filtre `types de voies` / `sans nom`.
- Ne pas solliciter Overpass à chaque ouverture de page : faire une extraction contrôlée une fois, enregistrer les géométries et une date de source. Prévoir la possibilité de refaire ultérieurement une synchronisation géographique **distincte des notes métier** et sans écraser les évaluations.
- Basemap OpenStreetMap ou fournisseur compatible avec attribution visible et respect des conditions d'usage ; aucun téléchargement massif de tuiles.

## 4. Fonctionnalités

### Carte
- Fond de carte, limites administratives, zoom, recherche, légende, couleurs et filtres.
- Tracé cliquable et surlignage de la voirie complète.
- Panneau latéral de consultation et de modification ; sauvegarde confirmée, annulation, messages d'erreur.
- Filtre « Toutes / Commune / SPW / Autre / Gestionnaire inconnu ».

### Tableau
- Liste unifiée de toutes les voiries avec nom, gestionnaire, état, type, densité, travaux, échéance, score, données manquantes.
- Recherche insensible aux accents/casse, tri, filtres combinables, pagination si nécessaire.
- Cliquer sur une ligne sélectionne et centre la carte ; cliquer sur la carte sélectionne la ligne correspondante.
- Priorités accessibles par liste décroissante ; export CSV de sauvegarde en phase ultérieure.

### Fiche et données
- `nom`, `gestionnaire`, `etat_note` (entier nullable 1–5), `mention_etat_source` (`RAS`, `SPW`, vide, autre), `type_habitat`, `type_voirie`, `intensite_circulation` (si connue), `densite_habitation`, `ampleur_travaux`, `echeance_brute`, `annee_prevue` (si explicite), `mobilite_note`, `risque_securite` (évaluation explicite, nullable), `particularites`, `statut_validation`, `source_excel_ligne`, `updated_at`.
- Le champ `risque_securite` ne peut pas être automatiquement déduit d'une observation libre.
- Historique de modification (avant/après, date, auteur).

## 5. Calcul transparent de priorité (proposition à faire valider au père)

Objectif : score 0–100, **100 = priorité de travaux la plus élevée**.

Pondération de départ :
- État de la chaussée : **55 %** ; note 1→0, 2→25, 3→50, 4→75, 5→100.
- Intensité / importance de circulation : **20 %** ; créer des équivalences explicites et configurables pour `Passage faible`, `Passage moyen`, `Passage élevé`, `Transit`. `Lotissement` n'est pas automatiquement une intensité de trafic : la laisser inconnue ou la valider.
- Densité d'habitation : **15 %** ; échelle documentée et paramétrable, sans deviner les cas non reconnus.
- Risque de sécurité/mobilité : **10 %** ; champ structuré à renseigner manuellement ; ne pas inférer d'un texte libre.

**Règles de fiabilité :**
- Pas de score si `etat_note` manque, même si `mention_etat_source = RAS`.
- Score calculé seulement si au moins un autre critère structuré est renseigné et si les pondérations connues représentent >= 70 % du total. Sinon `Non évalué`.
- Sur les critères connus : `score = somme(poids_i × valeur_i) / somme(poids_i connus)` ; calculer simultanément le taux de couverture = somme des poids connus / poids total.
- Afficher le score, sa couverture, les critères utilisés et un caractère **provisoire** tant qu'il manque des données.
- Couleurs initiales : 0–24 vert ; 25–49 jaune ; 50–74 orange ; 75–100 rouge ; score absent gris. Les seuils et poids modifiables dans les paramètres.
- Le statut `SPW` est une information de gestionnaire ; il ne force pas une couleur de priorité. Prévoir l'exclusion des voiries SPW d'un classement **des interventions communales**, sans les supprimer de la carte.
- Les amplitudes de travaux et dates prévues ne sont pas automatiquement des facteurs du score initial.
- Documenter que le score est **un outil d'aide au classement**, pas une expertise d'ingénierie ni une décision automatique de travaux.

## 6. Architecture cible (proposition)

- Front-end : Next.js App Router + TypeScript + Tailwind CSS.
- Carte : React Leaflet + Leaflet / GeoJSON ; chargement côté navigateur pour éviter les erreurs SSR.
- Backend/données : Supabase Postgres + Auth, politiques Row Level Security et migrations versionnées. Pour le MVP, géométries GeoJSON en JSONB ; PostGIS si une réelle requête spatiale avancée le justifie.
- Import Excel : bibliothèque JS maintenue (ex. SheetJS/xlsx ou ExcelJS), script idempotent séparé, journal d'import et rapport de correspondances. Dépendance à vérifier au moment du développement.
- Hébergement final : Vercel ou autre environnement compatible ; clés d'API dans `.env.local` et variables d'environnement serveur, jamais commitées.
- Git pour versionner et sauvegarder les modifications.
- Aucun compte supplémentaire, aucune inscription publique, aucune clé privilégiée exposée au client.

Tables suggérées : `roads`, `road_segments`, `road_evaluations` (ou colonnes de `roads` si plus simple), `import_rows`, `match_reviews`, `priority_settings`, `change_log`. Structure exacte à préciser avant implémentation.

## 7. Phases imposées et critères d'acceptation

**Phase 0 — Analyse et plan, sans développement.** Lire le fichier Excel, auditer les 180 lignes, trouver les doublons et variations, documenter les choix géographiques et l'architecture. Produire `PLAN.md`, `DATA_AUDIT.md`, `DATA_MODEL.md`, `CLAUDE.md`. Expliquer les risques et attentes. Ne pas inventer de routes. **Arrêt pour revue.**

**Phase 1 — Socle et interface.** Créer le projet Next.js, le design responsive, la navigation `Carte`, `Voiries`, `Priorités`, `Paramètres`, avec données fictives explicitement étiquetées `démo`. Vérifier `npm run dev`, lint et types. **Arrêt pour revue.**

**Phase 2 — Couverture géographique.** Récupérer la limite de Pepinster et le réseau routier réel dans une extraction locale versionnée. Ajouter la carte et des routes cliquables en une seule couleur par voirie logique. Faire un audit de couverture, de routes non nommées et d'homonymes. **Arrêt pour revue.**

**Phase 3 — Import de l'Excel.** Implémenter le parsing des vraies lignes, les normalisations traçables, l'appariement des noms et une table des correspondances incertaines ; aucune fusion automatique en cas d'ambiguïté ; rapport `MATCHING_REPORT.md`. Les routes OSM absentes de l'Excel restent visibles à compléter. **Arrêt pour revue.**

**Phase 4 — Persistance et compte privé.** Schéma SQL versionné, Auth pour l'unique administrateur, RLS en lecture et écriture, CRUD, journal des modifications. Tester la persistance après rafraîchissement et les refus d'accès non autorisé. **Arrêt pour revue.**

**Phase 5 — Carte / tableau réellement synchronisés.** Panneau latéral éditable, recherche/filtres, sélection bidirectionnelle, sauvegarde et rechargement. Tester le changement d'une route contenant plusieurs segments : tous doivent adopter la même couleur. **Arrêt pour revue.**

**Phase 6 — Priorités.** Ajouter moteur de score avec valeurs manquantes, couverture, couleurs, gestion des voiries SPW, classement, filtres et paramètres. Tests unitaires d'algorithme et de cas limites. **Arrêt pour revue.**

**Phase 7 — Finition et publication.** Accessibilité, responsive, gestion erreurs, tests d'intégration et de sécurité, sauvegarde/export, guide utilisateur et déploiement. Ne pas publier ni créer de dépenses sans validation expresse. **Arrêt final.**

**À chaque phase :** résumé des fichiers créés/modifiés, instructions exactes pour tester sur Mac, captures d'écran ou aperçu si possible, résultats de tests, limites restantes, et n'entamer la phase suivante que sur demande.

## 8. Premier message à envoyer à Claude Code

> Tu es mon ingénieur logiciel principal et mon accompagnateur pédagogique. Je suis débutant et je développe pour mon père une application web privée appelée « Voiries Pepinster ». Lis d'abord entièrement le document `Brief_Claude_Code_Voiries_Pepinster.md` et le fichier `etat_voiries_pepinster.xlsx`, feuille `Feuil1`. Ne commence PAS à coder. Effectue seulement la PHASE 0 de ce document : audit Excel, plan, architecture, stratégie géographique pour obtenir toutes les voiries de Pepinster et règles de calcul de priorité. Produis les documents prévus dans le dépôt, explique tes choix clairement en français, indique les questions bloquantes et attends ma validation avant de passer à la phase 1. Ne suppose jamais qu'un nom Excel correspond à une route sans validation, ni que « RAS » signifie note 1 ou « SPW » note d'état. Donne-moi ensuite les commandes exactes pour avancer.

## 9. Message type pour continuer une phase

> J'ai examiné et validé la phase précédente. Réalise UNIQUEMENT la phase [N] du document `Brief_Claude_Code_Voiries_Pepinster.md`. Respecte les critères d'acceptation, n'anticipe pas la phase suivante. À la fin, lance les vérifications pertinentes, explique ce que je dois tester dans mon navigateur et attends mon retour.

## 10. Références techniques à consulter pendant le développement

- Overpass API : https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM tile usage : https://operations.osmfoundation.org/policies/tiles/
- Wallonie, réseau routier régional : https://geoportail.wallonie.be/catalogue/bdcb789c-4b02-4c0c-863a-98dac4ed0240.html
- Wallonie, PICC : https://geoportail.wallonie.be/PICC
- Next.js : https://nextjs.org/docs
- Supabase Auth : https://supabase.com/docs/guides/auth
- Claude Code mode plan : https://support.claude.com/fr/articles/14553413-aide-memoire-claude-code
