"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconeCarte,
  IconeListe,
  IconeParametres,
  IconePriorites,
} from "@/components/icones";

export const RUBRIQUES = [
  { href: "/carte", libelle: "Carte", Icone: IconeCarte },
  { href: "/voiries", libelle: "Voiries", Icone: IconeListe },
  { href: "/priorites", libelle: "Priorités", Icone: IconePriorites },
  { href: "/parametres", libelle: "Paramètres", Icone: IconeParametres },
] as const;

/** Navigation principale : barre latérale (ordinateur) ou onglets du bas (téléphone). */
export function NavLinks({ variante }: { variante: "laterale" | "onglets" }) {
  const chemin = usePathname();

  if (variante === "onglets") {
    return (
      <ul className="grid grid-cols-4">
        {RUBRIQUES.map(({ href, libelle, Icone }) => {
          const actif = chemin.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  actif ? "text-brand" : "text-muted"
                }`}
              >
                <Icone />
                {libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {RUBRIQUES.map(({ href, libelle, Icone }) => {
        const actif = chemin.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] font-medium transition-colors ${
                actif
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icone />
              {libelle}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
