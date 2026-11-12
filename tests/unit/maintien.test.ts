// Appel quotidien de maintien (D22) : seul Vercel, avec le bon secret, peut le déclencher.
import { afterEach, describe, expect, it, vi } from "vitest";

const requeteBase = vi.fn(async () => ({ data: [], error: null as null | { message: string } }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ select: () => ({ limit: requeteBase }) }) }),
}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const SECRET = "un-secret-de-test-assez-long-123";
const appel = (entete?: string) => new Request("https://exemple.invalid/api/maintien", { headers: entete ? { authorization: entete } : {} });

describe("/api/maintien", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    requeteBase.mockClear();
  });

  it("refuse sans secret, avec un mauvais secret, ou si le secret n'est pas configuré", async () => {
    const { GET } = await import("@/app/api/maintien/route");
    vi.stubEnv("CRON_SECRET", SECRET);
    expect((await GET(appel())).status).toBe(401);
    expect((await GET(appel("Bearer mauvais"))).status).toBe(401);
    expect((await GET(appel(SECRET))).status).toBe(401); // sans « Bearer »
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(appel("Bearer "))).status).toBe(401);
    expect(requeteBase).not.toHaveBeenCalled();
  });

  it("avec le bon secret, fait une petite requête et ne renvoie aucune donnée", async () => {
    const { GET } = await import("@/app/api/maintien/route");
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemple.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const r = await GET(appel(`Bearer ${SECRET}`));
    expect(r.status).toBe(200);
    expect(Object.keys(await r.json())).toEqual(["ok", "le"]);
    expect(requeteBase).toHaveBeenCalledTimes(1);
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
});
