import type { Metadata } from "next";
import Link from "next/link";
import { EnTetePage } from "@/components/blocs";
import { ValidationNotes } from "@/components/priorite/ValidationNotes";

export const metadata: Metadata = { title: "Valider les notes suggérées" };

export default function PageValidationNotes() {
  return (
    <>
      <EnTetePage
        titre="Valider les notes suggérées"
        description="Notes d'état proposées d'après la couleur de la case « Etat » de l'Excel. Tu choisis lesquelles valider."
        actions={
          <Link href="/priorites" className="text-sm font-medium text-brand underline underline-offset-2">
            ← Retour aux priorités
          </Link>
        }
      />
      <div className="mx-auto max-w-4xl px-4 py-5 md:px-8">
        <ValidationNotes />
      </div>
    </>
  );
}
