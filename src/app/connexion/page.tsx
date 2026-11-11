import type { Metadata } from "next";
import { Suspense } from "react";
import { FormulaireConnexion } from "@/app/connexion/FormulaireConnexion";
import { configSupabase } from "@/lib/supabase/serveur";

export const metadata: Metadata = { title: "Connexion" };

export default function PageConnexion() {
  const configure = configSupabase() !== null;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#0d6b69" />
            <path d="M11 27 L14.5 5 M21 27 L17.5 5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M16 8 v2.5 M16 14 v2.5 M16 20 v2.5" stroke="#e3a600" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="text-xl font-semibold text-ink">Voiries Pepinster</h1>
            <p className="text-sm text-muted">Accès privé</p>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          {configure ? (
            <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
              <FormulaireConnexion />
            </Suspense>
          ) : (
            <p role="alert" className="text-sm text-ink">
              L&apos;application n&apos;est pas encore reliée à sa base de données. Il manque le
              fichier <code>.env.local</code> (voir <code>.env.example</code> et le guide de la phase 4).
            </p>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Aucune inscription possible : le compte est créé par l&apos;administrateur.
        </p>
      </div>
    </main>
  );
}
