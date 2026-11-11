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
  // Application privée : on demande aux moteurs de recherche de ne rien indexer.
  headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
