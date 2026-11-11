# Mettre l'application en ligne (Vercel) — guide pas à pas

> ⚠️ **À ne faire qu'après ta décision explicite.** Rien n'est publié tant que tu ne fais pas ces étapes toi-même.
> Coût prévu : **0 €** (décision D10). À aucun moment il ne faut entrer de carte bancaire.

Aujourd'hui, l'application tourne seulement sur ton Mac (`npm run dev`). La mettre en ligne permet à ton père de l'ouvrir depuis son ordinateur ou son téléphone, avec une adresse du type `https://voiries-pepinster.vercel.app`. La base de données (Supabase) est déjà en ligne : seule l'application doit l'être.

Durée : environ 20 minutes.

---

## Avant de commencer : deux règles des offres gratuites

1. **Vercel Hobby (gratuit) est réservé à un usage personnel et non commercial.** Vercel considère comme commercial tout usage dont quelqu'un tire un revenu, par exemple si quelqu'un est payé pour créer ou héberger le site. Un outil privé que ton père utilise bénévolement entre dans l'usage gratuit. **Si ton père est rémunéré pour ce travail** (par la commune, par exemple), pose-toi la question avant de publier. En cas de doute, le support de Vercel répond. Sources : [Vercel – Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel – Fair use (commercial usage)](https://vercel.com/docs/limits/fair-use-guidelines).
2. **Supabase gratuit met le projet en pause après environ une semaine sans activité.** Tu reçois un e-mail avant la pause. Si ton père n'utilise pas l'application pendant plusieurs semaines, ouvre le tableau de bord Supabase → ton projet → **Resume project**. Les données sont conservées (reprise possible pendant un an). Source : [Supabase – Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

---

## Étape 1 — Vérifier que tout est à jour (2 min)

Dans le Terminal, dans le dossier du projet :

```bash
git pull
npm install
npx supabase@3.1.0 db push --remote
npm run check
npm run db:verifier
```

Tu dois voir `Finished supabase db push.` (ou « Remote database is up to date »), puis aucun ❌.

## Étape 2 — Créer le compte Vercel (3 min)

1. Va sur <https://vercel.com/signup>.
2. Choisis l'offre **Hobby** (projets personnels, gratuite), puis ton nom.
3. **Continue with GitHub**, avec le compte `hugolegranddiet-dotcom` (décision D12 : comptes techniques à ton nom).
4. Si Vercel propose un essai **Pro**, refuse : reste sur Hobby.

## Étape 3 — Importer le projet (3 min)

1. Sur le tableau de bord Vercel : **Add New…** → **Project**.
2. Dans la liste de tes dépôts GitHub, à côté de `voiries-pepinster`, clique **Import**. Si le dépôt n'apparaît pas, utilise le lien proposé par Vercel pour modifier les autorisations GitHub, et autorise ce seul dépôt.
3. *Framework Preset* : **Next.js** (détecté tout seul). Ne change pas les autres réglages.

## Étape 4 — Les variables d'environnement (3 min)

Toujours sur la page d'import, ouvre **Environment Variables** et ajoute **uniquement ces deux variables** (les mêmes valeurs que dans ton `.env.local`) :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://TON_PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |

🚫 **N'ajoute jamais `SUPABASE_SECRET_KEY` sur Vercel.** L'application en ligne n'en a pas besoin. Cette clé contourne toute la sécurité : elle reste uniquement sur ton Mac, pour les scripts (`db:seed`, `db:sauvegarde`…).

## Étape 5 — Publier (3 min)

Clique **Deploy**. Après 1 à 3 minutes, Vercel affiche « Congratulations » et l'adresse du site (`https://voiries-pepinster-….vercel.app`). Note-la.

## Étape 6 — Indiquer l'adresse à Supabase (2 min)

Dans Supabase : **Authentication** → **URL Configuration** → **Site URL** : colle l'adresse Vercel, puis **Save**. Laisse l'inscription publique **désactivée** (déjà fait en phase 4).

## Étape 7 — Tester (5 min)

1. Ouvre l'adresse Vercel dans une **fenêtre de navigation privée** : la page de connexion doit s'afficher, et rien d'autre.
2. Connecte-toi avec le compte de ton père : la carte s'affiche, colorée.
3. Modifie une note, recharge : la modification est toujours là.
4. Sur ton téléphone (4G, pas le Wi-Fi), ouvre l'adresse et vérifie la même chose.
5. Sur le Mac : `npm run db:verifier` doit toujours tout afficher en ✅.

## Étape 8 — Donner l'accès à ton père

- Envoie-lui l'adresse. Sur son téléphone, il peut l'ajouter à l'écran d'accueil (Safari : bouton Partager → **Sur l'écran d'accueil**).
- Montre-lui la page **Aide** (lien en bas du menu, ou en haut sur téléphone).
- Mot de passe oublié : `npm run db:mot-de-passe -- son-adresse@exemple.be` affiche un nouveau mot de passe à lui donner de vive voix ou sur papier.

---

## Après la mise en ligne

- **Chaque `git push` sur `main` republie automatiquement le site.** Si une mise à jour contient une migration (`supabase/migrations/`), lance `npx supabase@3.1.0 db push --remote` **avant** le push.
- **Sauvegarde mensuelle :** `npm run db:sauvegarde` sur le Mac (fichier dans `sauvegardes/`, à copier dans iCloud ou sur une clé USB). Ton père peut aussi télécharger un CSV depuis **Paramètres**.
- **Restaurer** (en cas d'erreur grave) : `npm run db:restaurer -- sauvegardes/le-fichier.json` montre d'abord ce qui changerait ; ajoute `--confirmer` pour appliquer. Rien n'est jamais supprimé.
- **Retirer le site** : Vercel → le projet → **Settings** → tout en bas, **Delete Project**. La base Supabase n'est pas touchée.
