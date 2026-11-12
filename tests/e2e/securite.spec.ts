// Sécurité de l'application publiée : sans connexion, tout est fermé.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/carte", "/voiries", "/priorites", "/priorites/validation", "/parametres"];

test.describe("visiteur non connecté", () => {
  for (const page of PAGES) {
    test(`${page} renvoie vers la connexion`, async ({ page: p }) => {
      await p.goto(page);
      await expect(p).toHaveURL(new RegExp(`/connexion\\?suite=${encodeURIComponent(page).replace(/%2F/g, "(%2F|/)")}`));
      await expect(p.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(p.getByLabel(/adresse e-mail/i)).toBeVisible();
    });
  }

  test("l'accueil mène à la connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("les données sont refusées (401)", async ({ request }) => {
    const r = await request.get("/api/carte");
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ erreur: "non_connecte" });
  });

  test("l'appel de maintien refuse tout appel sans le secret de Vercel", async ({ request }) => {
    const r = await request.get("/api/maintien", { maxRedirects: 0 });
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ erreur: "non_autorise" });
    expect((await request.get("/api/maintien", { headers: { authorization: "Bearer devine" } })).status()).toBe(401);
  });

  test("un faux jeton de session ne donne aucun accès", async ({ context, request }) => {
    const faux = "base64-" + Buffer.from(JSON.stringify({ access_token: "aaa.bbb.ccc", refresh_token: "x", user: { id: "11111111-1111-4111-8111-111111111111" } })).toString("base64");
    await context.addCookies([{ name: "sb-127-auth-token", value: faux, url: "http://localhost:3105" }]);
    const page = await context.newPage();
    await page.goto("/carte");
    await expect(page).toHaveURL(/\/connexion/);
    const r = await request.get("/api/carte", { headers: { cookie: `sb-127-auth-token=${faux}` } });
    expect(r.status()).toBe(401);
  });

  test("l'adresse de retour piégée est ignorée", async ({ page }) => {
    await page.goto("/connexion?suite=" + encodeURIComponent("/\\pirate.example"));
    await expect(page.locator('input[name="suite"]')).toHaveValue("/\\pirate.example"); // reçue telle quelle…
    // …mais l'action de connexion la remplace par /carte (testé dans tests/unit/securite.test.ts).
  });
});

test.describe("réponses du serveur", () => {
  test("portent les en-têtes de sécurité", async ({ request }) => {
    const r = await request.get("/connexion");
    const h = r.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-robots-tag"]).toContain("noindex");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("la page de connexion est accessible (axe-core)", async ({ page }) => {
    await page.goto("/connexion");
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });

  test("une adresse inconnue ne révèle rien sans connexion", async ({ page }) => {
    // Même une page qui n'existe pas renvoie d'abord vers la connexion :
    // un visiteur ne peut pas deviner quelles pages existent.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/connexion\?suite=%2Fadmin/);
  });
});

test("aucune clé secrète dans le code envoyé au navigateur", async () => {
  test.skip(test.info().project.name !== "ordinateur", "un seul passage suffit");
  const fichiers: string[] = [];
  const parcourir = (d: string) =>
    readdirSync(d).forEach((f) => {
      const c = join(d, f);
      if (statSync(c).isDirectory()) parcourir(c);
      else fichiers.push(c);
    });
  parcourir(join(".next", "static"));
  expect(fichiers.length).toBeGreaterThan(10);
  for (const f of fichiers) {
    const t = readFileSync(f, "utf8");
    expect(t, f).not.toMatch(/sb_secret_|SUPABASE_SECRET_KEY|service_role/);
  }
});
