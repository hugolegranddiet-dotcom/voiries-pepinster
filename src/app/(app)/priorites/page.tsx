import type { Metadata } from "next";
import { EnTetePage } from "@/components/blocs";
import { ClassementPriorites } from "@/components/priorite/ClassementPriorites";

export const metadata: Metadata = { title: "Priorités" };

export default function PagePriorites() {
  return (
    <>
      <EnTetePage
        titre="Priorités"
        description="Classement des voiries par score, de la priorité la plus élevée à la plus faible. Le détail du calcul est dans la fiche de chaque voirie."
      />
      <div className="mx-auto max-w-4xl px-4 py-5 md:px-8">
        <ClassementPriorites />
      </div>
    </>
  );
}
