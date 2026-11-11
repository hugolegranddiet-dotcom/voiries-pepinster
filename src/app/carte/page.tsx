import type { Metadata } from "next";
import { CarteVoiries } from "@/components/carte/CarteVoiries";

export const metadata: Metadata = { title: "Carte" };

export default function PageCarte() {
  return (
    <div className="h-full">
      <h1 className="sr-only">Carte des voiries de Pepinster</h1>
      <CarteVoiries />
    </div>
  );
}
