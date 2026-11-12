"use client";

// Petites préférences d'affichage retenues PAR NAVIGATEUR (filtres repliés,
// largeur de la fiche…). Jamais de données métier ici : si le navigateur refuse
// le stockage (navigation privée, réglages), l'application marche quand même
// avec les valeurs par défaut.
import { useCallback, useSyncExternalStore } from "react";

const PREFIXE = "voiries-pepinster:";
const EVENEMENT = "voiries-preference";

function lire(cle: string): string | null {
  try {
    return window.localStorage.getItem(PREFIXE + cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string | null) {
  try {
    if (valeur === null) window.localStorage.removeItem(PREFIXE + cle);
    else window.localStorage.setItem(PREFIXE + cle, valeur);
  } catch {
    // stockage refusé : la préférence vaut seulement pour cette page
  }
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: cle }));
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

/**
 * Préférence texte : `null` tant qu'elle n'a jamais été choisie (et toujours
 * `null` côté serveur, pour que la première image soit identique partout).
 */
export function usePreference(cle: string): [string | null, (v: string | null) => void] {
  const valeur = useSyncExternalStore(
    abonner,
    () => lire(cle),
    () => null,
  );
  const changer = useCallback((v: string | null) => ecrire(cle, v), [cle]);
  return [valeur, changer];
}
