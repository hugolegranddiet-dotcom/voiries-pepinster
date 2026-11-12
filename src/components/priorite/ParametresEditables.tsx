"use client";

// Paramètres du score modifiables par le père (D3). Chaque enregistrement crée
// une NOUVELLE version ; les anciennes restent consultables et réactivables.
import { useMemo, useState, useTransition } from "react";
import { activerParametres, publierParametres } from "@/app/actions/priorites";
import { BadgePriorite, COULEUR_BANDE } from "@/components/badges";
import { AvertissementScore, Carte } from "@/components/blocs";
import { useDonnees } from "@/components/donnees/FournisseurDonnees";
import { ErreurDonnees } from "@/components/donnees/ErreurDonnees";
import { BoutonExport } from "@/components/donnees/BoutonExport";
import { LIBELLES_GESTIONNAIRE, type Gestionnaire } from "@/lib/domaine";
import { classer } from "@/lib/priority/classement";
import {
  CRITERES,
  LIBELLES_BANDES,
  LIBELLES_CRITERES,
  libelleValeur,
  PARAMETRES_PAR_DEFAUT,
  VALEURS_CRITERE,
  type CritereScore,
  type ParametresScore,
} from "@/lib/priority/defaults";
import { SchemaParametres, seuilsDepuisDebuts } from "@/lib/priority/parametres";

/** Le formulaire garde des chaînes (ce que la personne tape), converties à l'enregistrement. */
interface Brouillon {
  poids: Record<CritereScore, string>;
  echelles: Record<CritereScore, Record<string, string>>;
  debuts: { jaune: string; orange: string; rouge: string };
  couverture: string;
  gestionnaires: Gestionnaire[];
}

function versBrouillon(p: ParametresScore): Brouillon {
  const texte = <T extends Record<string, number>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));
  return {
    poids: texte(p.poids) as Record<CritereScore, string>,
    echelles: Object.fromEntries(CRITERES.map((c) => [c, texte(p.echelles[c] as Record<string, number>)])) as Brouillon["echelles"],
    debuts: { jaune: String(p.seuils[1].min), orange: String(p.seuils[2].min), rouge: String(p.seuils[3].min) },
    couverture: String(Math.round(p.couverture_min * 100)),
    gestionnaires: [...p.gestionnaires_classement],
  };
}

const nombre = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));

function depuisBrouillon(b: Brouillon) {
  const entiers = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, nombre(v)]));
  return SchemaParametres.safeParse({
    poids: entiers(b.poids),
    echelles: Object.fromEntries(CRITERES.map((c) => [c, entiers(b.echelles[c])])),
    seuils: seuilsDepuisDebuts(nombre(b.debuts.jaune), nombre(b.debuts.orange), nombre(b.debuts.rouge)),
    couverture_min: nombre(b.couverture) / 100,
    gestionnaires_classement: b.gestionnaires,
  });
}

function ChampNombre({ id, libelle, valeur, onChange, suffixe }: { id: string; libelle: string; valeur: string; onChange: (v: string) => void; suffixe?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="text-sm text-ink">{libelle}</label>
      <span className="flex items-center gap-1.5">
        <input
          id={id}
          inputMode="numeric"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-right text-sm tabular-nums text-ink"
        />
        {suffixe && <span className="w-6 text-sm text-muted">{suffixe}</span>}
      </span>
    </div>
  );
}

export function ParametresEditables() {
  const { etat, recharger } = useDonnees();
  const donnees = etat.statut === "pret" ? etat.donnees : null;
  const actifs = donnees?.parametres ?? PARAMETRES_PAR_DEFAUT;
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const [confirmer, setConfirmer] = useState<null | { type: "publier" } | { type: "activer"; version: number }>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  const b = brouillon ?? versBrouillon(actifs);
  const valide = depuisBrouillon(b);
  const brouillonParams: ParametresScore | null = valide.success ? { version: null, ...(valide.data as Omit<ParametresScore, "version">) } : null;
  const modifie = JSON.stringify(b) !== JSON.stringify(versBrouillon(actifs));
  const totalPoids = CRITERES.reduce((s, c) => s + (nombre(b.poids[c]) || 0), 0);

  // Aperçu : effet des paramètres en cours de saisie sur le classement communal.
  // (La clé texte évite de recalculer à chaque rendu tant que les valeurs ne changent pas.)
  const cleBrouillon = brouillonParams ? JSON.stringify(brouillonParams) : null;
  const apercu = useMemo(() => {
    if (!donnees || !cleBrouillon) return null;
    const p = JSON.parse(cleBrouillon) as ParametresScore;
    const avant = classer(Object.values(donnees.fiches), actifs, { exclureHorsCommune: true });
    const apres = classer(Object.values(donnees.fiches), p, { exclureHorsCommune: true });
    return { avant: avant.classees.length, apres: apres.classees.slice(0, 5), nbApres: apres.classees.length };
  }, [donnees, actifs, cleBrouillon]);

  const maj = (f: (x: Brouillon) => Brouillon) => {
    setBrouillon(f(b));
    setConfirmer(null);
    setMessage(null);
  };

  const executer = () =>
    demarrer(async () => {
      if (!confirmer) return;
      setMessage(null);
      const r = confirmer.type === "publier" ? (valide.success ? await publierParametres(valide.data) : null) : await activerParametres(confirmer.version);
      setConfirmer(null);
      if (!r) return;
      if (!r.ok) {
        setMessage({ ok: false, texte: r.erreur });
        return;
      }
      await recharger();
      setBrouillon(null);
      setMessage({ ok: true, texte: `Version ${r.donnees.version} active : la carte, la liste et le classement l'utilisent maintenant.` });
    });

  if (etat.statut === "erreur") return <ErreurDonnees message={etat.message} />;
  if (!donnees) return <p role="status" className="text-sm text-muted">Chargement des paramètres…</p>;

  const versions = [...donnees.versionsParametres].reverse();

  return (
    <div className="flex flex-col gap-5 pb-24">
      <AvertissementScore />
      <p className="rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink">
        Paramètres utilisés : <strong>{actifs.version === null ? "valeurs par défaut du plan (rien en base)" : `version ${actifs.version}`}</strong>.
        Modifie les valeurs ci-dessous : un aperçu montre l&apos;effet sur le classement avant d&apos;enregistrer. Enregistrer crée une nouvelle
        version ; l&apos;ancienne est gardée et peut être réactivée.
      </p>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? "border-brand/30 bg-brand-soft text-brand-strong" : "border-prio-rouge/30 bg-prio-rouge/5 text-prio-rouge"}`}>
          {message.texte}
        </p>
      )}

      <Carte titre="Poids des critères">
        {CRITERES.map((c) => (
          <ChampNombre key={c} id={`poids-${c}`} libelle={LIBELLES_CRITERES[c]} valeur={b.poids[c]} suffixe="%" onChange={(v) => maj((x) => ({ ...x, poids: { ...x.poids, [c]: v } }))} />
        ))}
        <p className={`mt-2 text-sm ${totalPoids === 100 ? "text-muted" : "text-demo-ink"}`}>
          Total : <strong>{totalPoids} %</strong>
          {totalPoids !== 100 && " — les poids seront ramenés en proportion (le calcul reste juste, mais 100 % est plus lisible)."}
        </p>
      </Carte>

      <div className="grid gap-5 md:grid-cols-2">
        {CRITERES.map((c) => (
          <Carte key={c} titre={`Points : ${LIBELLES_CRITERES[c].toLowerCase()}`}>
            {VALEURS_CRITERE[c].map((v) => (
              <ChampNombre
                key={v}
                id={`ech-${c}-${v}`}
                libelle={libelleValeur(c, v)}
                valeur={b.echelles[c][v]}
                suffixe="pts"
                onChange={(val) => maj((x) => ({ ...x, echelles: { ...x.echelles, [c]: { ...x.echelles[c], [v]: val } } }))}
              />
            ))}
          </Carte>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Carte titre="Couleurs (début de chaque tranche)">
          <p className="mb-1 flex items-center gap-2 text-sm text-ink">
            <span className={`size-3 rounded-full ${COULEUR_BANDE.vert}`} aria-hidden="true" /> {LIBELLES_BANDES.vert} : à partir de 0
          </p>
          {(["jaune", "orange", "rouge"] as const).map((bande) => (
            <ChampNombre
              key={bande}
              id={`seuil-${bande}`}
              libelle={`${LIBELLES_BANDES[bande]} : à partir de`}
              valeur={b.debuts[bande]}
              onChange={(v) => maj((x) => ({ ...x, debuts: { ...x.debuts, [bande]: v } }))}
            />
          ))}
        </Carte>
        <Carte titre="Fiabilité et classement">
          <ChampNombre
            id="couverture"
            libelle="Critères renseignés minimum"
            valeur={b.couverture}
            suffixe="%"
            onChange={(v) => maj((x) => ({ ...x, couverture: v }))}
          />
          <fieldset className="mt-3">
            <legend className="text-sm text-ink">Gestionnaires gardés dans le classement communal</legend>
            {(["commune", "spw", "autre"] as const).map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--brand)]"
                  checked={b.gestionnaires.includes(g)}
                  onChange={(e) =>
                    maj((x) => ({ ...x, gestionnaires: e.target.checked ? [...x.gestionnaires, g] : x.gestionnaires.filter((y) => y !== g) }))
                  }
                />
                {LIBELLES_GESTIONNAIRE[g]}
              </label>
            ))}
            <p className="mt-1 text-xs text-muted">Les voiries au gestionnaire inconnu restent toujours dans le classement (à confirmer).</p>
          </fieldset>
        </Carte>
      </div>

      {!valide.success && (
        <p role="alert" className="rounded-lg border border-prio-rouge/30 bg-prio-rouge/5 px-3 py-2 text-sm text-prio-rouge">
          {valide.error.issues[0]?.message ?? "Valeurs invalides."} (Nombres entiers de 0 à 100.)
        </p>
      )}

      {modifie && apercu && (
        <Carte titre="Aperçu avec ces valeurs (pas encore enregistré)">
          <p className="text-sm text-ink">
            Voiries classées : {apercu.avant} → <strong>{apercu.nbApres}</strong>. Les 5 premières :
          </p>
          <ol className="mt-2 space-y-1 text-sm">
            {apercu.apres.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-ink">{l.rang}. {l.nom}</span>
                <BadgePriorite score={l.resultat.score} bande={l.resultat.bande} provisoire={l.resultat.provisoire} manuel={l.resultat.manuel} />
              </li>
            ))}
          </ol>
        </Carte>
      )}

      <Carte titre="Sauvegarde des données">
        <p className="mb-3 text-sm text-muted">
          Télécharge un fichier lisible par Excel avec toutes les voiries, leurs évaluations et leur score. À faire de temps en temps et à garder
          précieusement (par exemple une fois par mois).
        </p>
        <BoutonExport
          prefixe="voiries-pepinster-sauvegarde"
          libelle={`Télécharger toutes les voiries (${Object.keys(donnees.fiches).length})`}
          fiches={() => Object.values(donnees.fiches).sort((a, b) => a.id.localeCompare(b.id))}
        />
      </Carte>

      <Carte titre="Versions enregistrées">
        {versions.length === 0 ? (
          <p className="text-sm text-muted">Aucune version en base.</p>
        ) : (
          <ul className="divide-y divide-line">
            {versions.map((v) => (
              <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="text-ink">
                  <strong>Version {v.version}</strong> · {new Date(v.creeLe).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" })}
                  <span className="block text-xs text-muted">
                    {v.lisible ? CRITERES.map((c) => `${LIBELLES_CRITERES[c].split(" ")[0]} ${v.poids[c]}`).join(" · ") : "illisible"}
                  </span>
                </span>
                {v.actif ? (
                  <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">active</span>
                ) : (
                  v.lisible && (
                    <button type="button" onClick={() => setConfirmer({ type: "activer", version: v.version })} className="rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand-soft">
                      Réactiver
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        {!confirmer ? (
          <>
            <button type="button" onClick={() => maj(() => versBrouillon({ ...PARAMETRES_PAR_DEFAUT }))} className="text-sm text-brand underline underline-offset-2">
              Valeurs par défaut du plan
            </button>
            {modifie && (
              <button type="button" onClick={() => { setBrouillon(null); setMessage(null); }} className="text-sm text-muted underline underline-offset-2">
                Annuler mes changements
              </button>
            )}
            <button
              type="button"
              disabled={!modifie || !valide.success || enCours}
              onClick={() => setConfirmer({ type: "publier" })}
              className="ml-auto rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40"
            >
              Enregistrer une nouvelle version
            </button>
          </>
        ) : (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">
              {confirmer.type === "publier" ? "Enregistrer et utiliser ces paramètres partout ?" : `Réactiver la version ${confirmer.version} ?`}
            </span>
            <button type="button" disabled={enCours} onClick={executer} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40">
              {enCours ? "Enregistrement…" : "Confirmer"}
            </button>
            <button type="button" disabled={enCours} onClick={() => setConfirmer(null)} className="rounded-lg border border-line px-3 py-2 text-sm text-ink">
              Annuler
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
