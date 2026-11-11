"use client";

// Dernier filet de sécurité : remplace toute la page si même la mise en page échoue.
// Il doit définir ses propres <html> et <body> et n'a pas accès aux styles de l'application.
export default function ErreurGlobale({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f3f5f4", color: "#12262f", margin: 0 }}>
        <title>Erreur · Voiries Pepinster</title>
        <main style={{ maxWidth: 420, margin: "64px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>Un problème est survenu</h1>
          <p style={{ color: "#56676d" }}>Aucune donnée n&apos;a été perdue. Réessaie, ou recharge la page.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, border: 0, background: "#0d6b69", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
