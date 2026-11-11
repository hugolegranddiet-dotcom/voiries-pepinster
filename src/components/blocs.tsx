import type { ReactNode } from "react";
import { IconeInfo } from "@/components/icones";

export function EnTetePage({
  titre,
  description,
  actions,
}: {
  titre: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-surface px-4 py-5 sm:flex-row sm:items-end sm:justify-between md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{titre}</h1>
        {description && (
          <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="self-start sm:self-auto">{actions}</div>}
    </div>
  );
}

/** Rappel permanent : le score aide à classer, il ne décide pas. */
export function AvertissementScore() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-muted">
      <IconeInfo className="mt-0.5 shrink-0 text-brand" width={18} height={18} />
      <span>
        Le score est <strong className="text-ink">un outil d&apos;aide au classement</strong>,
        pas une expertise d&apos;ingénierie ni une décision automatique de travaux.
      </span>
    </p>
  );
}

export function Carte({
  titre,
  children,
  className = "",
}: {
  titre?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 md:p-5 ${className}`}>
      {titre && <h2 className="mb-3 text-base font-semibold text-ink">{titre}</h2>}
      {children}
    </section>
  );
}
