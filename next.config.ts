import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Masque la pastille « N » de développement (les erreurs restent affichées).
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // La page d'accueil ouvre directement la carte.
  redirects() {
    return [{ source: "/", destination: "/carte", permanent: false }];
  },
  // N'annonce pas « Next.js » dans les réponses (moins d'informations pour un attaquant).
  poweredByHeader: false,
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Application privée : on demande aux moteurs de recherche de ne rien indexer.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Interdit d'afficher l'application dans un cadre d'un autre site (piège au clic).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          // Le navigateur ne devine pas le type des fichiers.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Les sites externes (tuiles OSM) ne reçoivent que le nom du site, jamais l'adresse complète.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Ni caméra, ni micro, ni position : l'application n'en a pas besoin.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
