import type { Metadata } from "next";
import { CarteDemo } from "@/components/carte/CarteDemo";

export const metadata: Metadata = { title: "Carte" };

export default function PageCarte() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">Carte des voiries</h1>
      <div className="min-h-0 flex-1">
        <CarteDemo />
      </div>
    </div>
  );
}
