import type { ReactNode } from "react";
import { NavLinks } from "@/components/NavLinks";

/** Bandeau visible sur toutes les pages tant que les données sont fictives. */
function BandeauDemo() {
  return (
    <div
      role="note"
      className="border-b border-demo-line bg-demo-bg px-4 py-2 text-center text-sm text-demo-ink"
    >
      <strong className="mr-1 rounded bg-demo-ink px-1.5 py-0.5 text-xs font-bold tracking-wide text-demo-bg">
        DÉMO
      </strong>
      <span className="sm:hidden">Voiries et Priorités : données fictives.</span>
      <span className="hidden sm:inline">
        La carte montre les voies réelles (OpenStreetMap), sans évaluation. Les écrans
        Voiries et Priorités utilisent encore des données fictives.
      </span>
    </div>
  );
}

function Marque({ claire = false }: { claire?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill={claire ? "#ffffff" : "#0d6b69"} />
        <path
          d="M11 27 L14.5 5 M21 27 L17.5 5"
          stroke={claire ? "#0d6b69" : "#ffffff"}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M16 8 v2.5 M16 14 v2.5 M16 20 v2.5"
          stroke="#e3a600"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-tight">
        <p className={`text-base font-semibold ${claire ? "text-white" : "text-ink"}`}>
          Voiries Pepinster
        </p>
        <p className={`text-xs ${claire ? "text-white/70" : "text-muted"}`}>
          Suivi de l&apos;état des routes
        </p>
      </div>
    </div>
  );
}

/** Cadre commun : bandeau démo, navigation et zone de contenu. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <BandeauDemo />

      {/* En-tête téléphone */}
      <header className="border-b border-line bg-surface px-4 py-2.5 md:hidden">
        <Marque />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Barre latérale ordinateur */}
        <aside className="hidden w-60 shrink-0 flex-col bg-ink px-3 py-5 md:flex">
          <div className="px-2 pb-6">
            <Marque claire />
          </div>
          <nav aria-label="Navigation principale">
            <NavLinks variante="laterale" />
          </nav>
          <p className="mt-auto px-2 text-xs leading-relaxed text-white/50">
            Version de développement — phase 2
          </p>
        </aside>

        <main id="contenu" className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Onglets téléphone */}
      <nav
        aria-label="Navigation principale"
        className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <NavLinks variante="onglets" />
      </nav>
    </div>
  );
}
