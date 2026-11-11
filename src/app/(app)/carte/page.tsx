import type { Metadata } from "next";
import { Suspense } from "react";
import { CarteVoiries } from "@/components/carte/CarteVoiries";

export const metadata: Metadata = { title: "Carte" };

export default function PageCarte() {
  return (
    <div className="h-full">
      <h1 className="sr-only">Carte des voiries de Pepinster</h1>
      {/* Les données sont lues dans la base, après connexion (voir /api/carte). */}
      <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement de la carte…</p>}>
        <CarteVoiries />
      </Suspense>
    </div>
  );
}
