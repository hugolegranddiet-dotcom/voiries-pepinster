// Sécurité (phase 7) : redirection après connexion, en-têtes HTTP.
import { describe, expect, it } from "vitest";
import { cheminSur } from "@/lib/securite/redirection";
import config from "../../next.config";
import { motDePasseAleatoire } from "../../scripts/db/mot-de-passe";

describe("retour après connexion (?suite=)", () => {
  it.each([
    ["/voiries?voirie=n%3Arue%20du%20biez", "/voiries?voirie=n%3Arue%20du%20biez"],
    ["/priorites/validation", "/priorites/validation"],
    ["/carte", "/carte"],
  ])("accepte le chemin interne %s", (entree, sortie) => {
    expect(cheminSur(entree)).toBe(sortie);
  });

  it.each([
    [undefined],
    [""],
    ["https://pirate.example"],
    ["//pirate.example"],
    ["/\\pirate.example"],
    ["/\t/pirate.example"],
    ["/%2F%2Fpirate.example"],
    ["javascript:alert(1)"],
    ["/connexion"],
    ["/api/carte"],
    ["/carte\nSet-Cookie: x=1"],
    ["/" + "a".repeat(600)],
  ])("refuse %j et renvoie vers la carte", (entree) => {
    expect(cheminSur(entree)).toBe("/carte");
  });
});

describe("en-têtes de sécurité", () => {
  it("protègent toutes les pages", async () => {
    const regles = await config.headers!();
    const tout = regles.find((r) => r.source === "/:path*")!;
    const h = Object.fromEntries(tout.headers.map((x) => [x.key, x.value]));
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Robots-Tag"]).toContain("noindex");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(config.poweredByHeader).toBe(false);
  });
});

describe("mot de passe de secours", () => {
  it("est long, sans caractère ambigu, et différent à chaque fois", () => {
    const a = motDePasseAleatoire();
    expect(a).toHaveLength(16);
    expect(a).not.toMatch(/[0O1lI]/);
    expect(new Set(Array.from({ length: 50 }, () => motDePasseAleatoire())).size).toBe(50);
  });
});
