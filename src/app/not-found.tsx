import Link from "next/link";

export default function PageIntrouvable() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette adresse ne correspond à aucune page de l&apos;application.</p>
      <Link
        href="/carte"
        className="mt-6 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        Retour à la carte
      </Link>
    </div>
  );
}
