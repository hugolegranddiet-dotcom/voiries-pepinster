"use client";

import { useState } from "react";
import { BadgePriorite, COULEUR_BANDE } from "@/components/badges";
import { IconeFermer } from "@/components/icones";
import { FicheVoirie } from "@/components/carte/FicheVoirie";
import { VOIRIES_DEMO } from "@/lib/demo/voiries-demo";
import { LIBELLES_BANDES, SEUILS_PAR_DEFAUT } from "@/lib/priority/defaults";

function Legende() {
  return (
    <div className="rounded-lg border border-line bg-surface/95 p-3 text-xs shadow-sm backdrop-blur">
      <p className="mb-2 font-semibold text-ink">Légende</p>
      <ul className="space-y-1.5">
        {[...SEUILS_PAR_DEFAUT].reverse().map((s) => (
          <li key={s.bande} className="flex items-center gap-2">
            <span className={`h-1.5 w-6 rounded-full ${COULEUR_BANDE[s.bande]}`} aria-hidden="true" />
            <span className="text-ink">
              {s.min}–{s.max}
            </span>
            <span className="text-muted">{LIBELLES_BANDES[s.bande]}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className={`h-1.5 w-6 rounded-full ${COULEUR_BANDE.gris}`} aria-hidden="true" />
          <span className="text-muted">Non évalué</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-6 border-t-2 border-dashed border-ink" aria-hidden="true" />
          <span className="text-muted">SPW ou autre gestionnaire</span>
        </li>
      </ul>
    </div>
  );
}

/**
 * Mise en page de l'écran Carte.
 * Phase 1 : AUCUN fond de carte ni tracé (ils arrivent en phase 2, depuis OSM).
 * Une liste de voiries de démonstration permet d'ouvrir la fiche latérale.
 */
export function CarteDemo() {
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const selection = VOIRIES_DEMO.find((v) => v.id === selectionId) ?? null;

  return (
    <div className="relative flex h-full min-h-[32rem]">
      <section
        aria-label="Zone de la carte"
        className="carte-attente relative flex flex-1 items-start justify-center overflow-y-auto p-4 md:items-center md:p-8"
      >
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Emplacement de la carte
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            La carte réelle arrive en phase 2
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Elle affichera la limite de la commune et les voiries réelles issues
            d&apos;OpenStreetMap. Aucun tracé n&apos;est dessiné ici à la main.
          </p>
          <p className="mt-4 text-sm font-medium text-ink">
            En attendant, ouvre une fiche de démonstration :
          </p>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {VOIRIES_DEMO.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelectionId(v.id)}
                  aria-pressed={v.id === selectionId}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-canvas ${
                    v.id === selectionId ? "bg-brand-soft" : ""
                  }`}
                >
                  <span className="font-medium text-ink">{v.nom}</span>
                  <BadgePriorite score={v.scoreDemo} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Legende />
          </div>
        </div>
      </section>

      {/* Panneau latéral (ordinateur) / feuille du bas (téléphone) */}
      <aside
        aria-label="Fiche de la voirie"
        className={`${
          selection ? "flex" : "hidden"
        } absolute inset-x-0 bottom-0 z-10 max-h-[80%] flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl md:static md:flex md:max-h-none md:w-[24rem] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-sm font-semibold text-ink">Fiche</p>
          {selection && (
            <button
              type="button"
              onClick={() => setSelectionId(null)}
              className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink"
              aria-label="Fermer la fiche"
            >
              <IconeFermer width={18} height={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-4">
          {selection ? (
            <FicheVoirie voirie={selection} />
          ) : (
            <p className="text-sm text-muted">
              Sélectionne une voirie pour afficher sa fiche.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
