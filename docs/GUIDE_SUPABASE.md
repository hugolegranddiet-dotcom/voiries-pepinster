# Guide — mettre en service la base de données (phase 4)

Durée : **20 à 30 minutes**, une seule fois. Coût : **0 €** (offre gratuite de Supabase).
Tout se fait sur ton Mac, dans le navigateur et le Terminal. Copie les commandes **une par une**.

> 🔐 **Trois secrets vont apparaître** : le mot de passe de la base, la clé `sb_secret_…` et le mot de passe de ton père.
> Garde-les dans un gestionnaire de mots de passe. **Ne les envoie jamais dans une conversation, un e-mail ou sur GitHub** — pas même à Claude.

---

## Étape 1 — Créer le projet Supabase (5 min)

1. Va sur **https://supabase.com** → **Start your project**. Connecte-toi avec ton compte **GitHub** (le plus simple).
2. **New project** :
   - *Organization* : celle proposée (personnelle, offre **Free**) ;
   - *Project name* : `voiries-pepinster` ;
   - *Database Password* : clique **Generate a password**, puis **copie-le dans ton gestionnaire de mots de passe** (il servira à l'étape 3) ;
   - *Region* : une région **Europe** (par ex. *Central EU (Frankfurt)*) ;
   - **Create new project**. Attends 1 à 2 minutes que le projet soit prêt.
3. Note l'**identifiant du projet** (*Project ref*) : une suite d'une vingtaine de lettres minuscules, par ex. `abcdefghijklmnopqrst`. Trois façons de le trouver :
   - **le plus simple** : dans la barre d'adresse du navigateur, quand tu es dans ton projet : `https://supabase.com/dashboard/project/`**`abcdefghijklmnopqrst`** → c'est la partie après `/project/` ;
   - **Project Settings** (roue dentée en bas à gauche) → **General** → champ **Project ID** (bouton *Copy* à côté) ;
   - dans l'adresse du projet : `https://`**`abcdefghijklmnopqrst`**`.supabase.co`.

## Étape 2 — Fermer les inscriptions (1 min)

Dans le projet : **Authentication** → **Sign In / Providers** :
- décoche **Allow new users to sign up** → **Save** ;
- laisse le fournisseur **Email** activé (c'est lui qui permet la connexion par e-mail et mot de passe).

✅ Personne ne pourra créer de compte : seul toi pourras en créer un, depuis ce tableau de bord.

## Étape 3 — Créer les tables (3 min)

Dans le Terminal :

```bash
cd ~/Developer/voiries-pepinster
git pull
npm install
npx supabase@3.1.0 login
```

Le navigateur s'ouvre : autorise l'accès, puis reviens au Terminal.

```bash
npx supabase@3.1.0 link --project-ref TON_PROJECT_REF
```

Remplace `TON_PROJECT_REF` par l'identifiant de l'étape 1 (point 3), sans guillemets ni espaces. Exemple : `npx supabase@3.1.0 link --project-ref abcdefghijklmnopqrst`. Tu dois voir `Finished supabase link.` (le mot de passe de la base peut être demandé ici ou à la commande suivante : colle-le, rien ne s'affiche pendant la saisie, c'est normal).

```bash
npx supabase@3.1.0 db push --remote
```

`--remote` est indispensable : sans lui, l'outil cherche une base installée sur le Mac (message « Make sure Docker is running »). Si le **mot de passe de la base** est demandé, colle-le puis Entrée. Réponds `Y` pour confirmer. Tu dois voir `Applying migration 20261111200000_schema_initial.sql...` puis `Finished supabase db push.`

✅ Les tables, les règles de sécurité et le journal des modifications sont créés.

## Étape 4 — Relier l'application au projet (3 min)

```bash
cp .env.example .env.local
open -e .env.local
```

Le fichier s'ouvre dans TextEdit. Colle chaque valeur **juste après le `=`**, sans espace ni guillemets.

**Ligne 1 — `NEXT_PUBLIC_SUPABASE_URL=`** : l'adresse du projet, construite avec ton identifiant :
`https://TON_PROJECT_REF.supabase.co` (ex. `https://abcdefghijklmnopqrst.supabase.co`).
Tu la trouves aussi dans **Project Settings** (roue dentée en bas à gauche) → **Data API** → *Project URL*.

**Lignes 2 et 3 — les clés** : **Project Settings** → **API Keys** (menu de gauche). Reste sur l'onglet des nouvelles clés, **pas** sur *Legacy API keys*.

| Ligne | Section de la page | Comment copier |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` | **Publishable key** | bouton *Copy* à droite de la clé `sb_publishable_…` |
| `SUPABASE_SECRET_KEY=` | **Secret keys** | clique sur l'œil (*Reveal*) de la clé `sb_secret_…`, puis *Copy* |

Si la page ne montre aucune clé `sb_publishable_…`, clique sur **Create new API keys**.

Le fichier doit ressembler à ceci (valeurs raccourcies) :

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx…
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxx…
```

Enregistre (Cmd + S) et ferme TextEdit. Ce fichier reste sur ton Mac : il est exclu de GitHub.

## Étape 5 — Importer les données (1 min)

```bash
npm run db:seed
```

Tu dois voir une série de ✓ (1119 voiries, 1489 segments, 180 lignes de l'Excel, 180 décisions…) puis `✅ Import terminé.`

## Étape 6 — Créer le compte de ton père (3 min)

1. Dans Supabase : **Authentication → Users → Add user → Create new user**.
2. Saisis **son adresse e-mail** et un **mot de passe solide** (12 caractères ou plus), coche **Auto Confirm User**, puis **Create user**.
3. Dans le Terminal (remplace l'adresse) :

```bash
npm run db:admin -- adresse.de.ton.pere@exemple.be
```

Tu dois voir `✅ … est administrateur.`

## Étape 7 — Vérifier automatiquement (1 min)

```bash
npm run db:verifier
```

Tout doit être ✅ :
1. un visiteur non connecté ne voit **aucune** donnée et ne peut rien modifier ; l'inscription publique est fermée ;
2. toutes les données sont présentes ;
3. il y a exactement **un** administrateur.

Si une ligne est ❌, copie le résultat et envoie-le à Claude (il ne contient aucun secret).

## Étape 8 — Tester dans le navigateur (5 min)

```bash
npm run dev
```

Ouvre **http://localhost:3000** :

1. Tu arrives sur **Connexion** (les pages sont protégées).
2. Essaie un mauvais mot de passe → message « Adresse e-mail ou mot de passe incorrect ».
3. Connecte-toi avec le compte de ton père → la **carte** s'affiche avec les voiries.
4. Clique sur la **Rue du Biez** → la fiche montre les données de l'Excel (ligne 15). Dans **Particularités**, ajoute un mot, puis **Enregistrer**.
5. **Recharge la page** (Cmd + R) et rouvre la Rue du Biez : ta modification est toujours là ✅ (persistance).
6. **Se déconnecter** (en bas à gauche) → retour à la connexion. Tape `http://localhost:3000/carte` → tu es renvoyé vers la connexion ✅.

*Test facultatif « compte non autorisé »* : crée un second utilisateur dans Supabase **sans** lancer `db:admin`, connecte-toi avec lui → la carte affiche « Ce compte n'est pas autorisé ». Supprime ensuite ce compte dans Supabase.

---

## Mises à jour de la base (phases suivantes)

Quand une phase ajoute un fichier dans `supabase/migrations/`, il faut l'envoyer à Supabase une fois, après `git pull` :

```bash
npx supabase@3.1.0 db push --remote
```

Réponds `Y`. Tu dois voir `Applying migration …` pour chaque nouveau fichier (en phase 6 : `20261111230000_phase6_priorites.sql`), puis `Finished supabase db push.` Les migrations déjà appliquées ne sont pas refaites, et **aucune donnée n'est effacée**.

## À savoir

- **Mise en pause (offre gratuite)** : un projet presque inactif pendant environ une semaine est mis en pause. Supabase prévient par e-mail ; les données sont **conservées** ; on le réactive depuis le tableau de bord. On en reparlera à la phase 7 (mise en ligne).
- **Historique** : chaque modification est enregistrée dans la table `change_log` (avant, après, auteur, date). On peut la consulter dans Supabase : *Table Editor → change_log*.
- **Problème ?** Copie le message d'erreur du Terminal (jamais le contenu de `.env.local`) et envoie-le à Claude.
