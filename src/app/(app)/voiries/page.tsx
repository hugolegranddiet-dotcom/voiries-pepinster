import type { Metadata } from "next";
import { Suspense } from "react";
import { EnTetePage } from "@/components/blocs";
import { TableauVoiries } from "@/components/voiries/TableauVoiries";

export const metadata: Metadata = { title: "Voiries" };

export default function PageVoiries() {
  return (
    <div className="flex h-full flex-col">
      <EnTetePage
        titre="Voiries"
        description="Toutes les voiries de Pepinster. Clique sur une ligne pour ouvrir et modifier sa fiche ; l'icône carte la montre sur la carte."
      />
      <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement des voiries…</p>}>
        <TableauVoiries />
      </Suspense>
    </div>
  );
}
