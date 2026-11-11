import type { Metadata } from "next";
import { Suspense } from "react";
import { CarteVoiries } from "@/components/carte/CarteVoiries";
import type { DonneesExcelCarte } from "@/lib/matching/decisions";
// Données issues de l'Excel (générées par `npm run match`).
// Elles sont lues côté serveur et ne sont PAS placées dans public/.
// En phase 4, elles passeront dans la base de données, derrière la connexion.
import excelParVoirie from "../../../data/app/excel_par_voirie.json";

export const metadata: Metadata = { title: "Carte" };

export default function PageCarte() {
  return (
    <div className="h-full">
      <h1 className="sr-only">Carte des voiries de Pepinster</h1>
      <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement de la carte…</p>}>
        <CarteVoiries excel={excelParVoirie as DonneesExcelCarte} />
      </Suspense>
    </div>
  );
}
