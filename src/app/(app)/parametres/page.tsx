import type { Metadata } from "next";
import { EnTetePage } from "@/components/blocs";
import { ParametresEditables } from "@/components/priorite/ParametresEditables";

export const metadata: Metadata = { title: "Paramètres" };

export default function PageParametres() {
  return (
    <>
      <EnTetePage
        titre="Paramètres"
        description="Règles du score de priorité : poids, points, couleurs et fiabilité. Chaque modification est enregistrée comme une nouvelle version."
      />
      <div className="mx-auto max-w-4xl px-4 py-5 md:px-8">
        <ParametresEditables />
      </div>
    </>
  );
}
