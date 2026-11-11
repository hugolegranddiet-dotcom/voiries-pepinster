import { AppShell } from "@/components/AppShell";
import { FournisseurDonnees } from "@/components/donnees/FournisseurDonnees";

/**
 * Pages de l'application : accessibles seulement une fois connecté (voir src/proxy.ts).
 * Les données (carte + tableau) sont chargées une fois et partagées entre les pages.
 */
export default function MiseEnPageApplication({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      <FournisseurDonnees>{children}</FournisseurDonnees>
    </AppShell>
  );
}
