// Tests de bout en bout (phase 7) sur la VERSION DE PRODUCTION de l'application,
// reliée à une fausse adresse Supabase : on vérifie que rien n'est accessible
// sans connexion. Aucune vraie donnée n'est utilisée.
//   npm run test:e2e        (la première fois sur le Mac : npx playwright install chromium)
import { defineConfig, devices } from "@playwright/test";

const PORT = 3105;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"] } },
    { name: "telephone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/connexion`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      // Fausse base : adresse locale qui refuse toute connexion.
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_e2e",
      // Fausse clé secrète « témoin » : le test vérifie qu’elle n’apparaît JAMAIS dans le code du navigateur.
      SUPABASE_SECRET_KEY: "sb_secret_temoin_e2e_ne_doit_jamais_fuir",
    },
  },
});
